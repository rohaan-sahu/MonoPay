import { PublicKey } from "@solana/web3.js";
import { supabase } from "@mpay/lib/supabase";

export type PaymentRail = "sol_public" | "spl_public";
export type PaymentIntentStatus = "pending" | "submitted" | "confirmed" | "failed";

export type PaymentIntentHandle = {
  id: string;
  clientReference: string;
};

export type CreatePaymentIntentInput = {
  senderUserId?: string;
  senderWalletAddress: string;
  senderHandle?: string;
  recipientWalletAddress: string;
  recipientInput: string;
  recipientNormalized: string;
  recipientTag?: string;
  assetSymbol: string;
  assetMint?: string;
  amountUi: number;
  amountRaw?: string;
  memo?: string;
  rail: PaymentRail;
  network?: string;
};

export type MarkPaymentIntentConfirmedInput = {
  intentId: string;
  txSignature: string;
  explorerUrl?: string;
  network?: string;
  assetMint?: string;
  amountRaw?: string;
  status?: PaymentIntentStatus;
};

export type MarkPaymentIntentFailedInput = {
  intentId: string;
  errorMessage: string;
};

export type PaymentLedgerHistoryEntry = {
  id: string;
  senderWalletAddress: string;
  recipientWalletAddress: string;
  recipientTag?: string;
  assetSymbol: string;
  assetMint?: string;
  amountUi: number;
  amountRaw?: string;
  rail: PaymentRail;
  status: PaymentIntentStatus;
  txSignature?: string;
  explorerUrl?: string;
  network?: string;
  createdAt: string;
  updatedAt: string;
};

type UnknownError = { code?: string; message?: string };

function normalizeWalletAddress(value: string) {
  return new PublicKey(value.trim()).toBase58();
}

function normalizeTag(value?: string) {
  const cleaned = value?.trim().replace(/^@+/, "").toLowerCase();
  if (!cleaned) return undefined;
  return `@${cleaned}`;
}

