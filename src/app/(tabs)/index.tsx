// src/app/(tabs)/index.tsx
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Button, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HasilGeocoding } from "../../../types/geocoding";
import { DataCuacaLengkap, DataKualitasUdara } from "../../../types/weather";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { useDebounce } from "../../hooks/use-debounce";
import { ambilKualitasUdara } from "../../services/airQualityService";
import { cariKota } from "../../services/geocodingService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { ambilCuaca } from "../../services/weatherService";

export default function HalamanUtama() {
  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [cuaca, setCuaca] = useState<DataCuacaLengkap | null>(null);
  const [kualitasUdara, setKualitasUdara] = useState<DataKualitasUdara | null>(null);
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (teksTertunda.trim().length === 0) {
      return;
    }
    cariKota(teksTertunda)
      .then(setHasilPencarian)
      .catch(() => setHasilPencarian([]));
  }, [teksTertunda]);

  async function pilihKota(kota: HasilGeocoding) {
    setKotaTerpilih(kota);
    const idSaatIni = ++requestIdRef.current;
    setSedangMemuat(true);
    setPesanError(null);
    setCuaca(null);
    setKualitasUdara(null);

    try {
      const [dataCuaca, dataAQI] = await Promise.all([
        ambilCuaca(kota.latitude, kota.longitude),
        ambilKualitasUdara(kota.latitude, kota.longitude),
      ]);
      if (idSaatIni !== requestIdRef.current) return;
      setCuaca(dataCuaca);
      setKualitasUdara(dataAQI);
    } catch {
      if (idSaatIni !== requestIdRef.current) return;
      setPesanError("Gagal memuat data cuaca. Periksa koneksi internet Anda.");
    } finally {
      if (idSaatIni === requestIdRef.current) {
        setSedangMemuat(false);
      }
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 16 }}>
      <SearchBox
        onCari={(nilai) => {
          setTeksCari(nilai);
          if (nilai.trim().length === 0) {
            setPesanError(null);
          }
        }}
      />

      {teksTertunda.trim().length > 0 &&
        hasilPencarian.map((kota) => (
        <TouchableOpacity
          key={kota.id}
          onPress={() => pilihKota(kota)}
          accessibilityRole="button"
          accessibilityLabel={`Lihat cuaca ${kota.name}`}
          style={{ paddingVertical: 8 }}
        >
          <Text>{kota.name}{kota.admin1 ? `, ${kota.admin1}` : ""}</Text>
        </TouchableOpacity>
        ))}

      {sedangMemuat && <ActivityIndicator size="large" color="#0000ff" />}

      {pesanError && (
        <View style={{ alignItems: "center", gap: 8 }}>
          <Text
            accessibilityLabel="Pesan Error: ${pesanError}"
            style={{ color: "red", textAlign: "center" }}
          >
            {pesanError}
          </Text>
          <Button
            title="Coba Lagi"
            onPress={() => kotaTerpilih && pilihKota(kotaTerpilih)}
          />
        </View>
      )}

      {!sedangMemuat && !pesanError && teksTertunda.length > 0 &&
        hasilPencarian.length === 0 && (
          <Text
            accessibilityLabel="Pesan kosong: Kota tidak ditemukan"
            style={{ textAlign: "center" }}
          >
            Kota tidak ditemukan
          </Text>
        )}

      {cuaca && kualitasUdara && kotaTerpilih && !sedangMemuat && (
        <>
          <WeatherCard
            kota={kotaTerpilih.name}
            suhu={cuaca.saatIni.suhu}
            tingkatAQI={konversiTingkatAQI(kualitasUdara.indeksAQI)}
            indeksAQI={kualitasUdara.indeksAQI}
          />
          <Text>
            Kondisi: {labelKodeCuaca(cuaca.saatIni.kodeCuaca)} - Angin{" "}
            {cuaca.saatIni.kecepatanAngin} km/j
          </Text>
          <Text>
            Hari ini: min {cuaca.harian.suhuMinimal[0]}{"\u00b0"}C, maks{" "}
            {cuaca.harian.suhuMaksimal[0]}{"\u00b0"}C
          </Text>
          <Text style={{ fontSize: 12, color: "#666" }}>
            PM2.5: {kualitasUdara.pm25} {"\u00b5"}g/m{"\u00b3"} | PM10:{" "}
            {kualitasUdara.pm10} {"\u00b5"}g/m{"\u00b3"}
          </Text>
        </>
      )}

      <AtribusiCuaca />
    </SafeAreaView>
  );
}
