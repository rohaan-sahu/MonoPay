import * as nacl from "tweetnacl";
import { supabase } from "@mpay/lib/supabase";
import { walletService } from "@mpay/services/wallet-service";

const DEFAULT_STATEMENT = "Sign in to MonoPay";
const DEFAULT_WEB3_SIGNIN_URL = process.env.EXPO_PUBLIC_WEB3_SIGNIN_URL || "https://monopay.app";
const WEB3_SIGNIN_URL_FALLBACKS = ["http://localhost:3000", "https://monopay.app"];

function resolveWeb3MessageUrl(rawInput?: string) {
  const candidate = (rawInput || DEFAULT_WEB3_SIGNIN_URL).trim();

  try {
    const parsed = new URL(candidate);

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("SIWS URL must use http or https.");
    }

    return parsed;
  } catch {
    return new URL(DEFAULT_WEB3_SIGNIN_URL);
  }
}

function toActionableWeb3ErrorMessage(error: unknown, messageUrl: string) {
  const rawMessage = error instanceof Error ? error.message : String(error);

  if (rawMessage.includes("domain in first line of message is not valid")) {
    return `Web3 sign-in URL is invalid for SIWS: ${messageUrl}. Use a valid https://app-domain URL via EXPO_PUBLIC_WEB3_SIGNIN_URL.`;
  }

  if (rawMessage.includes("URI which is not allowed on this server")) {
    return `Supabase rejected SIWS URI (${messageUrl}). Add this exact URL to Supabase Auth URL allow list (Site URL / Redirect URLs), then set EXPO_PUBLIC_WEB3_SIGNIN_URL to the same value.`;
  }

  return rawMessage;
}

function isSupabaseWeb3UrlPolicyError(message: string) {
  return (
    message.includes("URI which is not allowed on this server") ||
    message.includes("domain in first line of message is not valid")
  );
}

export type EmbeddedWalletAuthResult = {
  userId: string;
  walletAddress: string;
  expiresAt?: number | null;
};

class SupabaseWeb3AuthService {
  async signInWithEmbeddedWallet(options?: { statement?: string; callbackUrl?: string; url?: string }): Promise<EmbeddedWalletAuthResult> {
    const traceId = `w3-${Date.now().toString(36)}`;

    try {
      console.log("[wallet-connect-trace] web3:start", { traceId });
      const keypair = await walletService.getKeypair();

      if (!keypair) {
        throw new Error("No wallet found on this device. Create or import a wallet first.");
      }

      const walletAddress = keypair.publicKey.toBase58();
      console.log("[wallet-connect-trace] web3:keypair", { traceId, walletAddress });
      const wallet = {
        publicKey: {
          toBase58: () => walletAddress,
        },
        signMessage: async (message: Uint8Array) => {
          return nacl.sign.detached(message, keypair.secretKey);
        },
      };

      const statement = options?.statement || DEFAULT_STATEMENT;
      const candidateUrls = [options?.url, DEFAULT_WEB3_SIGNIN_URL, ...WEB3_SIGNIN_URL_FALLBACKS]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => resolveWeb3MessageUrl(value).href)
        .filter((value, index, list) => list.indexOf(value) === index);

      let data: { user?: { id: string }; session?: { expires_at?: number | null } } | null = null;
      let lastPolicyError: Error | null = null;

      for (const [attempt, candidateUrl] of candidateUrls.entries()) {
        console.log("[wallet-connect-trace] web3:supabase-signin:start", {
          traceId,
          statement,
          attempt: attempt + 1,
          totalAttempts: candidateUrls.length,
          messageUrl: candidateUrl,
          messageHost: new URL(candidateUrl).host,
        });

        const response = await supabase.auth.signInWithWeb3({
          chain: "solana",
          wallet,
          statement,
          options: {
            url: candidateUrl,
          },
        });

        if (!response.error) {
          data = response.data;
          break;
        }

        const actionableMessage = toActionableWeb3ErrorMessage(response.error, candidateUrl);
        console.error("[wallet-connect-trace] web3:supabase-signin:error", {
          traceId,
          attempt: attempt + 1,
          messageUrl: candidateUrl,
          message: response.error.message,
          actionableMessage,
          name: response.error.name,
          status: (response.error as { status?: number }).status,
        });

        if (isSupabaseWeb3UrlPolicyError(response.error.message)) {
          lastPolicyError = new Error(actionableMessage);
          continue;
        }

        throw new Error(actionableMessage);
      }

      if (!data) {
        throw (
          lastPolicyError ||
          new Error(
            `Supabase Web3 sign-in failed for all candidate SIWS URLs (${candidateUrls.join(", ")}). Set EXPO_PUBLIC_WEB3_SIGNIN_URL to an allowed URL in Supabase Auth settings.`
          )
        );
      }

      if (!data?.user || !data?.session) {
        console.error("[wallet-connect-trace] web3:supabase-signin:invalid-payload", {
          traceId,
          hasUser: Boolean(data?.user),
          hasSession: Boolean(data?.session),
        });
        throw new Error("Supabase did not return a valid user session for wallet auth.");
      }

      const result = {
        userId: data.user.id,
        walletAddress,
        expiresAt: data.session.expires_at ?? null,
      };
      console.log("[wallet-connect-trace] web3:done", {
        traceId,
        userId: result.userId,
        walletAddress: result.walletAddress,
        expiresAt: result.expiresAt,
      });

      return result;
    } catch (error) {
      console.error("[wallet-connect-trace] web3:exception", {
        traceId,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const web3AuthService = new SupabaseWeb3AuthService();
