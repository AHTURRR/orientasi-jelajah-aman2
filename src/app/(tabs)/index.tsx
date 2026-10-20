import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HasilGeocoding } from "../../../types/geocoding";
import { HasilCuacaOffline, RingkasanKotaTersimpan } from "../../../types/cache";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import SearchBox from "../../components/SearchBox";
import StatusData from "../../components/StatusData";
import WeatherCard from "../../components/WeatherCard";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { useDebounce } from "../../hooks/use-debounce";
import { ambilSemuaFavorit } from "../../services/favoritStorage";
import { cariKota } from "../../services/geocodingService";
import {
  ambilKoordinatSaatIni,
  mintaIzinLokasi,
} from "../../services/locationService";
import {
  daftarKotaTersimpan,
  bersihkanCacheLama,
} from "../../services/cacheRepository";
import {
  BATAS_CACHE_MS,
  ambilCuacaOfflineFirst,
} from "../../services/cuacaRepository";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { KotaFavorit } from "../../../types/favorit";

export default function HalamanUtama() {
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);
  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
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
  const sudahFavorit =
    kotaTerpilih !== null &&
    daftarFavorit.some((kota) => kota.id === kotaTerpilih.id);

  async function muatKotaTersimpan() {
    try {
      setKotaTersimpan(await daftarKotaTersimpan());
    } catch (err) {
      console.warn("Gagal memuat daftar cache SQLite.", err);
    }
  }

  useEffect(() => {
    bersihkanCacheLama(BATAS_CACHE_MS)
      .catch((err) => console.warn("Gagal memuat cache SQLite.", err));
    void Promise.resolve().then(muatKotaTersimpan);
  }, []);

  useEffect(() => {
    if (teksTertunda.trim().length === 0) {
      return;
    }
    cariKota(teksTertunda)
      .then(setHasilPencarian)
      .catch(() => setHasilPencarian([]));
  }, [teksTertunda]);

  useEffect(() => {
    ambilSemuaFavorit()
      .then(setDaftarFavorit)
      .catch((err) => console.warn("Gagal memuat daftar favorit.", err));
  }, []);

  async function pilihKota(kota: HasilGeocoding, paksaPerbarui = false) {
    setKotaTerpilih(kota);
    const idSaatIni = ++requestIdRef.current;
    setSedangMemuat(true);
    setPesanError(null);

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
  }

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
      await pilihKota({
        id: -1,
        name: "Lokasi Saat Ini",
        latitude: koordinat.latitude,
        longitude: koordinat.longitude,
        country: "",
      });
    } catch {
      setPesanLokasi(
        "Lokasi tidak dapat diambil. Silakan cari kota secara manual di atas.",
      );
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <SearchBox
          onCari={(nilai) => {
            setTeksCari(nilai);
            if (nilai.trim().length === 0) setPesanError(null);
          }}
        />
        <Button title="Gunakan Lokasi Saat Ini" onPress={gunakanLokasiSaatIni} />
        {pesanLokasi && <Text accessibilityLabel={pesanLokasi}>{pesanLokasi}</Text>}

        {teksTertunda.trim().length > 0 &&
          hasilPencarian.map((kota) => (
            <TouchableOpacity
              key={kota.id}
              onPress={() => pilihKota(kota)}
              accessibilityRole="button"
              accessibilityLabel={`Lihat cuaca ${kota.name}`}
            >
              <Text>
                {kota.name}
                {kota.admin1 ? `, ${kota.admin1}` : ""}
              </Text>
            </TouchableOpacity>
          ))}

        {kotaTersimpan.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "bold" }}>
              Tersimpan di perangkat (bisa dibuka offline)
            </Text>
            {kotaTersimpan.map((kota) => (
              <TouchableOpacity
                key={kota.kunci}
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
                <Text>{kota.nama}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {sedangMemuat && <ActivityIndicator />}
        {pesanError && (
          <View>
            <Text accessibilityLabel={pesanError}>{pesanError}</Text>
            <Button
              title="Coba Lagi"
              onPress={() => kotaTerpilih && pilihKota(kotaTerpilih, true)}
            />
          </View>
        )}

        {!sedangMemuat &&
          !pesanError &&
          teksTertunda.trim().length > 0 &&
          hasilPencarian.length === 0 && <Text>Kota tidak ditemukan</Text>}

        {hasil && kotaTerpilih && !sedangMemuat && (
          <>
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
            <Text>
              Kondisi: {labelKodeCuaca(hasil.cuaca.saatIni.kodeCuaca)} - Angin{" "}
              {hasil.cuaca.saatIni.kecepatanAngin} km/j
            </Text>
            <Text>
              Hari ini: min {hasil.cuaca.harian.suhuMinimal[0]}{"\u00b0"}C, maks{" "}
              {hasil.cuaca.harian.suhuMaksimal[0]}{"\u00b0"}C
            </Text>
            <Text style={{ fontSize: 12, color: "#666" }}>
              PM2.5: {hasil.kualitasUdara.pm25} {"\u00b5"}g/m{"\u00b3"} | PM10:{" "}
              {hasil.kualitasUdara.pm10} {"\u00b5"}g/m{"\u00b3"}
            </Text>
            <Button
              title="Perbarui Sekarang"
              onPress={() => pilihKota(kotaTerpilih, true)}
            />
            <Button
              title={sudahFavorit ? "Sudah di Favorit" : "Tambahkan ke Favorit"}
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
          </>
        )}

        <AtribusiCuaca />
      </ScrollView>
    </SafeAreaView>
  );
}
