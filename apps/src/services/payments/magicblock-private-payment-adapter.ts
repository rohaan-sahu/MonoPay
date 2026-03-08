import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { Buffer } from "buffer";
import { getPaymentConfig } from "@mpay/services/sandbox/env";
import { PaymentAdapter, PrivatePaymentInput, PrivatePaymentResult } from "@mpay/services/sandbox/types";
import { withSolanaRpcRetry } from "@mpay/services/solana-rpc-service";

const DEFAULT_API_BASE = "https://api.docs.magicblock.app";
const REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const DEFAULT_USDC_MAINNET_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

type MagicBlockTxResponse = {
  transaction?: string;
  message?: string;
  error?: string;
};

function parseBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function resolveApiBase() {
  const configured = process.env.EXPO_PUBLIC_MONOPAY_MAGICBLOCK_API_BASE_URL?.trim();
  if (!configured) {
    return DEFAULT_API_BASE;
  }

  const withProtocol = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  return withProtocol.replace(/\/+$/, "");
}

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

  const scaled = Math.round(uiAmount * 10 ** decimals);
  if (!Number.isFinite(scaled) || scaled <= 0) {
    throw new Error("Transfer amount is too small.");
  }

  return BigInt(scaled);
}

function assertSafeIntegerAmount(value: bigint) {
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  if (value > max) {
    throw new Error("Transfer amount is too large for MagicBlock API integer payload.");
  }

  return Number(value);
}

function assertPaymentInput(input: PrivatePaymentInput) {
  const assetSymbol = input.assetSymbol.trim().toUpperCase();
  if (assetSymbol !== "USDC") {
    throw new Error("MagicBlock rail currently supports USDC only.");
  }

  if (!input.fromHandle.trim()) {
    throw new Error("Sender handle is required.");
  }

  if (!input.toHandle.trim()) {
    throw new Error("Recipient wallet is required.");
  }

  if (!Number.isFinite(input.amountUsd) || input.amountUsd <= 0) {
    throw new Error("Amount must be greater than 0.");
  }
}

