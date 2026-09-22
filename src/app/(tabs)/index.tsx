// src/app/(tabs)/index.tsx
import { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HasilGeocoding } from "../../../types/geocoding";
import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";

export default function HalamanUtama() {
  const [teksCari, setTeksCari] = useState("");
  const [hasil, setHasil] = useState<HasilGeocoding[]>([]);
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  const teksTertunda = useDebounce(teksCari, 800);

  useEffect(() => {
    if (teksTertunda.trim().length === 0) {
      setHasil([]);
      setPesanError(null);
      return;
    }
    ambilData(teksTertunda);
  }, [teksTertunda]);

  async function ambilData(nama: string) {
    setSedangMemuat(true);
    setPesanError(null);
    try {
      const data = await cariKota(nama);
      setHasil(data);
    } catch (err) {
      setPesanError("Gagal mengambil data. Periksa koneksi internet Anda.");
    } finally {
      setSedangMemuat(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 16 }}>
      <SearchBox onCari={setTeksCari} />

      {sedangMemuat && <ActivityIndicator size="large" color="#0000ff" />}

      {pesanError && (
        <View style={{ alignItems: "center", gap: 8 }}>
          <Text
            accessibilityLabel="Pesan Error: ${pesanError}"
            style={{ color: "red", textAlign: "center" }}
          >
            {pesanError}
          </Text>
          <Button title="Coba Lagi" onPress={() => ambilData(teksTertunda)} />
        </View>
      )}

      {!sedangMemuat &&
        !pesanError &&
        teksTertunda.length > 0 &&
        hasil.length === 0 && (
          <Text
            accessibilityLabel="Pesan kosong: Kota tidak ditemukan"
            style={{ textAlign: "center" }}
          >
            Kota tidak ditemukan
          </Text>
        )}

      {!sedangMemuat && !pesanError && hasil.length > 0 && (
        <Text accessibilityLabel={`Ditemukan ${hasil.length} kota`}>
          Ditemukan {hasil.length} kota
        </Text>
      )}

      {hasil.map((kota) => (
        <WeatherCard
          key={kota.id}
          kota={kota.name}
          suhu={29} // Suhu statis sementara, bisa disesuaikan dengan data API cuaca nanti
          tingkatAQI="BAIK"
        />
      ))}
    </SafeAreaView>
  );
}
