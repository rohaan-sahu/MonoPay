# MonoPay (WIP)

**Private, Solana-powered social payments.** MonoPay brings the seamless experience of Google Pay (India) to the Solana ecosystem. It combines a high-speed QR payment interface with a private chat layer, allowing users to transact without exposing their account states or transaction history to the public ledger.

---

## Core Features

* **Private Payments:** Built with privacy-first architecture where only the payer and payee have visibility into account states and transaction details. Uses Inco for privacy.
* **QR-Based Ecosystem:** Instant scan-and-pay functionality for a frictionless, retail-inspired experience.
* **Social Chat Layer:** A dedicated messaging interface where users can send, request, and track private payments within a conversation.
* **Metaplex Identity:** During onboarding, users mint a **Metaplex Core** asset that acts as their unique, shareable "Identity Card."
* **Secure Access:** Mandatory 6-digit passcode or pattern lock screen integrated.

---

## Tech Stack

* **Framework:** React Native with Expo (Expo Router)
* **Blockchain:** Solana (Devnet)
* **Smart Contracts:** Anchor Framework
* **State Management:** Zustand
* **Identity:** Metaplex Core

---

## Project Structure

To maintain a clean separation of concerns, we follow this strict directory pattern:

* **`app/` (User-Facing):** Handles all routing, layouts, and screen definitions.
* `index.tsx`: The mandatory Lock Screen.
* `(tabs)/`: Main application navigation (Home, Scan, Chat, Profile).


* **`src/` (Services):** Contains all internal logic and helpers.
* `components/`: Reusable UI elements.
* `hooks/`: Custom React hooks (Solana/Anchor interactions).
* `styles/`: Modular style definitions (e.g., `theme.ts`, `homeScreen.ts`).


---


## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

This project uses [file-based routing](https://docs.expo.dev/router/introduction).


---

## Contributing

MonoPay follows a strict architecture to keep social and payment logic separate.

# Directory & Aliasing
- app/: User-facing routes and screen layouts.

- src/: All logic, hooks, and styles.

-  Alias: Use @mpay for all imports from src.

# Styling Pattern
Each screen requires a dedicated style template from src/styles/. Follow this import convention:

```TypeScript
import { homeScreen as s } from "@mpay/styles/homeScreenStyles";
```
Theming: Extend the base templates in theme.ts rather than hardcoding values.
