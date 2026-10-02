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
    const namaKota = teksTertunda.trim();

    if (!namaKota) {
      setHasil([]);
      setPesanError(null);
      setSedangMemuat(false);
      return;
    }

    let dibatalkan = false;

    async function ambilData() {
      setSedangMemuat(true);
      setPesanError(null);
      setHasil([]);

      try {
        const data = await cariKota(namaKota);
        if (!dibatalkan) {
          setHasil(data);
        }
      } catch {
        if (!dibatalkan) {
          setPesanError("Gagal mengambil data. Periksa koneksi internet Anda.");
        }
      } finally {
        if (!dibatalkan) {
          setSedangMemuat(false);
        }
      }
    }

    void ambilData();

    return () => {
      dibatalkan = true;
    };
  }, [teksTertunda]);

  async function cobaLagi() {
    const namaKota = teksTertunda.trim();

    if (!namaKota) {
      return;
    }

    setSedangMemuat(true);
    setPesanError(null);
    try {
      const data = await cariKota(namaKota);
      setHasil(data);
    } catch {
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
            accessibilityLabel={`Pesan error: ${pesanError}`}
            style={{ color: "red", textAlign: "center" }}
          >
            {pesanError}
          </Text>
          <Button title="Coba Lagi" onPress={cobaLagi} />
        </View>
      )}

      {!sedangMemuat &&
        !pesanError &&
        teksTertunda.trim().length > 0 &&
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
