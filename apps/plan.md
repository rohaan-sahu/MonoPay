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

## Phase 5: Solana Mobile Wallet Adapter (MWA)

- [ ] Phase 5.1 - Foundation and compatibility
- [ ] Add MWA libraries for Expo React Native (Android-first for hackathon).
- [ ] Verify deep-link intent filters and app scheme alignment in Expo config.
- [ ] Keep existing embedded wallet path as fallback (do not break current auth).

- [ ] Phase 5.2 - External wallet connect (read-only bootstrap)
- [ ] Add "Connect external wallet" option in auth flow.
- [ ] Implement wallet authorization session and return selected account address.
- [ ] Persist connection metadata (`provider`, `authToken`, `walletAddress`, `mode=external`).

- [ ] Phase 5.3 - Sign-in with Supabase Web3 using MWA signer
- [ ] Build signer abstraction so Web3 sign-in can use either local keypair or MWA signer.
- [ ] Reuse current SIWS/Supabase flow, replacing direct nacl signing for MWA mode.
- [ ] Validate reconnect logic after app restart (refresh/reauthorize flow).

- [ ] Phase 5.4 - Payments using MWA signing
- [ ] Build transaction signing abstraction for both `embedded` and `external` wallets.
- [ ] Route SOL and SPL/MagicBlock send flows through shared signer interface.
- [ ] Confirm send/confirm/history behavior parity with embedded wallet mode.

- [ ] Phase 5.5 - UX and failure handling
- [ ] Add clear wallet-mode indicator in profile (`embedded` vs `external`).
- [ ] Handle "wallet app not installed" and "user rejected signature" gracefully.
- [ ] Add safe fallback to embedded/import flow if MWA session fails.

- [ ] Phase 5.6 - Release checklist
- [ ] Test matrix: Android physical device + at least 2 wallets.
- [ ] Verify passcode/lock + hydration behavior for external mode.
- [ ] Confirm no private keys from external wallets are stored on-device.
