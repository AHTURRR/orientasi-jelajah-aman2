import { Text, View } from "react-native";
import { TingkatAQI, WeatherCardProps } from "../../types/cuaca";
import { spacing, typeScale } from "../constants/styles";

const warnaPerTingkat: Record<TingkatAQI, string> = {
  BAIK: "green",
  SEDANG: "goldenrod",
  TIDAK_SEHAT: "orange",
  BERBAHAYA: "crimson",
};

export default function WeatherCard({
  kota,
  suhu,
  tingkatAQI,
  indeksAQI,
}: WeatherCardProps) {
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
        borderRadius: 8,
        backgroundColor: "#F4F7FA",
      }}
    >
      <Text style={{ fontWeight: "bold", fontSize: typeScale.judul }}>
        {kota}
      </Text>
      <Text style={{ fontSize: typeScale.subjudul }}>
        {suhu}
        {"\u00b0"}C
      </Text>
      <Text style={{ color: warnaPerTingkat[tingkatAQI], fontSize: typeScale.isi }}>
        {teksAQI}
      </Text>
    </View>
  );
}
