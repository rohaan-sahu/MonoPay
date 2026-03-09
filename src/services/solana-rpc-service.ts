type RpcRetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function extractErrorText(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function isSolanaRpcRateLimitError(error: unknown) {
  const message = extractErrorText(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    message.includes("request limit")
  );
}

function isTransientRpcError(error: unknown) {
  const message = extractErrorText(error).toLowerCase();

  if (isSolanaRpcRateLimitError(error)) {
    return true;
  }

  return (
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("temporarily unavailable") ||
    message.includes("failed to fetch")
  );
}

export async function withSolanaRpcRetry<T>(
  operation: () => Promise<T>,
  options?: RpcRetryOptions
): Promise<T> {
  const maxAttempts = Math.max(1, options?.maxAttempts ?? 4);
  const baseDelayMs = Math.max(100, options?.baseDelayMs ?? 300);
  const maxDelayMs = Math.max(baseDelayMs, options?.maxDelayMs ?? 2200);

  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (attempt >= maxAttempts || !isTransientRpcError(error)) {
        break;
      }

      const jitter = Math.floor(Math.random() * 120);
      const delayMs = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1) + jitter);
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("RPC request failed.");
}

export function toSolanaRpcUserMessage(error: unknown, fallback: string) {
  const raw = extractErrorText(error);
  const message = raw.toLowerCase();

  if (
    message.includes("403") &&
    (message.includes("batch") || message.includes("paid plan") || message.includes("forbidden"))
  ) {
    return "Your current RPC plan rejected this request type (403). We switched to non-batch mode; please retry.";
  }

  if (isSolanaRpcRateLimitError(error)) {
    return "Solana RPC is rate-limited right now. Please wait a few seconds and try again.";
  }

  if (
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("503") ||
    message.includes("504")
  ) {
    return "Solana RPC is temporarily unavailable. Please try again shortly.";
  }

  if (raw.length > 180) {
    return fallback;
  }

  return raw || fallback;
}
