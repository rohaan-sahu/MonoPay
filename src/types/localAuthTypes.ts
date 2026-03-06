type AuthMode = "sign-in" | "sign-up";
type AuthChannel = "phone" | "email" | "wallet";
type MetaplexNetwork = "solana-devnet" | "solana-testnet" | "solana-mainnet";
type MetaplexSyncStatus = "synced" | "unknown" | "failed";

type AuthPayload = {
  mode: AuthMode;
  channel: AuthChannel;
  phone?: string;
  email?: string;
  fullName?: string;
};

type PendingAuth = AuthPayload;

type UserProfile = {
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
  metaplexNetwork?: MetaplexNetwork;
  metaplexSyncStatus?: MetaplexSyncStatus;
  metaplexLastSyncAt?: string;
  metaplexLastTxSignature?: string;
  passcode?: string;
};

type VerifyResult = {
  ok: boolean;
  error?: string;
  needsPasscodeSetup?: boolean;
  locked?: boolean;
};

type AuthStore = {
  currentUser: UserProfile | null;
  isLocked: boolean;
  pendingAuth: PendingAuth | null;
  beginAuth: (payload: AuthPayload) => { ok: boolean; error?: string };
  connectWallet: (mode: AuthMode) => Promise<VerifyResult>;
  verifyOtp: (code: string) => VerifyResult;
  setPasscode: (passcode: string) => { ok: boolean; error?: string };
  unlock: (passcode: string) => { ok: boolean; error?: string };
  lockApp: () => void;
  signOut: () => void;
  updateProfile: (input: { fullName: string; email?: string; monopayTag: string }) => Promise<{ ok: boolean; error?: string }>;
  linkWalletToUser: (
    walletAddress: string,
    options?: {
      supabaseUserId?: string;
      handle?: string;
      monopayTag?: string;
      metaplexCardId?: string;
      metaplexCardStatus?: "active" | "deactivated";
      metaplexNetwork?: MetaplexNetwork;
      metaplexSyncStatus?: MetaplexSyncStatus;
      metaplexLastSyncAt?: string;
      metaplexLastTxSignature?: string;
    }
  ) => { ok: boolean; error?: string };
};

// Types export
export {
    AuthMode,
    AuthChannel,
    AuthPayload,
    AuthStore,
    MetaplexNetwork,
    MetaplexSyncStatus,
    PendingAuth,
    UserProfile,
    VerifyResult
}