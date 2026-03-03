import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { palette } from "@mpay/styles/theme";

type TabItemIconProps = {
  iconName: keyof typeof Feather.glyphMap;
  label: string;
  focused: boolean;
};

function TabItemIcon({ iconName, label, focused }: TabItemIconProps) {
  const color = focused ? palette.textPrimary : palette.textMuted;

  return (
    <View style={styles.item}>
      <Feather name={iconName} size={20} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
      {focused ? <View style={styles.dot} /> : <View style={styles.dotSpacer} />}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.surfaceLight,
          borderTopColor: palette.borderLight,
          height: 84,
          paddingTop: 8,
          paddingBottom: 10
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: palette.textPrimary,
        tabBarInactiveTintColor: palette.textMuted
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabItemIcon iconName="home" label="Home" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ focused }) => <TabItemIcon iconName="camera" label="Scan" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused }) => <TabItemIcon iconName="message-circle" label="Chat" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabItemIcon iconName="user" label="Profile" focused={focused} />
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
    paddingTop: 2
  },
  label: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "600"
  },
  dot: {
    marginTop: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.textPrimary
  },
  dotSpacer: {
    marginTop: 3,
    width: 4,
    height: 4
  }
});
