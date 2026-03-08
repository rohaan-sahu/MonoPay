import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@mpay/lib/supabase";
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

type WalletConflict = {
  deviceWalletAddress: string;
  accountWalletAddress: string;
};

type VerifyResult = {
  ok: boolean;
  error?: string;
  needsPasscodeSetup?: boolean;
  locked?: boolean;
  needsWalletImport?: boolean;
  needsWalletSetup?: boolean;
  needsWalletConflictResolution?: boolean;
};

type AuthStore = {
  currentUser: UserProfile | null;
  isLocked: boolean;
  isHydrating: boolean;
  pendingAuth: PendingAuth | null;
  walletConflict: WalletConflict | null;
  beginAuth: (payload: AuthPayload) => Promise<{ ok: boolean; error?: string }>;
  connectWallet: (mode: AuthMode) => Promise<VerifyResult>;
  verifyOtp: (code: string) => Promise<VerifyResult>;
  resendOtp: () => Promise<{ ok: boolean; error?: string }>;
  clearDeviceWallet: () => Promise<{ ok: boolean; error?: string }>;
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

const ACCOUNT_LINK_MODE = process.env.EXPO_PUBLIC_MONOPAY_ACCOUNT_LINK_MODE === "email_phone" ? "email_phone" : "email_only";
const PHONE_OTP_ENABLED = ACCOUNT_LINK_MODE === "email_phone";

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

type VerifiedEmailIdentity = {
  userId: string;
  email: string;
};

type SupabaseProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  wallet_address: string | null;
  monopay_tag: string | null;
  metaplex_card_id: string | null;
};

function mapEmailOtpErrorMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("token hash")) {
    return "Supabase is sending magic links instead of OTP. Switch the email template to include {{ .Token }}.";
  }

  if (lower.includes("expired")) {
    return "OTP has expired. Request a new code and try again.";
  }

  if (lower.includes("signup is disabled")) {
    return "Signups are disabled in Supabase.";
  }

  if (lower.includes("signups not allowed")) {
    return "No account found for this email. Please sign up first.";
  }

  return message;
}

async function requestEmailOtp(mode: AuthMode, email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: mode === "sign-up" }
  });

  if (error) {
    throw new Error(mapEmailOtpErrorMessage(error.message));
  }
}

async function verifyEmailOtp(email: string, code: string): Promise<VerifiedEmailIdentity> {
  const types: ("email" | "signup")[] = ["email", "signup"];
  let lastError = "Unable to verify OTP.";

  for (const type of types) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type
    });

    if (!error && data.user?.id) {
      return {
        userId: data.user.id,
        email: data.user.email ?? email
      };
    }

    if (error) {
      lastError = mapEmailOtpErrorMessage(error.message);
    }
  }

  throw new Error(lastError);
}

async function fetchSupabaseProfile(userId: string): Promise<SupabaseProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,wallet_address,monopay_tag,metaplex_card_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[auth-store] Failed to fetch profile row:", error.message);
    return null;
  }

  return data;
}

