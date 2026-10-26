import { Link, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import WeatherCard from "../../components/WeatherCard";
import { useAppTheme } from "../../context/ThemeContext";

function buatDataCuaca(kota: string) {
  const totalKarakter = kota
    .split("")
    .reduce((total, karakter) => total + karakter.charCodeAt(0), 0);
  const indeksAQI = 25 + (totalKarakter % 120);

  return {
    suhu: 24 + (totalKarakter % 12),
    tingkatAQI:
      indeksAQI <= 50
        ? "BAIK"
        : indeksAQI <= 100
          ? "SEDANG"
          : "TIDAK_SEHAT",
  } as const;
}

export default function HalamanDetail() {
  const { warna } = useAppTheme();
  const { kota, id, nama, lat, lon } = useLocalSearchParams<{
    kota: string;
    id?: string;
    nama?: string;
    lat?: string;
    lon?: string;
  }>();
  const namaKota = kota ?? "Kota tidak diketahui";
  const dataCuaca = buatDataCuaca(namaKota);
  const parameterFavoritLengkap = id && nama && lat && lon;

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        gap: 16,
        backgroundColor: warna.background,
      }}
    >
      <WeatherCard
        kota={namaKota}
        suhu={dataCuaca.suhu}
        tingkatAQI={dataCuaca.tingkatAQI}
      />
      {parameterFavoritLengkap && (
        <Link
          href={{
            pathname: "/tambah-favorit",
            params: { id, nama, lat, lon },
          }}
          accessibilityLabel={`Tambah ${namaKota} ke favorit`}
          style={{ color: warna.primary, fontWeight: "600" }}
        >
          Tambah Favorit
        </Link>
      )}
    </View>
  );
}
