import { Buffer } from "buffer";
import { PublicKey } from "@solana/web3.js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type StoredMwaSession = {
  walletAddress: string;
  authToken: string;
  walletUriBase: string;
  chain: string;
  updatedAt: string;
};

export type MobileWalletAuthorization = {
  walletAddress: string;
  walletUriBase: string;
  authToken: string;
  accountLabel?: string;
  chain: string;
};

const MWA_SESSION_KEY = "MPAY_MWA_SESSION";

function parseBooleanFlag(value: string | undefined, defaultValue = false) {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function resolveChainFromRpcUrl() {
  const rpcUrl = (process.env.EXPO_PUBLIC_MONOPAY_RPC_URL || "").toLowerCase();

  if (rpcUrl.includes("mainnet")) {
    return "solana:mainnet";
  }

  if (rpcUrl.includes("testnet")) {
    return "solana:testnet";
  }

  return "solana:devnet";
}

function decodeBase64AddressToBase58(addressBase64: string) {
  const decoded = Buffer.from(addressBase64, "base64");
  return new PublicKey(decoded).toBase58();
}

function resolveIdentity() {
  const uri = (process.env.EXPO_PUBLIC_WEB3_SIGNIN_URL || "https://monopay.app").trim();

  return {
    name: "MonoPay",
    uri,
    icon: undefined as string | undefined,
  };
}

class MobileWalletAdapterService {
  private secureStoreAvailablePromise = SecureStore.isAvailableAsync().catch(() => false);

  isEnabled() {
    return Platform.OS === "android" && parseBooleanFlag(process.env.EXPO_PUBLIC_MONOPAY_MWA_ENABLED, false);
  }

  private async getStoredSession(): Promise<StoredMwaSession | null> {
    const secureStoreAvailable = await this.secureStoreAvailablePromise;

    if (!secureStoreAvailable) {
      return null;
    }

    try {
      const raw = await SecureStore.getItemAsync(MWA_SESSION_KEY);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as StoredMwaSession;

      if (!parsed.walletAddress || !parsed.walletUriBase || !parsed.authToken) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private async setStoredSession(session: StoredMwaSession) {
    const secureStoreAvailable = await this.secureStoreAvailablePromise;

    if (!secureStoreAvailable) {
      return;
    }

    await SecureStore.setItemAsync(MWA_SESSION_KEY, JSON.stringify(session));
  }

  async clearStoredSession() {
    const secureStoreAvailable = await this.secureStoreAvailablePromise;

    if (!secureStoreAvailable) {
      return;
    }

    await SecureStore.deleteItemAsync(MWA_SESSION_KEY);
  }

  private async authorizeWithWallet(options?: { authToken?: string; walletUriBase?: string }) {
    const { transact } = await import("@solana-mobile/mobile-wallet-adapter-protocol-web3js");
    const chain = resolveChainFromRpcUrl();
    const identity = resolveIdentity();

    const result = await transact(
      async (wallet) =>
        wallet.authorize({
          identity,
          chain,
          ...(options?.authToken ? { auth_token: options.authToken } : {}),
        }),
      options?.walletUriBase ? { baseUri: options.walletUriBase } : undefined
    );

    const selectedAccount = result.accounts?.[0];

    if (!selectedAccount?.address) {
      throw new Error("No wallet account returned from mobile wallet adapter.");
    }

    const walletAddress = decodeBase64AddressToBase58(selectedAccount.address);

    const normalized: MobileWalletAuthorization = {
      walletAddress,
      walletUriBase: result.wallet_uri_base,
      authToken: result.auth_token,
      accountLabel: selectedAccount.label,
      chain,
    };

    await this.setStoredSession({
      walletAddress: normalized.walletAddress,
      walletUriBase: normalized.walletUriBase,
      authToken: normalized.authToken,
      chain: normalized.chain,
      updatedAt: new Date().toISOString(),
    });

    return normalized;
  }

  async authorize(): Promise<MobileWalletAuthorization> {
    if (!this.isEnabled()) {
      throw new Error("External mobile wallet adapter is disabled.");
    }

    const storedSession = await this.getStoredSession();
    const traceId = `mwa-${Date.now().toString(36)}`;

    if (storedSession) {
      try {
        console.log("[mwa-flow] authorize:reauthorize:start", {
          traceId,
          walletAddress: storedSession.walletAddress,
          walletUriBase: storedSession.walletUriBase,
          chain: storedSession.chain,
        });
        const reauthorized = await this.authorizeWithWallet({
          authToken: storedSession.authToken,
          walletUriBase: storedSession.walletUriBase,
        });
        console.log("[mwa-flow] authorize:reauthorize:ok", {
          traceId,
          walletAddress: reauthorized.walletAddress,
          walletUriBase: reauthorized.walletUriBase,
          chain: reauthorized.chain,
        });
        return reauthorized;
      } catch (error) {
        console.warn("[mwa-flow] authorize:reauthorize:failed", {
          traceId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log("[mwa-flow] authorize:fresh:start", { traceId });
    const fresh = await this.authorizeWithWallet();
    console.log("[mwa-flow] authorize:fresh:ok", {
      traceId,
      walletAddress: fresh.walletAddress,
      walletUriBase: fresh.walletUriBase,
      chain: fresh.chain,
    });
    return fresh;
  }
}

export const mobileWalletAdapterService = new MobileWalletAdapterService();
