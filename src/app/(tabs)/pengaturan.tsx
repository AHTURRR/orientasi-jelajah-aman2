import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Button,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ModeTema, useAppTheme } from "../../context/ThemeContext";
import { hapusSemuaCache } from "../../services/cacheRepository";

interface OpsiTema {
  nilai: ModeTema;
  label: string;
  deskripsi: string;
  ikon: keyof typeof Ionicons.glyphMap;
}

const PILIHAN_TEMA: OpsiTema[] = [
  {
    nilai: "light",
    label: "Terang",
    deskripsi: "Tampilan latar cerah dengan teks gelap",
    ikon: "sunny-outline",
  },
  {
    nilai: "dark",
    label: "Gelap",
    deskripsi: "Tampilan latar gelap yang nyaman di mata",
    ikon: "moon-outline",
  },
  {
    nilai: "system",
    label: "Ikuti Sistem",
    deskripsi: "Menyesuaikan pengaturan tema perangkat otomatis",
    ikon: "phone-portrait-outline",
  },
];

export default function TabPengaturan() {
  const { modeTema, skemaAktif, warna, ubahModeTema } = useAppTheme();
  const [pesan, setPesan] = useState<string | null>(null);

  async function eksekusiHapusSemuaCache() {
    try {
      await hapusSemuaCache();
      setPesan("Data cuaca tersimpan sudah dihapus.");
    } catch {
      setPesan("Data cuaca gagal dihapus. Silakan coba lagi.");
    }
  }

  function konfirmasiHapusSemuaCache() {
    const teksKonfirmasi =
      "Yakin ingin menghapus seluruh data cuaca yang tersimpan di perangkat?";
    if (Platform.OS === "web") {
      if (globalThis.confirm(teksKonfirmasi)) {
        void eksekusiHapusSemuaCache();
      }
      return;
    }

    Alert.alert("Konfirmasi Hapus Cache", teksKonfirmasi, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus Semua",
        style: "destructive",
        onPress: () => void eksekusiHapusSemuaCache(),
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: warna.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Kartu Tema Aplikasi */}
        <View
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: warna.surface,
            borderWidth: 1,
            borderColor: warna.border,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons
              name="color-palette-outline"
              size={20}
              color={warna.primary}
            />
            <Text
              style={{ fontSize: 17, fontWeight: "bold", color: warna.text }}
            >
              Tema Tampilan Aplikasi
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: warna.textSecondary }}>
            Mode aktif saat ini:{" "}
            <Text style={{ fontWeight: "bold", color: warna.text }}>
              {skemaAktif === "dark" ? "Gelap (Dark)" : "Terang (Light)"}
            </Text>
          </Text>

          <View style={{ gap: 8 }}>
            {PILIHAN_TEMA.map((opsi) => {
              const terpilih = modeTema === opsi.nilai;
              return (
                <TouchableOpacity
                  key={opsi.nilai}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: terpilih }}
                  accessibilityLabel={`Pilih tema ${opsi.label}`}
                  onPress={() => void ubahModeTema(opsi.nilai)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: terpilih ? warna.card : warna.background,
                    borderWidth: terpilih ? 2 : 1,
                    borderColor: terpilih ? warna.primary : warna.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      flex: 1,
                    }}
                  >
                    <Ionicons
                      name={opsi.ikon}
                      size={22}
                      color={terpilih ? warna.primary : warna.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: terpilih ? "bold" : "600",
                          color: warna.text,
                        }}
                      >
                        {opsi.label}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: warna.textSecondary }}
                      >
                        {opsi.deskripsi}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={terpilih ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={terpilih ? warna.primary : warna.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Kartu Manajemen Penyimpanan Cache */}
        <View
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: warna.surface,
            borderWidth: 1,
            borderColor: warna.border,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="server-outline" size={20} color={warna.primary} />
            <Text
              style={{ fontSize: 17, fontWeight: "bold", color: warna.text }}
            >
              Penyimpanan & Cache Offline
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: warna.textSecondary }}>
            Jelajah Aman Versi 1.0.0
          </Text>
          <Button
            title="Hapus Data Cuaca Tersimpan"
            color={warna.danger}
            onPress={konfirmasiHapusSemuaCache}
          />
          {pesan && (
            <Text
              accessibilityLabel={pesan}
              style={{ color: warna.primary, fontSize: 13, fontWeight: "600" }}
            >
              {pesan}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
