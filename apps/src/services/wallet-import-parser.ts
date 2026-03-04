import { hmac } from "@noble/hashes/hmac";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha512 } from "@noble/hashes/sha512";
import * as nacl from "tweetnacl";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_LOOKUP = new Map(BASE58_ALPHABET.split("").map((char, index) => [char, index]));
const HARDENED_OFFSET = 0x80000000;
const textEncoder = new TextEncoder();

type WalletImportSource = "private_key_bytes" | "private_key_base58" | "mnemonic";

export type WalletImportParseResult = {
  source: WalletImportSource;
  secretKeyBytes: number[];
  derivationPath?: string;
};

function decodeBase58(value: string) {
  const input = value.trim();

  if (!input) {
    throw new Error("Wallet key input is empty.");
  }

  const bytes: number[] = [0];

  for (const char of input) {
    const charValue = BASE58_LOOKUP.get(char);

    if (charValue === undefined) {
      throw new Error("Invalid base58 secret key.");
    }

    let carry = charValue;

    for (let i = 0; i < bytes.length; i += 1) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }

    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  for (let i = 0; i < input.length && input[i] === "1"; i += 1) {
    bytes.push(0);
  }

  return new Uint8Array(bytes.reverse());
}

function decodeHexToBytes(value: string) {
  const raw = value.trim().toLowerCase();
  const normalized = raw.startsWith("0x") ? raw.slice(2) : raw;

  if (!/^[0-9a-f]+$/.test(normalized) || normalized.length % 2 !== 0) {
    throw new Error("Invalid hex secret key.");
  }

  const bytes = new Uint8Array(normalized.length / 2);

  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }

  return bytes;
}

function parseNumberArray(value: string) {
  const trimmed = value.trim();

  let candidate = trimmed;

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    candidate = trimmed.slice(1, -1);
  }

  const parts = candidate
    .split(/[\s,]+/g)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  const numbers = parts.map((part) => Number.parseInt(part, 10));

  if (numbers.some((valuePart) => Number.isNaN(valuePart) || valuePart < 0 || valuePart > 255)) {
    return null;
  }

  return Uint8Array.from(numbers);
}

function toSecretKeyBytes(secretKey: Uint8Array) {
  if (secretKey.length === 64) {
    // Validate shape for detached signing.
    nacl.sign.keyPair.fromSecretKey(secretKey);
    return secretKey;
  }

  if (secretKey.length === 32) {
    return nacl.sign.keyPair.fromSeed(secretKey).secretKey;
  }

  throw new Error("Secret key must be 32-byte seed or 64-byte private key.");
}

function parsePrivateKeyInput(input: string) {
  const numericInput = parseNumberArray(input);

  if (numericInput) {
    return {
      source: "private_key_bytes" as const,
      secret: toSecretKeyBytes(numericInput),
    };
  }

  const compact = input.trim();
  const isLikelyHex = /^(0x)?[0-9a-fA-F]{64}$/.test(compact) || /^(0x)?[0-9a-fA-F]{128}$/.test(compact);

  if (isLikelyHex) {
    return {
      source: "private_key_bytes" as const,
      secret: toSecretKeyBytes(decodeHexToBytes(compact)),
    };
  }

  return {
    source: "private_key_base58" as const,
    secret: toSecretKeyBytes(decodeBase58(compact)),
  };
}

function serializeUint32BigEndian(value: number) {
  const out = new Uint8Array(4);
  out[0] = (value >>> 24) & 0xff;
  out[1] = (value >>> 16) & 0xff;
  out[2] = (value >>> 8) & 0xff;
  out[3] = value & 0xff;
  return out;
}

function parseDerivationPath(path?: string) {
  const normalized = (path || "m/44'/501'/0'/0'").trim();

  if (!normalized.startsWith("m/")) {
    throw new Error("Derivation path must start with m/.");
  }

  const segments = normalized
    .slice(2)
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    throw new Error("Derivation path must include at least one segment.");
  }

  const indices = segments.map((segment) => {
    if (!segment.endsWith("'")) {
      throw new Error("Only hardened derivation path segments are supported for Solana.");
    }

    const raw = Number.parseInt(segment.slice(0, -1), 10);

    if (Number.isNaN(raw) || raw < 0 || raw >= HARDENED_OFFSET) {
      throw new Error(`Invalid derivation path segment: ${segment}`);
    }

    return raw;
  });

  return { normalized, indices };
}

function deriveEd25519PrivateSeed(seed: Uint8Array, indices: number[]) {
  let node = hmac(sha512, textEncoder.encode("ed25519 seed"), seed);
  let key = node.slice(0, 32);
  let chainCode = node.slice(32, 64);

  for (const index of indices) {
    const data = new Uint8Array(1 + 32 + 4);
    data[0] = 0;
    data.set(key, 1);
    data.set(serializeUint32BigEndian(index + HARDENED_OFFSET), 33);

    node = hmac(sha512, chainCode, data);
    key = node.slice(0, 32);
    chainCode = node.slice(32, 64);
  }

  return key;
}

function parseMnemonicInput(mnemonicRaw: string, passphrase?: string, derivationPath?: string) {
  const mnemonic = mnemonicRaw
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
    .join(" ");
  const words = mnemonic.split(" ");

  if (!(words.length === 12 || words.length === 24)) {
    throw new Error("Mnemonic must contain 12 or 24 words.");
  }

  const salt = `mnemonic${(passphrase || "").normalize("NFKD")}`;
  const seed = pbkdf2(sha512, textEncoder.encode(mnemonic.normalize("NFKD")), textEncoder.encode(salt), {
    c: 2048,
    dkLen: 64,
  });
  const pathInfo = parseDerivationPath(derivationPath);
  const privateSeed = deriveEd25519PrivateSeed(seed, pathInfo.indices);
  const keypair = nacl.sign.keyPair.fromSeed(privateSeed);

  return {
    source: "mnemonic" as const,
    secret: keypair.secretKey,
    derivationPath: pathInfo.normalized,
  };
}

export function looksLikeMnemonic(input: string) {
  const words = input
    .trim()
    .split(/\s+/g)
    .filter(Boolean);

  return words.length >= 12 && words.every((word) => /^[a-zA-Z]+$/.test(word));
}

export function parseWalletImportInput(
  rawInput: string,
  options?: {
    passphrase?: string;
    derivationPath?: string;
    forceMnemonic?: boolean;
  }
): WalletImportParseResult {
  const input = rawInput.trim();

  if (!input) {
    throw new Error("Enter a private key, base58 key, or mnemonic phrase.");
  }

  const mnemonicMode = options?.forceMnemonic || looksLikeMnemonic(input);

  if (mnemonicMode) {
    const parsedMnemonic = parseMnemonicInput(input, options?.passphrase, options?.derivationPath);

    return {
      source: parsedMnemonic.source,
      secretKeyBytes: Array.from(parsedMnemonic.secret),
      derivationPath: parsedMnemonic.derivationPath,
    };
  }

  const parsedPrivate = parsePrivateKeyInput(input);

  return {
    source: parsedPrivate.source,
    secretKeyBytes: Array.from(parsedPrivate.secret),
  };
}
