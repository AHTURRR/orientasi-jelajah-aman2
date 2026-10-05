import { Linking, Text, TouchableOpacity } from "react-native";

export default function AtribusiCuaca() {
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL("https://open-meteo.com/")}
      accessibilityRole="link"
      accessibilityLabel="Buka atribusi data Open-Meteo"
    >
      <Text style={{ fontSize: 11, color: "#888", textAlign: "center" }}>
        Data cuaca disediakan oleh Open-Meteo.com
      </Text>
    </TouchableOpacity>
  );
}
