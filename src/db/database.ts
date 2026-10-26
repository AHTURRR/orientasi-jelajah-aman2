import { Platform } from "react-native";

const NAMA_DATABASE = "jelajah-aman.db";
const VERSI_DATABASE = 2;
const KUNCI_WEB_FALLBACK = "@jelajah_aman:sqlite_fallback_cache";

export interface BarisCacheInternal {
  kunci: string;
  kota_id: number;
  nama_kota: string;
  latitude: number;
  longitude: number;
  cuaca_json: string;
  aqi_json: string;
  disimpan_pada: number;
  jumlah_dibuka?: number;
}

export type ParamSQL = (string | number | null)[];

export interface DatabaseAdapter {
  runAsync(sql: string, params?: ParamSQL): Promise<unknown>;
  getFirstAsync<T>(sql: string, params?: ParamSQL): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: ParamSQL): Promise<T[]>;
  execAsync(sql: string): Promise<void>;
}

let dbPromise: Promise<DatabaseAdapter> | null = null;

function bacaWebStore(): Record<string, BarisCacheInternal> {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(KUNCI_WEB_FALLBACK);
    return raw ? (JSON.parse(raw) as Record<string, BarisCacheInternal>) : {};
  } catch {
    return {};
  }
}

function simpanWebStore(store: Record<string, BarisCacheInternal>): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(KUNCI_WEB_FALLBACK, JSON.stringify(store));
    }
  } catch {
    // Abaikan jika storage penuh
  }
}

function buatFallbackAdapter(): DatabaseAdapter {
  return {
    async execAsync() {
      // No-op untuk schema di fallback adapter
    },
    async runAsync(sql: string, params: unknown[] = []) {
      const store = bacaWebStore();
      const normalized = sql.trim().toUpperCase();
      if (normalized.startsWith("INSERT OR REPLACE INTO CACHE_CUACA")) {
        const [
          kunci,
          kota_id,
          nama_kota,
          latitude,
          longitude,
          cuaca_json,
          aqi_json,
          disimpan_pada,
        ] = params as [
          string,
          number,
          string,
          number,
          number,
          string,
          string,
          number,
        ];
        store[kunci] = {
          kunci,
          kota_id,
          nama_kota,
          latitude,
          longitude,
          cuaca_json,
          aqi_json,
          disimpan_pada,
          jumlah_dibuka: store[kunci]?.jumlah_dibuka ?? 0,
        };
        simpanWebStore(store);
      } else if (
        normalized.startsWith("DELETE FROM CACHE_CUACA WHERE KUNCI = ?")
      ) {
        const kunci = String(params[0] ?? "");
        delete store[kunci];
        simpanWebStore(store);
      } else if (
        normalized.startsWith("DELETE FROM CACHE_CUACA WHERE DISIMPAN_PADA < ?")
      ) {
        const batas = Number(params[0] ?? 0);
        for (const k of Object.keys(store)) {
          if (store[k].disimpan_pada < batas) {
            delete store[k];
          }
        }
        simpanWebStore(store);
      } else if (normalized.startsWith("DELETE FROM CACHE_CUACA")) {
        simpanWebStore({});
      }
    },
    async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      const normalized = sql.trim().toUpperCase();
      if (normalized.includes("PRAGMA USER_VERSION")) {
        return { user_version: VERSI_DATABASE } as unknown as T;
      }
      if (normalized.includes("FROM CACHE_CUACA WHERE KUNCI = ?")) {
        const store = bacaWebStore();
        const kunci = String(params[0] ?? "");
        return (store[kunci] as unknown as T) ?? null;
      }
      return null;
    },
    async getAllAsync<T>(sql: string): Promise<T[]> {
      const normalized = sql.trim().toUpperCase();
      if (normalized.includes("FROM CACHE_CUACA")) {
        const store = bacaWebStore();
        const semua = Object.values(store).sort(
          (a, b) => b.disimpan_pada - a.disimpan_pada,
        );
        return semua.slice(0, 10) as unknown as T[];
      }
      return [];
    },
  };
}

export function ambilDatabase(): Promise<DatabaseAdapter> {
  if (!dbPromise) {
    dbPromise = bukaDanMigrasi().catch(() => {
      // Gunakan fallback adapter jika SQLite gagal diinisialisasi (misal pada Web tanpa COOP/COEP)
      return buatFallbackAdapter();
    });
  }
  return dbPromise;
}

async function bukaDanMigrasi(): Promise<DatabaseAdapter> {
  if (Platform.OS === "web") {
    try {
      const SQLite = await import("expo-sqlite");
      const db = (await SQLite.openDatabaseAsync(
        NAMA_DATABASE,
      )) as unknown as DatabaseAdapter;
      await migrasiDatabase(db);
      return db;
    } catch {
      return buatFallbackAdapter();
    }
  }

  const SQLite = await import("expo-sqlite");
  const db = (await SQLite.openDatabaseAsync(
    NAMA_DATABASE,
  )) as unknown as DatabaseAdapter;
  await migrasiDatabase(db);
  return db;
}

async function migrasiDatabase(db: DatabaseAdapter): Promise<void> {
  const baris = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  let versiSaatIni = baris?.user_version ?? 0;

  if (versiSaatIni >= VERSI_DATABASE) return;

  if (versiSaatIni < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS cache_cuaca (
        kunci TEXT PRIMARY KEY NOT NULL,
        kota_id INTEGER NOT NULL,
        nama_kota TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        cuaca_json TEXT NOT NULL,
        aqi_json TEXT NOT NULL,
        disimpan_pada INTEGER NOT NULL
      );
    `);
    versiSaatIni = 1;
  }

  if (versiSaatIni < 2) {
    await db.execAsync(
      "ALTER TABLE cache_cuaca ADD COLUMN jumlah_dibuka INTEGER NOT NULL DEFAULT 0;",
    );
    versiSaatIni = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${VERSI_DATABASE}`);
}
