import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useAppTheme } from "../context/ThemeContext";

function RootNavigator() {
  const { warna, skemaAktif } = useAppTheme();

  return (
    <>
      <StatusBar style={skemaAktif === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: warna.surface },
          headerTintColor: warna.text,
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: warna.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="detail/[kota]" options={{ title: "Detail Cuaca" }} />
        <Stack.Screen
          name="tambah-favorit"
          options={{ presentation: "modal", title: "Tambah Favorit" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
