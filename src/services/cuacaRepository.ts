import { ambilCache, simpanCache } from "./cacheRepository";
import { ambilKualitasUdara } from "./airQualityService";
import { ambilCuaca } from "./weatherService";
import { HasilCuacaOffline, KotaUntukCache } from "../../types/cache";

export const TTL_SEGAR_MS = 30 * 60 * 1000;
export const BATAS_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

interface OpsiAmbil {
  paksaPerbarui?: boolean;
}

export async function ambilCuacaOfflineFirst(
  kota: KotaUntukCache,
  opsi: OpsiAmbil = {},
): Promise<HasilCuacaOffline> {
  const cache = await ambilCache(kota.latitude, kota.longitude);
  const umur = cache ? Date.now() - cache.disimpanPada : Infinity;
  const cacheMasihBerlaku = cache !== null && umur <= BATAS_CACHE_MS;

  if (cacheMasihBerlaku && umur < TTL_SEGAR_MS && !opsi.paksaPerbarui) {
    return { ...cache, sumber: "cache-segar" };
  }

  let cuaca: Awaited<ReturnType<typeof ambilCuaca>>;
  let kualitasUdara: Awaited<ReturnType<typeof ambilKualitasUdara>>;
  try {
    [cuaca, kualitasUdara] = await Promise.all([
      ambilCuaca(kota.latitude, kota.longitude),
      ambilKualitasUdara(kota.latitude, kota.longitude),
    ]);
  } catch (err) {
    if (cacheMasihBerlaku && cache) {
      return {
        ...cache,
        sumber: "cache-basi",
      };
    }
    throw new Error(
      `Belum ada data tersimpan dan tidak ada koneksi internet: ${String(err)}`,
    );
  }

  try {
    await simpanCache(kota, cuaca, kualitasUdara);
  } catch (err) {
    console.warn("Data berhasil dimuat, tetapi cache gagal disimpan.", err);
  }

  return {
    cuaca,
    kualitasUdara,
    disimpanPada: Date.now(),
    sumber: "jaringan",
  };
}
