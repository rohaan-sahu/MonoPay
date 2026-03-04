import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { palette, fontWeight } from "@mpay/styles/theme";

type TabItemIconProps = {
  iconName: keyof typeof Feather.glyphMap;
  label: string;
  focused: boolean;
};

function TabItemIcon({ iconName, label, focused }: TabItemIconProps) {
  return (
    <View style={styles.item}>
      {focused ? (
        <View style={styles.activePill}>
          <Feather name={iconName} size={20} color={palette.white} />
        </View>
      ) : (
        <Feather name={iconName} size={20} color={palette.textMuted} />
      )}
      <Text style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
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
          height: 88,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: palette.textPrimary,
        tabBarInactiveTintColor: palette.textMuted,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabItemIcon iconName="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Pay",
          tabBarIcon: ({ focused }) => (
            <TabItemIcon iconName="credit-card" label="Pay" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Transactions",
          tabBarIcon: ({ focused }) => (
            <TabItemIcon iconName="trending-up" label="Transactions" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabItemIcon iconName="user" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
    paddingTop: 2,
    gap: 4,
  },
  activePill: {
    backgroundColor: palette.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: fontWeight.semibold as "600",
  },
  labelActive: {
    color: palette.textPrimary,
  },
  labelInactive: {
    color: palette.textMuted,
  },
});
