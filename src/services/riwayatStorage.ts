import AsyncStorage from "@react-native-async-storage/async-storage";
import { ItemRiwayatPencarian } from "../../types/riwayat";

const KUNCI_RIWAYAT = "@jelajah_aman:riwayat_pencarian";
export const MAKS_RIWAYAT = 10;

export interface TargetKotaNavigasi {
  id: number;
  nama: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

let kotaTargetDariRiwayat: TargetKotaNavigasi | null = null;

export function setKotaTargetNavigasi(kota: TargetKotaNavigasi): void {
  kotaTargetDariRiwayat = kota;
}

export function ambilDanBersihkanKotaTargetNavigasi(): TargetKotaNavigasi | null {
  const target = kotaTargetDariRiwayat;
  kotaTargetDariRiwayat = null;
  return target;
}

export async function ambilSemuaRiwayat(): Promise<ItemRiwayatPencarian[]> {
  try {
    const json = await AsyncStorage.getItem(KUNCI_RIWAYAT);
    if (!json) return [];

    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data)) return [];

    return data
      .filter(
        (item): item is ItemRiwayatPencarian =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as ItemRiwayatPencarian).id === "number" &&
          typeof (item as ItemRiwayatPencarian).nama === "string" &&
          typeof (item as ItemRiwayatPencarian).latitude === "number" &&
          typeof (item as ItemRiwayatPencarian).longitude === "number",
      )
      .slice(0, MAKS_RIWAYAT);
  } catch {
    return [];
  }
}

export async function catatRiwayatPencarian(
  kota: Omit<ItemRiwayatPencarian, "dicariPada">,
): Promise<ItemRiwayatPencarian[]> {
  // Jangan catat entri generik Lokasi Saat Ini (id < 0) sebagai riwayat pencarian kota
  if (kota.id < 0) {
    return ambilSemuaRiwayat();
  }

  const riwayatLama = await ambilSemuaRiwayat();
  const kunciBaru = `${kota.latitude.toFixed(2)},${kota.longitude.toFixed(2)}`;

  const tanpaDuplikat = riwayatLama.filter((item) => {
    const kunciItem = `${item.latitude.toFixed(2)},${item.longitude.toFixed(2)}`;
    return item.id !== kota.id && kunciItem !== kunciBaru;
  });

  const itemBaru: ItemRiwayatPencarian = {
    ...kota,
    dicariPada: Date.now(),
  };

  const riwayatBaru = [itemBaru, ...tanpaDuplikat].slice(0, MAKS_RIWAYAT);
  await AsyncStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(riwayatBaru));
  return riwayatBaru;
}

export async function hapusSatuRiwayat(
  id: number,
  latitude: number,
  longitude: number,
): Promise<ItemRiwayatPencarian[]> {
  const riwayatLama = await ambilSemuaRiwayat();
  const targetKunci = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const riwayatBaru = riwayatLama.filter((item) => {
    const kunciItem = `${item.latitude.toFixed(2)},${item.longitude.toFixed(2)}`;
    return item.id !== id && kunciItem !== targetKunci;
  });
  await AsyncStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(riwayatBaru));
  return riwayatBaru;
}

export async function hapusSemuaRiwayat(): Promise<void> {
  await AsyncStorage.removeItem(KUNCI_RIWAYAT);
}
