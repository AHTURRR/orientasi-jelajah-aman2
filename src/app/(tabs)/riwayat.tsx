import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RingkasanKotaTersimpan } from "../../../types/cache";
import { KotaFavorit } from "../../../types/favorit";
import { ItemRiwayatPencarian } from "../../../types/riwayat";
import { useAppTheme } from "../../context/ThemeContext";
import {
  buatKunci,
  daftarKotaTersimpan,
  hapusCacheKota,
} from "../../services/cacheRepository";
import { ambilSemuaFavorit, hapusFavorit } from "../../services/favoritStorage";
import {
  ambilSemuaRiwayat,
  hapusSatuRiwayat,
  hapusSemuaRiwayat,
  MAKS_RIWAYAT,
  setKotaTargetNavigasi,
} from "../../services/riwayatStorage";

export default function TabRiwayat() {
  const { warna } = useAppTheme();
  const [daftarRiwayat, setDaftarRiwayat] = useState<ItemRiwayatPencarian[]>(
    [],
  );
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);
  const [daftarCache, setDaftarCache] = useState<RingkasanKotaTersimpan[]>([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);

  const muatSemuaData = useCallback(async () => {
    try {
      const [riwayat, favorit, cache] = await Promise.all([
        ambilSemuaRiwayat(),
        ambilSemuaFavorit(),
        daftarKotaTersimpan(),
      ]);
      setDaftarRiwayat(riwayat);
      setDaftarFavorit(favorit);
      setDaftarCache(cache);
    } catch {
      Alert.alert(
        "Gagal memuat data",
        "Data riwayat atau favorit tidak dapat dibaca. Silakan coba lagi.",
      );
    } finally {
      setSedangMemuat(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setSedangMemuat(true);
      void muatSemuaData();
    }, [muatSemuaData]),
  );

  function bukaKotaDiBeranda(kota: {
    id: number;
    nama: string;
    admin1?: string;
    country?: string;
    latitude: number;
    longitude: number;
  }) {
    setKotaTargetNavigasi(kota);
    router.navigate("/");
  }

  function cariCacheUntukKoordinat(
    latitude: number,
    longitude: number,
  ): RingkasanKotaTersimpan | undefined {
    const kunci = buatKunci(latitude, longitude);
    return daftarCache.find((c) => c.kunci === kunci);
  }

  async function eksekusiHapusCache(kunci: string) {
    try {
      await hapusCacheKota(kunci);
      setDaftarCache((prev) => prev.filter((c) => c.kunci !== kunci));
    } catch {
      Alert.alert(
        "Gagal menghapus cache",
        "Data cache kota belum berhasil dihapus. Silakan coba lagi.",
      );
    }
  }

  function konfirmasiHapusCache(namaKota: string, kunci: string) {
    const pesan = `Yakin ingin menghapus data cache offline untuk ${namaKota}?`;
    if (Platform.OS === "web") {
      if (globalThis.confirm(pesan)) {
        void eksekusiHapusCache(kunci);
      }
      return;
    }

    Alert.alert("Konfirmasi Hapus Cache", pesan, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus Cache",
        style: "destructive",
        onPress: () => void eksekusiHapusCache(kunci),
      },
    ]);
  }

  async function eksekusiHapusRiwayat(item: ItemRiwayatPencarian) {
    try {
      const terbaru = await hapusSatuRiwayat(
        item.id,
        item.latitude,
        item.longitude,
      );
      setDaftarRiwayat(terbaru);
    } catch {
      Alert.alert("Gagal", "Item riwayat gagal dihapus.");
    }
  }

  async function eksekusiBersihkanRiwayat() {
    try {
      await hapusSemuaRiwayat();
      setDaftarRiwayat([]);
    } catch {
      Alert.alert("Gagal", "Riwayat pencarian gagal dibersihkan.");
    }
  }

  function konfirmasiBersihkanRiwayat() {
    const pesan = "Yakin ingin menghapus seluruh riwayat pencarian terakhir?";
    if (Platform.OS === "web") {
      if (globalThis.confirm(pesan)) {
        void eksekusiBersihkanRiwayat();
      }
      return;
    }

    Alert.alert("Bersihkan Riwayat", pesan, [
      { text: "Batal", style: "cancel" },
      {
        text: "Bersihkan",
        style: "destructive",
        onPress: () => void eksekusiBersihkanRiwayat(),
      },
    ]);
  }

  async function hapusKotaFavorit(id: number) {
    try {
      await hapusFavorit(id);
      setDaftarFavorit((prev) => prev.filter((k) => k.id !== id));
    } catch {
      Alert.alert(
        "Gagal menghapus favorit",
        "Kota belum berhasil dihapus. Silakan coba lagi.",
      );
    }
  }

  function konfirmasiHapusFavorit(kota: KotaFavorit) {
    const pesan = `Yakin hapus ${kota.nama} dari daftar favorit?`;
    if (Platform.OS === "web") {
      if (globalThis.confirm(pesan)) {
        void hapusKotaFavorit(kota.id);
      }
      return;
    }

    Alert.alert("Konfirmasi Hapus", pesan, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => void hapusKotaFavorit(kota.id),
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: warna.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Bagian 1: Riwayat Pencarian Terakhir */}
        <View
          style={{
            padding: 14,
            borderRadius: 12,
            backgroundColor: warna.surface,
            borderWidth: 1,
            borderColor: warna.border,
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="time-outline" size={20} color={warna.primary} />
              <Text
                style={{ fontSize: 17, fontWeight: "bold", color: warna.text }}
              >
                Riwayat Pencarian Terakhir
              </Text>
            </View>
            {daftarRiwayat.length > 0 && (
              <TouchableOpacity
                onPress={konfirmasiBersihkanRiwayat}
                accessibilityRole="button"
                accessibilityLabel="Bersihkan semua riwayat pencarian"
              >
                <Text
                  style={{
                    color: warna.danger,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Bersihkan
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={{ fontSize: 13, color: warna.textSecondary }}>
            Menampilkan {daftarRiwayat.length} dari maksimal {MAKS_RIWAYAT}{" "}
            pencarian kota terakhir (ketuk kota untuk melihat cuaca).
          </Text>

          {sedangMemuat && (
            <Text style={{ color: warna.textSecondary }}>
              Memuat riwayat...
            </Text>
          )}

          {!sedangMemuat && daftarRiwayat.length === 0 && (
            <Text style={{ color: warna.textSecondary, fontStyle: "italic" }}>
              Belum ada riwayat pencarian kota.
            </Text>
          )}

          {daftarRiwayat.map((item) => {
            const infoCache = cariCacheUntukKoordinat(
              item.latitude,
              item.longitude,
            );
            const kunciKota = buatKunci(item.latitude, item.longitude);

            return (
              <View
                key={`${item.id}-${kunciKota}`}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: warna.card,
                  borderWidth: 1,
                  borderColor: warna.border,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Tampilkan cuaca untuk ${item.nama}`}
                    onPress={() =>
                      bukaKotaDiBeranda({
                        id: item.id,
                        nama: item.nama,
                        admin1: item.admin1,
                        country: item.country,
                        latitude: item.latitude,
                        longitude: item.longitude,
                      })
                    }
                  >
                    <Ionicons
                      name="search-outline"
                      size={18}
                      color={warna.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: warna.text,
                        }}
                      >
                        {item.nama}
                        {item.admin1 ? `, ${item.admin1}` : ""}
                      </Text>
                      <Text style={{ fontSize: 12, color: warna.textSecondary }}>
                        {infoCache && infoCache.suhuTerakhir !== undefined
                          ? `Cache tersedia: ${infoCache.suhuTerakhir}\u00b0C`
                          : "Ketuk untuk memuat cuaca kota ini"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                  >
                    {infoCache && (
                      <TouchableOpacity
                        onPress={() =>
                          konfirmasiHapusCache(item.nama, infoCache.kunci)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Hapus cache kota ${item.nama}`}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          borderRadius: 6,
                          backgroundColor: warna.danger,
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color="#FFFFFF"
                        />
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          Hapus Cache
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => void eksekusiHapusRiwayat(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Hapus ${item.nama} dari riwayat pencarian`}
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: warna.border,
                      }}
                    >
                      <Ionicons
                        name="close"
                        size={16}
                        color={warna.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bagian 2: Cache Kota Tersimpan (Offline) */}
        <View
          style={{
            padding: 14,
            borderRadius: 12,
            backgroundColor: warna.surface,
            borderWidth: 1,
            borderColor: warna.border,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons
              name="cloud-offline-outline"
              size={20}
              color={warna.primary}
            />
            <Text
              style={{ fontSize: 17, fontWeight: "bold", color: warna.text }}
            >
              Cache Kota Tersimpan (Mode Offline)
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: warna.textSecondary }}>
            Tersimpan {daftarCache.length} cache cuaca kota di perangkat.
          </Text>

          {!sedangMemuat && daftarCache.length === 0 && (
            <Text style={{ color: warna.textSecondary, fontStyle: "italic" }}>
              Belum ada cache cuaca kota yang tersimpan.
            </Text>
          )}

          {daftarCache.map((cacheItem) => (
            <View
              key={cacheItem.kunci}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 12,
                borderRadius: 10,
                backgroundColor: warna.card,
                borderWidth: 1,
                borderColor: warna.border,
              }}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                accessibilityRole="button"
                accessibilityLabel={`Buka cache cuaca ${cacheItem.nama}`}
                onPress={() =>
                  bukaKotaDiBeranda({
                    id: cacheItem.id,
                    nama: cacheItem.nama,
                    latitude: cacheItem.latitude,
                    longitude: cacheItem.longitude,
                  })
                }
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: warna.text,
                  }}
                >
                  {cacheItem.nama}
                </Text>
                <Text style={{ fontSize: 12, color: warna.textSecondary }}>
                  {cacheItem.suhuTerakhir !== undefined
                    ? `Suhu tersimpan: ${cacheItem.suhuTerakhir}\u00b0C`
                    : "Data cuaca tersimpan"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  konfirmasiHapusCache(cacheItem.nama, cacheItem.kunci)
                }
                accessibilityRole="button"
                accessibilityLabel={`Hapus cache ${cacheItem.nama}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: warna.danger,
                }}
              >
                <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                <Text
                  style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}
                >
                  Hapus Cache
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Bagian 3: Kota Favorit */}
        <View
          style={{
            padding: 14,
            borderRadius: 12,
            backgroundColor: warna.surface,
            borderWidth: 1,
            borderColor: warna.border,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="heart-outline" size={20} color={warna.primary} />
            <Text
              style={{ fontSize: 17, fontWeight: "bold", color: warna.text }}
            >
              Kota Favorit
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: warna.textSecondary }}>
            Tersimpan {daftarFavorit.length} kota
          </Text>

          {sedangMemuat && (
            <Text style={{ color: warna.textSecondary }}>
              Memuat favorit...
            </Text>
          )}
          {!sedangMemuat && daftarFavorit.length === 0 && (
            <Text style={{ color: warna.textSecondary, fontStyle: "italic" }}>
              Belum ada kota favorit
            </Text>
          )}

          {daftarFavorit.map((kota) => (
            <View
              key={kota.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 12,
                borderRadius: 10,
                backgroundColor: warna.card,
                borderWidth: 1,
                borderColor: warna.border,
              }}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                accessibilityRole="button"
                accessibilityLabel={`Lihat cuaca favorit ${kota.nama}`}
                onPress={() => bukaKotaDiBeranda(kota)}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: warna.text,
                  }}
                >
                  {kota.nama}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => konfirmasiHapusFavorit(kota)}
                accessibilityRole="button"
                accessibilityLabel={`Hapus favorit ${kota.nama}`}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: warna.danger,
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}
                >
                  Hapus
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
