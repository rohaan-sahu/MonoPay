# MonoPay Payments Plan (SOL + USDC)

## Current State

- Inco rail is fully removed from app code and env setup.
- SOL payments use standard public Solana transfer flow.
- USDC payments support:
  - MagicBlock private rail when enabled
  - SPL public transfer fallback when MagicBlock is disabled

## Environment Flags

- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_ENABLED`
- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_API_BASE_URL`
- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_ENDPOINT_URL`
- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_VALIDATOR`
- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_API_KEY` (optional)
- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_AUTH_BEARER` (optional)
- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_DEPOSIT_BEFORE_TRANSFER`
- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_INIT_RECIPIENT`

## Rails

### SOL (Public)

- Adapter: `src/services/sandbox/payment-adapter.ts` (`SolanaPaymentAdapter`)
- Flow: sign + send standard `SystemProgram.transfer`
- Ledger rail: `sol_public`

### USDC (MagicBlock Private)

- Adapter: `src/services/payments/magicblock-private-payment-adapter.ts`
- Routed by: `src/services/private-payment-service.ts`
- Ledger rail: `spl_public` (adapter label in logs indicates `magicblock_private`)

### USDC (SPL Public Fallback)

- Adapter: `src/services/payments/spl-usdc-payment-adapter.ts`
- Triggered when `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_ENABLED=false`
- Ledger rail: `spl_public`

## Transaction History / Balances

- Home balances are public on-chain balances from `wallet-balance-service.ts`.
- App transaction history is app-intent based + parsed on-chain transactions.

## Next Steps

1. Add explicit MagicBlock withdraw flow and UI messaging.
2. Add clearer ledger rail taxonomy if we want to distinguish private-vs-public USDC in DB.
3. Add production API proxy for MagicBlock requests if backend signing/risk controls are required.
