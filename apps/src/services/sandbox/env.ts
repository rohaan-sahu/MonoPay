import { Keypair, PublicKey } from "@solana/web3.js";

const DEFAULT_RPC_URL = "https://api.devnet.solana.com";
const DEFAULT_LAMPORTS_PER_USD = 1_000_000;
const DEFAULT_ID_CARD_METADATA_URI = "https://monopay.app/metadata/monopay-id-card-v1.json";
const DEFAULT_ID_CARD_METADATA_PATH = "metadata/monopay-id-card-v1.json";

type HandleDirectory = Record<string, string>;
type AccountLinkMode = "email_only" | "email_phone";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}. Add it to apps/.env before using the SDK sandbox.`);
  }

  return value;
}

function optionalEnv(name: string) {
  return process.env[name]?.trim() || "";
}

function buildSupabasePublicUrl(path: string) {
  const supabaseUrl = optionalEnv("EXPO_PUBLIC_SUPABASE_URL");

  if (!supabaseUrl) {
    return "";
  }

  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/monopay-assets/${path}`;
}

function parseSecretKeyJson(raw: string, envName: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${envName} must be a JSON array of 64 integers.`);
  }

  if (!Array.isArray(parsed) || parsed.length < 64) {
    throw new Error(`${envName} must be a JSON array with at least 64 numbers.`);
  }

  const bytes = parsed.map((value) => Number(value));
  const hasInvalidNumber = bytes.some((value) => Number.isNaN(value) || value < 0 || value > 255);

  if (hasInvalidNumber) {
    throw new Error(`${envName} contains invalid byte values.`);
  }

  return new Uint8Array(bytes);
}

function parseLamportsPerUsd(raw: string) {
  if (!raw) {
    return DEFAULT_LAMPORTS_PER_USD;
  }

  const value = Number.parseFloat(raw);

  if (Number.isNaN(value) || value <= 0) {
    throw new Error("EXPO_PUBLIC_MONOPAY_LAMPORTS_PER_USD must be a positive number.");
  }

  return value;
}

function assertValidPublicKey(address: string, label: string) {
  try {
    const key = new PublicKey(address.trim());
    return key.toBase58();
  } catch {
    throw new Error(`Invalid ${label}: ${address}`);
  }
}

export function getHandleDirectory(): HandleDirectory {
  const raw = optionalEnv("EXPO_PUBLIC_MONOPAY_HANDLE_DIRECTORY_JSON");

  if (!raw) {
    return {};
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("EXPO_PUBLIC_MONOPAY_HANDLE_DIRECTORY_JSON must be valid JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("EXPO_PUBLIC_MONOPAY_HANDLE_DIRECTORY_JSON must be a JSON object.");
  }

  const entries = Object.entries(parsed);
  const directory: HandleDirectory = {};

  for (const [handle, value] of entries) {
    if (typeof value !== "string") {
      throw new Error(`Handle mapping for ${handle} must be a wallet address string.`);
    }

    directory[handle] = assertValidPublicKey(value, `wallet for ${handle}`);
  }

  return directory;
}

export function resolveWalletAddress(
  identifier: string,
  options: {
    directory: HandleDirectory;
    fallbackAddress?: string;
    label: string;
  }
) {
  const value = identifier.trim();

  if (!value) {
    throw new Error(`${options.label} is required.`);
  }

  if (value.startsWith("@")) {
    const mapped = options.directory[value] || (options.fallbackAddress ? options.fallbackAddress.trim() : "");

    if (!mapped) {
      throw new Error(
        `${options.label} '${value}' is not mapped. Add it in EXPO_PUBLIC_MONOPAY_HANDLE_DIRECTORY_JSON or enter a wallet address directly.`
      );
    }

    return assertValidPublicKey(mapped, options.label);
  }

  return assertValidPublicKey(value, options.label);
}

export function getSolanaSignerKeypair() {
  const raw = requiredEnv("EXPO_PUBLIC_MONOPAY_SENDER_SECRET_KEY_JSON");
  const secret = parseSecretKeyJson(raw, "EXPO_PUBLIC_MONOPAY_SENDER_SECRET_KEY_JSON");
  return Keypair.fromSecretKey(secret);
}

export function getSolanaSignerSecretKey() {
  const raw = requiredEnv("EXPO_PUBLIC_MONOPAY_SENDER_SECRET_KEY_JSON");
  return parseSecretKeyJson(raw, "EXPO_PUBLIC_MONOPAY_SENDER_SECRET_KEY_JSON");
}

function getOptionalSolanaSignerSecretKey() {
  const raw = optionalEnv("EXPO_PUBLIC_MONOPAY_SENDER_SECRET_KEY_JSON");

  if (!raw) {
    return undefined;
  }

  return parseSecretKeyJson(raw, "EXPO_PUBLIC_MONOPAY_SENDER_SECRET_KEY_JSON");
}

export function getPaymentConfig() {
  const directory = getHandleDirectory();
  const signerSecretKey = getOptionalSolanaSignerSecretKey();

  return {
    rpcUrl: optionalEnv("EXPO_PUBLIC_MONOPAY_RPC_URL") || DEFAULT_RPC_URL,
    senderKeypair: signerSecretKey ? Keypair.fromSecretKey(signerSecretKey) : undefined,
    lamportsPerUsd: parseLamportsPerUsd(optionalEnv("EXPO_PUBLIC_MONOPAY_LAMPORTS_PER_USD")),
    defaultRecipientPublicKey: optionalEnv("EXPO_PUBLIC_MONOPAY_DEFAULT_RECIPIENT_PUBLIC_KEY"),
    handleDirectory: directory
  };
}

export function getSupabaseConfig() {
  return {
    url: requiredEnv("EXPO_PUBLIC_SUPABASE_URL"),
    anonKey: requiredEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
  };
}

export function getAccountLinkMode(): AccountLinkMode {
  const raw = optionalEnv("EXPO_PUBLIC_MONOPAY_ACCOUNT_LINK_MODE");

  if (!raw) {
    return "email_only";
  }

  if (raw === "email_only" || raw === "email_phone") {
    return raw;
  }

  throw new Error("EXPO_PUBLIC_MONOPAY_ACCOUNT_LINK_MODE must be 'email_only' or 'email_phone'.");
}

export function getMetaplexConfig() {
  const directory = getHandleDirectory();
  const fallbackOwner = optionalEnv("EXPO_PUBLIC_MONOPAY_IDCARD_OWNER_PUBLIC_KEY");
  const derivedMetadataUri = buildSupabasePublicUrl(DEFAULT_ID_CARD_METADATA_PATH);
  const signerSecretKey = getOptionalSolanaSignerSecretKey();

  return {
    rpcUrl: optionalEnv("EXPO_PUBLIC_MONOPAY_RPC_URL") || DEFAULT_RPC_URL,
    signerSecretKey,
    metadataUri: optionalEnv("EXPO_PUBLIC_MONOPAY_IDCARD_METADATA_URI") || derivedMetadataUri || DEFAULT_ID_CARD_METADATA_URI,
    defaultOwnerPublicKey: fallbackOwner,
    handleDirectory: directory
  };
}

export function getSandboxDefaults() {
  const defaults = {
    signerPublicKey: "",
    defaultRecipientPublicKey: "",
    defaultOwnerPublicKey: ""
  };

  try {
    defaults.signerPublicKey = getSolanaSignerKeypair().publicKey.toBase58();
  } catch {
    // Ignore missing env at initial render.
  }

  const fallbackRecipient = optionalEnv("EXPO_PUBLIC_MONOPAY_DEFAULT_RECIPIENT_PUBLIC_KEY");
  const fallbackOwner = optionalEnv("EXPO_PUBLIC_MONOPAY_IDCARD_OWNER_PUBLIC_KEY");
  const directory = (() => {
    try {
      return getHandleDirectory();
    } catch {
      return {};
    }
  })();

  defaults.defaultRecipientPublicKey = fallbackRecipient || directory["@merchant"] || "";
  defaults.defaultOwnerPublicKey = fallbackOwner || directory["@monopayuser"] || defaults.signerPublicKey || "";

  return defaults;
}
