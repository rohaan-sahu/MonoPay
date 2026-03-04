# MonoPay Implementation Checklist (Wallet + Metaplex + Inco)

Last updated: March 4, 2026

## North Star
MonoPay should deliver fast Solana payments with a private-by-default path, wallet-first onboarding, and a profile identity layer users can pay to by handle.

## Decisions Locked (For now)
- Keep `Supabase` as backend/auth/session source of truth.
- Do not migrate to Firebase/Firestore now.
- Keep current wallet service and improve it incrementally.
- Keep Inco integration in sandbox while we harden wallet + identity in the real app.
- Use Metaplex Core program (no custom program deployment required for current scope).
- Evaluate Turnkey as a future wallet infrastructure option behind an adapter, not as a disruptive rewrite now.

## Why Not Firebase Right Now
- Current architecture already uses Supabase auth/session flows and Postgres-backed app state.
- We need relational constraints (wallet-to-user, tag uniqueness, identity mappings) plus predictable RLS.
- A migration now would add risk with little product upside for this phase.
- Revisit only if team/process constraints force it.

## Turnkey Recommendation
- Recommended path: keep current wallet service for now, add a `WalletProviderAdapter` boundary, and make Turnkey a pluggable provider later.
- Trigger to adopt Turnkey aggressively:
  - Need policy-based signing / org controls / managed key lifecycle.
  - Need multi-device passkey-centric wallet UX at scale.
  - Need stronger key custody guarantees than our local embedded model.

## End-to-End Target Flow
1. User opens onboarding.
2. User chooses `Create wallet` or `Import existing wallet`.
3. Wallet is created/imported and user secures passcode.
4. Wallet signs web3 auth challenge; app session is established.
5. App ensures profile row + MonoPay tag + Metaplex ID card mapping.
6. User enters app; Home shows live balances.
7. Pay screen supports pay-by-address and pay-by-username/tag.

## Current State Snapshot
- [x] Wallet create flow works and survives app restart.
- [x] Wallet sign-in flow routes to lock when passcode already exists.
- [x] Supabase web3 sign-in flow works with valid SIWS URL allowlist.
- [x] Sandbox Inco payment trigger works and logs tx links.
- [x] Sandbox Metaplex lifecycle works (create/update/immutable guard/deactivate).
- [x] Live wallet balances are surfaced in app UI.
- [~] Wallet export exists; backup UX is improving.
- [ ] Real app automatic Metaplex provisioning is not fully wired yet.
- [ ] Pay-by-username/tag is not wired yet.

## Implementation Checklist

### Phase 1: Wallet + Auth Hardening
- [x] Single-flight wallet sign-in (avoid duplicate concurrent connect attempts).
- [x] Secure storage first strategy for auth persistence.
- [x] Actionable web3 auth error messages and trace logs.
- [ ] Add guarded retry policy around transient auth network failures.
- [ ] Add explicit offline state message for wallet sign-in attempts.

Exit criteria:
- [ ] Sign-in is deterministic (no accidental duplicate requests).
- [ ] Errors are user-actionable (config vs network vs wallet mismatch).

### Phase 2: Wallet Backup/Recovery Safety
- [x] Wallet export screen exists.
- [ ] Add reliable clipboard copy + secure confirm UX on export.
- [ ] Add recovery phrase flow for newly created wallets (not only raw secret bytes).
- [ ] Add mandatory acknowledgment gates before entering home on first wallet creation.
- [ ] Add clear docs in app: restore wallet on new device.

Exit criteria:
- [ ] User can safely recover wallet on a fresh install/device.

### Phase 3: Metaplex Identity in Real App
- [x] Create `IdentityProvisioningService` for production app path.
- [ ] Implement `ensureIdentityForWallet(walletPubkey)`:
  - [x] Ensure profile record exists.
  - [x] Ensure unique MonoPay tag exists (or generate one).
  - [x] Ensure Metaplex ID card exists for wallet.
  - [x] Persist mapping in Supabase (with local fallback if tables are not present).
- [x] Trigger provisioning right after wallet create/import success.
- [x] Trigger reconciliation on sign-in if mapping is missing/inconsistent.
- [x] Show card data/state on Profile page.
- [ ] Keep immutable fields locked:
  - [ ] `owner`
  - [ ] `cardId`
  - [ ] `createdAt`
  - [ ] `network`
