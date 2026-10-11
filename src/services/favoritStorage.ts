// src/services/favoritStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KotaFavorit } from "../../types/favorit";

const KUNCI_PENYIMPANAN = "@jelajah_aman:favorit";
export async function ambilSemuaFavorit(): Promise<KotaFavorit[]> {
  const json = await AsyncStorage.getItem(KUNCI_PENYIMPANAN);
  if (!json) return [];

  const data: unknown = JSON.parse(json);
  if (!Array.isArray(data)) return [];

  return data
    .filter(
      (kota): kota is KotaFavorit & { name?: string } =>
        typeof kota === "object" &&
        kota !== null &&
        typeof (kota as KotaFavorit).id === "number" &&
        typeof (kota as KotaFavorit).latitude === "number" &&
        typeof (kota as KotaFavorit).longitude === "number",
    )
    .map((kota) => ({
      id: kota.id,
      nama: kota.nama ?? kota.name ?? "Kota tanpa nama",
      latitude: kota.latitude,
      longitude: kota.longitude,
    }));
}
export async function tambahFavorit(kota: KotaFavorit): Promise<void> {
  const daftar = await ambilSemuaFavorit();
  const sudahAda = daftar.some((k) => k.id === kota.id);
  if (sudahAda) return;
  const daftarBaru = [...daftar, kota];
  await AsyncStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(daftarBaru));
}
export async function hapusFavorit(id: number): Promise<void> {
  const daftar = await ambilSemuaFavorit();
  const daftarBaru = daftar.filter((k) => k.id !== id);
  await AsyncStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(daftarBaru));
}