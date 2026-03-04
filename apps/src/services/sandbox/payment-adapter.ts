import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SendTransactionError,
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

function normalizeEncryptEndpoint(endpoint: string) {
  const trimmed = endpoint.trim();

  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/encrypt";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return trimmed;
  }
}

function buildEncryptEndpointCandidates() {
  const configured = process.env.EXPO_PUBLIC_MONOPAY_INCO_ENCRYPT_ENDPOINT?.trim();
  const seeds = configured
    ? [configured]
    : ["http://127.0.0.1:8787/encrypt", "http://localhost:8787/encrypt"];
  const candidates = new Set<string>();

  for (const seed of seeds) {
    const normalized = normalizeEncryptEndpoint(seed);

    if (!normalized) {
      continue;
    }

    candidates.add(normalized);

    if (normalized.includes("127.0.0.1")) {
      candidates.add(normalized.replace("127.0.0.1", "localhost"));
    }

    if (normalized.includes("localhost")) {
      candidates.add(normalized.replace("localhost", "127.0.0.1"));
    }
  }

  return Array.from(candidates);
}

async function requestEncryptedAmount(endpoint: string, lamports: number) {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    throw new Error(`unreachable (${message})`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { error?: unknown };
    const message = typeof errorBody.error === "string" ? errorBody.error : `endpoint failed (${response.status})`;
    throw new Error(message);
  }

  const body = (await response.json()) as { encryptedHex?: unknown };

  if (typeof body.encryptedHex !== "string" || !HEX_PATTERN.test(body.encryptedHex)) {
    throw new Error("invalid encryptedHex response");
  }

  return body.encryptedHex;
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

async function encryptAmountForMemo(lamports: number): Promise<string> {
  const candidates = buildEncryptEndpointCandidates();

  if (candidates.length === 0) {
    throw new Error(
      "Missing EXPO_PUBLIC_MONOPAY_INCO_ENCRYPT_ENDPOINT. Set it to http://127.0.0.1:8787/encrypt and start: npm --prefix apps run encrypt:server"
    );
  }
  const failures: string[] = [];

  for (let attempt = 0; attempt < candidates.length; attempt += 1) {
    const endpoint = candidates[attempt];

    try {
      const encryptedHex = await requestEncryptedAmount(endpoint, lamports);

      if (attempt > 0) {
        console.warn("[pay-flow] inco:encrypt:fallback-endpoint-used", {
          endpoint,
          attempt: attempt + 1
        });
      }

      return encryptedHex;
    } catch (error) {
      failures.push(`${endpoint} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(
    `Encryption endpoint is unreachable. Tried: ${failures.join(" | ")}. Start local server with: npm --prefix apps run encrypt:server. If testing on a physical device, use your laptop LAN IP in EXPO_PUBLIC_MONOPAY_INCO_ENCRYPT_ENDPOINT (e.g. http://192.168.x.x:8787/encrypt).`
  );
}

export class IncoSolanaPaymentAdapter implements PaymentAdapter {
  async createPrivatePayment(input: PrivatePaymentInput): Promise<PrivatePaymentResult> {
    assertPaymentInput(input);

    const config = getPaymentConfig();
    const assetSymbol = input.assetSymbol.trim().toUpperCase();

    if (assetSymbol !== "SOL") {
      throw new Error("Only SOL transfers are enabled right now. USDC/USDT rail will be added next.");
    }

    const senderKeypair = input.senderSecretKeyBytes
      ? Keypair.fromSecretKey(Uint8Array.from(input.senderSecretKeyBytes))
      : config.senderKeypair;
    const toAddress = resolveWalletAddress(input.toHandle, {
      directory: config.handleDirectory,
      fallbackAddress: config.defaultRecipientPublicKey,
      label: "Recipient wallet"
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

    const encryptedAmountHex = await encryptAmountForMemo(lamports);
    const memoPayload = JSON.stringify({
      app: "monopay",
      privacy: "inco",
      encryptedAmountHex,
      encryptionMode: "remote-inco",
      fromHandle: input.fromHandle.trim(),
      toHandle: input.toHandle.trim(),
      asset: assetSymbol,
      note: input.memo?.slice(0, 64) ?? "",
      ts: new Date().toISOString()
    });

    const memoData = new TextEncoder().encode(memoPayload);

    if (memoData.length > 566) {
      throw new Error("Encrypted memo payload is too large. Reduce memo text and try again.");
    }

    const connection = new Connection(config.rpcUrl, "confirmed");
    const transferIx = SystemProgram.transfer({
      fromPubkey: senderKeypair.publicKey,
      toPubkey: recipient,
      lamports
    });
    const memoIx = new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [],
      data: Buffer.from(memoData)
    });
    const transaction = new Transaction().add(transferIx, memoIx);
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
        preflightCommitment: "confirmed"
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
