import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { SolanaPaymentAdapter } from "@mpay/services/sandbox/payment-adapter";
import { paymentLedgerService, PaymentRail } from "@mpay/services/payment-ledger-service";
import { SplUsdcPaymentAdapter } from "@mpay/services/payments/spl-usdc-payment-adapter";
import { MagicBlockPrivatePaymentAdapter } from "@mpay/services/payments/magicblock-private-payment-adapter";
import { resolvePayRecipient, ResolvedPayRecipient } from "@mpay/services/pay-recipient-service";
import { PrivatePaymentResult } from "@mpay/services/sandbox/types";
import { walletService } from "@mpay/services/wallet-service";

type SendPrivatePaymentInput = {
  fromHandle: string;
  senderUserId?: string;
  senderWalletAddress?: string;
  recipientInput: string;
  amount: number;
  memo?: string;
  assetSymbol: string;
};

type SendPrivatePaymentResult = {
  payment: PrivatePaymentResult;
  recipient: ResolvedPayRecipient;
};

class PrivatePaymentService {
  private solAdapter = new SolanaPaymentAdapter();
  private usdcAdapter = new SplUsdcPaymentAdapter();
  private magicBlockUsdcAdapter = new MagicBlockPrivatePaymentAdapter();

  private shouldUseMagicBlockUsdcRail() {
    const raw = process.env.EXPO_PUBLIC_MONOPAY_MAGICBLOCK_ENABLED?.trim().toLowerCase();
    return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
  }

  async sendByRecipient(input: SendPrivatePaymentInput): Promise<SendPrivatePaymentResult> {
    const fromHandle = input.fromHandle.trim();
    const assetSymbol = input.assetSymbol.trim().toUpperCase();

    if (!fromHandle) {
      throw new Error("Sender handle is required.");
    }

    if (assetSymbol !== "SOL" && assetSymbol !== "USDC") {
      throw new Error("Unsupported asset. Use SOL or USDC for now.");
    }

    if (input.amount <= 0 || Number.isNaN(input.amount)) {
      throw new Error("Amount must be greater than 0.");
    }

    const sender = await walletService.getKeypair();

    if (!sender) {
      throw new Error("No wallet keypair available on this device. Reconnect wallet and try again.");
    }

    const senderWalletAddress = sender.publicKey.toBase58();
    const recipient = await resolvePayRecipient(input.recipientInput);

    if (
      recipient.walletAddress === senderWalletAddress ||
      (input.senderWalletAddress && recipient.walletAddress === input.senderWalletAddress)
    ) {
      throw new Error("You cannot send payment to your own wallet.");
    }

    const useMagicBlockUsdcRail = assetSymbol === "USDC" && this.shouldUseMagicBlockUsdcRail();
    const selectedAdapter =
      assetSymbol === "SOL"
        ? this.solAdapter
        : useMagicBlockUsdcRail
          ? this.magicBlockUsdcAdapter
          : this.usdcAdapter;

    const rail: PaymentRail = assetSymbol === "SOL" ? "sol_public" : "spl_public";
    const fallbackAmountRaw =
      assetSymbol === "SOL" ? Math.round(input.amount * LAMPORTS_PER_SOL).toString() : undefined;
    const fallbackAssetMint = assetSymbol === "USDC" ? process.env.EXPO_PUBLIC_MONOPAY_USDC_MINT : undefined;

    let intentId: string | undefined;
    try {
      const pendingIntent = await paymentLedgerService.createPendingIntent({
        senderUserId: input.senderUserId,
        senderWalletAddress,
        senderHandle: fromHandle,
        recipientWalletAddress: recipient.walletAddress,
        recipientInput: input.recipientInput,
        recipientNormalized: recipient.normalized,
        recipientTag: recipient.source === "tag" ? recipient.normalized : undefined,
        assetSymbol,
        assetMint: fallbackAssetMint,
        amountUi: input.amount,
        amountRaw: fallbackAmountRaw,
        memo: input.memo,
        rail,
      });
      intentId = pendingIntent?.id;
    } catch (ledgerError) {
      console.warn("[payment-ledger] intent:create:error", {
        message: ledgerError instanceof Error ? ledgerError.message : String(ledgerError),
      });
    }

    let payment: PrivatePaymentResult;
    try {
      payment = await selectedAdapter.createPrivatePayment({
        fromHandle,
        toHandle: recipient.walletAddress,
        amountUsd: input.amount,
        amountSol: assetSymbol === "SOL" ? input.amount : undefined,
        memo: input.memo,
        assetSymbol,
        senderSecretKeyBytes: Array.from(sender.secretKey),
      });
    } catch (error) {
      if (intentId) {
        await paymentLedgerService
          .markIntentFailed({
            intentId,
            errorMessage: error instanceof Error ? error.message : String(error),
          })
          .catch((ledgerError) => {
            console.warn("[payment-ledger] intent:mark-failed:error", {
              intentId,
              message: ledgerError instanceof Error ? ledgerError.message : String(ledgerError),
            });
          });
      }
      throw error;
    }

    if (intentId) {
      await paymentLedgerService
        .markIntentSubmitted({
          intentId,
          txSignature: payment.transactionId,
          explorerUrl: payment.explorerUrl,
          network: payment.network,
          status: "confirmed",
          assetMint: payment.assetMint || fallbackAssetMint,
          amountRaw: payment.amountRaw || fallbackAmountRaw,
        })
        .catch((ledgerError) => {
          console.warn("[payment-ledger] intent:mark-confirmed:error", {
            intentId,
            message: ledgerError instanceof Error ? ledgerError.message : String(ledgerError),
          });
        });
    }

    console.log("[pay-flow] send:ok", {
      assetSymbol,
      rail,
      adapter: assetSymbol === "SOL" ? "sol_public" : useMagicBlockUsdcRail ? "magicblock_private" : "spl_public",
      intentId,
      recipient: recipient.normalized,
      walletAddress: recipient.walletAddress,
      tx: payment.transactionId,
      network: payment.network,
    });

    return { payment, recipient };
  }
}

export const privatePaymentService = new PrivatePaymentService();