- [ ] Mutable profile/plugin fields:
  - [ ] `displayName`
  - [ ] `avatarUrl`
  - [ ] `paymentPointer`
  - [ ] `bio`
  - [ ] `monopayTag`

Exit criteria:
- [ ] Wallet onboarding auto-creates/reuses Metaplex identity consistently.
- [ ] Profile reflects on-chain + mapped identity state correctly.

### Phase 4: Pay by Username (MonoPay Tag)
- [ ] Add username/tag resolver service (`@handle -> wallet`).
- [ ] Add pay input mode switch: address or tag.
- [ ] Add strict normalization + uniqueness rules for tags.
- [ ] Prevent payments to suspended/deactivated tags.
- [ ] Log resolution details for support/debug.

Exit criteria:
- [ ] User can pay by tag with same reliability as direct address pay.

### Phase 5: Inco Path (From Sandbox to Main Flow)
- [x] Sandbox payment trigger logs tx link.
- [ ] Define production payment adapter contract:
  - [ ] `preparePayment(...)`
  - [ ] `submitPayment(...)`
  - [ ] `getReceipt(...)`
- [ ] Keep SOL transfer fallback adapter while Inco rail is hardened.
- [ ] Add Inco confidential-token adapter implementation.
- [ ] Wire receipt/audit metadata into app activity feed.

Exit criteria:
- [ ] Main app payment path can switch adapters without screen rewrite.

### Phase 6: External Wallet Connect (Phantom/Solflare)
- [ ] Deep-link connect flow for real devices.
- [ ] Signature-based auth handshake parity with embedded wallet auth.
- [ ] Distinct UX for simulator limitations.
- [ ] Test matrix on iOS physical device.

Exit criteria:
- [ ] User can connect external wallet and authenticate reliably.

### Phase 7: Auth UI Rationalization
- [ ] Remove social buttons from wallet-first auth screens (if still present).
- [ ] Keep email/phone OTP fallback path available.
- [ ] Ensure copy/design stays aligned with Cheks-style UI decisions.

Exit criteria:
- [ ] Wallet-first primary UX is visually and behaviorally consistent.

## Supabase Data Checklist
- [ ] `profiles` row includes `wallet_address` and `monopay_tag`.
- [ ] `monopay_tags` uniqueness is enforced server-side.
- [ ] `wallet_identities` table maps wallet -> metaplex asset/card id.
- [ ] RLS policies enforce wallet ownership for updates.
- [ ] Minimal admin/recovery policies for support operations.

## Metaplex Test Harness Checklist
- [ ] Add scripts under `apps/scripts/`:
  - [ ] Create card
  - [ ] Update mutable field
  - [ ] Attempt immutable update (expect failure)
  - [ ] Deactivate/close
- [ ] Print tx signatures + explorer links.
- [ ] Add runbook steps for devnet verification.

## Environment Checklist
- [x] Supabase URL/anon key configured.
- [x] Solana RPC + signer key configured.
- [x] Inco sandbox endpoint configured.
- [x] Base metadata URI configured.
- [ ] Add explicit SIWS allowed URI list docs for each environment.
- [ ] Add production/staging env templates for wallet + identity + payments.

## QA Checklist (Manual)
- [ ] Create wallet -> secure passcode -> sign in -> lock screen -> unlock.
- [ ] Kill app -> relaunch -> connect wallet -> unlock works.
- [ ] Import wallet (valid) succeeds.
- [ ] Import wallet (invalid key/mnemonic) fails with clear message.
- [ ] First auth provisions Metaplex identity + MonoPay tag.
- [ ] Profile shows mapped card and immutable/mutable field behavior.
- [ ] Pay by address works.
- [ ] Pay by tag works.
- [ ] Inco adapter path logs receipt and explorer link.

## Immediate Execution Order From Here
1. Phase 3: Wire real-app Metaplex identity auto-provisioning + tag creation.
2. Phase 4: Ship pay-by-username resolver and payment entry flow.
3. Phase 5: Promote Inco from sandbox-only to adapter in main payment path.
4. Phase 2: Finalize backup/recovery UX (clipboard + phrase + restore confidence).
