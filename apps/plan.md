# MonoPay Execution Plan (Wallet + Metaplex + Inco)

Last updated: March 3, 2026

## Goal
Build MonoPay as a wallet-first payments app on Solana with:
1. Wallet-first signup/signin (OTP optional fallback).
2. Automatic Metaplex ID card lifecycle tied to wallet identity.
3. Current sandbox Inco-encrypted payment trigger upgraded later to a confidential rail.

## Current State (What already works)
- SDK sandbox route exists: `apps/app/sandbox.tsx`.
- Inco payment adapter exists and is live in sandbox:
  - `apps/src/services/sandbox/payment-adapter.ts`
  - Uses Solana transfer + Inco-encrypted memo via remote endpoint.
- Supabase account-linking adapter exists:
  - `apps/src/services/sandbox/account-linking-adapter.ts`
  - Supports `email_only` and `email_phone`.
- Metaplex ID card adapter exists:
  - `apps/src/services/sandbox/id-card-adapter.ts`
  - Supports create, update plugin field, immutable field block, deactivate (burn).

## Product Direction (Agreed)
1. Primary auth should be wallet-based.
2. Email/phone OTP should be optional fallback, not required.
3. Google/Apple auth buttons can be removed from auth screens.
4. After wallet auth, create or fetch Metaplex ID card automatically.
5. Show the ID card state in Profile.
6. Keep Inco payment rail in sandbox now; later migrate from plain SOL transfer flow to a confidential-token rail.

## Architecture Plan

### 1) Wallet Auth Layer
Implement `WalletAuthService` with two modes:
- Embedded wallet mode:
  - Create wallet (generate keypair).
  - Import wallet (private key / seed input).
  - Persist secrets in secure storage (device keychain/secure store).
- External wallet-connect mode:
  - Connect to Solflare/Phantom via deep link / wallet protocol.
  - Sign challenge for authentication.

Auth flow:
1. App requests nonce/challenge from backend.
2. Wallet signs challenge.
3. Backend verifies signature and mints app session.
4. App stores session token and wallet pubkey.

### 2) Identity Layer (Metaplex ID Card)
Implement `IdCardProvisioningService`:
- `ensureIdCardForWallet(walletPubkey)`:
  - Check mapping in DB (`wallet_pubkey -> card_id`).
  - If missing, create asset via Metaplex Core.
  - Store mapping and return card record.
- Enforce immutable fields:
  - `cardId`, `owner`, `createdAt`, `network`.
- Mutable profile plugin fields:
  - `displayName`, `avatarUrl`, `paymentPointer`, `bio`.

### 3) Payment Layer (Inco Path)
Phase now:
- Keep current sandbox adapter (works with remote encryption endpoint).
- Continue to log tx links and payload outcomes in sandbox.

Phase later:
- Introduce a new payment adapter for confidential-token rail.
- Keep adapter interface stable so UI does not change.

## Implementation Order (Execution Sequence)

### Phase 1: Wallet-First Foundation
1. Add `WalletAuthService` interfaces + concrete implementation.
2. Wire onboarding buttons:
   - `Create wallet`
   - `Add existing wallet`
   - `Connect wallet`
3. Remove Google/Apple from auth UI.
4. Keep OTP route as secondary fallback ("Use email instead").

Exit criteria:
- User can complete signup/signin with wallet only.
- Session persists after app restart.

### Phase 2: Auto-Provision Metaplex Card
1. On successful wallet auth, call `ensureIdCardForWallet`.
2. Save `wallet -> cardId` mapping in DB.
3. Profile reads and displays card data/state.
4. Expose update/deactivate actions where needed.

Exit criteria:
- First wallet login auto-creates card.
- Repeat login reuses existing card.
- Immutable field mutation attempts fail with clear errors.

### Phase 3: Separate Metaplex Program Test Harness
1. Add script(s) under `apps/scripts/`:
   - create card
   - update mutable field
   - attempt immutable update (expect failure)
   - deactivate/burn
2. Print signatures and explorer links.
3. Store runbook in docs.

Exit criteria:
- Script run confirms lifecycle end-to-end independent of UI.

### Phase 4: Inco Rail Upgrade
1. Keep current payment working while building new rail adapter.
2. Swap adapter implementation only (no screen rewrite).
3. Validate payload privacy model and settlement semantics.

Exit criteria:
- Payment route no longer depends on plain SOL transfer semantics.
- Sandbox and profile payment activity continue to work through the same interface.

## Metaplex Program Notes (Important)

### Do we need to deploy a program?
Short answer: usually no.

Why:
- For current ID card lifecycle, we are using Metaplex Core client SDK against the existing Core program on Solana cluster.
- You do not need to deploy your own program unless you require custom on-chain logic that Metaplex Core cannot express.

When we would deploy:
- Custom rules/authorization beyond plugin model.
- New account/state model not representable with existing Core constructs.
- Custom constraints requiring our own Solana program.

### How we verify Metaplex works
1. Create asset transaction confirmed on devnet.
2. Fetch asset from chain after create/update.
3. Immutable write attempt fails by app rule (and optionally by program/plugin policy when enforced).
4. Burn/deactivate transaction confirmed and `safeFetch` shows asset is gone.

## Wallet Testing Strategy

### Simulator
- Use for embedded wallet flows (create/import).
- Good for app state, auth/session, and card provisioning tests.

### Physical iPhone
- Use for external wallet connection testing (Solflare/Phantom).
- Deep-link wallet flows are far more realistic on a real device.

## Backend + Env Requirements

Current required envs already in `apps/.env`:
- Supabase URL + anon key.
- Solana RPC + signer key.
- Handle directory JSON + default recipient/owner.
- Inco encryption endpoint.
- Metaplex metadata URI.

Additional envs needed for wallet-first auth productionization:
- `MONOPAY_AUTH_CHALLENGE_ENDPOINT`
- `MONOPAY_AUTH_VERIFY_ENDPOINT`
- `MONOPAY_SESSION_SIGNING_KEY` (backend secret)
- Optional wallet connect project keys (depending on chosen provider).

## Risks and Controls
- Risk: external wallet UX instability on simulator.
  - Control: treat simulator as embedded-wallet-only test bed.
- Risk: coupling auth and chain writes can cause partial failures.
  - Control: idempotent `ensureIdCardForWallet` with retries and reconciliation job.
- Risk: payment rail migration breaks UI.
  - Control: preserve adapter contract and swap implementation only.

## Milestone Checklist
- [ ] Wallet-only signup/signin works end-to-end.
- [ ] OTP fallback remains available but optional.
- [ ] Google/Apple removed from auth screens.
- [ ] Metaplex card auto-provisions after wallet auth.
- [ ] Profile displays card metadata/state.
- [ ] Standalone Metaplex lifecycle script passes on devnet.
- [ ] Inco payment sandbox remains healthy during migration.
- [ ] Confidential rail design doc approved before implementation.

## Immediate Next Step (When implementation starts)
Start Phase 1 only:
1. Build wallet service contract + storage.
2. Wire onboarding/auth screens to wallet actions.
3. Keep sandbox integrations untouched until Phase 1 is stable.
