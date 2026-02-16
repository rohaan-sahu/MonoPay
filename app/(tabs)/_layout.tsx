import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#16161D",
          borderTopColor: "#2A2A35",
        },
        tabBarActiveTintColor: "#14F195",
        tabBarInactiveTintColor: "#6B7280",
      }}
    >
      <StatusBar style="light" />

      <Tabs.Screen
        name="index"
        options={{
          title: "OnBoard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
