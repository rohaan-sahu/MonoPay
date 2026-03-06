import "react-native-get-random-values";
import { Keypair } from "@solana/web3.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { parseWalletImportInput } from "./walletImportParses";
import { normalizeRecoveryPhrase,generateRecoveryPhrase } from "./walletRecoveryPhraseService";

type WalletMode = "embedded" | "imported";

type WalletMeta = {
  publicKey: string;
  mode: WalletMode;
  createdAt: string;
};

type WalletCreateResult = WalletMeta;

type StoredUserProfile = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  walletAddress?: string;
  supabaseUserId?: string;
  handle: string;
  monopayTag?: string;
  metaplexCardId?: string;
  metaplexCardStatus?: "active" | "deactivated";
  metaplexNetwork?: "solana-devnet" | "solana-testnet" | "solana-mainnet";
  metaplexSyncStatus?: "synced" | "unknown" | "failed";
  metaplexLastSyncAt?: string;
  metaplexLastTxSignature?: string;
  passcode?: string;
};

interface WalletService {
  createWallet(): Promise<WalletCreateResult>;
  importWallet(secretKeyBytes: number[]): Promise<WalletCreateResult>;
  parseAndImportWallet(
    rawInput: string,
    options?: { passphrase?: string; derivationPath?: string; forceMnemonic?: boolean }
  ): Promise<{ wallet: WalletCreateResult; source: "private_key_bytes" | "private_key_base58" | "mnemonic"; derivationPath?: string }>;
  hasStoredWallet(): Promise<boolean>;
  getStoredWallet(): Promise<WalletMeta | null>;
  getStoredRecoveryPhrase(): Promise<string | null>;
  isRecoveryBackedUp(): Promise<boolean>;
  markRecoveryBackedUp(): Promise<void>;
  exportSecretKeyBytes(): Promise<number[] | null>;
  getKeypair(): Promise<Keypair | null>;
  clearWallet(): Promise<void>;
  storeUserProfile(profile: StoredUserProfile): Promise<void>;
  getStoredUserProfile(): Promise<StoredUserProfile | null>;
}

const KEY_SECRET = "MPAY_WALLET_SECRET";
const KEY_META = "MPAY_WALLET_META";
const KEY_PROFILE = "MPAY_WALLET_PROFILE";
const KEY_RECOVERY_PHRASE = "MPAY_WALLET_RECOVERY_PHRASE";
const KEY_RECOVERY_BACKED_UP = "MPAY_WALLET_RECOVERY_BACKED_UP";
const FALLBACK_PREFIX = "MPAY_FALLBACK_";

class SecureStoreWalletService implements WalletService {
  private secureStoreChecked = false;
  private secureStoreAvailable = false;
  private asyncStorageChecked = false;
  private asyncStorageAvailable = false;

  private async ensureRandomValues() {
    const globalWithCrypto = globalThis as typeof globalThis & {
      crypto?: {
        getRandomValues?: (array: unknown) => unknown;
      };
    };

    if (typeof globalWithCrypto.crypto?.getRandomValues === "function") {
      return;
    }

    // Force-load RNG polyfill in case this module executes before app-level polyfills.
    require("react-native-get-random-values");

    if (typeof globalWithCrypto.crypto?.getRandomValues !== "function") {
      throw new Error("crypto.getRandomValues is unavailable in this runtime.");
    }
  }

  private fallbackKey(key: string) {
    return `${FALLBACK_PREFIX}${key}`;
  }

  private async canUseSecureStore() {
    if (this.secureStoreChecked) {
      return this.secureStoreAvailable;
    }

    this.secureStoreChecked = true;

    try {
      this.secureStoreAvailable = await SecureStore.isAvailableAsync();
    } catch {
      this.secureStoreAvailable = false;
    }

    return this.secureStoreAvailable;
  }

  private async canUseAsyncStorage() {
    if (this.asyncStorageChecked) {
      return this.asyncStorageAvailable;
    }

    this.asyncStorageChecked = true;

    try {
      await AsyncStorage.getItem(`${FALLBACK_PREFIX}__probe__`);
      this.asyncStorageAvailable = true;
    } catch {
      this.asyncStorageAvailable = false;
    }

    return this.asyncStorageAvailable;
  }

  private async setItem(key: string, value: string) {
    const secureStoreReady = await this.canUseSecureStore();

    if (secureStoreReady) {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        this.secureStoreAvailable = false;
        console.warn("[wallet-service] SecureStore write failed, falling back to AsyncStorage:", error);
      }

      if (this.secureStoreAvailable) {
        // Best-effort cleanup. AsyncStorage may be unavailable in some Expo runtimes.
        if (await this.canUseAsyncStorage()) {
          try {
            await AsyncStorage.removeItem(this.fallbackKey(key));
          } catch {
            this.asyncStorageAvailable = false;
          }
        }
        return;
      }
    }

    if (await this.canUseAsyncStorage()) {
      await AsyncStorage.setItem(this.fallbackKey(key), value);
      return;
    }

