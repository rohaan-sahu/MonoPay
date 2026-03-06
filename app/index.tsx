import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/local-auth-stores";

export default function IndexRoute() {
  const { currentUser, isLocked } = useAuthStore();

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (isLocked) {
    return <Redirect href="/lock" />;
  }

  return <Redirect href="/(tabs)" />;
}
