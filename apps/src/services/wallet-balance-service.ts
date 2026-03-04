import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { toSolanaRpcUserMessage, withSolanaRpcRetry } from "@mpay/services/solana-rpc-service";

type ClusterName = "devnet" | "testnet" | "mainnet-beta" | "custom";

export type WalletBalanceEntry = {
  symbol: string;
  label: string;
  amount: number;
  display: string;
  available: string;
  isStable: boolean;
  mint?: string;
};

type FetchWalletBalancesOptions = {
  forceRefresh?: boolean;
};

const RPC_URL = process.env.EXPO_PUBLIC_MONOPAY_RPC_URL || "https://api.devnet.solana.com";
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const connection = new Connection(RPC_URL, "confirmed");
const BALANCE_CACHE_TTL_MS = 15_000;
const balanceCache = new Map<string, { expiresAt: number; value: WalletBalanceEntry[] }>();

type StablecoinDefinition = {
  symbol: "USDC" | "USDT";
  envMint?: string;
  defaultMints: Partial<Record<ClusterName, string>>;
};

const STABLECOIN_DEFINITIONS: StablecoinDefinition[] = [
  {
    symbol: "USDC",
    envMint: process.env.EXPO_PUBLIC_MONOPAY_USDC_MINT,
    defaultMints: {
      devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    },
  },
  {
    symbol: "USDT",
    envMint: process.env.EXPO_PUBLIC_MONOPAY_USDT_MINT,
    defaultMints: {
      "mainnet-beta": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    },
  },
];

function detectClusterName(rpcUrl: string): ClusterName {
  const normalized = rpcUrl.toLowerCase();

  if (normalized.includes("devnet")) return "devnet";
  if (normalized.includes("testnet")) return "testnet";
  if (normalized.includes("mainnet")) return "mainnet-beta";
  return "custom";
}

function clusterLabel(cluster: ClusterName) {
  if (cluster === "devnet") return "Devnet";
  if (cluster === "testnet") return "Testnet";
  if (cluster === "mainnet-beta") return "Mainnet";
  return "Custom RPC";
}

function normalizeMint(mint?: string) {
  const value = mint?.trim();
  return value ? value : undefined;
}

function formatTokenAmount(amount: number, options?: { min?: number; max?: number }) {
  const min = options?.min ?? 0;
  const max = options?.max ?? 6;

  return amount.toLocaleString("en-US", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

function formatStableDisplay(amount: number) {
  const max = amount >= 1 ? 2 : 6;
  return `$${formatTokenAmount(amount, { min: 2, max })}`;
}

function formatSolDisplay(amount: number) {
  return `${formatTokenAmount(amount, { min: 2, max: 6 })} SOL`;
}

function cloneBalances(entries: WalletBalanceEntry[]) {
  return entries.map((entry) => ({ ...entry }));
}

async function fetchMintBalancesByOwner(owner: PublicKey) {
  const response = await withSolanaRpcRetry(
    () => connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }, "confirmed"),
    { maxAttempts: 4, baseDelayMs: 280 }
  );
  const balancesByMint = new Map<string, number>();

  for (const tokenAccount of response.value) {
    const parsedData = tokenAccount.account.data.parsed as
      | {
          info?: {
            mint?: string;
            tokenAmount?: {
              uiAmount?: number | null;
              uiAmountString?: string;
            };
          };
        }
      | undefined;

    const mint = parsedData?.info?.mint;
    const tokenAmountInfo = parsedData?.info?.tokenAmount;

    if (!mint || !tokenAmountInfo) {
      continue;
    }

    const rawAmount =
      tokenAmountInfo.uiAmount ??
      (tokenAmountInfo.uiAmountString ? Number.parseFloat(tokenAmountInfo.uiAmountString) : 0);
    const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
    balancesByMint.set(mint, (balancesByMint.get(mint) || 0) + amount);
  }

  return balancesByMint;
}

export async function fetchWalletBalances(
  walletAddress: string,
  options?: FetchWalletBalancesOptions
): Promise<WalletBalanceEntry[]> {
  try {
    const owner = new PublicKey(walletAddress);
    const normalizedWalletAddress = owner.toBase58();
    const now = Date.now();
    const cached = balanceCache.get(normalizedWalletAddress);

    if (!options?.forceRefresh && cached && cached.expiresAt > now) {
      return cloneBalances(cached.value);
    }

    const cluster = detectClusterName(RPC_URL);
    const network = clusterLabel(cluster);

    const [lamports, mintBalances] = await Promise.all([
      withSolanaRpcRetry(() => connection.getBalance(owner, "confirmed"), {
        maxAttempts: 4,
        baseDelayMs: 280,
      }),
      fetchMintBalancesByOwner(owner),
    ]);

    const stablecoins: WalletBalanceEntry[] = STABLECOIN_DEFINITIONS.map((definition) => {
      const mint = normalizeMint(definition.envMint || definition.defaultMints[cluster]);
      const amount = mint ? mintBalances.get(mint) || 0 : 0;

      return {
        symbol: definition.symbol,
        label: `${definition.symbol} • ${network}`,
        amount,
        display: formatStableDisplay(amount),
        available: formatTokenAmount(amount, { min: 0, max: 6 }),
        isStable: true,
        mint,
      };
    });

    const solAmount = lamports / LAMPORTS_PER_SOL;
    const solBalance: WalletBalanceEntry = {
      symbol: "SOL",
      label: `SOL • ${network}`,
      amount: solAmount,
      display: formatSolDisplay(solAmount),
      available: formatTokenAmount(solAmount, { min: 0, max: 6 }),
      isStable: false,
    };

    const result = [...stablecoins, solBalance];
    balanceCache.set(normalizedWalletAddress, {
      expiresAt: now + BALANCE_CACHE_TTL_MS,
      value: cloneBalances(result),
    });

    return result;
  } catch (error) {
    const fallbackKey = (() => {
      try {
        return new PublicKey(walletAddress).toBase58();
      } catch {
        return walletAddress.trim();
      }
    })();
    const cached = balanceCache.get(fallbackKey);

    if (cached) {
      return cloneBalances(cached.value);
    }

    throw new Error(toSolanaRpcUserMessage(error, "Unable to fetch wallet balances right now."));
  }
}
