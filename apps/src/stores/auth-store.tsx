import { createContext, ReactNode, useContext, useMemo, useRef, useState } from "react";
import { identityProvisioningService } from "@mpay/services/identity-provisioning-service";
import { web3AuthService } from "@mpay/services/web3-auth-service";
import { walletService } from "@mpay/services/wallet-service";

type AuthMode = "sign-in" | "sign-up";
type AuthChannel = "phone" | "email" | "wallet";
type MetaplexNetwork = "solana-devnet" | "solana-testnet" | "solana-mainnet";
type MetaplexSyncStatus = "synced" | "unknown" | "failed";

type AuthPayload = {
  mode: AuthMode;
  channel: AuthChannel;
  phone?: string;
  email?: string;
  fullName?: string;
};

type PendingAuth = AuthPayload;

type UserProfile = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  walletAddress?: string;
  supabaseUserId?: string;
  handle: string;
  monopayTag?: string;
  metaplexCardId?: string;
  metaplexCardStatus?: "active" | "deactivated";
  metaplexNetwork?: MetaplexNetwork;
  metaplexSyncStatus?: MetaplexSyncStatus;
  metaplexLastSyncAt?: string;
  metaplexLastTxSignature?: string;
  passcode?: string;
};

type VerifyResult = {
  ok: boolean;
  error?: string;
  needsPasscodeSetup?: boolean;
  locked?: boolean;
};

type AuthStore = {
  currentUser: UserProfile | null;
  isLocked: boolean;
  pendingAuth: PendingAuth | null;
  beginAuth: (payload: AuthPayload) => { ok: boolean; error?: string };
  connectWallet: (mode: AuthMode) => Promise<VerifyResult>;
  verifyOtp: (code: string) => VerifyResult;
  setPasscode: (passcode: string) => { ok: boolean; error?: string };
  unlock: (passcode: string) => { ok: boolean; error?: string };
  lockApp: () => void;
  signOut: () => void;
  updateProfile: (input: { fullName: string; email?: string; monopayTag: string }) => Promise<{ ok: boolean; error?: string }>;
  linkWalletToUser: (
    walletAddress: string,
    options?: {
      supabaseUserId?: string;
      handle?: string;
      monopayTag?: string;
      metaplexCardId?: string;
      metaplexCardStatus?: "active" | "deactivated";
      metaplexNetwork?: MetaplexNetwork;
      metaplexSyncStatus?: MetaplexSyncStatus;
      metaplexLastSyncAt?: string;
      metaplexLastTxSignature?: string;
    }
  ) => { ok: boolean; error?: string };
};

const AuthContext = createContext<AuthStore | null>(null);

const OTP_CODE = "123456";

const DEMO_USER: UserProfile = {
  id: "user_demo_1",
  fullName: "MonoPay Demo",
  phone: "+15551234567",
  handle: "@monopaydemo",
  monopayTag: "@monopaydemo",
  passcode: "1234"
};

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (phone.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.startsWith("1") && digits.length === 11) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function createHandle(name: string) {
  return `@${name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14) || "user"}`;
}

