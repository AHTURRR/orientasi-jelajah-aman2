import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useAppTheme } from "../../context/ThemeContext";

export default function TabLayout() {
  const { warna } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: warna.surface,
        },
        headerTintColor: warna.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarStyle: {
          backgroundColor: warna.tabBarBackground,
          borderTopColor: warna.border,
        },
        tabBarActiveTintColor: warna.tabBarActive,
        tabBarInactiveTintColor: warna.tabBarInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarLabel: "Beranda",
          tabBarAccessibilityLabel: "Tab Beranda Cuaca",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "partly-sunny" : "partly-sunny-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="riwayat"
        options={{
          title: "Riwayat & Favorit",
          tabBarLabel: "Riwayat & Favorit",
          tabBarAccessibilityLabel: "Tab Riwayat Pencarian dan Kota Favorit",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "bookmarks" : "bookmarks-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pengaturan"
        options={{
          title: "Pengaturan",
          tabBarLabel: "Pengaturan",
          tabBarAccessibilityLabel: "Tab Pengaturan Aplikasi",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tentang"
        options={{
          title: "Tentang",
          tabBarLabel: "Tentang",
          tabBarAccessibilityLabel: "Tab Tentang Aplikasi",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "information-circle" : "information-circle-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
