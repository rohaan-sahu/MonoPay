import { Redirect, router } from "expo-router";
import { useCallback, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useAuthStore } from "@mpay/stores/auth-store";

const PIN_LENGTH = 4;

const bodyFont = Platform.select({
  ios: "Inter",
  android: "sans-serif",
  default: "sans-serif"
});

const displayFont = Platform.select({
  ios: "Bricolage Grotesque",
  android: "sans-serif-light",
  default: "sans-serif"
});

export default function LockScreen() {
  const { currentUser, isLocked, signOut, unlock } = useAuthStore();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const handlePress = useCallback(
    (digit: string) => {
      if (passcode.length >= PIN_LENGTH) return;
      setError("");
      const next = passcode + digit;
      setPasscode(next);

      if (next.length === PIN_LENGTH) {
        setTimeout(() => {
          const result = unlock(next);
          if (!result.ok) {
            setError(result.error ?? "Incorrect passcode.");
            setPasscode("");
            return;
          }
          router.replace("/(tabs)/home");
        }, 150);
      }
    },
    [passcode, unlock]
  );

  const handleDelete = useCallback(() => {
    setError("");
    setPasscode((p) => p.slice(0, -1));
  }, []);

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isLocked) {
    return <Redirect href="/(tabs)/home" />;
  }

  const initials = currentUser.fullName
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const firstName = currentUser.fullName.split(" ")[0];

  const handleLogout = () => {
    signOut();
    router.replace("/(auth)/welcome");
  };

  return (
    <SafeAreaView style={ls.page}>
      <View style={ls.container}>
        {/* Top Section */}
        <View style={ls.topSection}>
          {/* Avatar */}
          <View style={ls.avatar}>
            <Text style={ls.avatarText}>{initials}</Text>
          </View>

          {/* Greeting */}
          <Text style={ls.greeting}>Welcome Back {firstName}</Text>
          <Text style={ls.instruction}>Enter your {PIN_LENGTH}-Digit PIN</Text>
        </View>

        {/* PIN Indicators */}
        <View style={ls.pinRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                ls.pinBox,
                i < passcode.length && ls.pinBoxFilled
              ]}
            >
              {i < passcode.length && <View style={ls.pinDot} />}
            </View>
          ))}
        </View>

        {!!error && <Text style={ls.error}>{error}</Text>}

        {/* Spacer pushes numpad toward bottom */}
        <View style={{ flex: 1 }} />

        {/* Numpad */}
        <View style={ls.numpad}>
          {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["bio", "0", "del"]].map((row, ri) => (
            <View key={ri} style={ls.numpadRow}>
              {row.map((key, ki) => {
                if (key === "bio") {
                  return (
                    <Pressable key={ki} style={ls.numpadKey}>
                      <FingerprintIcon />
                    </Pressable>
                  );
                }
                if (key === "del") {
                  return (
                    <Pressable key={ki} style={ls.numpadKey} onPress={handleDelete}>
                      <Feather name="chevron-left" size={28} color="#dc2626" />
                    </Pressable>
                  );
                }
                return (
                  <Pressable key={ki} style={ls.numpadKey} onPress={() => handlePress(key)}>
                    <Text style={ls.numpadDigit}>{key}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={ls.footer}>
          <Text style={ls.footerText}>
            Not your account?{" "}
            <Text style={ls.footerLink} onPress={handleLogout}>
              Log out
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FingerprintIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 640 640" fill="#171717">
      <Path d="M112 320C112 205.1 205.1 112 320 112C383.1 112 439.6 140.1 477.8 184.5C486.4 194.6 501.6 195.7 511.6 187.1C521.6 178.5 522.8 163.3 514.2 153.3C467.3 98.6 397.7 64 320 64C178.6 64 64 178.6 64 320L64 360C64 373.3 74.7 384 88 384C101.3 384 112 373.3 112 360L112 320zM570.5 267.1C567.8 254.1 555 245.8 542.1 248.6C529.2 251.4 520.8 264.1 523.6 277C526.5 290.9 528.1 305.3 528.1 320.1L528.1 360.1C528.1 373.4 538.8 384.1 552.1 384.1C565.4 384.1 576.1 373.4 576.1 360.1L576.1 320.1C576.1 302 574.2 284.3 570.6 267.2zM320 144C301 144 282.6 147 265.5 152.6C250.3 157.6 246.8 176.3 257.2 188.5C264.3 196.8 276 199.3 286.6 196.4C297.2 193.5 308.4 192 320 192C390.7 192 448 249.3 448 320L448 344.9C448 370.1 446.5 395.2 443.6 420.2C441.9 434.8 453 448 467.8 448C479.6 448 489.7 439.4 491.1 427.7C494.4 400.3 496.1 372.7 496.1 345L496.1 320.1C496.1 222.9 417.3 144.1 320.1 144.1zM214.7 212.7C205.6 202.1 189.4 201.3 180.8 212.3C157.7 242.1 144 279.4 144 320L144 344.9C144 369.1 141.4 393.3 136.2 416.8C132.8 432.4 144.1 447.9 160.1 447.9C170.6 447.9 180 440.9 182.3 430.6C188.7 402.5 192 373.8 192 344.8L192 319.9C192 292.7 200.5 267.5 214.9 246.8C222.1 236.4 222.9 222.2 214.7 212.6zM320 224C267 224 224 267 224 320L224 344.9C224 380.8 219.4 416.4 210.2 451C206.4 465.3 216.9 480 231.7 480C241.2 480 249.6 473.8 252.1 464.6C262.6 425.6 268 385.4 268 344.9L268 320C268 291.3 291.3 268 320 268C348.7 268 372 291.3 372 320L372 344.9C372 381.2 368.5 417.3 361.6 452.8C358.9 466.7 369.3 480 383.4 480C393.6 480 402.4 473 404.4 463C412.1 424.2 416 384.7 416 344.9L416 320C416 267 373 224 320 224zM344 320C344 306.7 333.3 296 320 296C306.7 296 296 306.7 296 320L296 344.9C296 404.8 285 464.2 263.5 520.1L257.6 535.4C252.8 547.8 259 561.7 271.4 566.4C283.8 571.1 297.7 565 302.4 552.6L308.3 537.3C331.9 475.9 344 410.7 344 344.9L344 320z" />
    </Svg>
  );
}

const ls = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#ffffff"
  },
  container: {
    flex: 1,
    paddingHorizontal: 24
  },
  topSection: {
    alignItems: "flex-start",
    marginTop: 24,
    marginBottom: 32
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  avatarText: {
    color: "#737373",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: bodyFont
  },
  greeting: {
    color: "#171717",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 6,
    fontFamily: displayFont
  },
  instruction: {
    color: "#737373",
    fontSize: 16,
    fontFamily: bodyFont
  },
  pinRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 14,
    marginTop: 20
  },
  pinBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  pinBoxFilled: {
    borderColor: "#171717",
    backgroundColor: "#171717"
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ffffff"
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
    fontFamily: bodyFont
  },
  numpad: {
    paddingHorizontal: 8,
    marginBottom: 12
  },
  numpadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24
  },
  numpadKey: {
    width: 80,
    height: 56,
    alignItems: "center",
    justifyContent: "center"
  },
  numpadDigit: {
    fontSize: 28,
    fontWeight: "700",
    color: "#171717",
    fontFamily: bodyFont
  },
  footer: {
    paddingBottom: 16,
    alignItems: "center"
  },
  footerText: {
    color: "#737373",
    fontSize: 14,
    fontFamily: bodyFont
  },
  footerLink: {
    color: "#171717",
    fontWeight: "700",
    textDecorationLine: "underline",
    fontFamily: bodyFont
  }
});
