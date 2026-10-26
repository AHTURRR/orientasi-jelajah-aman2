import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, Text, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { tambahFavorit } from "../services/favoritStorage";

export default function ModalTambahFavorit() {
  const { warna } = useAppTheme();
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
      setPesanError(
        "Data kota tidak lengkap. Silakan kembali dan pilih kota lagi.",
      );
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
    <View
      style={{
        flex: 1,
        padding: 16,
        gap: 16,
        backgroundColor: warna.background,
      }}
    >
      <View
        style={{
          padding: 16,
          borderRadius: 12,
          backgroundColor: warna.surface,
          borderWidth: 1,
          borderColor: warna.border,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 16, color: warna.text }}>
          Tambahkan <Text style={{ fontWeight: "bold" }}>{nama}</Text> ke daftar
          favorit?
        </Text>
        {pesanError && (
          <Text style={{ color: warna.danger }}>{pesanError}</Text>
        )}
        <Button
          title={sedangMenyimpan ? "Menyimpan..." : "Simpan"}
          color={warna.primary}
          onPress={simpan}
          disabled={sedangMenyimpan}
        />
      </View>
    </View>
  );
}
