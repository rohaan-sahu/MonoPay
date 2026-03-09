import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getAccountLinkMode, getSupabaseConfig } from "@mpay/services/sandbox/env";
import { AccountLinkingAdapter, AccountLinkRequest, FinalizedAccount } from "@mpay/services/sandbox/types";

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (phone.trim().startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  return `+${digits}`;
}

function assertEmail(email: string) {
  const value = email.trim().toLowerCase();
  const isValid = /^\S+@\S+\.\S+$/.test(value);

  if (!isValid) {
    throw new Error("Enter a valid email address.");
  }

  return value;
}

function assertPhone(phone: string) {
  const value = normalizePhone(phone);
  const digitsCount = value.replace(/\D/g, "").length;

  if (digitsCount < 10) {
    throw new Error("Enter a valid phone number.");
  }

  return value;
}

function assertName(name: string) {
  if (name.trim().length < 2) {
    throw new Error("Full name is required.");
  }

  return name.trim();
}

type RequestState = AccountLinkRequest & {
  emailUserId?: string;
  phoneUserId?: string;
};

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const config = getSupabaseConfig();
  supabaseClient = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  return supabaseClient;
}

function mapEmailVerificationError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("token hash")) {
    return "Supabase email template is in magic-link mode. Switch template to OTP mode using {{ .Token }} in Supabase Auth > Email Templates.";
  }

  if (lower.includes("expired")) {
    return "Email OTP has expired. Tap Start registration again to request a fresh code.";
  }

  return message;
}

async function verifyEmailOtp(client: SupabaseClient, email: string, code: string) {
  const emailTypes: ("email" | "signup")[] = ["email", "signup"];
  let lastError = "Email verification failed.";

  for (const type of emailTypes) {
    const { data, error } = await client.auth.verifyOtp({
      email,
      token: code,
      type
    });

    if (!error) {
      await client.auth.signOut();
      return data.user?.id;
    }

    lastError = mapEmailVerificationError(error.message);
  }

  throw new Error(lastError);
}

async function verifyPhoneOtp(client: SupabaseClient, phone: string, code: string) {
  const { data, error } = await client.auth.verifyOtp({
    phone,
    token: code,
    type: "sms"
  });

  if (error) {
    throw new Error(error.message);
  }

  await client.auth.signOut();
  return data.user?.id;
}

export class SupabaseAccountLinkingAdapter implements AccountLinkingAdapter {
  private requests = new Map<string, RequestState>();

  async startRegistration(input: { email: string; phone: string }): Promise<AccountLinkRequest> {
    const client = getSupabaseClient();
    const linkMode = getAccountLinkMode();
    const phoneRequired = linkMode === "email_phone";
    const email = assertEmail(input.email);
    const phone = phoneRequired ? assertPhone(input.phone) : normalizePhone(input.phone);
    const requestId = createId("link");
    const now = new Date().toISOString();

    const emailOtp = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });

    if (emailOtp.error) {
      throw new Error(emailOtp.error.message);
    }

    if (phoneRequired) {
      const phoneOtp = await client.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: true, channel: "sms" }
      });

      if (phoneOtp.error) {
        throw new Error(phoneOtp.error.message);
      }
    }

    const request: RequestState = {
      requestId,
      email,
      phone,
      phoneRequired,
      emailVerified: false,
      phoneVerified: !phoneRequired,
      createdAt: now
    };

    this.requests.set(requestId, request);
    return request;
  }

  async verifyEmailCode(input: { requestId: string; code: string }): Promise<AccountLinkRequest> {
    const client = getSupabaseClient();
    const request = this.requests.get(input.requestId);

    if (!request) {
      throw new Error("Registration request not found.");
    }

    const emailUserId = await verifyEmailOtp(client, request.email, input.code.trim());

    const updated: RequestState = { ...request, emailVerified: true, emailUserId };
    this.requests.set(updated.requestId, updated);
    return updated;
  }

  async verifyPhoneCode(input: { requestId: string; code: string }): Promise<AccountLinkRequest> {
    const client = getSupabaseClient();
    const request = this.requests.get(input.requestId);

    if (!request) {
      throw new Error("Registration request not found.");
    }

    if (!request.phoneRequired) {
      return request;
    }

    const phoneUserId = await verifyPhoneOtp(client, request.phone, input.code.trim());

    const updated: RequestState = { ...request, phoneVerified: true, phoneUserId };
    this.requests.set(updated.requestId, updated);
    return updated;
  }

  async finalizeRegistration(input: { requestId: string; fullName: string }): Promise<FinalizedAccount> {
    const request = this.requests.get(input.requestId);

    if (!request) {
      throw new Error("Registration request not found.");
    }

    if (!request.emailVerified || (request.phoneRequired && !request.phoneVerified)) {
      throw new Error(request.phoneRequired ? "Verify both email and phone before finalizing." : "Verify email before finalizing.");
    }

    const fullName = assertName(input.fullName);

    return {
      accountId: request.emailUserId || request.phoneUserId || createId("acct"),
      fullName,
      email: request.email,
      phone: request.phone,
      linkedAt: new Date().toISOString()
    };
  }
}
