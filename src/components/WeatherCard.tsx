import { View, Text } from "react-native";
import { WeatherCardProps } from "../../types/cuaca";

export default function WeatherCard({ kota, suhu, tingkatAQI }: WeatherCardProps) {
  const warnaAQI = {
    BAIK: "green",
    SEDANG: "orange",
    TIDAK_SEHAT: "red",
    BERBAHAYA: "darkred",
  }[tingkatAQI];

  return (
    <View style={{ padding: 16, borderRadius: 8, backgroundColor: "#F4F7FA" }}>
      <Text style={{ fontWeight: "bold", fontSize: 18 }}>{kota}</Text>
      <Text style={{ fontSize: 32 }}>{suhu}{"\u00b0"}C</Text>
      <Text style={{ color: warnaAQI }}>AQI: {tingkatAQI}</Text>
    </View>
  );
}
