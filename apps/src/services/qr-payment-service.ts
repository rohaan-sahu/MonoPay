import { PublicKey } from "@solana/web3.js";

export type ParsedQrRecipient = {
  raw: string;
  source: "monopay_qr" | "solana_pay" | "wallet" | "tag" | "json";
  recipientInput: string;
  walletAddress?: string;
  monopayTag?: string;
  displayName?: string;
  requestedAmount?: string;
};

type BuildMonopayQrInput = {
  walletAddress: string;
  monopayTag?: string;
  displayName?: string;
  requestedAmount?: string;
};

function normalizeTag(value?: string) {
  const cleaned = value?.trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "");
  return cleaned ? `@${cleaned}` : undefined;
}

function normalizeWalletAddress(value: string) {
  return new PublicKey(value.trim()).toBase58();
}

function toReadableMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isWalletAddress(value: string) {
  try {
    normalizeWalletAddress(value);
    return true;
  } catch {
    return false;
  }
}

function parseSolanaPayUri(input: string): ParsedQrRecipient | null {
  if (!input.toLowerCase().startsWith("solana:")) {
    return null;
  }

  const stripped = input.slice("solana:".length).trim();
  if (!stripped) {
    throw new Error("Scanned Solana Pay QR is missing recipient.");
  }

  const [recipientPart, queryPart] = stripped.split("?");
  const walletAddress = normalizeWalletAddress(decodeURIComponent(recipientPart));
  const params = new URLSearchParams(queryPart || "");
  const label = params.get("label")?.trim() || "";
  const amount = params.get("amount")?.trim() || "";

  return {
    raw: input,
    source: "solana_pay",
    recipientInput: walletAddress,
    walletAddress,
    displayName: label || undefined,
    requestedAmount: amount || undefined,
  };
}

function parseMonopayUrl(input: string): ParsedQrRecipient | null {
  const withProtocol = /^https?:\/\//i.test(input) || /^[a-z]+:\/\//i.test(input) ? input : "";
  if (!withProtocol) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  const protocol = url.protocol.toLowerCase();
  const isMonopayScheme = protocol === "mpay:" || protocol === "monopay:";
  const isMonopayHttp = /(^|\.)monopay/i.test(url.hostname) || /\/pay/i.test(url.pathname);

  if (!isMonopayScheme && !isMonopayHttp) {
    return null;
  }

  const walletCandidate =
    url.searchParams.get("wallet") ||
    url.searchParams.get("recipient") ||
    url.searchParams.get("address") ||
    "";
  const tagCandidate =
    normalizeTag(url.searchParams.get("tag") || url.searchParams.get("handle") || url.searchParams.get("username") || "");
  const displayName = url.searchParams.get("name") || url.searchParams.get("displayName") || "";
  const requestedAmount = url.searchParams.get("amount") || "";

  let walletAddress: string | undefined;
  if (walletCandidate) {
    walletAddress = normalizeWalletAddress(walletCandidate);
  }

  const recipientInput = tagCandidate || walletAddress;
  if (!recipientInput) {
    throw new Error("Scanned MonoPay QR is missing recipient data.");
  }

  return {
    raw: input,
    source: "monopay_qr",
    recipientInput,
    walletAddress,
    monopayTag: tagCandidate,
    displayName: displayName.trim() || undefined,
    requestedAmount: requestedAmount.trim() || undefined,
  };
}

function parseJsonPayload(input: string): ParsedQrRecipient | null {
  if (!input.trim().startsWith("{")) {
    return null;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(input) as Record<string, unknown>;
  } catch {
    return null;
  }

  const tagCandidate = normalizeTag(
    typeof parsed.tag === "string"
      ? parsed.tag
      : typeof parsed.monopayTag === "string"
        ? parsed.monopayTag
        : ""
  );
  const walletCandidate =
    typeof parsed.wallet === "string"
      ? parsed.wallet
      : typeof parsed.walletAddress === "string"
        ? parsed.walletAddress
        : typeof parsed.recipient === "string"
          ? parsed.recipient
          : "";
  const displayName =
    typeof parsed.name === "string"
      ? parsed.name
      : typeof parsed.displayName === "string"
        ? parsed.displayName
        : "";
  const requestedAmount = typeof parsed.amount === "string" ? parsed.amount : "";

  let walletAddress: string | undefined;
  if (walletCandidate) {
    walletAddress = normalizeWalletAddress(walletCandidate);
  }

  const recipientInput = tagCandidate || walletAddress;
  if (!recipientInput) {
    throw new Error("Scanned QR JSON is missing recipient data.");
  }

  return {
    raw: input,
    source: "json",
    recipientInput,
    walletAddress,
    monopayTag: tagCandidate,
    displayName: displayName.trim() || undefined,
    requestedAmount: requestedAmount.trim() || undefined,
  };
}

export function buildMonopayQrPayload(input: BuildMonopayQrInput) {
  const walletAddress = normalizeWalletAddress(input.walletAddress);
  const url = new URL("mpay://pay");
  url.searchParams.set("v", "1");
  url.searchParams.set("wallet", walletAddress);

  const normalizedTag = normalizeTag(input.monopayTag);
  if (normalizedTag) {
    url.searchParams.set("tag", normalizedTag.slice(1));
  }

  const displayName = input.displayName?.trim();
  if (displayName) {
    url.searchParams.set("name", displayName);
  }

  const amount = input.requestedAmount?.trim();
  if (amount) {
    url.searchParams.set("amount", amount);
  }

  return url.toString();
}

export function parseScannedQrRecipient(rawInput: string): ParsedQrRecipient {
  const raw = rawInput.trim();

  if (!raw) {
    throw new Error("Scanned QR data is empty.");
  }

  if (raw.startsWith("@")) {
    const tag = normalizeTag(raw);
    if (!tag) {
      throw new Error("Invalid MonoPay tag in QR.");
    }
    return {
      raw,
      source: "tag",
      recipientInput: tag,
      monopayTag: tag,
    };
  }

  if (isWalletAddress(raw)) {
    const walletAddress = normalizeWalletAddress(raw);
    return {
      raw,
      source: "wallet",
      recipientInput: walletAddress,
      walletAddress,
    };
  }

  const solanaPay = parseSolanaPayUri(raw);
  if (solanaPay) {
    return solanaPay;
  }

  const monopay = parseMonopayUrl(raw);
  if (monopay) {
    return monopay;
  }

  const jsonPayload = parseJsonPayload(raw);
  if (jsonPayload) {
    return jsonPayload;
  }

  throw new Error("Unsupported QR format. Use a MonoPay QR, Solana Pay QR, wallet address, or @tag.");
}

export function ensureNotSelfRecipient(recipientInput: string, selfWalletAddress?: string, selfTag?: string) {
  const normalizedSelfTag = normalizeTag(selfTag);
  const normalizedRecipientTag = recipientInput.startsWith("@") ? normalizeTag(recipientInput) : undefined;

  if (normalizedRecipientTag && normalizedSelfTag && normalizedRecipientTag === normalizedSelfTag) {
    throw new Error("You cannot pay yourself.");
  }

  if (!recipientInput.startsWith("@") && selfWalletAddress) {
    try {
      const normalizedSelfWallet = normalizeWalletAddress(selfWalletAddress);
      const normalizedRecipientWallet = normalizeWalletAddress(recipientInput);
      if (normalizedSelfWallet === normalizedRecipientWallet) {
        throw new Error("You cannot pay yourself.");
      }
    } catch (error) {
      if (toReadableMessage(error) === "You cannot pay yourself.") {
        throw error;
      }
    }
  }
}
