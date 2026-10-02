// app/_layout.tsx (root layout)
import { Stack } from "expo-router";
import { FavoritProvider } from "../contexts/favorit-context";

export default function RootLayout() {
  return (
    <FavoritProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="detail/[kota]" options={{ title: "Detail Cuaca" }} />
        <Stack.Screen
          name="tambah-favorit"
          options={{ presentation: "modal", title: "Tambah Favorit" }}
        />
      </Stack>
    </FavoritProvider>
  );
}
