import "react-native-get-random-values";
import { Keypair } from "@solana/web3.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

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
  handle: string;
  passcode?: string;
};

interface WalletService {
  createWallet(): Promise<WalletCreateResult>;
  importWallet(secretKeyBytes: number[]): Promise<WalletCreateResult>;
  hasStoredWallet(): Promise<boolean>;
  getStoredWallet(): Promise<WalletMeta | null>;
  getKeypair(): Promise<Keypair | null>;
  clearWallet(): Promise<void>;
  storeUserProfile(profile: StoredUserProfile): Promise<void>;
  getStoredUserProfile(): Promise<StoredUserProfile | null>;
}

const KEY_SECRET = "MPAY_WALLET_SECRET";
const KEY_META = "MPAY_WALLET_META";
const KEY_PROFILE = "MPAY_WALLET_PROFILE";
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

  private async storeKeypair(keypair: Keypair, mode: WalletMode): Promise<WalletMeta> {
    const secretBytes = Array.from(keypair.secretKey);
    const meta: WalletMeta = {
      publicKey: keypair.publicKey.toBase58(),
      mode,
      createdAt: new Date().toISOString(),
    };

    await this.setItem(KEY_SECRET, JSON.stringify(secretBytes));
    await this.setItem(KEY_META, JSON.stringify(meta));

    return meta;
  }

  async createWallet(): Promise<WalletCreateResult> {
    try {
      await this.ensureRandomValues();
      const keypair = Keypair.generate();
      return this.storeKeypair(keypair, "embedded");
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
      return this.storeKeypair(keypair, "imported");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown wallet import error.";
      throw new Error(`Wallet import failed: ${message}`);
    }
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
    await this.deleteItem(KEY_PROFILE);
  }
}

export const walletService = new SecureStoreWalletService();
