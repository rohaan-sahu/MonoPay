import {
  Connection,
  Keypair,
  PublicKey,
  SendTransactionError,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { Buffer } from "buffer";
import { getPaymentConfig } from "@mpay/services/sandbox/env";
import { PaymentAdapter, PrivatePaymentInput, PrivatePaymentResult } from "@mpay/services/sandbox/types";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const TOKEN_ACCOUNT_SIZE_BYTES = 165;
const DEFAULT_USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const DEFAULT_USDC_MAINNET_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function inferExplorerCluster(rpcUrl: string) {
  if (rpcUrl.includes("mainnet")) return "mainnet-beta";
  if (rpcUrl.includes("testnet")) return "testnet";
  return "devnet";
}

function inferSupportedNetwork(rpcUrl: string): PrivatePaymentResult["network"] {
  if (rpcUrl.includes("mainnet")) return "solana-mainnet";
  if (rpcUrl.includes("testnet")) return "solana-testnet";
  return "solana-devnet";
}

function formatTokenAmount(value: number, decimals = 6) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function formatRawTokenAmount(rawAmount: bigint, decimals: number) {
  const divisor = 10n ** BigInt(decimals);
  const whole = rawAmount / divisor;
  const fraction = rawAmount % divisor;
  const fractionString = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");

  return fractionString ? `${whole.toString()}.${fractionString}` : whole.toString();
}

function formatSolAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 9,
  });
}

function resolveUsdcMint(rpcUrl: string) {
  const configured = process.env.EXPO_PUBLIC_MONOPAY_USDC_MINT?.trim();
  if (configured) {
    return new PublicKey(configured);
  }

  if (rpcUrl.includes("mainnet")) {
    return new PublicKey(DEFAULT_USDC_MAINNET_MINT);
  }

  return new PublicKey(DEFAULT_USDC_DEVNET_MINT);
}

function toRawAmount(uiAmount: number, decimals: number) {
  if (!Number.isFinite(uiAmount) || uiAmount <= 0) {
    throw new Error("Amount must be greater than 0.");
  }

  const multiplier = 10 ** decimals;
  const scaled = Math.round(uiAmount * multiplier);

  if (!Number.isFinite(scaled) || scaled <= 0) {
    throw new Error("Transfer amount is too small.");
  }

  return BigInt(scaled);
}

function buildMemoPayload(input: PrivatePaymentInput, mint: PublicKey) {
  const payload = JSON.stringify({
    app: "monopay",
    privacy: "public",
    rail: "spl_public",
    asset: "USDC",
    mint: mint.toBase58(),
    fromHandle: input.fromHandle.trim(),
    toHandle: input.toHandle.trim(),
    note: input.memo?.slice(0, 64) ?? "",
    ts: new Date().toISOString(),
  });
  const data = new TextEncoder().encode(payload);

  if (data.length > 566) {
    throw new Error("Memo payload is too large. Reduce note text and try again.");
  }

  return Buffer.from(data);
}

async function assertSplTransferPreflight(input: {
  connection: Connection;
  sender: PublicKey;
  senderAta: PublicKey;
  recipientAtaExists: boolean;
  amountRaw: bigint;
  amountUi: number;
  decimals: number;
  transaction: Transaction;
}) {
  const { connection, sender, senderAta, recipientAtaExists, amountRaw, amountUi, decimals, transaction } = input;
  const senderTokenAccount = await getAccount(connection, senderAta, "confirmed", TOKEN_PROGRAM_ID).catch(() => {
    throw new Error("No USDC token account found for sender wallet. Fund this wallet with devnet USDC first.");
  });
  const [senderSolBalance, feeResponse, ataRentLamports] = await Promise.all([
    connection.getBalance(sender, "confirmed"),
    connection.getFeeForMessage(transaction.compileMessage(), "confirmed"),
    recipientAtaExists
      ? Promise.resolve(0)
      : connection.getMinimumBalanceForRentExemption(TOKEN_ACCOUNT_SIZE_BYTES, "confirmed"),
  ]);

  if (senderTokenAccount.amount < amountRaw) {
    throw new Error(
      `Insufficient USDC balance. Need ${formatTokenAmount(amountUi)} USDC, available ${formatRawTokenAmount(senderTokenAccount.amount, decimals)} USDC.`
    );
  }

  const estimatedFeeLamports = feeResponse.value ?? 5_000;
  const requiredSolLamports = estimatedFeeLamports + ataRentLamports;
  if (senderSolBalance < requiredSolLamports) {
    throw new Error(
      `Insufficient SOL for network fees. Need ~${formatSolAmount(requiredSolLamports / 1_000_000_000)} SOL, available ~${formatSolAmount(senderSolBalance / 1_000_000_000)} SOL.`
    );
  }
}

function assertPaymentInput(input: PrivatePaymentInput) {
  if (!input.fromHandle.trim()) {
    throw new Error("Sender handle is required.");
  }

  if (!input.toHandle.trim()) {
    throw new Error("Recipient wallet is required.");
  }

  const assetSymbol = input.assetSymbol.trim().toUpperCase();
  if (assetSymbol !== "USDC") {
    throw new Error("USDC adapter received unsupported asset.");
  }
}

export class SplUsdcPaymentAdapter implements PaymentAdapter {
  async createPrivatePayment(input: PrivatePaymentInput): Promise<PrivatePaymentResult> {
    assertPaymentInput(input);

    const config = getPaymentConfig();
    const connection = new Connection(config.rpcUrl, "confirmed");
    const mint = resolveUsdcMint(config.rpcUrl);

    const senderKeypair = input.senderSecretKeyBytes
      ? Keypair.fromSecretKey(Uint8Array.from(input.senderSecretKeyBytes))
      : config.senderKeypair;
    const recipient = new PublicKey(input.toHandle.trim());

    const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_PROGRAM_ID);
    const decimals = mintInfo.decimals;
    const amountUi = input.amountUsd;
    const amountRaw = toRawAmount(amountUi, decimals);

    const senderAta = getAssociatedTokenAddressSync(
      mint,
      senderKeypair.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const recipientAta = getAssociatedTokenAddressSync(
      mint,
      recipient,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const recipientAtaInfo = await connection.getAccountInfo(recipientAta, "confirmed");
    const recipientAtaExists = Boolean(recipientAtaInfo);

    const transaction = new Transaction();

    if (!recipientAtaExists) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          senderKeypair.publicKey,
          recipientAta,
          recipient,
          mint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    transaction.add(
      createTransferCheckedInstruction(
        senderAta,
        mint,
        recipientAta,
        senderKeypair.publicKey,
        amountRaw,
        decimals,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const memoIx = new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [],
      data: buildMemoPayload(input, mint),
    });
    transaction.add(memoIx);

    transaction.feePayer = senderKeypair.publicKey;
    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = latestBlockhash.blockhash;

    await assertSplTransferPreflight({
      connection,
      sender: senderKeypair.publicKey,
      senderAta,
      recipientAtaExists,
      amountRaw,
      amountUi,
      decimals,
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

      if (message.includes("insufficient funds")) {
        throw new Error("Insufficient balance for this USDC transfer or network fee.");
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
      rail: "spl_public",
      assetSymbol: "USDC",
      assetMint: mint.toBase58(),
      amountUi,
      amountRaw: amountRaw.toString(),
    };
  }
}