function normalizeTag(tag?: string) {
  const cleaned = tag?.trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "");

  if (!cleaned) {
    return undefined;
  }

  return `@${cleaned}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([DEMO_USER]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const registeredUsersRef = useRef(registeredUsers);
  registeredUsersRef.current = registeredUsers;

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const store = useMemo<AuthStore>(() => {
    return {
      currentUser,
      pendingAuth,
      isLocked,
      beginAuth: (payload) => {
        if (payload.mode === "sign-up" && payload.fullName && payload.fullName.trim().length < 2) {
          return { ok: false, error: "Enter your full name." };
        }

        const channel: AuthChannel = payload.channel ?? "phone";
        const normalizedFullName = payload.fullName?.trim();
        const normalizedPhone = channel === "phone" ? normalizePhone(payload.phone ?? "") : undefined;
        const normalizedEmail = channel === "email" ? normalizeEmail(payload.email ?? "") : undefined;

        if (channel === "phone") {
          if (!normalizedPhone || normalizedPhone.length < 11) {
            return { ok: false, error: "Enter a valid phone number." };
          }
        } else if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
          return { ok: false, error: "Enter a valid email address." };
        }

        if (payload.mode === "sign-in") {
          const existing = registeredUsers.find((user) =>
            channel === "phone" ? user.phone === normalizedPhone : user.email === normalizedEmail
          );

          if (!existing) {
            return { ok: false, error: "Account not found. Please sign up first." };
          }
        }

        setPendingAuth({ mode: payload.mode, channel, phone: normalizedPhone, email: normalizedEmail, fullName: normalizedFullName });

        return { ok: true };
      },
      connectWallet: async (mode) => {
        const traceId = `wc-${Date.now().toString(36)}`;
        console.log("[wallet-connect-trace] store:start", { traceId, mode });

        try {
          if (mode === "sign-in") {
            const stored = await walletService.getStoredWallet();
            console.log("[wallet-connect-trace] store:stored-wallet", {
              traceId,
              found: Boolean(stored),
              publicKey: stored?.publicKey,
              mode: stored?.mode,
            });

            if (!stored) {
              return { ok: false, error: "No wallet found on this device. Please sign up first." };
            }

            let existing = registeredUsersRef.current.find((u) => u.walletAddress === stored.publicKey);
            console.log("[wallet-connect-trace] store:registered-lookup", {
              traceId,
              found: Boolean(existing),
              localRegisteredUsersCount: registeredUsersRef.current.length,
            });

            if (!existing) {
              const persisted = await walletService.getStoredUserProfile();
              console.log("[wallet-connect-trace] store:persisted-profile", {
                traceId,
                found: Boolean(persisted),
                persistedWalletAddress: persisted?.walletAddress,
                persistedUserId: persisted?.id,
                persistedHasPasscode: Boolean(persisted?.passcode),
                persistedHasSupabaseUserId: Boolean(persisted?.supabaseUserId),
              });

              if (persisted && persisted.walletAddress === stored.publicKey) {
                existing = persisted;
                setRegisteredUsers((prev) => [persisted, ...prev]);
              } else {
                return { ok: false, error: "No account linked to this wallet." };
              }
            }

            console.log("[wallet-connect-trace] store:web3-auth:start", {
              traceId,
              walletAddress: stored.publicKey,
            });
            const web3Auth = await web3AuthService.signInWithEmbeddedWallet();
            console.log("[wallet-connect-trace] store:web3-auth:ok", {
              traceId,
              userId: web3Auth.userId,
              walletAddress: web3Auth.walletAddress,
              expiresAt: web3Auth.expiresAt,
            });

            const syncedExisting =
              existing.supabaseUserId && existing.supabaseUserId === web3Auth.userId
                ? existing
                : { ...existing, supabaseUserId: web3Auth.userId };

            let identitySyncedUser = syncedExisting;

            try {
              const identity = await identityProvisioningService.ensureIdentityForWallet({
                walletAddress: stored.publicKey,
                ownerUserId: web3Auth.userId,
                displayName: syncedExisting.fullName,
                phone: syncedExisting.phone,
                email: syncedExisting.email,
                preferredTag: syncedExisting.monopayTag || syncedExisting.handle,
                existingMonopayTag: syncedExisting.monopayTag,
                existingMetaplexCardId: syncedExisting.metaplexCardId,
                existingMetaplexCardStatus: syncedExisting.metaplexCardStatus,
                existingMetaplexNetwork: syncedExisting.metaplexNetwork,
              });

              identitySyncedUser = {
                ...syncedExisting,
                handle: identity.monopayTag,
                monopayTag: identity.monopayTag,
                metaplexCardId: identity.metaplexCardId,
                metaplexCardStatus: identity.metaplexCardStatus,
                metaplexNetwork: identity.metaplexNetwork,
                metaplexSyncStatus: identity.metaplexSyncStatus,
                metaplexLastSyncAt: identity.metaplexLastSyncAt,
                metaplexLastTxSignature: identity.metaplexLastTxSignature,
              };

              console.log("[wallet-connect-trace] store:identity:ok", {
                traceId,
                walletAddress: identity.walletAddress,
                monopayTag: identity.monopayTag,
                metaplexCardId: identity.metaplexCardId,
                source: identity.source,
              });
            } catch (identityError) {
              console.warn("[wallet-connect-trace] store:identity:error", {
                traceId,
                message: identityError instanceof Error ? identityError.message : String(identityError),
              });
            }

            setCurrentUser(identitySyncedUser);
            setRegisteredUsers((prev) => prev.map((user) => (user.id === identitySyncedUser.id ? identitySyncedUser : user)));
            void walletService.storeUserProfile(identitySyncedUser).catch((error) => {
              console.warn("[auth-store] Failed to persist synced wallet profile:", error);
            });
            setPendingAuth(null);
            setIsLocked(Boolean(identitySyncedUser.passcode));

            const result = {
              ok: true,
              needsPasscodeSetup: !identitySyncedUser.passcode,
              locked: Boolean(identitySyncedUser.passcode)
            } as const;
            console.log("[wallet-connect-trace] store:done", { traceId, result });

            return result;
          }

          const walletSeed = Date.now().toString(36).slice(-6);
          const seededWalletTag = createHandle(`mono${walletSeed}`);

          const newUser: UserProfile = {
            id: `user_${Date.now()}`,
            fullName: "Wallet User",
            handle: seededWalletTag,
            monopayTag: seededWalletTag
          };

          setRegisteredUsers((prev) => [newUser, ...prev]);
          setCurrentUser(newUser);
          setPendingAuth(null);
          setIsLocked(false);

          const result = {
            ok: true,
            needsPasscodeSetup: true,
            locked: false
          } as const;
          console.log("[wallet-connect-trace] store:done", { traceId, result });

          return result;
        } catch (error) {
          console.error("[wallet-connect-trace] store:exception", {
            traceId,
            mode,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          throw error;
        }
      },
      verifyOtp: (code) => {
        if (!pendingAuth) {
          return { ok: false, error: "No active verification request. Start again." };
        }

        if (code !== OTP_CODE) {
          return { ok: false, error: "Invalid OTP code." };
        }

        if (pendingAuth.mode === "sign-in") {
          const existing = registeredUsers.find((user) =>
            pendingAuth.channel === "phone" ? user.phone === pendingAuth.phone : user.email === pendingAuth.email
          );

          if (!existing) {
            return { ok: false, error: "No account found. Create one first." };
          }

          setCurrentUser(existing);
          setPendingAuth(null);
          setIsLocked(Boolean(existing.passcode));

          return {
            ok: true,
            needsPasscodeSetup: !existing.passcode,
            locked: Boolean(existing.passcode)
          };
        }

        const alreadyExists = registeredUsers.some((user) =>
          pendingAuth.channel === "phone" ? user.phone === pendingAuth.phone : user.email === pendingAuth.email
        );

        if (alreadyExists) {
          return {
            ok: false,
            error: pendingAuth.channel === "phone" ? "An account already exists for this number." : "An account already exists for this email."
          };
        }

        const newUser: UserProfile = {
          id: `user_${Date.now()}`,
          fullName: pendingAuth.fullName ?? "MonoPay User",
          phone: pendingAuth.phone,
          email: pendingAuth.email,
          handle: createHandle(pendingAuth.fullName ?? "user"),
          monopayTag: createHandle(pendingAuth.fullName ?? "user")
        };

        setRegisteredUsers((prev) => [newUser, ...prev]);
        setCurrentUser(newUser);
        setPendingAuth(null);
        setIsLocked(false);

        return {
          ok: true,
          needsPasscodeSetup: true,
          locked: false
        };
      },
      setPasscode: (passcode) => {
        if (!currentUser) {
          return { ok: false, error: "No active user session." };
        }

        if (!/^\d{4,6}$/.test(passcode)) {
          return { ok: false, error: "Passcode must be 4-6 digits." };
        }

        const updated = { ...currentUser, passcode };

        setCurrentUser(updated);
        setRegisteredUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)));
        setIsLocked(true);

        // Keep wallet-linked profile in sync so sign-in after cold restart goes to lock flow.
        void walletService.storeUserProfile(updated).catch((error) => {
          console.warn("[auth-store] Failed to persist passcode update:", error);
        });

        return { ok: true };
      },
      unlock: (passcode) => {
        if (!currentUser?.passcode) {
          setIsLocked(false);
          return { ok: true };
        }

        if (currentUser.passcode !== passcode) {
          return { ok: false, error: "Incorrect passcode." };
        }

        setIsLocked(false);
        return { ok: true };
      },
      lockApp: () => {
        if (!currentUser) {
          return;
        }

        setIsLocked(true);
      },
      signOut: () => {
        void web3AuthService.signOut().catch((error) => {
          console.warn("[auth-store] Supabase sign-out warning:", error);
        });
        setCurrentUser(null);
        setPendingAuth(null);
        setIsLocked(false);
      },
      updateProfile: async (input) => {
        const user = currentUserRef.current;

        if (!user) {
          return { ok: false, error: "No active user session." };
        }

        const nextFullName = input.fullName.trim();

        if (nextFullName.length < 2) {
          return { ok: false, error: "Full name must be at least 2 characters." };
        }

        const normalizedEmailInput = input.email ? normalizeEmail(input.email) : "";
        const nextEmail = normalizedEmailInput || undefined;

        if (nextEmail && !isValidEmail(nextEmail)) {
          return { ok: false, error: "Enter a valid email address." };
        }

        const normalizedTag = normalizeTag(input.monopayTag || user.monopayTag || user.handle);

        if (!normalizedTag || normalizedTag.replace(/^@/, "").length < 3) {
          return { ok: false, error: "MonoPay tag must be at least 3 valid characters." };
        }

        const nextUser: UserProfile = {
          ...user,
          fullName: nextFullName,
          email: nextEmail,
          handle: normalizedTag,
          monopayTag: normalizedTag,
        };

        if (user.walletAddress) {
          try {
            const identity = await identityProvisioningService.updateIdentityProfile({
              walletAddress: user.walletAddress,
              ownerUserId: user.supabaseUserId,
              displayName: nextFullName,
              phone: user.phone,
              email: nextEmail,
              desiredMonopayTag: normalizedTag,
            });

            nextUser.handle = identity.monopayTag;
            nextUser.monopayTag = identity.monopayTag;
            nextUser.metaplexCardId = identity.metaplexCardId;
            nextUser.metaplexCardStatus = identity.metaplexCardStatus;
            nextUser.metaplexNetwork = identity.metaplexNetwork;
            nextUser.metaplexSyncStatus = identity.metaplexSyncStatus;
            nextUser.metaplexLastSyncAt = identity.metaplexLastSyncAt;
            nextUser.metaplexLastTxSignature = identity.metaplexLastTxSignature;
          } catch (error) {
            return {
              ok: false,
              error: error instanceof Error ? error.message : "Could not update wallet identity.",
            };
          }
        }

        setCurrentUser(nextUser);
        setRegisteredUsers((prev) => prev.map((entry) => (entry.id === user.id ? nextUser : entry)));

        void walletService.storeUserProfile(nextUser).catch((error) => {
          console.warn("[auth-store] Failed to persist profile update:", error);
        });

        return { ok: true };
      },
      linkWalletToUser: (walletAddress, options) => {
        const user = currentUserRef.current;

        if (!user) {
          return { ok: false, error: "No active user session." };
        }

        const resolvedTag = normalizeTag(options?.monopayTag || options?.handle || user.monopayTag || user.handle);

        const updated = {
          ...user,
          walletAddress,
          supabaseUserId: options?.supabaseUserId ?? user.supabaseUserId,
          handle: resolvedTag || user.handle,
          monopayTag: resolvedTag || user.monopayTag,
          metaplexCardId: options?.metaplexCardId ?? user.metaplexCardId,
          metaplexCardStatus: options?.metaplexCardStatus ?? user.metaplexCardStatus,
          metaplexNetwork: options?.metaplexNetwork ?? user.metaplexNetwork,
          metaplexSyncStatus: options?.metaplexSyncStatus ?? user.metaplexSyncStatus,
          metaplexLastSyncAt: options?.metaplexLastSyncAt ?? user.metaplexLastSyncAt,
          metaplexLastTxSignature: options?.metaplexLastTxSignature ?? user.metaplexLastTxSignature
        };

        setCurrentUser(updated);
        setRegisteredUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

        void walletService.storeUserProfile(updated).catch((error) => {
          console.warn("[auth-store] Failed to persist wallet-linked profile:", error);
        });

        return { ok: true };
      }
    };
  }, [currentUser, isLocked, pendingAuth, registeredUsers]);

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
}

export function useAuthStore() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuthStore must be used within AuthProvider.");
  }

  return value;
}
