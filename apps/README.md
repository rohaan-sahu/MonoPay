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
- `npm run encrypt:server` (local Inco encryption endpoint for sandbox payments)
- `npm run lint`
- `npm run typecheck`

## Structure

- `app/index.tsx` launch gate (`auth` -> `lock` -> `tabs`)
- `app/(auth)/` onboarding + sign in/sign up + OTP + passcode
- `app/lock.tsx` mandatory lock screen
- `app/(tabs)/` main app shell (`home`, `scan`, `chat`, `profile`)
- `assets/` static assets
- `src/` internal logic and shared modules (`components`, `services`, `stores`, `styles`)

## Notes

- Auth is currently mocked in-app for UI development.
- OTP code is `123456`.

## SDK Sandbox

- Open `Profile -> SDK Sandbox (POC)` to test real SDK-backed flows.
- Copy `apps/.env.example` to `apps/.env` and fill the values before running.
- Current sandbox integrations:
  - Inco + Solana transaction flow for payment trigger
  - Supabase OTP flow for email + phone verification
  - Metaplex Core asset lifecycle for ID card create/update/deactivate
- React Native note:
  - `@inco/solana-sdk` encryption currently depends on Node `crypto` and cannot run directly in Expo iOS runtime.
  - Configure `EXPO_PUBLIC_MONOPAY_INCO_ENCRYPT_ENDPOINT` to call a backend/Edge function that runs `encryptValue`.
  - Sandbox payment trigger is strict and fails if this endpoint is missing/unreachable.
  - Local dev flow:
    - Start endpoint: `npm run encrypt:server`
    - Keep `EXPO_PUBLIC_MONOPAY_INCO_ENCRYPT_ENDPOINT=http://127.0.0.1:8787/encrypt` for iOS simulator.
    - If testing on physical device, replace `127.0.0.1` with your machine LAN IP.
- Account-link mode:
  - `EXPO_PUBLIC_MONOPAY_ACCOUNT_LINK_MODE=email_only` (recommended while Twilio/SMS is not configured)
  - `EXPO_PUBLIC_MONOPAY_ACCOUNT_LINK_MODE=email_phone` (requires SMS provider in Supabase)
  - For email OTP (instead of magic-link), configure Supabase email template to include `{{ .Token }}` and not `{{ .ConfirmationURL }}`.

## Metadata (MonoPay ID Card)

- Versioned metadata template: `apps/assets/metadata/monopay-id-card-v1.json`
- Metadata pipeline guide: `apps/assets/metadata/README.md`
- Current expected URI pattern:
  - `https://<supabase-project-ref>.supabase.co/storage/v1/object/public/monopay-assets/metadata/monopay-id-card-v1.json`
