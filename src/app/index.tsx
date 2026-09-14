import { useState, useEffect } from "react";
import { View } from "react-native";
import WeatherCard from "../components/WeatherCard";
import SearchBox from "../components/SearchBox";
import RiwayatList from "../components/RiwayatList";
import IndikatorAQI from "../components/IndikatorAQI";
import { TingkatAQI } from "../../types/cuaca";

interface DataCuacaAktif {
  kota: string;
  suhu: number;
  indeksAQI: number;
  tingkatAQI: TingkatAQI;
  diperbaruiPada: string;
}

function rapikanNamaKota(kota: string) {
  return kota
    .trim()
    .split(/\s+/)
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1).toLowerCase())
    .join(" ");
}

function buatDataCuaca(kota: string): DataCuacaAktif {
  const totalKarakter = kota.split("").reduce((total, karakter) => total + karakter.charCodeAt(0), 0);
  const indeksAQI = 25 + (totalKarakter % 120);
  const tingkatAQI =
    indeksAQI <= 50
      ? "BAIK"
      : indeksAQI <= 100
        ? "SEDANG"
        : "TIDAK_SEHAT";

  return {
    kota,
    suhu: 24 + (totalKarakter % 12),
    indeksAQI,
    tingkatAQI,
    diperbaruiPada: new Date().toLocaleString("id-ID"),
  };
}

export default function HalamanUtama() {
  const [dataCuacaAktif, setDataCuacaAktif] = useState(() => buatDataCuaca("Pekalongan"));
  const [riwayat, setRiwayat] = useState<string[]>(["Pekalongan"]);

  useEffect(() => {
    console.log("Kota aktif berubah menjadi:", dataCuacaAktif.kota);
  }, [dataCuacaAktif.kota]);

  function handleCari(kota: string) {
    const kotaRapi = rapikanNamaKota(kota);

    if (!kotaRapi) {
      return;
    }

    setDataCuacaAktif(buatDataCuaca(kotaRapi));
    setRiwayat((daftarSebelumnya) =>
      daftarSebelumnya.some((item) => item.toLowerCase() === kotaRapi.toLowerCase())
        ? daftarSebelumnya
        : [...daftarSebelumnya, kotaRapi]
    );
  }

  return (
    <View style={{ padding: 16, gap: 16 }}>
      <SearchBox onCari={handleCari} />
      <WeatherCard
        kota={dataCuacaAktif.kota}
        suhu={dataCuacaAktif.suhu}
        tingkatAQI={dataCuacaAktif.tingkatAQI}
      />
      <RiwayatList daftarKota={riwayat} onPilihKota={handleCari} />
      <IndikatorAQI
        kota={dataCuacaAktif.kota}
        indeksAQI={dataCuacaAktif.indeksAQI}
        tingkat={dataCuacaAktif.tingkatAQI}
        diperbaruiPada={dataCuacaAktif.diperbaruiPada}
      />
    </View>
  );
}
