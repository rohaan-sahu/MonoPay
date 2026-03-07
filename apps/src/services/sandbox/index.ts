import { SupabaseAccountLinkingAdapter } from "@mpay/services/sandbox/account-linking-adapter";
import { getSandboxDefaults } from "@mpay/services/sandbox/env";
import { MetaplexIdCardAdapter } from "@mpay/services/sandbox/id-card-adapter";
import { SolanaPaymentAdapter } from "@mpay/services/sandbox/payment-adapter";

export const sandboxAdapters = {
  payment: new SolanaPaymentAdapter(),
  accountLinking: new SupabaseAccountLinkingAdapter(),
  idCard: new MetaplexIdCardAdapter()
};

export const sandboxDefaults = getSandboxDefaults();

export type {
  AccountLinkRequest,
  FinalizedAccount,
  IdCardRecord,
  PrivatePaymentInput,
  PrivatePaymentResult
} from "@mpay/services/sandbox/types";