    throw new Error("No available persistent storage backend in this runtime.");
  }

  private async getItem(key: string) {
    const secureStoreReady = await this.canUseSecureStore();

    if (secureStoreReady) {
      try {
        const value = await SecureStore.getItemAsync(key);

        if (value !== null) {
          return value;
        }
      } catch (error) {
        this.secureStoreAvailable = false;
        console.warn("[wallet-service] SecureStore read failed, falling back to AsyncStorage:", error);
      }
    }

    if (await this.canUseAsyncStorage()) {
      try {
        return await AsyncStorage.getItem(this.fallbackKey(key));
      } catch {
        this.asyncStorageAvailable = false;
      }
    }

    return null;
  }

  private async deleteItem(key: string) {
    const secureStoreReady = await this.canUseSecureStore();

    if (secureStoreReady) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        this.secureStoreAvailable = false;
        console.warn("[wallet-service] SecureStore delete failed, continuing with fallback cleanup:", error);
      }
    }

    if (await this.canUseAsyncStorage()) {
      try {
        await AsyncStorage.removeItem(this.fallbackKey(key));
      } catch {
        this.asyncStorageAvailable = false;
      }
    }
  }

  private async storeKeypair(
    keypair: Keypair,
    mode: WalletMode,
    options?: { recoveryPhrase?: string | null; backupConfirmed?: boolean }
  ): Promise<WalletMeta> {
    const secretBytes = Array.from(keypair.secretKey);
    const meta: WalletMeta = {
      publicKey: keypair.publicKey.toBase58(),
      mode,
      createdAt: new Date().toISOString(),
    };

    await this.setItem(KEY_SECRET, JSON.stringify(secretBytes));
    await this.setItem(KEY_META, JSON.stringify(meta));
    await this.setItem(KEY_RECOVERY_BACKED_UP, JSON.stringify(Boolean(options?.backupConfirmed)));

    if (options?.recoveryPhrase) {
      await this.setItem(KEY_RECOVERY_PHRASE, normalizeRecoveryPhrase(options.recoveryPhrase));
    } else {
      await this.deleteItem(KEY_RECOVERY_PHRASE);
    }

    return meta;
  }

  async createWallet(): Promise<WalletCreateResult> {
    try {
      await this.ensureRandomValues();
      const recoveryPhrase = generateRecoveryPhrase(12);
      const parsed = parseWalletImportInput(recoveryPhrase, { forceMnemonic: true });
      const keypair = Keypair.fromSecretKey(Uint8Array.from(parsed.secretKeyBytes));
      return this.storeKeypair(keypair, "embedded", { recoveryPhrase, backupConfirmed: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown wallet generation error.";
      throw new Error(`Wallet creation failed: ${message}`);
    }
  }

  async importWallet(secretKeyBytes: number[]): Promise<WalletCreateResult> {
    try {
      if (!Array.isArray(secretKeyBytes) || secretKeyBytes.length < 64) {
        throw new Error("Secret key must be an array of at least 64 byte values.");
      }

      const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyBytes));
      return this.storeKeypair(keypair, "imported", { backupConfirmed: true, recoveryPhrase: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown wallet import error.";
      throw new Error(`Wallet import failed: ${message}`);
    }
  }

  async parseAndImportWallet(
    rawInput: string,
    options?: { passphrase?: string; derivationPath?: string; forceMnemonic?: boolean }
  ) {
    const parsed = parseWalletImportInput(rawInput, options);
    const wallet = await this.importWallet(parsed.secretKeyBytes);

    if (parsed.source === "mnemonic") {
      await this.setItem(KEY_RECOVERY_PHRASE, normalizeRecoveryPhrase(rawInput));
      await this.setItem(KEY_RECOVERY_BACKED_UP, JSON.stringify(true));
    }

    return {
      wallet,
      source: parsed.source,
      derivationPath: parsed.derivationPath,
    };
  }

  async hasStoredWallet(): Promise<boolean> {
    const meta = await this.getItem(KEY_META);
    return meta !== null;
  }

  async getStoredWallet(): Promise<WalletMeta | null> {
    const raw = await this.getItem(KEY_META);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as WalletMeta;
    } catch {
      await this.deleteItem(KEY_META);
      return null;
    }
  }

  async getStoredRecoveryPhrase(): Promise<string | null> {
    return this.getItem(KEY_RECOVERY_PHRASE);
  }

  async isRecoveryBackedUp(): Promise<boolean> {
    const raw = await this.getItem(KEY_RECOVERY_BACKED_UP);

    if (!raw) {
      return false;
    }

    try {
      return Boolean(JSON.parse(raw));
    } catch {
      await this.deleteItem(KEY_RECOVERY_BACKED_UP);
      return false;
    }
  }

  async markRecoveryBackedUp(): Promise<void> {
    await this.setItem(KEY_RECOVERY_BACKED_UP, JSON.stringify(true));
  }

  async getKeypair(): Promise<Keypair | null> {
    const raw = await this.getItem(KEY_SECRET);

    if (!raw) {
      return null;
    }

    try {
      const bytes = JSON.parse(raw) as number[];
      return Keypair.fromSecretKey(Uint8Array.from(bytes));
    } catch {
      await this.deleteItem(KEY_SECRET);
      return null;
    }
  }

  async exportSecretKeyBytes(): Promise<number[] | null> {
    const keypair = await this.getKeypair();

    if (!keypair) {
      return null;
    }

    return Array.from(keypair.secretKey);
  }

  async storeUserProfile(profile: StoredUserProfile): Promise<void> {
    await this.setItem(KEY_PROFILE, JSON.stringify(profile));
  }

  async getStoredUserProfile(): Promise<StoredUserProfile | null> {
    const raw = await this.getItem(KEY_PROFILE);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredUserProfile;
    } catch {
      await this.deleteItem(KEY_PROFILE);
      return null;
    }
  }

  async clearWallet(): Promise<void> {
    await this.deleteItem(KEY_SECRET);
    await this.deleteItem(KEY_META);
    await this.deleteItem(KEY_RECOVERY_PHRASE);
    await this.deleteItem(KEY_RECOVERY_BACKED_UP);
    await this.deleteItem(KEY_PROFILE);
  }
}

export const walletService = new SecureStoreWalletService();
