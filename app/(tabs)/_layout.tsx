import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Buffer } from "buffer";
import "react-native-get-random-values";
import { SafeAreaProvider } from "react-native-safe-area-context";

global.Buffer = global.Buffer || Buffer;

export default function TabLayout() {
  return (
    <SafeAreaProvider>
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
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="request"
          options={{
            title: "request",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="card-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Me",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="man" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
