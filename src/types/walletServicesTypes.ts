import type { Keypair } from "@solana/web3.js";

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

// Interfaces export
export {
    StoredUserProfile,
    WalletService,
}

// Types export
export {
    WalletCreateResult,
    WalletMode,
    WalletMeta
}