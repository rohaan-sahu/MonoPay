import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SendTransactionError,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { getPaymentConfig, resolveWalletAddress } from "@mpay/services/sandbox/env";
import { PaymentAdapter, PrivatePaymentInput, PrivatePaymentResult } from "@mpay/services/sandbox/types";

function assertPaymentInput(input: PrivatePaymentInput) {
  if (!input.fromHandle.trim()) {
    throw new Error("Sender handle is required.");
  }

  if (!input.toHandle.trim()) {
    throw new Error("Recipient handle or wallet address is required.");
  }
}

function inferExplorerCluster(rpcUrl: string) {
  if (rpcUrl.includes("mainnet")) {
    return "mainnet-beta";
  }

  if (rpcUrl.includes("testnet")) {
    return "testnet";
  }

  return "devnet";
}

function inferSupportedNetwork(rpcUrl: string): PrivatePaymentResult["network"] {
  if (rpcUrl.includes("mainnet")) {
    return "solana-mainnet";
  }

  if (rpcUrl.includes("testnet")) {
    return "solana-testnet";
  }

  return "solana-devnet";
}

function formatLamportsAsSol(lamports: number) {
  const sol = lamports / LAMPORTS_PER_SOL;
  return sol.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 9,
  });
}

async function assertSolTransferPreflight(options: {
  connection: Connection;
  sender: PublicKey;
  recipient: PublicKey;
  lamports: number;
  transaction: Transaction;
}) {
  const { connection, sender, recipient, lamports, transaction } = options;

  const [senderBalanceLamports, minimumRentLamports, recipientAccountInfo] = await Promise.all([
    connection.getBalance(sender, "confirmed"),
    connection.getMinimumBalanceForRentExemption(0, "confirmed"),
    connection.getAccountInfo(recipient, "confirmed"),
  ]);

  if (!recipientAccountInfo && lamports < minimumRentLamports) {
    throw new Error(
      `Recipient wallet appears new. Minimum transfer is ~${formatLamportsAsSol(minimumRentLamports)} SOL to satisfy rent requirements.`
    );
  }

  const feeResponse = await connection.getFeeForMessage(transaction.compileMessage(), "confirmed");
  const estimatedFeeLamports = feeResponse.value ?? 5_000;
  const requiredLamports = lamports + estimatedFeeLamports;

  if (senderBalanceLamports < requiredLamports) {
    throw new Error(
      `Insufficient SOL balance. Need ~${formatLamportsAsSol(requiredLamports)} SOL (amount + network fee), available ~${formatLamportsAsSol(senderBalanceLamports)} SOL.`
    );
  }

  const remainingLamports = senderBalanceLamports - requiredLamports;

  if (remainingLamports > 0 && remainingLamports < minimumRentLamports) {
    throw new Error(
      `This payment would leave your wallet below rent-exempt reserve (~${formatLamportsAsSol(minimumRentLamports)} SOL). Reduce amount or top up SOL.`
    );
  }
}

export class SolanaPaymentAdapter implements PaymentAdapter {
  async createPrivatePayment(input: PrivatePaymentInput): Promise<PrivatePaymentResult> {
    assertPaymentInput(input);

    const config = getPaymentConfig();
    const assetSymbol = input.assetSymbol.trim().toUpperCase();

    if (assetSymbol !== "SOL") {
      throw new Error("Only SOL transfers are enabled by this adapter.");
    }

    const senderKeypair = input.senderSecretKeyBytes
      ? Keypair.fromSecretKey(Uint8Array.from(input.senderSecretKeyBytes))
      : config.senderKeypair;

    if (!senderKeypair) {
      throw new Error(
        "No sender keypair available. Connect a wallet first. Sandbox-only fallback uses EXPO_PUBLIC_MONOPAY_SENDER_SECRET_KEY_JSON."
      );
    }
    const toAddress = resolveWalletAddress(input.toHandle, {
      directory: config.handleDirectory,
      fallbackAddress: config.defaultRecipientPublicKey,
      label: "Recipient wallet",
    });

    const recipient = new PublicKey(toAddress);
    const amountSol =
      typeof input.amountSol === "number" && Number.isFinite(input.amountSol) && input.amountSol > 0
        ? input.amountSol
        : null;
    const lamports = amountSol
      ? Math.round(amountSol * LAMPORTS_PER_SOL)
      : Math.round(input.amountUsd * config.lamportsPerUsd);

    if (lamports <= 0) {
      throw new Error("Transfer amount is too small. Increase amount.");
    }

    if (amountSol === null) {
      console.warn("[pay-flow] amount:legacy-usd-conversion", {
        assetSymbol,
        amountUsd: input.amountUsd,
        lamports,
      });
    }

    const connection = new Connection(config.rpcUrl, "confirmed");
    const transferIx = SystemProgram.transfer({
      fromPubkey: senderKeypair.publicKey,
      toPubkey: recipient,
      lamports,
    });
    const transaction = new Transaction().add(transferIx);
    transaction.feePayer = senderKeypair.publicKey;

    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = latestBlockhash.blockhash;

    console.log("[pay-flow] preflight:start", {
      assetSymbol,
      from: senderKeypair.publicKey.toBase58(),
      to: recipient.toBase58(),
      lamports,
    });

    await assertSolTransferPreflight({
      connection,
      sender: senderKeypair.publicKey,
      recipient,
      lamports,
      transaction,
    });

    let signature: string;

    try {
      signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair], {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

      if (message.includes("insufficient funds for rent")) {
        throw new Error("Transaction failed due to rent requirements. Reduce amount or fund sender/recipient SOL.");
      }

      if (message.includes("insufficient funds")) {
        throw new Error("Insufficient SOL balance for this transfer and network fee.");
      }

      if (error instanceof SendTransactionError) {
        throw new Error(`Transaction simulation failed: ${error.message}`);
      }

      throw error;
    }

    const cluster = inferExplorerCluster(config.rpcUrl);

    return {
      transactionId: signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`,
      network: inferSupportedNetwork(config.rpcUrl),
      createdAt: new Date().toISOString(),
      rail: "sol_public",
      assetSymbol,
      amountUi: lamports / LAMPORTS_PER_SOL,
      amountRaw: lamports.toString(),
    };
  }
}
