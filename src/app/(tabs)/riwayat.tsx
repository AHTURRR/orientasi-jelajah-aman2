// src/app/(tabs)/riwayat.tsx
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Button, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KotaFavorit } from "../../../types/favorit";
import { ambilSemuaFavorit, hapusFavorit } from "../../services/favoritStorage";
export default function TabRiwayat() {
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let masihAktif = true;

      async function muatFavorit() {
        try {
          const favorit = await ambilSemuaFavorit();
          if (masihAktif) setDaftarFavorit(favorit);
        } catch {
          if (masihAktif) {
            Alert.alert(
              "Gagal memuat favorit",
              "Daftar favorit tidak dapat dibaca. Silakan coba lagi.",
            );
          }
        } finally {
          if (masihAktif) setSedangMemuat(false);
        }
      }

      setSedangMemuat(true);
      muatFavorit();

      return () => {
        masihAktif = false;
      };
    }, []),
  );

  async function hapus(id: number) {
    try {
      await hapusFavorit(id);
      setDaftarFavorit((prev) => prev.filter((k) => k.id !== id));
    } catch {
      Alert.alert(
        "Gagal menghapus favorit",
        "Kota belum berhasil dihapus. Silakan coba lagi.",
      );
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>Kota Favorit</Text>
      <Text>Tersimpan {daftarFavorit.length} kota</Text>
      {sedangMemuat && <Text>Memuat favorit...</Text>}
      {!sedangMemuat && daftarFavorit.length === 0 && (
        <Text>Belum ada kota favorit</Text>
      )}
      {daftarFavorit.map((kota) => (
        <View
          key={kota.id}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text>{kota.nama}</Text>
          <Button
            title="Hapus"
            onPress={() => {
              if (Platform.OS === "web") {
                if (globalThis.confirm(`Yakin hapus ${kota.nama}?`)) {
                  void hapus(kota.id);
                }
                return;
              }

              Alert.alert("Konfirmasi Hapus", `Yakin hapus ${kota.nama}?`, [
                {
                  text: "Batal",
                  style: "cancel",
                },
                {
                  text: "Hapus",
                  style: "destructive",
                  onPress: () => hapus(kota.id),
                },
              ]);
            }}
          />
        </View>
      ))}
    </SafeAreaView>
  );
}
