import { Linking, Text, TouchableOpacity } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function AtribusiCuaca() {
  const { warna } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={() => Linking.openURL("https://open-meteo.com/")}
      accessibilityRole="link"
      accessibilityLabel="Buka atribusi data Open-Meteo"
      style={{ paddingVertical: 8 }}
    >
      <Text
        style={{
          fontSize: 11,
          color: warna.textSecondary,
          textAlign: "center",
        }}
      >
        Data cuaca disediakan oleh Open-Meteo.com
      </Text>
    </TouchableOpacity>
  );
}
