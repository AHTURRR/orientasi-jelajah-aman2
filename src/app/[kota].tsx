import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import WeatherCard from "../components/WeatherCard";
import { useAppTheme } from "../context/ThemeContext";

export default function HalamanDetail() {
  const { warna } = useAppTheme();
  const { kota } = useLocalSearchParams<{ kota: string }>();
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: warna.background,
      }}
    >
      <WeatherCard
        kota={kota ?? "Kota tidak diketahui"}
        suhu={29}
        tingkatAQI="BAIK"
      />
    </View>
  );
}
