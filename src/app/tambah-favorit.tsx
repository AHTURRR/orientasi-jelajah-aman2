// app/tambah-favorit.tsx
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text, View } from "react-native";
import { useFavorit } from "../contexts/favorit-context";

export default function ModalTambahFavorit() {
  const { kota } = useLocalSearchParams<{ kota?: string }>();
  const { tambahFavorit } = useFavorit();
  const namaKota = kota?.trim() || "Kota tidak diketahui";

  function simpanFavorit() {
    tambahFavorit(namaKota);
    router.back();
  }

  return (
    <View style={{ padding: 16 }}>
      <Text>Tambahkan {namaKota} ke daftar favorit?</Text>
      <Button title="Simpan" onPress={simpanFavorit} />
    </View>
  );
}
