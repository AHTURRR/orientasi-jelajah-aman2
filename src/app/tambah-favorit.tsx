// src/app/tambah-favorit.tsx
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, Text, View } from "react-native";
import { tambahFavorit } from "../services/favoritStorage";
export default function ModalTambahFavorit() {
  const { id, nama, lat, lon } = useLocalSearchParams<{
    id: string;
    nama: string;
    lat: string;
    lon: string;
  }>();
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);

  async function simpan() {
    const idAngka = Number(id);
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (
      !nama ||
      !Number.isFinite(idAngka) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setPesanError("Data kota tidak lengkap. Silakan kembali dan pilih kota lagi.");
      return;
    }

    try {
      setSedangMenyimpan(true);
      setPesanError(null);
      await tambahFavorit({
        id: idAngka,
        nama,
        latitude,
        longitude,
      });
      router.back();
    } catch {
      setPesanError("Favorit gagal disimpan. Silakan coba lagi.");
    } finally {
      setSedangMenyimpan(false);
    }
  }

  return (
    <View style={{ padding: 16, gap: 16 }}>
      <Text>Tambahkan {nama} ke daftar favorit?</Text>
      {pesanError && <Text style={{ color: "red" }}>{pesanError}</Text>}
      <Button
        title={sedangMenyimpan ? "Menyimpan..." : "Simpan"}
        onPress={simpan}
        disabled={sedangMenyimpan}
      />
    </View>
  );
}
