import { CardStatus, SupportedNetwork } from "./globalTypes";

type Source = "supabase" | "local";
type MetaplexSyncStatus = "synced" | "unknown" | "failed";

export type WalletIdentityRecord = {
  walletAddress: string;
  ownerUserId?: string;
  displayName: string;
  monopayTag: string;
  metaplexCardId: string;
  metaplexCardStatus: CardStatus;
  metaplexNetwork: SupportedNetwork;
  metaplexSyncStatus?: MetaplexSyncStatus;
  metaplexLastSyncAt?: string;
  metaplexLastTxSignature?: string;
  createdAt: string;
  updatedAt: string;
  source: Source;
};

export type EnsureWalletIdentityInput = {
  walletAddress: string;
  ownerUserId?: string;
  displayName?: string;
  phone?: string;
  email?: string;
  preferredTag?: string;
  existingMonopayTag?: string;
  existingMetaplexCardId?: string;
  existingMetaplexCardStatus?: CardStatus;
  existingMetaplexNetwork?: SupportedNetwork;
};

export type UpdateWalletIdentityProfileInput = {
  walletAddress: string;
  ownerUserId?: string;
  displayName?: string;
  phone?: string;
  email?: string;
  desiredMonopayTag?: string;
};

export type OnChainIdentityVerificationResult = {
  walletAddress: string;
  metaplexCardId: string;
  checkedAt: string;
  ok: boolean;
  status: "matched" | "mismatch" | "unavailable";
  mismatches: string[];
  reason?: string;
  expected: {
    owner: string;
    displayName: string;
    paymentPointer: string;
    monopayTag: string;
  };
  onChain?: {
    owner: string;
    displayName: string;
    paymentPointer: string;
    status: CardStatus;
    lastTxSignature?: string;
  };
};

type UnknownError = {
  code?: string;
  message?: string;
};