async function postMagicBlockTx(
  path: string,
  payload: Record<string, unknown>,
  traceId: string
): Promise<MagicBlockTxResponse> {
  const apiBase = resolveApiBase();
  const endpoint = `${apiBase}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  const apiKey = process.env.EXPO_PUBLIC_MONOPAY_MAGICBLOCK_API_KEY?.trim();
  const bearerToken = process.env.EXPO_PUBLIC_MONOPAY_MAGICBLOCK_AUTH_BEARER?.trim();
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  if (bearerToken) {
    headers.authorization = `Bearer ${bearerToken}`;
  }

  try {
    console.log("[pay-flow] magicblock:request:start", {
      traceId,
      path,
      endpoint,
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = (await response.json().catch(() => ({}))) as MagicBlockTxResponse;
    if (!response.ok) {
      const detail =
        body.error ||
        body.message ||
        `MagicBlock endpoint failed (${response.status})`;
      throw new Error(detail);
    }

    if (!body.transaction || typeof body.transaction !== "string") {
      throw new Error("MagicBlock endpoint did not return a serialized transaction.");
    }

    console.log("[pay-flow] magicblock:request:ok", {
      traceId,
      path,
      endpoint,
    });

    return body;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`request failed (${endpoint}): ${message}`);
  } finally {
    clearTimeout(timeout);
    console.log("[pay-flow] magicblock:request:done", {
      traceId,
      path,
    });
  }
}

const TRANSFER_CHECKED_OPCODE = 12;
const TRANSFER_CHECKED_DATA_LENGTH = 10;

/**
 * Patch TransferChecked decimals directly on the raw serialized bytes.
 * Avoids deserialize→mutate→re-serialize roundtrip issues.
 * TransferChecked data: [12 (1 byte)] [amount (8 bytes LE)] [decimals (1 byte)]
 */
function patchTransferCheckedDecimalsRaw(txBase64: string, correctDecimals: number): string {
  const bytes = Buffer.from(txBase64, "base64");

  // Deserialize to find exact byte offsets of instruction data, then patch the raw buffer
  try {
    const vtx = VersionedTransaction.deserialize(Uint8Array.from(bytes));
    // MessageV0 serialization: we need to find the instruction data offset in the raw bytes.
    // Instead, rebuild the message bytes to find the TransferChecked pattern reliably.
    const msgBytes = vtx.message.serialize();

    // Find TransferChecked pattern in the message bytes
    for (let i = 0; i <= msgBytes.length - TRANSFER_CHECKED_DATA_LENGTH; i++) {
      if (
        msgBytes[i] === TRANSFER_CHECKED_OPCODE &&
        // Verify this is actually the instruction data by checking the data length prefix
        // In MessageV0 serialization, instruction data is prefixed with a compact-u16 length.
        // For 10 bytes, the compact-u16 prefix is just `10` (0x0a) at position i-1
        i > 0 &&
        msgBytes[i - 1] === TRANSFER_CHECKED_DATA_LENGTH
      ) {
        const currentDecimals = msgBytes[i + 9];
        if (currentDecimals !== correctDecimals) {
          console.log("[pay-flow] magicblock:patch-decimals:raw", {
            msgByteOffset: i + 9,
            from: currentDecimals,
            to: correctDecimals,
          });

          // Find the same pattern in the full transaction bytes (message is embedded in tx)
          // The message bytes appear after the signature section in the serialized tx
          const sigCount = bytes[0]; // compact-u16 for small values
          const sigSectionLength = 1 + sigCount * 64;
          const msgStart = sigSectionLength;
          const targetOffset = msgStart + (i + 9);

          if (targetOffset < bytes.length && bytes[targetOffset] === currentDecimals) {
            bytes[targetOffset] = correctDecimals;
            console.log("[pay-flow] magicblock:patch-decimals:applied", {
              txByteOffset: targetOffset,
              verification: bytes[targetOffset] === correctDecimals,
            });
            return bytes.toString("base64");
          }
        }
      }
    }
  } catch (e) {
    console.warn("[pay-flow] magicblock:patch-decimals:versioned-failed", {
      error: e instanceof Error ? e.message : String(e),
    });
  }

  // Fallback: scan raw bytes for the pattern (less precise but covers legacy tx)
  // Look for compact-u16(10) followed by opcode 12
  for (let i = 1; i < bytes.length - TRANSFER_CHECKED_DATA_LENGTH; i++) {
    if (
      bytes[i - 1] === TRANSFER_CHECKED_DATA_LENGTH &&
      bytes[i] === TRANSFER_CHECKED_OPCODE
    ) {
      const decimalsOffset = i + 9;
      if (decimalsOffset < bytes.length && bytes[decimalsOffset] !== correctDecimals) {
        console.log("[pay-flow] magicblock:patch-decimals:raw-fallback", {
          offset: decimalsOffset,
          from: bytes[decimalsOffset],
          to: correctDecimals,
        });
        bytes[decimalsOffset] = correctDecimals;
        return bytes.toString("base64");
      }
    }
  }

  return txBase64;
}

async function signAndSubmitSerializedTransaction(input: {
  connection: Connection;
  signer: Keypair;
  serializedTransactionBase64: string;
  traceId: string;
  stage: "recipient_init" | "deposit" | "transfer";
  patchDecimals?: number;
}) {
  const rawPayload = input.serializedTransactionBase64.trim();
  if (!rawPayload) {
    throw new Error("MagicBlock returned an empty transaction payload.");
  }

  // Apply decimals patch on raw bytes before any deserialization
  const payload = input.patchDecimals != null
    ? patchTransferCheckedDecimalsRaw(rawPayload, input.patchDecimals)
    : rawPayload;

  const bytes = Buffer.from(payload, "base64");
  if (bytes.length === 0) {
    throw new Error("MagicBlock returned an invalid transaction payload.");
  }

  const isBlockhashNotFound = (message: string) => {
    const lower = message.toLowerCase();
    return lower.includes("blockhash not found");
  };

  let versionedTx: VersionedTransaction | null = null;
  try {
    versionedTx = VersionedTransaction.deserialize(bytes);
  } catch {
    versionedTx = null;
  }

  if (versionedTx) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      versionedTx.sign([input.signer]);

      try {
        const signature = await withSolanaRpcRetry(
          () =>
            input.connection.sendRawTransaction(versionedTx.serialize(), {
              preflightCommitment: "confirmed",
              maxRetries: 3,
            }),
          { maxAttempts: 3, baseDelayMs: 300 }
        );
        await withSolanaRpcRetry(() => input.connection.confirmTransaction(signature, "confirmed"), {
          maxAttempts: 3,
          baseDelayMs: 300,
        });
        return signature;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!isBlockhashNotFound(message) || attempt === 1) {
          throw error;
        }

        console.warn("[pay-flow] magicblock:submit:blockhash-retry", {
          traceId: input.traceId,
          stage: input.stage,
          txKind: "versioned",
        });

        const latestBlockhash = await input.connection.getLatestBlockhash("confirmed");
        versionedTx.message.recentBlockhash = latestBlockhash.blockhash;
      }
    }
  }

  const legacyTx = Transaction.from(bytes);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    legacyTx.partialSign(input.signer);

    try {
      const signature = await withSolanaRpcRetry(
        () =>
          input.connection.sendRawTransaction(legacyTx.serialize(), {
            preflightCommitment: "confirmed",
            maxRetries: 3,
          }),
        { maxAttempts: 3, baseDelayMs: 300 }
      );
      await withSolanaRpcRetry(() => input.connection.confirmTransaction(signature, "confirmed"), {
        maxAttempts: 3,
        baseDelayMs: 300,
      });
      return signature;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!isBlockhashNotFound(message) || attempt === 1) {
        throw error;
      }

      console.warn("[pay-flow] magicblock:submit:blockhash-retry", {
        traceId: input.traceId,
        stage: input.stage,
        txKind: "legacy",
      });
      const latestBlockhash = await input.connection.getLatestBlockhash("confirmed");
      legacyTx.recentBlockhash = latestBlockhash.blockhash;
    }
  }

  throw new Error("MagicBlock transaction submit failed.");
}

export class MagicBlockPrivatePaymentAdapter implements PaymentAdapter {
  async createPrivatePayment(input: PrivatePaymentInput): Promise<PrivatePaymentResult> {
    assertPaymentInput(input);

    if (!parseBooleanFlag(process.env.EXPO_PUBLIC_MONOPAY_MAGICBLOCK_ENABLED, false)) {
      throw new Error("MagicBlock rail is disabled. Set EXPO_PUBLIC_MONOPAY_MAGICBLOCK_ENABLED=true.");
    }

    const paymentConfig = getPaymentConfig();
    const connection = new Connection(paymentConfig.rpcUrl, "confirmed");
    const sender = input.senderSecretKeyBytes
      ? Keypair.fromSecretKey(Uint8Array.from(input.senderSecretKeyBytes))
      : paymentConfig.senderKeypair;

    if (!sender) {
      throw new Error(
        "No sender keypair available. Connect a wallet first. Sandbox-only fallback uses EXPO_PUBLIC_MONOPAY_SENDER_SECRET_KEY_JSON."
      );
    }
    const recipient = new PublicKey(input.toHandle.trim());
    const mint = resolveUsdcMint(paymentConfig.rpcUrl);
    const mintInfo = await getMint(connection, mint, "confirmed");
    const amountRawBigInt = toRawAmount(input.amountUsd, mintInfo.decimals);
    const amountRawInteger = assertSafeIntegerAmount(amountRawBigInt);
    const traceId = `magicblock-${Date.now().toString(36)}`;
    const endpointOverride =
      process.env.EXPO_PUBLIC_MONOPAY_MAGICBLOCK_ENDPOINT_URL?.trim() || "";
    const validator = process.env.EXPO_PUBLIC_MONOPAY_MAGICBLOCK_VALIDATOR?.trim();
    const shouldInitializeRecipient = parseBooleanFlag(
      process.env.EXPO_PUBLIC_MONOPAY_MAGICBLOCK_INIT_RECIPIENT,
      true
    );
    const shouldDepositBeforeTransfer = parseBooleanFlag(
      process.env.EXPO_PUBLIC_MONOPAY_MAGICBLOCK_DEPOSIT_BEFORE_TRANSFER,
      true
    );

    console.log("[pay-flow] magicblock:send:start", {
      traceId,
      senderWalletAddress: sender.publicKey.toBase58(),
      recipientWalletAddress: recipient.toBase58(),
      mint: mint.toBase58(),
      amountUi: input.amountUsd,
      amountRaw: amountRawBigInt.toString(),
      mintDecimals: mintInfo.decimals,
      endpointOverride: endpointOverride || "(magicblock-default)",
      validator,
      shouldInitializeRecipient,
      shouldDepositBeforeTransfer,
    });
    console.log("[pay-flow] magicblock:notice", {
      traceId,
      message:
        "Private transfer moves value inside MagicBlock private accounts. Recipient public ATA will not increase until withdraw flow is executed.",
    });

    if (shouldDepositBeforeTransfer) {
      if (shouldInitializeRecipient) {
        const recipientInitPayload: Record<string, unknown> = {
          payer: sender.publicKey.toBase58(),
          user: recipient.toBase58(),
          mint: mint.toBase58(),
          amount: 0,
        };
        if (validator) {
          recipientInitPayload.validator = validator;
        }
        if (endpointOverride) {
          recipientInitPayload.endpoint_url = endpointOverride;
        }

        try {
          const recipientInit = await postMagicBlockTx(
            "/private/tx/deposit",
            recipientInitPayload,
            traceId
          );
          const recipientInitTx = await signAndSubmitSerializedTransaction({
            connection,
            signer: sender,
            serializedTransactionBase64: recipientInit.transaction || "",
            traceId,
            stage: "recipient_init",
          });
          console.log("[pay-flow] magicblock:recipient-init:ok", {
            traceId,
            tx: recipientInitTx,
          });
        } catch (initError) {
          const msg = initError instanceof Error ? initError.message : String(initError);
          if (msg.includes("already in use") || msg.includes("already exists")) {
            console.log("[pay-flow] magicblock:recipient-init:skipped (account already exists)", {
              traceId,
            });
          } else {
            throw initError;
          }
        }
      }

      const senderDepositPayload: Record<string, unknown> = {
        payer: sender.publicKey.toBase58(),
        user: sender.publicKey.toBase58(),
        mint: mint.toBase58(),
        amount: amountRawInteger,
      };
      if (validator) {
        senderDepositPayload.validator = validator;
      }
      if (endpointOverride) {
        senderDepositPayload.endpoint_url = endpointOverride;
      }

      try {
        const senderDeposit = await postMagicBlockTx("/private/tx/deposit", senderDepositPayload, traceId);
        const senderDepositTx = await signAndSubmitSerializedTransaction({
          connection,
          signer: sender,
          serializedTransactionBase64: senderDeposit.transaction || "",
          traceId,
          stage: "deposit",
        });
        console.log("[pay-flow] magicblock:deposit:ok", {
          traceId,
          tx: senderDepositTx,
        });
      } catch (depositError) {
        const msg = depositError instanceof Error ? depositError.message : String(depositError);
        if (msg.includes("already in use") || msg.includes("already exists")) {
          console.warn("[pay-flow] magicblock:deposit:skipped (sender private account already exists, proceeding with existing balance)", {
            traceId,
          });
        } else {
          throw depositError;
        }
      }
    }

    const transferRequestPayload: Record<string, unknown> = {
      sender: sender.publicKey.toBase58(),
      recipient: recipient.toBase58(),
      mint: mint.toBase58(),
      amount: amountRawInteger,
      decimals: mintInfo.decimals,
    };
    if (endpointOverride) {
      transferRequestPayload.endpoint_url = endpointOverride;
    }

    console.log("[pay-flow] magicblock:transfer:request", {
      traceId,
      amount: amountRawInteger,
      decimals: mintInfo.decimals,
      mint: mint.toBase58(),
    });

    const transferPayload = await postMagicBlockTx("/private/tx/transfer-amount", transferRequestPayload, traceId);

    const transferSignature = await signAndSubmitSerializedTransaction({
      connection,
      signer: sender,
      serializedTransactionBase64: transferPayload.transaction || "",
      traceId,
      stage: "transfer",
      patchDecimals: mintInfo.decimals,
    });
    const cluster = inferExplorerCluster(paymentConfig.rpcUrl);

    return {
      transactionId: transferSignature,
      explorerUrl: `https://explorer.solana.com/tx/${transferSignature}?cluster=${cluster}`,
      network: inferSupportedNetwork(paymentConfig.rpcUrl),
      createdAt: new Date().toISOString(),
      rail: "spl_public",
      assetSymbol: "USDC",
      assetMint: mint.toBase58(),
      amountUi: input.amountUsd,
      amountRaw: amountRawBigInt.toString(),
    };
  }
}
