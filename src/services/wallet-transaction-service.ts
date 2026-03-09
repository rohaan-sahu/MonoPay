import {
  Connection,
  LAMPORTS_PER_SOL,
  ParsedTransactionWithMeta,
  PublicKey,
} from "@solana/web3.js";
import { supabase } from "@mpay/lib/supabase";
import { paymentLedgerService } from "@mpay/services/payment-ledger-service";
import { toSolanaRpcUserMessage, withSolanaRpcRetry } from "@mpay/services/solana-rpc-service";

type TransactionDirection = "incoming" | "outgoing" | "self" | "unknown";
type TransactionStatus = "success" | "failed";
type TransactionAssetProgram = "native" | "token" | "token-2022";
type FetchWalletTransactionsOptions = {
  limit?: number;
  forceRefresh?: boolean;
  appOnly?: boolean;
};

export type WalletTransactionEntry = {
  id: string;
  signature: string;
  slot: number;
  createdAt: string;
  dateLabel: string;
  direction: TransactionDirection;
  incoming: boolean;
  status: TransactionStatus;
  amountLamports: number;
  amountSol: number;
  amountRaw: string;
  amountUi: number;
  decimals: number;
  assetSymbol: string;
  assetMint?: string;
  tokenProgram: TransactionAssetProgram;
  amountDisplay: string;
  counterpartyAddress?: string;
  counterpartyLabel: string;
  counterpartyTag?: string;
  app: "monopay" | "solana";
  explorerUrl: string;
};

type TransactionCounterpartyProfile = {
  displayName?: string;
  tag?: string;
};

const RPC_URL = process.env.EXPO_PUBLIC_MONOPAY_RPC_URL || "https://api.devnet.solana.com";
const connection = new Connection(RPC_URL, "confirmed");
const TRANSACTION_CACHE_TTL_MS = 15_000;
const transactionCache = new Map<string, { expiresAt: number; value: WalletTransactionEntry[] }>();
const DEFAULT_USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const DEFAULT_USDC_MAINNET_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const DEFAULT_USDT_MAINNET_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

const mintSymbolMap = new Map<string, string>();

function registerMintSymbol(symbol: string, mints: (string | undefined)[]) {
  for (const mint of mints) {
    const normalized = mint?.trim();
    if (!normalized) continue;
    mintSymbolMap.set(normalized, symbol);
  }
}

registerMintSymbol("USDC", [
  process.env.EXPO_PUBLIC_MONOPAY_USDC_MINT,
  DEFAULT_USDC_DEVNET_MINT,
  DEFAULT_USDC_MAINNET_MINT,
]);
registerMintSymbol("USDT", [
  process.env.EXPO_PUBLIC_MONOPAY_USDT_MINT,
  DEFAULT_USDT_MAINNET_MINT,
]);

function inferExplorerCluster(rpcUrl: string) {
  const normalized = rpcUrl.toLowerCase();

  if (normalized.includes("mainnet")) return "mainnet-beta";
  if (normalized.includes("testnet")) return "testnet";
  return "devnet";
}

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatSolAmount(solAmount: number) {
  return solAmount.toLocaleString("en-US", {
    minimumFractionDigits: solAmount >= 1 ? 2 : 4,
    maximumFractionDigits: 6,
  });
}

function inferAssetSymbol(mint?: string) {
  const normalizedMint = mint?.trim();
  if (!normalizedMint) return "TOKEN";
  return mintSymbolMap.get(normalizedMint) || "TOKEN";
}

