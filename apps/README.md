# MonoPay App (Expo + React Native)

## Setup

```bash
npm install
npm run start
```

## Scripts

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`
- `npm run typecheck`

## Structure

- `app/index.tsx` launch gate (`auth` -> `lock` -> `tabs`)
- `app/(auth)/` onboarding + sign in/sign up + OTP + passcode
- `app/lock.tsx` mandatory lock screen
- `app/(tabs)/` main app shell (`home`, `scan`, `chat`, `profile`)
- `assets/` static assets
- `src/` shared modules (`components`, `services`, `stores`, `styles`)

## Notes

- OTP code for sandbox flow is `123456`.
- Wallet auth includes Supabase Web3 sign-in for embedded Solana wallets.
- Wallet import parser logic (private key bytes/base58/mnemonic) is in `src/services/wallet-import-parser.ts`.

## SDK Sandbox

- Open `Profile -> SDK Sandbox (POC)` to test:
  - SOL transfer flow
  - Supabase OTP flow for email + phone verification
  - Metaplex Core identity-card create/update/deactivate
- Copy `apps/.env.example` to `apps/.env` and fill values before running.

## Payment Rails

- SOL: standard public Solana transfer.
- USDC:
  - MagicBlock private transfer when `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_ENABLED=true`
  - SPL public transfer fallback when MagicBlock is disabled.

## Account Link Mode

- `EXPO_PUBLIC_MONOPAY_ACCOUNT_LINK_MODE=email_only` (recommended while Twilio/SMS is not configured)
- `EXPO_PUBLIC_MONOPAY_ACCOUNT_LINK_MODE=email_phone` (requires SMS provider in Supabase)
- For email OTP (instead of magic-link), configure Supabase template with `{{ .Token }}`.

## Identity Auto-Provisioning

- Wallet create/import auto-provisions:
  - MonoPay tag
  - Metaplex identity card
  - local wallet identity mapping cache
- For full remote persistence, run `scripts/supabase-phase3-identity.sql` in Supabase SQL editor.

## Metadata (MonoPay ID Card)

- Versioned metadata template: `apps/assets/metadata/monopay-id-card-v1.json`
- Metadata pipeline guide: `apps/assets/metadata/README.md`
- Expected URI pattern:
  - `https://<supabase-project-ref>.supabase.co/storage/v1/object/public/monopay-assets/metadata/monopay-id-card-v1.json`