async function upsertSupabaseProfile(input: {
  userId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  monopayTag?: string;
  walletAddress?: string;
  metaplexCardId?: string;
}) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: input.userId,
      full_name: input.fullName || null,
      email: input.email || null,
      phone: input.phone || null,
      monopay_tag: input.monopayTag || null,
      wallet_address: input.walletAddress || null,
      metaplex_card_id: input.metaplexCardId || null,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([DEMO_USER]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);
  const [walletConflict, setWalletConflict] = useState<WalletConflict | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);

  const registeredUsersRef = useRef(registeredUsers);
  registeredUsersRef.current = registeredUsers;

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const [storedProfile, storedWallet] = await Promise.all([
          walletService.getStoredUserProfile(),
          walletService.getStoredWallet(),
        ]);

        if (!active) {
          return;
        }

        if (!storedProfile) {
          setCurrentUser(null);
          setWalletConflict(null);
          setIsLocked(false);
          return;
        }

        const hydrated: UserProfile = {
          ...storedProfile,
          walletAddress: storedProfile.walletAddress || storedWallet?.publicKey,
        };

        setCurrentUser(hydrated);
        setRegisteredUsers((prev) => [hydrated, ...prev.filter((entry) => entry.id !== hydrated.id)]);

        if (storedWallet?.publicKey && hydrated.walletAddress && storedWallet.publicKey !== hydrated.walletAddress) {
          setWalletConflict({
            deviceWalletAddress: storedWallet.publicKey,
            accountWalletAddress: hydrated.walletAddress,
          });
          setIsLocked(false);
          return;
        }

        setWalletConflict(null);
        setIsLocked(Boolean(hydrated.passcode));
      } finally {
        if (active) {
          setIsHydrating(false);
        }
      }
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  const store = useMemo<AuthStore>(() => {
    return {
      currentUser,
      pendingAuth,
      walletConflict,
      isLocked,
      isHydrating,
      beginAuth: async (payload) => {
        setWalletConflict(null);

        if (payload.mode === "sign-up" && payload.fullName && payload.fullName.trim().length < 2) {
          return { ok: false, error: "Enter your full name." };
        }

        const channel: AuthChannel = payload.channel ?? "phone";
        const normalizedFullName = payload.fullName?.trim();
        const normalizedPhone = channel === "phone" ? normalizePhone(payload.phone ?? "") : undefined;
        const normalizedEmail = channel === "email" ? normalizeEmail(payload.email ?? "") : undefined;

        if (channel === "phone") {
          if (!PHONE_OTP_ENABLED) {
            return { ok: false, error: "Phone OTP is disabled right now. Use email instead." };
          }

          if (!normalizedPhone || normalizedPhone.length < 11) {
            return { ok: false, error: "Enter a valid phone number." };
          }
        } else if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
          return { ok: false, error: "Enter a valid email address." };
        }

        if (payload.mode === "sign-in" && channel === "phone") {
          const existing = registeredUsersRef.current.find((user) =>
            user.phone === normalizedPhone
          );

          if (!existing) {
            return { ok: false, error: "Account not found. Please sign up first." };
          }
        }

        if (channel === "email" && normalizedEmail) {
          try {
            await requestEmailOtp(payload.mode, normalizedEmail);
          } catch (error) {
            return {
              ok: false,
              error: error instanceof Error ? error.message : "Could not send OTP. Please try again.",
            };
          }
        }

        setPendingAuth({ mode: payload.mode, channel, phone: normalizedPhone, email: normalizedEmail, fullName: normalizedFullName });

        return { ok: true };
      },
      connectWallet: async (mode) => {
        const traceId = `wc-${Date.now().toString(36)}`;
        console.log("[wallet-connect-trace] store:start", { traceId, mode });
        setWalletConflict(null);

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

            const persisted = await walletService.getStoredUserProfile();
            console.log("[wallet-connect-trace] store:persisted-profile", {
              traceId,
              found: Boolean(persisted),
              persistedWalletAddress: persisted?.walletAddress,
              persistedUserId: persisted?.id,
              persistedHasPasscode: Boolean(persisted?.passcode),
              persistedHasSupabaseUserId: Boolean(persisted?.supabaseUserId),
            });

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

            if (!existing) {
              if (
                persisted &&
                (
                  persisted.walletAddress === stored.publicKey ||
                  persisted.supabaseUserId === web3Auth.userId
                )
              ) {
                existing = persisted;
                setRegisteredUsers((prev) => [persisted, ...prev]);
              }
            }

            if (!existing) {
              const remoteProfile = await fetchSupabaseProfile(web3Auth.userId);
              const remoteIdentity = await identityProvisioningService.getIdentityForWallet(stored.publicKey).catch(() => null);

              if (remoteProfile) {
                const fallbackName = remoteProfile.full_name || remoteIdentity?.displayName || "Wallet User";
                const resolvedTag =
                  normalizeTag(remoteProfile.monopay_tag || remoteIdentity?.monopayTag || createHandle(fallbackName)) ||
                  createHandle(fallbackName);

                existing = {
                  id: `user_${remoteProfile.id}`,
                  fullName: fallbackName,
                  phone: remoteProfile.phone || undefined,
                  email: remoteProfile.email || undefined,
                  walletAddress: remoteProfile.wallet_address || stored.publicKey,
                  supabaseUserId: remoteProfile.id,
                  handle: resolvedTag,
                  monopayTag: resolvedTag,
                  metaplexCardId: remoteProfile.metaplex_card_id || remoteIdentity?.metaplexCardId || undefined,
                  metaplexCardStatus: remoteIdentity?.metaplexCardStatus,
                  metaplexNetwork: remoteIdentity?.metaplexNetwork,
                  metaplexSyncStatus: remoteIdentity?.metaplexSyncStatus,
                  metaplexLastSyncAt: remoteIdentity?.metaplexLastSyncAt,
                  metaplexLastTxSignature: remoteIdentity?.metaplexLastTxSignature,
                  passcode:
                    persisted && (persisted.supabaseUserId === remoteProfile.id || persisted.walletAddress === stored.publicKey)
                      ? persisted.passcode
                      : undefined,
                };
                const hydratedByProfile = existing;
                setRegisteredUsers((prev) => [hydratedByProfile, ...prev.filter((entry) => entry.id !== hydratedByProfile.id)]);
              } else if (remoteIdentity?.ownerUserId && remoteIdentity.ownerUserId === web3Auth.userId) {
                const fallbackName = remoteIdentity.displayName || "Wallet User";
                const resolvedTag = normalizeTag(remoteIdentity.monopayTag || createHandle(fallbackName)) || createHandle(fallbackName);

                existing = {
                  id: `user_${web3Auth.userId}`,
                  fullName: fallbackName,
                  walletAddress: stored.publicKey,
                  supabaseUserId: web3Auth.userId,
                  handle: resolvedTag,
                  monopayTag: resolvedTag,
                  metaplexCardId: remoteIdentity.metaplexCardId,
                  metaplexCardStatus: remoteIdentity.metaplexCardStatus,
                  metaplexNetwork: remoteIdentity.metaplexNetwork,
                  metaplexSyncStatus: remoteIdentity.metaplexSyncStatus,
                  metaplexLastSyncAt: remoteIdentity.metaplexLastSyncAt,
                  metaplexLastTxSignature: remoteIdentity.metaplexLastTxSignature,
                  passcode:
                    persisted && (persisted.supabaseUserId === web3Auth.userId || persisted.walletAddress === stored.publicKey)
                      ? persisted.passcode
                      : undefined,
                };
                const hydratedByIdentity = existing;
                setRegisteredUsers((prev) => [hydratedByIdentity, ...prev.filter((entry) => entry.id !== hydratedByIdentity.id)]);
              } else {
                return { ok: false, error: "No account linked to this wallet." };
              }
            }

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
      verifyOtp: async (code) => {
        if (!pendingAuth) {
          return { ok: false, error: "No active verification request. Start again." };
        }

        const normalizedCode = code.trim();

        if (normalizedCode.length !== 6) {
          return { ok: false, error: "Enter a valid 6-digit OTP." };
        }

        if (pendingAuth.channel === "phone") {
          return { ok: false, error: "Phone OTP is disabled right now. Use email instead." };
        }

        if (!pendingAuth.email) {
          return { ok: false, error: "Email missing for verification." };
        }

        let verifiedEmailIdentity: VerifiedEmailIdentity;

        try {
          verifiedEmailIdentity = await verifyEmailOtp(pendingAuth.email, normalizedCode);
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Unable to verify OTP.",
          };
        }

        if (pendingAuth.mode === "sign-in") {
          const remoteProfile = await fetchSupabaseProfile(verifiedEmailIdentity.userId);

          if (!remoteProfile) {
            return { ok: false, error: "No account found for this email. Please sign up first." };
          }

          const existing = registeredUsersRef.current.find((user) =>
            user.supabaseUserId === verifiedEmailIdentity.userId || user.email === verifiedEmailIdentity.email
          );

          const localProfile = await walletService.getStoredUserProfile();
          const localWallet = await walletService.getStoredWallet();
          const fallbackName = verifiedEmailIdentity.email.split("@")[0] || "MonoPay User";
          const resolvedTag = normalizeTag(remoteProfile.monopay_tag || existing?.monopayTag || createHandle(fallbackName)) || createHandle(fallbackName);
          const remoteWalletAddress = remoteProfile.wallet_address || existing?.walletAddress;
          const localWalletAddress = localWallet?.publicKey || localProfile?.walletAddress;
          const localProfileBelongsToVerifiedUser = Boolean(localProfile) &&
            (
              localProfile?.supabaseUserId === verifiedEmailIdentity.userId ||
              normalizeEmail(localProfile?.email || "") === normalizeEmail(verifiedEmailIdentity.email) ||
              (Boolean(localProfile?.walletAddress) &&
                Boolean(remoteWalletAddress) &&
                localProfile?.walletAddress === remoteWalletAddress)
            );

          if (remoteWalletAddress && localWalletAddress && remoteWalletAddress !== localWalletAddress) {
            const conflictUser: UserProfile = {
              id: `user_${remoteProfile.id}`,
              fullName: remoteProfile.full_name || existing?.fullName || fallbackName,
              phone: remoteProfile.phone || existing?.phone || undefined,
              email: remoteProfile.email || verifiedEmailIdentity.email,
              walletAddress: remoteWalletAddress,
              supabaseUserId: remoteProfile.id,
              handle: resolvedTag,
              monopayTag: resolvedTag,
              metaplexCardId: remoteProfile.metaplex_card_id || existing?.metaplexCardId || undefined,
            };

            setCurrentUser(conflictUser);
            setRegisteredUsers((prev) => [conflictUser, ...prev.filter((entry) => entry.id !== conflictUser.id)]);
            setPendingAuth(null);
            setWalletConflict({
              deviceWalletAddress: localWalletAddress,
              accountWalletAddress: remoteWalletAddress,
            });
            setIsLocked(false);

            return {
              ok: true,
              needsWalletConflictResolution: true,
            };
          }

          const resolvedWalletAddress = remoteWalletAddress || (localProfileBelongsToVerifiedUser ? localWalletAddress : undefined);
          const mergedPasscode = (localProfileBelongsToVerifiedUser ? localProfile?.passcode : undefined) || existing?.passcode;
          const nextUser: UserProfile = {
            id: `user_${remoteProfile.id}`,
            fullName: remoteProfile.full_name || existing?.fullName || fallbackName,
            phone: remoteProfile.phone || existing?.phone || undefined,
            email: remoteProfile.email || verifiedEmailIdentity.email,
            walletAddress: resolvedWalletAddress,
            supabaseUserId: remoteProfile.id,
            handle: resolvedTag,
            monopayTag: resolvedTag,
            metaplexCardId: remoteProfile.metaplex_card_id || existing?.metaplexCardId || undefined,
            passcode: mergedPasscode,
          };

          setCurrentUser(nextUser);
          setRegisteredUsers((prev) => [nextUser, ...prev.filter((entry) => entry.id !== nextUser.id)]);
          setPendingAuth(null);
          setWalletConflict(null);

          if (remoteWalletAddress && !localWallet) {
            const walletImportUser = { ...nextUser, passcode: undefined };
            setCurrentUser(walletImportUser);
            setRegisteredUsers((prev) => [walletImportUser, ...prev.filter((entry) => entry.id !== walletImportUser.id)]);
            setIsLocked(false);
            void walletService.storeUserProfile(walletImportUser).catch((error) => {
              console.warn("[auth-store] Failed to persist wallet-import-required profile:", error);
            });

            return {
              ok: true,
              needsWalletImport: true,
            };
          }

          if (!resolvedWalletAddress) {
            const walletSetupUser = { ...nextUser, passcode: undefined };
            setCurrentUser(walletSetupUser);
            setRegisteredUsers((prev) => [walletSetupUser, ...prev.filter((entry) => entry.id !== walletSetupUser.id)]);
            setIsLocked(false);
            void walletService.storeUserProfile(walletSetupUser).catch((error) => {
              console.warn("[auth-store] Failed to persist wallet-setup-required profile:", error);
            });

            return {
              ok: true,
              needsWalletSetup: true,
            };
          }

          setIsLocked(Boolean(mergedPasscode));
          void walletService.storeUserProfile(nextUser).catch((error) => {
            console.warn("[auth-store] Failed to persist signed-in profile:", error);
          });

          return {
            ok: true,
            needsPasscodeSetup: !mergedPasscode,
            locked: Boolean(mergedPasscode),
          };
        }

        const alreadyExists = registeredUsersRef.current.some((user) =>
          user.supabaseUserId === verifiedEmailIdentity.userId || user.email === verifiedEmailIdentity.email
        );

        if (alreadyExists) {
          return {
            ok: false,
            error: "An account already exists for this email."
          };
        }

        const existingRemoteProfile = await fetchSupabaseProfile(verifiedEmailIdentity.userId);

        if (existingRemoteProfile) {
          return {
            ok: false,
            error: "An account already exists for this email. Please sign in.",
          };
        }

        const generatedTag = normalizeTag(`@mono${verifiedEmailIdentity.userId.replace(/-/g, "").slice(0, 8)}`) || "@mono";
        const newUser: UserProfile = {
          id: `user_${verifiedEmailIdentity.userId}`,
          fullName: pendingAuth.fullName ?? "MonoPay User",
          email: verifiedEmailIdentity.email,
          supabaseUserId: verifiedEmailIdentity.userId,
          handle: generatedTag,
          monopayTag: generatedTag,
        };

        try {
          await upsertSupabaseProfile({
            userId: verifiedEmailIdentity.userId,
            fullName: newUser.fullName,
            email: newUser.email,
            phone: newUser.phone,
            monopayTag: newUser.monopayTag,
            walletAddress: newUser.walletAddress,
            metaplexCardId: newUser.metaplexCardId,
          });
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? `Profile save failed: ${error.message}` : "Profile save failed.",
          };
        }

        setRegisteredUsers((prev) => [newUser, ...prev]);
        setCurrentUser(newUser);
        setPendingAuth(null);
        setWalletConflict(null);
        setIsLocked(false);

        void walletService.storeUserProfile(newUser).catch((error) => {
          console.warn("[auth-store] Failed to persist signed-up profile:", error);
        });

        return {
          ok: true,
          needsPasscodeSetup: true,
          locked: false
        };
      },
      resendOtp: async () => {
        if (!pendingAuth?.email) {
          return { ok: false, error: "No active email verification request." };
        }

        try {
          await requestEmailOtp(pendingAuth.mode, pendingAuth.email);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Could not resend OTP.",
          };
        }
      },
      clearDeviceWallet: async () => {
        try {
          await walletService.clearWallet();
          setWalletConflict(null);
          setIsLocked(false);

          setCurrentUser((prev) => {
            if (!prev) {
              return prev;
            }

            return {
              ...prev,
              passcode: undefined,
            };
          });

          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Failed to clear device wallet.",
          };
        }
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
        void walletService.clearStoredUserProfile().catch((error) => {
          console.warn("[auth-store] Failed to clear stored user profile on sign-out:", error);
        });
        setCurrentUser(null);
        setPendingAuth(null);
        setWalletConflict(null);
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
        setWalletConflict(null);

        void walletService.storeUserProfile(updated).catch((error) => {
          console.warn("[auth-store] Failed to persist wallet-linked profile:", error);
        });

        return { ok: true };
      }
    };
  }, [currentUser, isLocked, isHydrating, pendingAuth, walletConflict]);

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
}

export function useAuthStore() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuthStore must be used within AuthProvider.");
  }

  return value;
}