function formatTokenAmount(amountUi: number, symbol: string) {
  const isStable = symbol === "USDC" || symbol === "USDT";
  const minimumFractionDigits = isStable && amountUi >= 1 ? 2 : 0;
  const maximumFractionDigits = isStable ? 6 : 8;

  return amountUi.toLocaleString("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}

function formatAmountDisplay(direction: TransactionDirection, amountUi: number, symbol: string) {
  const base = symbol === "SOL" ? `${formatSolAmount(amountUi)} SOL` : `${formatTokenAmount(amountUi, symbol)} ${symbol}`;

  if (direction === "incoming") return `+${base}`;
  if (direction === "outgoing") return `-${base}`;
  return base;
}

function toBigIntSafe(value: unknown) {
  if (typeof value === "bigint") return value;

  if (typeof value === "number" && Number.isFinite(value) && Number.isInteger(value)) {
    return BigInt(value);
  }

  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    try {
      return BigInt(value.trim());
    } catch {
      return null;
    }
  }

  return null;
}

function formatTransactionDate(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toIsoFromBlockTime(blockTime?: number | null) {
  if (typeof blockTime === "number" && Number.isFinite(blockTime)) {
    return new Date(blockTime * 1000).toISOString();
  }

  return new Date().toISOString();
}

function readPubkey(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof (value as { toString?: () => string }).toString === "function") {
    return (value as { toString: () => string }).toString();
  }

  return "";
}

function getMessageAccountKeys(tx: ParsedTransactionWithMeta): string[] {
  return tx.transaction.message.accountKeys.map((key) => {
    if (typeof key === "string") {
      return key;
    }

    if (key && typeof key === "object" && "pubkey" in key) {
      return readPubkey((key as { pubkey?: unknown }).pubkey);
    }

    return "";
  });
}

function parseMonopayMemoCandidate(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const candidates: string[] = [trimmed];
  const unwrappedQuoted =
    trimmed.startsWith("\"") && trimmed.endsWith("\"") ? trimmed.slice(1, -1).trim() : "";
  if (unwrappedQuoted) {
    candidates.push(unwrappedQuoted);
    candidates.push(unwrappedQuoted.replace(/\\"/g, "\"").replace(/\\\\/g, "\\"));
  }

  for (const candidate of candidates) {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");
    const jsonCandidate =
      firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? candidate.slice(firstBrace, lastBrace + 1)
        : candidate;

    try {
      const parsed = JSON.parse(jsonCandidate) as { app?: string };
      if (parsed?.app === "monopay") {
        return parsed;
      }
    } catch {
      // ignore malformed candidates
    }
  }

  return null;
}

function extractMonopayMemoPayload(tx: ParsedTransactionWithMeta) {
  const logs = tx.meta?.logMessages || [];

  for (const line of logs) {
    if (!line.includes("Memo")) {
      continue;
    }

    const withProgramPrefix = line.split("Program log:").slice(1).join("Program log:").trim();
    const afterFirstColon = line.includes(":") ? line.slice(line.indexOf(":") + 1).trim() : "";
    const afterSecondColon = afterFirstColon.includes(":")
      ? afterFirstColon.slice(afterFirstColon.indexOf(":") + 1).trim()
      : "";

    const parsedFromProgram = parseMonopayMemoCandidate(withProgramPrefix);
    if (parsedFromProgram) {
      return parsedFromProgram;
    }

    const parsedFromFirstColon = parseMonopayMemoCandidate(afterFirstColon);
    if (parsedFromFirstColon) {
      return parsedFromFirstColon;
    }

    const parsedFromSecondColon = parseMonopayMemoCandidate(afterSecondColon);
    if (parsedFromSecondColon) {
      return parsedFromSecondColon;
    }
  }

  return null;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function cacheKey(walletAddress: string, limit: number, appOnly: boolean) {
  return `${walletAddress}::${limit}::${appOnly ? "app" : "all"}`;
}

function cloneTransactions(entries: WalletTransactionEntry[]) {
  return entries.map((entry) => ({ ...entry }));
}

async function enrichCounterparties(
  entries: WalletTransactionEntry[],
  traceId: string
): Promise<WalletTransactionEntry[]> {
  const counterparties = entries
    .map((item) => item.counterpartyAddress)
    .filter((value): value is string => Boolean(value));
  const profileMap = await fetchCounterpartyProfiles(counterparties).catch((error) => {
    console.warn("[tx-flow] counterparty:lookup:error", {
      traceId,
      message: error instanceof Error ? error.message : String(error),
    });
    return new Map<string, TransactionCounterpartyProfile>();
  });

  return entries.map((item) => {
    const profile = item.counterpartyAddress ? profileMap.get(item.counterpartyAddress) : undefined;
    const tag = profile?.tag?.replace(/^@+/, "");
    const counterpartyTag = item.counterpartyTag || (tag ? `@${tag}` : undefined);
    const rawLabel = profile?.displayName || counterpartyTag || item.counterpartyLabel;
    const counterpartyLabel =
      rawLabel && rawLabel.replace(/^@/, "").length > 20
        ? truncateAddress(rawLabel.replace(/^@/, ""))
        : rawLabel;

    return {
      ...item,
      counterpartyLabel,
      counterpartyTag,
    };
  });
}

type TokenAccountMeta = {
  owner?: string;
  mint?: string;
  decimals?: number;
};

type ParsedTransfer = {
  direction: TransactionDirection;
  amountLamports: number;
  amountRaw: string;
  amountUi: number;
  decimals: number;
  assetSymbol: string;
  assetMint?: string;
  tokenProgram: TransactionAssetProgram;
  counterpartyAddress?: string;
};

function parseSystemTransferForWallet(tx: ParsedTransactionWithMeta, walletAddress: string): ParsedTransfer | null {
  const instructions = tx.transaction.message.instructions as {
    program?: string;
    parsed?: { type?: string; info?: { source?: string; destination?: string; lamports?: number | string } };
  }[];

  const candidates: {
    source: string;
    destination: string;
    lamports: number;
  }[] = [];

  for (const instruction of instructions) {
    if (instruction.program !== "system") {
      continue;
    }

    const parsed = instruction.parsed;
    const type = parsed?.type;

    if (type !== "transfer" && type !== "transferWithSeed") {
      continue;
    }

    const source = readPubkey(parsed?.info?.source);
    const destination = readPubkey(parsed?.info?.destination);
    const lamportsRaw = parsed?.info?.lamports;
    const lamports = typeof lamportsRaw === "string" ? Number.parseInt(lamportsRaw, 10) : Number(lamportsRaw);

    if (!source || !destination || !Number.isFinite(lamports) || lamports <= 0) {
      continue;
    }

    if (source === walletAddress || destination === walletAddress) {
      candidates.push({ source, destination, lamports });
    }
  }

  if (candidates.length > 0) {
    const preferred =
      candidates.find((item) => item.source === walletAddress && item.destination !== walletAddress) ||
      candidates.find((item) => item.destination === walletAddress && item.source !== walletAddress) ||
      candidates[0];

    const direction: TransactionDirection =
      preferred.source === walletAddress && preferred.destination === walletAddress
        ? "self"
        : preferred.source === walletAddress
          ? "outgoing"
          : "incoming";
    const counterpartyAddress =
      direction === "outgoing"
        ? preferred.destination
        : direction === "incoming"
          ? preferred.source
          : preferred.destination;
    const amountUi = preferred.lamports / LAMPORTS_PER_SOL;

    return {
      direction,
      amountLamports: preferred.lamports,
      amountRaw: preferred.lamports.toString(),
      amountUi,
      decimals: 9,
      assetSymbol: "SOL",
      tokenProgram: "native",
      counterpartyAddress,
    };
  }

  return null;
}

function parseTokenProgram(program?: string): TransactionAssetProgram | null {
  if (program === "spl-token") return "token";
  if (program === "spl-token-2022") return "token-2022";
  return null;
}

function buildTokenAccountMetaMap(tx: ParsedTransactionWithMeta) {
  const map = new Map<string, TokenAccountMeta>();
  const accountKeys = getMessageAccountKeys(tx);
  const balances = [...(tx.meta?.preTokenBalances || []), ...(tx.meta?.postTokenBalances || [])] as {
    accountIndex?: number;
    owner?: string;
    mint?: string;
    uiTokenAmount?: { decimals?: number };
  }[];

  for (const row of balances) {
    const accountIndex = row.accountIndex;
    if (typeof accountIndex !== "number" || accountIndex < 0 || accountIndex >= accountKeys.length) {
      continue;
    }

    const tokenAccount = accountKeys[accountIndex];
    if (!tokenAccount) {
      continue;
    }

    const existing = map.get(tokenAccount) || {};
    const owner = row.owner?.trim();
    const mint = row.mint?.trim();
    const decimals = row.uiTokenAmount?.decimals;

    map.set(tokenAccount, {
      owner: owner || existing.owner,
      mint: mint || existing.mint,
      decimals: typeof decimals === "number" ? decimals : existing.decimals,
    });
  }

  return map;
}

function parseTokenAmountDetails(info: Record<string, unknown>, fallbackDecimals: number) {
  const tokenAmount = (info.tokenAmount && typeof info.tokenAmount === "object"
    ? (info.tokenAmount as { amount?: unknown; decimals?: unknown })
    : null);
  const rawAmount = toBigIntSafe(tokenAmount?.amount ?? info.amount);
  if (rawAmount === null || rawAmount <= 0n) {
    return null;
  }

  const decimalsRaw = tokenAmount?.decimals ?? info.decimals ?? fallbackDecimals;
  const decimalsParsed =
    typeof decimalsRaw === "number"
      ? decimalsRaw
      : typeof decimalsRaw === "string"
        ? Number.parseInt(decimalsRaw, 10)
        : fallbackDecimals;
  const decimals = Number.isFinite(decimalsParsed) && decimalsParsed >= 0 ? decimalsParsed : fallbackDecimals;
  const amountUi = Number(rawAmount.toString()) / 10 ** decimals;

  if (!Number.isFinite(amountUi) || amountUi <= 0) {
    return null;
  }

  return {
    amountRaw: rawAmount.toString(),
    amountUi,
    decimals,
  };
}

function parseTokenTransferForWallet(tx: ParsedTransactionWithMeta, walletAddress: string): ParsedTransfer | null {
  const instructions = tx.transaction.message.instructions as {
    program?: string;
    parsed?: { type?: unknown; info?: unknown };
  }[];
  const tokenAccountMeta = buildTokenAccountMetaMap(tx);
  const candidates: ParsedTransfer[] = [];

  for (const instruction of instructions) {
    const tokenProgram = parseTokenProgram(instruction.program);
    if (!tokenProgram) {
      continue;
    }

    const parsed = instruction.parsed;
    const type = typeof parsed?.type === "string" ? parsed.type : "";
    if (type !== "transfer" && type !== "transferChecked") {
      continue;
    }

    const info = parsed?.info && typeof parsed.info === "object" ? (parsed.info as Record<string, unknown>) : null;
    if (!info) {
      continue;
    }

    const sourceToken = readPubkey(info.source);
    const destinationToken = readPubkey(info.destination);
    if (!sourceToken || !destinationToken) {
      continue;
    }

    const sourceMeta = tokenAccountMeta.get(sourceToken);
    const destinationMeta = tokenAccountMeta.get(destinationToken);
    const sourceOwner = sourceMeta?.owner || "";
    const destinationOwner = destinationMeta?.owner || "";
    const authority = readPubkey(info.authority);
    const walletIsSource = sourceOwner === walletAddress || authority === walletAddress;
    const walletIsDestination = destinationOwner === walletAddress;

    if (!walletIsSource && !walletIsDestination) {
      continue;
    }

    const fallbackDecimals = sourceMeta?.decimals ?? destinationMeta?.decimals ?? 0;
    const amountDetails = parseTokenAmountDetails(info, fallbackDecimals);
    if (!amountDetails) {
      continue;
    }

    const mintFromInfo = readPubkey(info.mint);
    const assetMint = mintFromInfo || sourceMeta?.mint || destinationMeta?.mint;
    const assetSymbol = inferAssetSymbol(assetMint);
    const direction: TransactionDirection =
      walletIsSource && walletIsDestination ? "self" : walletIsSource ? "outgoing" : "incoming";
    const counterpartyAddress =
      direction === "outgoing"
        ? destinationOwner || destinationToken
        : direction === "incoming"
          ? sourceOwner || sourceToken
          : destinationOwner || destinationToken;

    candidates.push({
      direction,
      amountLamports: 0,
      amountRaw: amountDetails.amountRaw,
      amountUi: amountDetails.amountUi,
      decimals: amountDetails.decimals,
      assetSymbol,
      assetMint,
      tokenProgram,
      counterpartyAddress,
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  return (
    candidates.find((item) => item.direction === "outgoing" && item.counterpartyAddress !== walletAddress) ||
    candidates.find((item) => item.direction === "incoming" && item.counterpartyAddress !== walletAddress) ||
    candidates[0]
  );
}

function isMissingRelationError(error: { code?: string; message?: string }) {
  const message = (error.message || "").toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("could not find the table")
  );
}

async function fetchCounterpartyProfiles(
  walletAddresses: string[]
): Promise<Map<string, TransactionCounterpartyProfile>> {
  const uniqueAddresses = Array.from(new Set(walletAddresses.filter(Boolean)));

  if (uniqueAddresses.length === 0) {
    return new Map();
  }

  const profileMap = new Map<string, TransactionCounterpartyProfile>();

  const [profilesResult, identityResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("wallet_address,full_name,monopay_tag")
      .in("wallet_address", uniqueAddresses),
    supabase
      .from("wallet_identities")
      .select("wallet_address,display_name,monopay_tag")
      .in("wallet_address", uniqueAddresses),
  ]);

  if (!profilesResult.error && Array.isArray(profilesResult.data)) {
    for (const row of profilesResult.data as {
      wallet_address?: string | null;
      full_name?: string | null;
      monopay_tag?: string | null;
    }[]) {
      const walletAddress = row.wallet_address?.trim();
      if (!walletAddress) continue;

      const existing = profileMap.get(walletAddress) || {};
      profileMap.set(walletAddress, {
        displayName: row.full_name?.trim() || existing.displayName,
        tag: row.monopay_tag?.trim() || existing.tag,
      });
    }
  } else if (profilesResult.error && !isMissingRelationError(profilesResult.error)) {
    console.warn("[tx-flow] profiles:lookup:error", {
      code: profilesResult.error.code,
      message: profilesResult.error.message,
    });
  }

  if (!identityResult.error && Array.isArray(identityResult.data)) {
    for (const row of identityResult.data as {
      wallet_address?: string | null;
      display_name?: string | null;
      monopay_tag?: string | null;
    }[]) {
      const walletAddress = row.wallet_address?.trim();
      if (!walletAddress) continue;

      const existing = profileMap.get(walletAddress) || {};
      profileMap.set(walletAddress, {
        displayName: existing.displayName || row.display_name?.trim() || undefined,
        tag: existing.tag || row.monopay_tag?.trim() || undefined,
      });
    }
  } else if (identityResult.error && !isMissingRelationError(identityResult.error)) {
    console.warn("[tx-flow] identities:lookup:error", {
      code: identityResult.error.code,
      message: identityResult.error.message,
    });
  }

  return profileMap;
}

export async function fetchWalletTransactions(
  walletAddress: string,
  options?: FetchWalletTransactionsOptions
): Promise<WalletTransactionEntry[]> {
  try {
    const normalizedWallet = new PublicKey(walletAddress).toBase58();
    const limit = Math.max(1, Math.min(options?.limit ?? 25, 40));
    const appOnly = options?.appOnly ?? true;
    const lookupKey = cacheKey(normalizedWallet, limit, appOnly);
    const now = Date.now();
    const cached = transactionCache.get(lookupKey);

    if (!options?.forceRefresh && cached && cached.expiresAt > now) {
      return cloneTransactions(cached.value);
    }

    const traceId = `tx-${Date.now().toString(36)}`;
    const cluster = inferExplorerCluster(RPC_URL);

    if (appOnly) {
      const ledgerHistory = await paymentLedgerService.fetchWalletHistory(normalizedWallet, { limit }).catch((error) => {
        console.warn("[tx-flow] ledger:read:error", {
          traceId,
          message: error instanceof Error ? error.message : String(error),
        });
        return null;
      });

      if (ledgerHistory && ledgerHistory.length > 0) {
        const ledgerEntries: WalletTransactionEntry[] = ledgerHistory.map((entry) => {
          const isOutgoing = entry.senderWalletAddress === normalizedWallet;
          const isIncoming = entry.recipientWalletAddress === normalizedWallet;
          const direction: TransactionDirection =
            isOutgoing && isIncoming ? "self" : isOutgoing ? "outgoing" : "incoming";
          const counterpartyAddress =
            direction === "outgoing"
              ? entry.recipientWalletAddress
              : direction === "incoming"
                ? entry.senderWalletAddress
                : entry.recipientWalletAddress;
          const assetSymbol = entry.assetSymbol.trim().toUpperCase();
          const decimals = assetSymbol === "SOL" ? 9 : 6;
          const amountLamports =
            assetSymbol === "SOL"
              ? Math.max(0, Math.round(entry.amountUi * LAMPORTS_PER_SOL))
              : 0;
          const amountRaw =
            entry.amountRaw ||
            (assetSymbol === "SOL"
              ? amountLamports.toString()
              : Math.round(entry.amountUi * 10 ** decimals).toString());
          const explorerUrl =
            entry.explorerUrl ||
            (entry.txSignature
              ? `https://explorer.solana.com/tx/${entry.txSignature}?cluster=${cluster}`
              : `https://explorer.solana.com/address/${counterpartyAddress}?cluster=${cluster}`);
          const status: TransactionStatus = entry.status === "failed" ? "failed" : "success";

          return {
            id: entry.id,
            signature: entry.txSignature || entry.id,
            slot: 0,
            createdAt: entry.updatedAt || entry.createdAt,
            dateLabel: formatTransactionDate(entry.updatedAt || entry.createdAt),
            direction,
            incoming: direction === "incoming",
            status,
            amountLamports,
            amountSol: assetSymbol === "SOL" ? entry.amountUi : 0,
            amountRaw,
            amountUi: entry.amountUi,
            decimals,
            assetSymbol,
            assetMint: entry.assetMint,
            tokenProgram: assetSymbol === "SOL" ? "native" : "token",
            amountDisplay: formatAmountDisplay(direction, entry.amountUi, assetSymbol),
            counterpartyAddress,
            counterpartyLabel: counterpartyAddress ? truncateAddress(counterpartyAddress) : "Unknown",
            counterpartyTag: entry.recipientTag,
            app: "monopay",
            explorerUrl,
          };
        });

        const enrichedLedger = await enrichCounterparties(ledgerEntries, traceId);
        const result = enrichedLedger
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
        transactionCache.set(lookupKey, {
          expiresAt: now + TRANSACTION_CACHE_TTL_MS,
          value: cloneTransactions(result),
        });

        return result;
      }
    }

    const signatures = await withSolanaRpcRetry(
      () => connection.getSignaturesForAddress(new PublicKey(normalizedWallet), { limit }),
      { maxAttempts: 4, baseDelayMs: 320 }
    );

    if (signatures.length === 0) {
      return [];
    }

    const signatureValues = signatures.map((item) => item.signature);
    const parsedTransactions: (ParsedTransactionWithMeta | null)[] = [];

    for (let index = 0; index < signatureValues.length; index += 1) {
      const signature = signatureValues[index];
      const parsedTx = await withSolanaRpcRetry(
        () =>
          connection.getParsedTransaction(signature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          }),
        { maxAttempts: 4, baseDelayMs: 320 }
      ).catch((error) => {
        console.warn("[tx-flow] parsed:single:error", {
          traceId,
          signature,
          message: error instanceof Error ? error.message : String(error),
        });
        return null;
      });
      parsedTransactions.push(parsedTx);

      if (index + 1 < signatureValues.length) {
        await sleep(90);
      }
    }

    const parsedEntries: WalletTransactionEntry[] = [];

    for (let index = 0; index < signatures.length; index += 1) {
      const signatureInfo = signatures[index];
      const tx = parsedTransactions[index];
      const createdAt = toIsoFromBlockTime(signatureInfo.blockTime);
      const fallbackExplorerUrl = `https://explorer.solana.com/tx/${signatureInfo.signature}?cluster=${cluster}`;

      if (!tx) {
        continue;
      }

      const transfer = parseTokenTransferForWallet(tx, normalizedWallet) || parseSystemTransferForWallet(tx, normalizedWallet);
      const status: TransactionStatus = tx.meta?.err ? "failed" : "success";
      const memoPayload = extractMonopayMemoPayload(tx);
      const app: "monopay" | "solana" = memoPayload?.app === "monopay" ? "monopay" : "solana";
      if (appOnly && app !== "monopay") {
        continue;
      }
      if (!transfer) {
        continue;
      }

      if (transfer.amountUi <= 0) {
        continue;
      }

      parsedEntries.push({
        id: signatureInfo.signature,
        signature: signatureInfo.signature,
        slot: signatureInfo.slot,
        createdAt,
        dateLabel: formatTransactionDate(createdAt),
        direction: transfer.direction,
        incoming: transfer.direction === "incoming",
        status,
        amountLamports: transfer.amountLamports,
        amountSol: transfer.assetSymbol === "SOL" ? transfer.amountUi : 0,
        amountRaw: transfer.amountRaw,
        amountUi: transfer.amountUi,
        decimals: transfer.decimals,
        assetSymbol: transfer.assetSymbol,
        assetMint: transfer.assetMint,
        tokenProgram: transfer.tokenProgram,
        amountDisplay: formatAmountDisplay(transfer.direction, transfer.amountUi, transfer.assetSymbol),
        counterpartyAddress: transfer.counterpartyAddress,
        counterpartyLabel: transfer.counterpartyAddress ? truncateAddress(transfer.counterpartyAddress) : "Unknown",
        app,
        explorerUrl: fallbackExplorerUrl,
      });
    }

    const enriched = await enrichCounterparties(parsedEntries, traceId);

    const result = enriched
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    transactionCache.set(lookupKey, {
      expiresAt: now + TRANSACTION_CACHE_TTL_MS,
      value: cloneTransactions(result),
    });

    return result;
  } catch (error) {
    const fallbackWallet = (() => {
      try {
        return new PublicKey(walletAddress).toBase58();
      } catch {
        return walletAddress.trim();
      }
    })();
    const fallbackLimit = Math.max(1, Math.min(options?.limit ?? 25, 40));
    const fallbackAppOnly = options?.appOnly ?? true;
    const cached = transactionCache.get(cacheKey(fallbackWallet, fallbackLimit, fallbackAppOnly));

    if (cached) {
      return cloneTransactions(cached.value);
    }

    throw new Error(toSolanaRpcUserMessage(error, "Unable to load transaction history right now."));
  }
}