function isMissingRelationError(error: UnknownError) {
  const message = (error.message || "").toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.code === "42703" ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("could not find the table") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

function toStatus(value: unknown): PaymentIntentStatus {
  if (value === "pending" || value === "submitted" || value === "confirmed" || value === "failed") {
    return value;
  }

  return "pending";
}

function toRail(value: unknown): PaymentRail {
  if (value === "sol_public" || value === "spl_public") {
    return value;
  }

  return "spl_public";
}

function toHistoryEntry(row: Record<string, unknown>): PaymentLedgerHistoryEntry | null {
  const id = typeof row.id === "string" ? row.id : "";
  const senderWalletAddress = typeof row.sender_wallet_address === "string" ? row.sender_wallet_address : "";
  const recipientWalletAddress = typeof row.recipient_wallet_address === "string" ? row.recipient_wallet_address : "";
  const assetSymbol = typeof row.asset_symbol === "string" ? row.asset_symbol.toUpperCase() : "";
  const amountUiRaw = row.amount_ui;
  const amountUi =
    typeof amountUiRaw === "number"
      ? amountUiRaw
      : typeof amountUiRaw === "string"
        ? Number.parseFloat(amountUiRaw)
        : Number.NaN;

  if (!id || !senderWalletAddress || !recipientWalletAddress || !assetSymbol || !Number.isFinite(amountUi)) {
    return null;
  }

  return {
    id,
    senderWalletAddress,
    recipientWalletAddress,
    recipientTag: normalizeTag(typeof row.recipient_tag === "string" ? row.recipient_tag : undefined),
    assetSymbol,
    assetMint: typeof row.asset_mint === "string" ? row.asset_mint : undefined,
    amountUi,
    amountRaw: typeof row.amount_raw === "string" ? row.amount_raw : undefined,
    rail: toRail(row.rail),
    status: toStatus(row.status),
    txSignature: typeof row.tx_signature === "string" ? row.tx_signature : undefined,
    explorerUrl: typeof row.explorer_url === "string" ? row.explorer_url : undefined,
    network: typeof row.network === "string" ? row.network : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

class PaymentLedgerService {
  private createClientReference() {
    const rand = Math.random().toString(36).slice(2, 8);
    return `pay_${Date.now().toString(36)}_${rand}`;
  }

  private async appendEvent(
    intentId: string,
    eventType: "created" | "submitted" | "confirmed" | "failed",
    payload: Record<string, unknown>
  ) {
    const { error } = await supabase.from("payment_events").insert({
      payment_intent_id: intentId,
      event_type: eventType,
      payload,
    });

    if (!error) {
      return;
    }

    if (isMissingRelationError(error)) {
      return;
    }

    console.warn("[payment-ledger] event:append:error", {
      intentId,
      eventType,
      code: error.code,
      message: error.message,
    });
  }

  async createPendingIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentHandle | null> {
    const senderWalletAddress = normalizeWalletAddress(input.senderWalletAddress);
    const recipientWalletAddress = normalizeWalletAddress(input.recipientWalletAddress);
    const clientReference = this.createClientReference();
    const recipientTag = normalizeTag(input.recipientTag || input.recipientNormalized);
    const amountUi = Number.isFinite(input.amountUi) ? input.amountUi : 0;

    const { data, error } = await supabase
      .from("payment_intents")
      .insert({
        client_reference: clientReference,
        sender_user_id: input.senderUserId || null,
        sender_wallet_address: senderWalletAddress,
        sender_handle: input.senderHandle || null,
        recipient_wallet_address: recipientWalletAddress,
        recipient_input: input.recipientInput,
        recipient_normalized: input.recipientNormalized,
        recipient_tag: recipientTag ? recipientTag.replace(/^@+/, "") : null,
        asset_symbol: input.assetSymbol.trim().toUpperCase(),
        asset_mint: input.assetMint || null,
        amount_ui: amountUi,
        amount_raw: input.amountRaw || null,
        memo: input.memo || null,
        rail: input.rail,
        network: input.network || "solana-devnet",
        status: "pending",
      })
      .select("id,client_reference")
      .single();

    if (error) {
      if (isMissingRelationError(error)) {
        console.warn("[payment-ledger] payment_intents:missing", {
          code: error.code,
          message: error.message,
        });
        return null;
      }

      throw new Error(error.message);
    }

    const intentId = typeof data?.id === "string" ? data.id : "";
    if (!intentId) {
      return null;
    }

    await this.appendEvent(intentId, "created", {
      senderWalletAddress,
      recipientWalletAddress,
      assetSymbol: input.assetSymbol.trim().toUpperCase(),
      amountUi,
      rail: input.rail,
    });

    return {
      id: intentId,
      clientReference: typeof data?.client_reference === "string" ? data.client_reference : clientReference,
    };
  }

  async markIntentSubmitted(input: MarkPaymentIntentConfirmedInput) {
    const { error } = await supabase
      .from("payment_intents")
      .update({
        status: input.status || "submitted",
        tx_signature: input.txSignature,
        explorer_url: input.explorerUrl || null,
        network: input.network || undefined,
        asset_mint: input.assetMint || undefined,
        amount_raw: input.amountRaw || undefined,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.intentId);

    if (error) {
      if (isMissingRelationError(error)) {
        return;
      }

      throw new Error(error.message);
    }

    await this.appendEvent(input.intentId, input.status === "confirmed" ? "confirmed" : "submitted", {
      txSignature: input.txSignature,
      explorerUrl: input.explorerUrl,
      network: input.network,
    });
  }

  async markIntentFailed(input: MarkPaymentIntentFailedInput) {
    const { error } = await supabase
      .from("payment_intents")
      .update({
        status: "failed",
        error_message: input.errorMessage.slice(0, 600),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.intentId);

    if (error) {
      if (isMissingRelationError(error)) {
        return;
      }

      throw new Error(error.message);
    }

    await this.appendEvent(input.intentId, "failed", {
      errorMessage: input.errorMessage.slice(0, 600),
    });
  }

  async fetchWalletHistory(walletAddress: string, options?: { limit?: number }): Promise<PaymentLedgerHistoryEntry[] | null> {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const limit = Math.max(1, Math.min(options?.limit ?? 25, 60));
    const { data, error } = await supabase
      .from("payment_intents")
      .select("id,sender_wallet_address,recipient_wallet_address,recipient_tag,asset_symbol,asset_mint,amount_ui,amount_raw,rail,status,tx_signature,explorer_url,network,created_at,updated_at")
      .or(`sender_wallet_address.eq.${normalizedWallet},recipient_wallet_address.eq.${normalizedWallet}`)
      .in("status", ["submitted", "confirmed"])
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingRelationError(error)) {
        return null;
      }

      throw new Error(error.message);
    }

    const entries = (data || [])
      .map((row) => toHistoryEntry(row as Record<string, unknown>))
      .filter((row): row is PaymentLedgerHistoryEntry => Boolean(row));

    return entries;
  }

  async fetchWalletTransferCount(walletAddress: string): Promise<number | null> {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const { count, error } = await supabase
      .from("payment_intents")
      .select("id", { count: "exact", head: true })
      .eq("sender_wallet_address", normalizedWallet)
      .in("status", ["submitted", "confirmed"]);

    if (error) {
      if (isMissingRelationError(error)) {
        return null;
      }

      throw new Error(error.message);
    }

    return typeof count === "number" ? count : 0;
  }
}

export const paymentLedgerService = new PaymentLedgerService();
