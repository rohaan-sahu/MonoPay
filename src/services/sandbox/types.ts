export type SupportedNetwork = "solana-devnet" | "solana-testnet" | "solana-mainnet";

export type PrivatePaymentInput = {
  fromHandle: string;
  toHandle: string;
  amountUsd: number;
  amountSol?: number;
  memo?: string;
  assetSymbol: string;
  senderSecretKeyBytes?: number[];
};

export type PrivatePaymentResult = {
  transactionId: string;
  explorerUrl: string;
  network: SupportedNetwork;
  createdAt: string;
  rail?: "sol_public" | "spl_public";
  assetSymbol?: string;
  assetMint?: string;
  amountUi?: number;
  amountRaw?: string;
};

export interface PaymentAdapter {
  createPrivatePayment(input: PrivatePaymentInput): Promise<PrivatePaymentResult>;
}

export type AccountLinkRequest = {
  requestId: string;
  email: string;
  phone: string;
  phoneRequired: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
};

export type FinalizedAccount = {
  accountId: string;
  fullName: string;
  email: string;
  phone: string;
  linkedAt: string;
};

export interface AccountLinkingAdapter {
  startRegistration(input: { email: string; phone: string }): Promise<AccountLinkRequest>;
  verifyEmailCode(input: { requestId: string; code: string }): Promise<AccountLinkRequest>;
  verifyPhoneCode(input: { requestId: string; code: string }): Promise<AccountLinkRequest>;
  finalizeRegistration(input: { requestId: string; fullName: string }): Promise<FinalizedAccount>;
}

export type CardStatus = "active" | "deactivated";

export type ImmutableCardFields = {
  cardId: string;
  owner: string;
  createdAt: string;
  network: SupportedNetwork;
};

export type ProfilePlugin = {
  displayName: string;
  avatarUrl: string;
  paymentPointer: string;
  bio: string;
};

export type IdCardRecord = ImmutableCardFields & {
  status: CardStatus;
  deactivatedAt?: string;
  lastSyncAt?: string;
  lastTxSignature?: string;
  plugins: {
    profile: ProfilePlugin;
  };
};

export type CreateIdCardInput = {
  owner: string;
  displayName: string;
  avatarUrl: string;
  paymentPointer: string;
  bio: string;
};

export type UpdatePluginFieldInput = {
  cardId: string;
  plugin: "profile";
  field: keyof ProfilePlugin | keyof ImmutableCardFields;
  value: string;
};

export interface IdCardAdapter {
  createCard(input: CreateIdCardInput): Promise<IdCardRecord>;
  updatePluginField(input: UpdatePluginFieldInput): Promise<IdCardRecord>;
  deactivateCard(input: { cardId: string; reason?: string }): Promise<IdCardRecord>;
  getCard(cardId: string): Promise<IdCardRecord | null>;
}
