import { ambilDatabase } from "../db/database";
import { DataCuacaLengkap, DataKualitasUdara } from "../../types/weather";
import {
  DataTersimpan,
  KotaUntukCache,
  RingkasanKotaTersimpan,
} from "../../types/cache";

interface BarisCache {
  kunci: string;
  kota_id: number;
  nama_kota: string;
  latitude: number;
  longitude: number;
  cuaca_json: string;
  aqi_json: string;
  disimpan_pada: number;
}

export function buatKunci(latitude: number, longitude: number): string {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

export async function simpanCache(
  kota: KotaUntukCache,
  cuaca: DataCuacaLengkap,
  kualitasUdara: DataKualitasUdara,
): Promise<void> {
  const db = await ambilDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO cache_cuaca
      (kunci, kota_id, nama_kota, latitude, longitude, cuaca_json, aqi_json, disimpan_pada)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      buatKunci(kota.latitude, kota.longitude),
      kota.id,
      kota.nama,
      kota.latitude,
      kota.longitude,
      JSON.stringify(cuaca),
      JSON.stringify(kualitasUdara),
      Date.now(),
    ],
  );
}

export async function ambilCache(
  latitude: number,
  longitude: number,
): Promise<DataTersimpan | null> {
  const db = await ambilDatabase();
  const baris = await db.getFirstAsync<BarisCache>(
    "SELECT * FROM cache_cuaca WHERE kunci = ?",
    [buatKunci(latitude, longitude)],
  );
  if (!baris) return null;

  try {
    return {
      cuaca: JSON.parse(baris.cuaca_json) as DataCuacaLengkap,
      kualitasUdara: JSON.parse(baris.aqi_json) as DataKualitasUdara,
      disimpanPada: baris.disimpan_pada,
    };
  } catch (err) {
    throw new Error(`Cache cuaca rusak dan tidak dapat dibaca: ${String(err)}`);
  }
}

export async function daftarKotaTersimpan(): Promise<RingkasanKotaTersimpan[]> {
  const db = await ambilDatabase();
  const semua = await db.getAllAsync<BarisCache>(
    `SELECT kunci, kota_id, nama_kota, latitude, longitude, cuaca_json, aqi_json, disimpan_pada
     FROM cache_cuaca ORDER BY disimpan_pada DESC LIMIT 10`,
  );

  return semua.map((baris) => {
    let suhuTerakhir: number | undefined;
    let indeksAQITerakhir: number | undefined;
    try {
      const cuaca = JSON.parse(baris.cuaca_json) as DataCuacaLengkap;
      suhuTerakhir = cuaca?.saatIni?.suhu;
      const aqi = JSON.parse(baris.aqi_json) as DataKualitasUdara;
      indeksAQITerakhir = aqi?.indeksAQI;
    } catch {
      // Abaikan jika JSON gagal di-parse pada ringkasan
    }

    return {
      kunci: baris.kunci,
      id: baris.kota_id,
      nama: baris.nama_kota,
      latitude: baris.latitude,
      longitude: baris.longitude,
      disimpanPada: baris.disimpan_pada,
      suhuTerakhir,
      indeksAQITerakhir,
    };
  });
}

export async function hapusCacheKota(kunci: string): Promise<void> {
  const db = await ambilDatabase();
  await db.runAsync("DELETE FROM cache_cuaca WHERE kunci = ?", [kunci]);
}

export async function bersihkanCacheLama(batasUmurMs: number): Promise<void> {
  const db = await ambilDatabase();
  await db.runAsync("DELETE FROM cache_cuaca WHERE disimpan_pada < ?", [
    Date.now() - batasUmurMs,
  ]);
}

export async function hapusSemuaCache(): Promise<void> {
  const db = await ambilDatabase();
  await db.runAsync("DELETE FROM cache_cuaca");
}
