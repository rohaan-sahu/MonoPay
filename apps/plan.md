# MonoPay Implementation Checklist

## Phase 1: Wallet + Auth

- [x] Wallet create/import wired and persisted on-device.
- [x] Wallet reconnect flow routes correctly to lock/passcode.
- [x] Supabase Web3 sign-in integrated for wallet sessions.
- [x] Export wallet key/recovery UX available.

## Phase 2: Identity

- [x] Metaplex identity auto-provision on wallet onboarding.
- [x] MonoPay tag auto-generated and persisted.
- [x] Profile edit flow updates local + persisted identity data.
- [x] On-chain identity verify/sync path available from profile.

## Phase 3: Payments (Current)

- [x] SOL transfer via standard public Solana flow.
- [x] USDC SPL public transfer flow.
- [x] MagicBlock private USDC flow behind feature flag.
- [x] Payment intents + events persisted to Supabase.
- [x] Recent recipients and app-only transaction history wired.

## Phase 4: Hardening

- [x] Remove legacy Inco runtime paths and env requirements.
- [x] Remove Inco server script and package dependency.
- [x] Clean sandbox labels/docs to match current rails.
- [ ] Add explicit private-balance/withdraw UX for MagicBlock rail.
- [ ] Add production-grade backend proxy for private rail requests.
- [ ] Add end-to-end automated tests for send/confirm/history flows.
