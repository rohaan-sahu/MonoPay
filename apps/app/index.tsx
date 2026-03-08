import { Redirect } from "expo-router";
import { useAuthStore } from "@mpay/stores/auth-store";

export default function IndexRoute() {
  const { currentUser, isLocked, isHydrating } = useAuthStore();

  if (isHydrating) {
    return null;
  }

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (isLocked) {
    return <Redirect href="/lock" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
