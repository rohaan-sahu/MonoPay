import {
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { getPaymentConfig, resolveWalletAddress } from "@mpay/services/sandbox/env";
import { PaymentAdapter, PrivatePaymentInput, PrivatePaymentResult } from "@mpay/services/sandbox/types";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const HEX_PATTERN = /^[0-9a-fA-F]+$/;

function assertPaymentInput(input: PrivatePaymentInput) {
  if (!input.fromHandle.trim()) {
    throw new Error("Sender handle is required.");
  }

  if (!input.toHandle.trim()) {
    throw new Error("Recipient handle or wallet address is required.");
  }

  if (input.amountUsd <= 0 || Number.isNaN(input.amountUsd)) {
    throw new Error("Amount must be greater than 0.");
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

async function encryptAmountForMemo(lamports: number): Promise<string> {
  const endpoint = process.env.EXPO_PUBLIC_MONOPAY_INCO_ENCRYPT_ENDPOINT?.trim();

  if (!endpoint) {
    throw new Error("Missing EXPO_PUBLIC_MONOPAY_INCO_ENCRYPT_ENDPOINT. Start the Inco encryption server first.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        value: String(lamports)
      }),
      signal: controller.signal
    });
  } catch {
    throw new Error("Encryption endpoint is unreachable. Ensure the Inco encryption server is running.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { error?: unknown };
    const message = typeof errorBody.error === "string" ? errorBody.error : `Encryption endpoint failed (${response.status}).`;
    throw new Error(message);
  }

  const body = (await response.json()) as { encryptedHex?: unknown };

  if (typeof body.encryptedHex !== "string" || !HEX_PATTERN.test(body.encryptedHex)) {
    throw new Error("Encryption endpoint returned an invalid encryptedHex response.");
  }

  return body.encryptedHex;
}

export class IncoSolanaPaymentAdapter implements PaymentAdapter {
  async createPrivatePayment(input: PrivatePaymentInput): Promise<PrivatePaymentResult> {
    assertPaymentInput(input);

    const config = getPaymentConfig();
    const toAddress = resolveWalletAddress(input.toHandle, {
      directory: config.handleDirectory,
      fallbackAddress: config.defaultRecipientPublicKey,
      label: "Recipient wallet"
    });

    const recipient = new PublicKey(toAddress);
    const lamports = Math.round(input.amountUsd * config.lamportsPerUsd);

    if (lamports <= 0) {
      throw new Error("Converted transfer amount is too small. Increase amount.");
    }

    const encryptedAmountHex = await encryptAmountForMemo(lamports);
    const memoPayload = JSON.stringify({
      app: "monopay",
      privacy: "inco",
      encryptedAmountHex,
      encryptionMode: "remote-inco",
      fromHandle: input.fromHandle.trim(),
      toHandle: input.toHandle.trim(),
      asset: input.assetSymbol,
      note: input.memo?.slice(0, 64) ?? "",
      ts: new Date().toISOString()
    });

    const memoData = new TextEncoder().encode(memoPayload);

    if (memoData.length > 566) {
      throw new Error("Encrypted memo payload is too large. Reduce memo text and try again.");
    }

    const connection = new Connection(config.rpcUrl, "confirmed");
    const transferIx = SystemProgram.transfer({
      fromPubkey: config.senderKeypair.publicKey,
      toPubkey: recipient,
      lamports
    });
    const memoIx = new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [],
      data: Buffer.from(memoData)
    });
    const transaction = new Transaction().add(transferIx, memoIx);
    transaction.feePayer = config.senderKeypair.publicKey;

    const signature = await sendAndConfirmTransaction(connection, transaction, [config.senderKeypair], {
      commitment: "confirmed",
      preflightCommitment: "confirmed"
    });

    const cluster = inferExplorerCluster(config.rpcUrl);

    return {
      transactionId: signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`,
      network: inferSupportedNetwork(config.rpcUrl),
      createdAt: new Date().toISOString()
    };
  }
}
