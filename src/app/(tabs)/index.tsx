import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  HasilCuacaOffline,
  RingkasanKotaTersimpan,
} from "../../../types/cache";
import { KotaFavorit } from "../../../types/favorit";
import { HasilGeocoding } from "../../../types/geocoding";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import SearchBox from "../../components/SearchBox";
import StatusData from "../../components/StatusData";
import WeatherCard from "../../components/WeatherCard";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { useAppTheme } from "../../context/ThemeContext";
import { useDebounce } from "../../hooks/use-debounce";
import {
  bersihkanCacheLama,
  buatKunci,
  daftarKotaTersimpan,
  hapusCacheKota,
} from "../../services/cacheRepository";
import {
  ambilCuacaOfflineFirst,
  BATAS_CACHE_MS,
} from "../../services/cuacaRepository";
import { ambilSemuaFavorit } from "../../services/favoritStorage";
import { cariKota } from "../../services/geocodingService";
import {
  ambilKoordinatSaatIni,
  mintaIzinLokasi,
} from "../../services/locationService";
import {
  ambilDanBersihkanKotaTargetNavigasi,
  catatRiwayatPencarian,
} from "../../services/riwayatStorage";
import { konversiTingkatAQI } from "../../services/weatherAdapter";

export default function HalamanUtama() {
  const { warna } = useAppTheme();

  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);
  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [sedangMencariKota, setSedangMencariKota] = useState(false);
  const [pencarianAktif, setPencarianAktif] = useState(false);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [hasil, setHasil] = useState<HasilCuacaOffline | null>(null);
  const [kotaTersimpan, setKotaTersimpan] = useState<RingkasanKotaTersimpan[]>(
    [],
  );
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);
  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0);
  const inputDariPenggunaRef = useRef(false);

  const sudahFavorit =
    kotaTerpilih !== null &&
    daftarFavorit.some((kota) => kota.id === kotaTerpilih.id);

  const muatKotaTersimpan = useCallback(async () => {
    try {
      const daftar = await daftarKotaTersimpan();
      setKotaTersimpan(daftar);
      return daftar;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    bersihkanCacheLama(BATAS_CACHE_MS)
      .then(() => daftarKotaTersimpan())
      .then(setKotaTersimpan)
      .catch(() => {});
  }, []);

  const pilihKota = useCallback(
    async (
      kota: HasilGeocoding,
      paksaPerbarui = false,
      simpanKeRiwayat = true,
    ) => {
      inputDariPenggunaRef.current = false;
      setPencarianAktif(false);
      setHasilPencarian([]);
      setSedangMencariKota(false);
      setKotaTerpilih(kota);
      const idSaatIni = ++requestIdRef.current;
      setSedangMemuat(true);
      setPesanError(null);

      if (simpanKeRiwayat && kota.id >= 0) {
        catatRiwayatPencarian({
          id: kota.id,
          nama: kota.name,
          admin1: kota.admin1,
          country: kota.country,
          latitude: kota.latitude,
          longitude: kota.longitude,
        }).catch(() => {});
      }

      try {
        const data = await ambilCuacaOfflineFirst(
          {
            id: kota.id,
            nama: kota.name,
            latitude: kota.latitude,
            longitude: kota.longitude,
          },
          { paksaPerbarui },
        );
        if (idSaatIni !== requestIdRef.current) return;
        setHasil(data);
        await muatKotaTersimpan();
      } catch {
        if (idSaatIni !== requestIdRef.current) return;
        setHasil(null);
        setPesanError(
          "Belum ada data tersimpan dan tidak ada koneksi internet. Sambungkan internet lalu coba lagi.",
        );
      } finally {
        if (idSaatIni === requestIdRef.current) setSedangMemuat(false);
      }
    },
    [muatKotaTersimpan],
  );

  useFocusEffect(
    useCallback(() => {
      ambilSemuaFavorit()
        .then(setDaftarFavorit)
        .catch(() => {});

      const targetDariRiwayat = ambilDanBersihkanKotaTargetNavigasi();
      if (targetDariRiwayat) {
        void Promise.resolve().then(() => {
          inputDariPenggunaRef.current = false;
          setTeksCari(targetDariRiwayat.nama);
          void pilihKota(
            {
              id: targetDariRiwayat.id,
              name: targetDariRiwayat.nama,
              admin1: targetDariRiwayat.admin1,
              country: targetDariRiwayat.country ?? "",
              latitude: targetDariRiwayat.latitude,
              longitude: targetDariRiwayat.longitude,
            },
            false,
            true,
          );
        });
        return;
      }

      daftarKotaTersimpan()
        .then((daftar) => {
          setKotaTersimpan(daftar);
          // Jika cache untuk kota yang sedang tampil telah dihapus dari tab Riwayat/Pengaturan, sinkronkan tampilan
          setKotaTerpilih((kotaSaatIni) => {
            if (!kotaSaatIni) return null;
            const kunciSaatIni = buatKunci(
              kotaSaatIni.latitude,
              kotaSaatIni.longitude,
            );
            const masihAdaDiCache = daftar.some(
              (c) => c.kunci === kunciSaatIni,
            );
            if (!masihAdaDiCache) {
              setHasil(null);
              setPesanError(null);
              return null;
            }
            return kotaSaatIni;
          });
        })
        .catch(() => {});
    }, [pilihKota]),
  );

  useEffect(() => {
    if (!inputDariPenggunaRef.current || teksTertunda.trim().length === 0) {
      return;
    }
    let aktif = true;
    cariKota(teksTertunda)
      .then((res) => {
        if (aktif && inputDariPenggunaRef.current) {
          setHasilPencarian(res);
          setSedangMencariKota(false);
        }
      })
      .catch(() => {
        if (aktif) {
          setHasilPencarian([]);
          setSedangMencariKota(false);
        }
      });
    return () => {
      aktif = false;
    };
  }, [teksTertunda]);

  async function gunakanLokasiSaatIni() {
    try {
      const status = await mintaIzinLokasi();
      if (status === "denied") {
        setPesanLokasi(
          "Izin lokasi ditolak. Silakan cari kota secara manual di atas.",
        );
        return;
      }
      if (status === "unavailable") {
        setPesanLokasi(
          "Layanan lokasi tidak aktif di perangkat ini. Silakan cari kota secara manual.",
        );
        return;
      }
      setPesanLokasi(null);
      const koordinat = await ambilKoordinatSaatIni();
      await pilihKota(
        {
          id: -1,
          name: "Lokasi Saat Ini",
          latitude: koordinat.latitude,
          longitude: koordinat.longitude,
          country: "",
        },
        false,
        false,
      );
    } catch {
      setPesanLokasi(
        "Lokasi tidak dapat diambil. Silakan cari kota secara manual di atas.",
      );
    }
  }

  async function eksekusiHapusCache(item: RingkasanKotaTersimpan) {
    try {
      await hapusCacheKota(item.kunci);
      await muatKotaTersimpan();
      if (
        kotaTerpilih &&
        buatKunci(kotaTerpilih.latitude, kotaTerpilih.longitude) === item.kunci
      ) {
        setHasil(null);
        setKotaTerpilih(null);
      }
    } catch {
      Alert.alert("Gagal", "Cache kota gagal dihapus. Silakan coba lagi.");
    }
  }

  function konfirmasiHapusCache(item: RingkasanKotaTersimpan) {
    const pesanKonfirmasi = `Hapus data cache cuaca untuk ${item.nama} dari perangkat?`;
    if (Platform.OS === "web") {
      if (globalThis.confirm(pesanKonfirmasi)) {
        void eksekusiHapusCache(item);
      }
      return;
    }

    Alert.alert("Konfirmasi Hapus Cache", pesanKonfirmasi, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => void eksekusiHapusCache(item),
      },
    ]);
  }

  const tampilTidakDitemukan =
    pencarianAktif &&
    !sedangMemuat &&
    !sedangMencariKota &&
    !pesanError &&
    teksTertunda.trim().length > 0 &&
    hasilPencarian.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: warna.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <SearchBox
          nilai={teksCari}
          onCari={(nilai) => {
            const adaTeks = nilai.trim().length > 0;
            inputDariPenggunaRef.current = adaTeks;
            setPencarianAktif(adaTeks);
            setTeksCari(nilai);
            if (!adaTeks) {
              setPesanError(null);
              setHasilPencarian([]);
              setSedangMencariKota(false);
            } else {
              setSedangMencariKota(true);
            }
          }}
        />
        <Button
          title="Gunakan Lokasi Saat Ini"
          color={warna.primary}
          onPress={gunakanLokasiSaatIni}
        />
        {pesanLokasi && (
          <Text
            accessibilityLabel={pesanLokasi}
            style={{ color: warna.danger, fontSize: 13 }}
          >
            {pesanLokasi}
          </Text>
        )}

        {hasilPencarian.length > 0 && (
          <View
            style={{
              backgroundColor: warna.surface,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: warna.border,
              overflow: "hidden",
            }}
          >
            {hasilPencarian.map((kota, idx) => (
              <TouchableOpacity
                key={kota.id}
                onPress={() => pilihKota(kota)}
                accessibilityRole="button"
                accessibilityLabel={`Lihat cuaca ${kota.name}`}
                style={{
                  padding: 12,
                  borderBottomWidth: idx < hasilPencarian.length - 1 ? 1 : 0,
                  borderBottomColor: warna.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={warna.primary}
                  />
                  <Text style={{ color: warna.text, fontSize: 15 }}>
                    {kota.name}
                    {kota.admin1 ? `, ${kota.admin1}` : ""}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={warna.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {kotaTersimpan.length > 0 && (
          <View
            style={{
              gap: 8,
              padding: 12,
              borderRadius: 10,
              backgroundColor: warna.surface,
              borderWidth: 1,
              borderColor: warna.border,
            }}
          >
            <Text
              style={{ fontWeight: "bold", color: warna.text, fontSize: 15 }}
            >
              Tersimpan di perangkat (bisa dibuka offline)
            </Text>
            {kotaTersimpan.map((kota) => (
              <View
                key={kota.kunci}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: warna.card,
                  borderWidth: 1,
                  borderColor: warna.border,
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
                  accessibilityLabel={`Buka data tersimpan ${kota.nama}`}
                  onPress={() =>
                    pilihKota({
                      id: kota.id,
                      name: kota.nama,
                      latitude: kota.latitude,
                      longitude: kota.longitude,
                      country: "",
                    })
                  }
                >
                  <Ionicons
                    name="cloud-done-outline"
                    size={18}
                    color={warna.primary}
                  />
                  <View>
                    <Text style={{ color: warna.text, fontWeight: "600" }}>
                      {kota.nama}
                    </Text>
                    {kota.suhuTerakhir !== undefined && (
                      <Text
                        style={{ color: warna.textSecondary, fontSize: 12 }}
                      >
                        Suhu tersimpan: {kota.suhuTerakhir}
                        {"\u00b0"}C
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => konfirmasiHapusCache(kota)}
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus cache ${kota.nama}`}
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
                    style={{
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    Hapus Cache
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {sedangMemuat && (
          <ActivityIndicator size="large" color={warna.primary} />
        )}
        {pesanError && (
          <View
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: warna.surface,
              borderWidth: 1,
              borderColor: warna.danger,
              gap: 10,
            }}
          >
            <Text
              accessibilityLabel={pesanError}
              style={{ color: warna.danger, fontSize: 14 }}
            >
              {pesanError}
            </Text>
            <Button
              title="Coba Lagi"
              color={warna.primary}
              onPress={() => kotaTerpilih && pilihKota(kotaTerpilih, true)}
            />
          </View>
        )}

        {tampilTidakDitemukan && (
          <Text style={{ color: warna.textSecondary }}>
            Kota tidak ditemukan
          </Text>
        )}

        {hasil && kotaTerpilih && !sedangMemuat && (
          <View style={{ gap: 12 }}>
            <StatusData
              sumber={hasil.sumber}
              disimpanPada={hasil.disimpanPada}
            />
            <WeatherCard
              kota={kotaTerpilih.name}
              suhu={hasil.cuaca.saatIni.suhu}
              tingkatAQI={konversiTingkatAQI(hasil.kualitasUdara.indeksAQI)}
              indeksAQI={hasil.kualitasUdara.indeksAQI}
            />
            <Text style={{ color: warna.text, fontSize: 14 }}>
              Kondisi: {labelKodeCuaca(hasil.cuaca.saatIni.kodeCuaca)} {"\u2022"}{" "}
              Angin {hasil.cuaca.saatIni.kecepatanAngin} km/j
            </Text>
            <Text style={{ color: warna.text, fontSize: 14 }}>
              Hari ini: min {hasil.cuaca.harian.suhuMinimal[0]}
              {"\u00b0"}C, maks {hasil.cuaca.harian.suhuMaksimal[0]}
              {"\u00b0"}C
            </Text>
            <Text style={{ fontSize: 12, color: warna.textSecondary }}>
              PM2.5: {hasil.kualitasUdara.pm25} {"\u00b5"}g/m{"\u00b3"} | PM10:{" "}
              {hasil.kualitasUdara.pm10} {"\u00b5"}g/m{"\u00b3"}
            </Text>
            <Button
              title="Perbarui Sekarang"
              color={warna.primary}
              onPress={() => pilihKota(kotaTerpilih, true)}
            />
            {kotaTerpilih.id >= 0 && (
              <Button
                title={
                  sudahFavorit ? "Sudah di Favorit" : "Tambahkan ke Favorit"
                }
                color={warna.primary}
                disabled={sudahFavorit}
                onPress={() =>
                  router.push({
                    pathname: "/tambah-favorit",
                    params: {
                      id: String(kotaTerpilih.id),
                      nama: kotaTerpilih.name,
                      lat: String(kotaTerpilih.latitude),
                      lon: String(kotaTerpilih.longitude),
                    },
                  })
                }
              />
            )}
          </View>
        )}

        <AtribusiCuaca />
      </ScrollView>
    </SafeAreaView>
  );
}
