import { createContext, ReactNode, useContext, useMemo, useRef, useState } from "react";
import { walletService } from "@mpay/services/wallet-service";

type AuthMode = "sign-in" | "sign-up";
type AuthChannel = "phone" | "email" | "wallet";

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
  handle: string;
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
  linkWalletToUser: (walletAddress: string) => { ok: boolean; error?: string };
};

const AuthContext = createContext<AuthStore | null>(null);

const OTP_CODE = "123456";

const DEMO_USER: UserProfile = {
  id: "user_demo_1",
  fullName: "MonoPay Demo",
  phone: "+15551234567",
  handle: "@monopaydemo",
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
        if (mode === "sign-in") {
          const stored = await walletService.getStoredWallet();

          if (!stored) {
            return { ok: false, error: "No wallet found on this device. Please sign up first." };
          }

          let existing = registeredUsersRef.current.find((u) => u.walletAddress === stored.publicKey);

          if (!existing) {
            const persisted = await walletService.getStoredUserProfile();

            if (persisted && persisted.walletAddress === stored.publicKey) {
              existing = persisted;
              setRegisteredUsers((prev) => [persisted, ...prev]);
            } else {
              return { ok: false, error: "No account linked to this wallet." };
            }
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

        const newUser: UserProfile = {
          id: `user_${Date.now()}`,
          fullName: "Wallet User",
          handle: createHandle("wallet")
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
          handle: createHandle(pendingAuth.fullName ?? "user")
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
        setCurrentUser(null);
        setPendingAuth(null);
        setIsLocked(false);
      },
      linkWalletToUser: (walletAddress) => {
        const user = currentUserRef.current;

        if (!user) {
          return { ok: false, error: "No active user session." };
        }

        const updated = { ...user, walletAddress };

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
