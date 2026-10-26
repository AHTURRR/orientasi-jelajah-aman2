import { Text, View } from "react-native";
import { TingkatAQI, WeatherCardProps } from "../../types/cuaca";
import { spacing, typeScale } from "../constants/styles";
import { useAppTheme } from "../context/ThemeContext";

const warnaPerTingkatTerang: Record<TingkatAQI, string> = {
  BAIK: "#15803D",
  SEDANG: "#B45309",
  TIDAK_SEHAT: "#C2410C",
  BERBAHAYA: "#B91C1C",
};

const warnaPerTingkatGelap: Record<TingkatAQI, string> = {
  BAIK: "#4ADE80",
  SEDANG: "#FBBF24",
  TIDAK_SEHAT: "#FB923C",
  BERBAHAYA: "#F87171",
};

export default function WeatherCard({
  kota,
  suhu,
  tingkatAQI,
  indeksAQI,
}: WeatherCardProps) {
  const { warna, skemaAktif } = useAppTheme();
  const warnaAQI =
    skemaAktif === "dark"
      ? warnaPerTingkatGelap[tingkatAQI]
      : warnaPerTingkatTerang[tingkatAQI];

  const teksAQI =
    indeksAQI === undefined
      ? `AQI: ${tingkatAQI}`
      : `AQI: ${indeksAQI} (${tingkatAQI})`;
  const labelAksesibilitas =
    indeksAQI === undefined
      ? `Cuaca ${kota}, suhu ${suhu} derajat, kualitas udara ${tingkatAQI}`
      : `Cuaca ${kota}, suhu ${suhu} derajat, indeks kualitas udara ${indeksAQI}, kategori ${tingkatAQI}`;

  return (
    <View
      accessible
      accessibilityLabel={labelAksesibilitas}
      style={{
        padding: spacing.sedang,
        borderRadius: 12,
        backgroundColor: warna.card,
        borderWidth: 1,
        borderColor: warna.border,
        gap: 4,
      }}
    >
      <Text
        style={{
          fontWeight: "bold",
          fontSize: typeScale.judul,
          color: warna.text,
        }}
      >
        {kota}
      </Text>
      <Text
        style={{
          fontSize: 32,
          fontWeight: "bold",
          color: warna.primary,
        }}
      >
        {suhu}
        {"\u00b0"}C
      </Text>
      <Text
        style={{
          color: warnaAQI,
          fontSize: typeScale.isi,
          fontWeight: "600",
        }}
      >
        {teksAQI}
      </Text>
    </View>
  );
}
