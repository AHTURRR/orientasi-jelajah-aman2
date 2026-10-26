import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typeScale } from "../../constants/styles";
import { useAppTheme } from "../../context/ThemeContext";

export default function TabTentang() {
  const { warna } = useAppTheme();

  return (
    <SafeAreaView
      accessibilityLabel="Halaman Tentang Jelajah Aman"
      style={{
        flex: 1,
        backgroundColor: warna.background,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.sedang,
          gap: spacing.sedang,
        }}
      >
        <View
          style={{
            padding: 20,
            borderRadius: 12,
            backgroundColor: warna.surface,
            borderWidth: 1,
            borderColor: warna.border,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="shield-checkmark" size={28} color={warna.primary} />
            <Text
              style={{
                fontSize: typeScale.judul,
                fontWeight: "bold",
                color: warna.text,
              }}
            >
              Jelajah Aman
            </Text>
          </View>
          <Text
            style={{
              fontSize: typeScale.subjudul,
              color: warna.primary,
              fontWeight: "600",
            }}
          >
            Versi 1.0.0
          </Text>
          <Text
            style={{
              fontSize: typeScale.isi,
              color: warna.text,
            }}
          >
            Dibuat oleh Tim Jelajah Aman (Ahmad Turmudi - NIM 60324069)
          </Text>
          <Text
            style={{
              fontSize: typeScale.isi,
              color: warna.textSecondary,
              lineHeight: 20,
            }}
          >
            Aplikasi pemantau cuaca dan kualitas udara (AQI) berbasis lokasi
            dengan dukungan mode offline, riwayat pencarian, kota favorit, serta
            kustomisasi tema tampilan.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
