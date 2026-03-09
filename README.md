# MonoPay App

Private social payments on Solana with wallet-first onboarding, QR-based pay/request flows, profile identity, and mobile-native UX built with Expo + React Native.

## Links

- Website: https://monopay-gilt.vercel.app/
- Demo video: https://www.youtube.com/watch?v=udU0tBlfVmc
- APK, pitch, QR, and project assets: https://drive.google.com/drive/folders/19820hg8z-comjPrXLVWigOHD76f7F7e_

## Scan To Access The App

Scan this QR code to open the shared MonoPay app build:

<img src="qr.png" alt="MonoPay app access QR code" width="280" />

## What MonoPay Does

- Wallet-first onboarding with create wallet, import wallet, and external wallet connection support
- QR request and scan-to-pay flows
- Email OTP authentication with local passcode lock
- Solana payments with public SOL transfers and private USDC rail support
- MonoPay tag resolution for pay-by-username
- Auto-provisioned wallet identity and profile data

## Current Stack

- Expo + React Native + Expo Router
- Solana Web3 / SPL token flows
- Supabase Auth + app data
- MagicBlock private transfer rail for supported USDC flow
- Metaplex identity provisioning
- Zustand state management

## Project Layout

```text
app/        Expo Router screens
assets/     Images, metadata, static assets
src/        Services, stores, components, styles
scripts/    Local helpers and utilities
```

## Run Locally

```bash
npm install
npm run start
```

Useful commands:

- `npm run android`
- `npm run ios`
- `npm run lint`
- `npm run typecheck`
- `npm run eas:build:android:preview`

## Environment

Core app envs currently used in `.env` / EAS:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB3_SIGNIN_URL`
- `EXPO_PUBLIC_MONOPAY_RPC_URL`
- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_ENABLED`
- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_API_BASE_URL`
- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_DEPOSIT_BEFORE_TRANSFER`
- `EXPO_PUBLIC_MONOPAY_MAGICBLOCK_INIT_RECIPIENT`
- `EXPO_PUBLIC_MONOPAY_ACCOUNT_LINK_MODE`
- `EXPO_PUBLIC_MONOPAY_IDCARD_METADATA_URI`

See `.env.example` for the local template.

## Payments

- SOL transfers use the standard Solana public transfer flow.
- USDC uses the private MagicBlock rail when enabled.
- MonoPay tag resolution supports pay-by-username.

## Identity And Auth

- Email OTP sign-in/sign-up
- Embedded wallet create/import flow
- Passcode lock on app reopen
- Auto-provisioned MonoPay tag + wallet identity record

## Build Notes

- This build currently targets devnet.
- Mainnet is intentionally disabled in the shipped UI for now.
