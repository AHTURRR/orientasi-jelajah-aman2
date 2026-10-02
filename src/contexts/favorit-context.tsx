import { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface FavoritContextValue {
  kotaFavorit: string[];
  tambahFavorit: (kota: string) => void;
}

const FavoritContext = createContext<FavoritContextValue | null>(null);

export function FavoritProvider({ children }: { children: ReactNode }) {
  const [kotaFavorit, setKotaFavorit] = useState<string[]>([]);

  const nilai = useMemo(
    () => ({
      kotaFavorit,
      tambahFavorit: (kota: string) => {
        const namaKota = kota.trim();

        if (!namaKota) {
          return;
        }

        setKotaFavorit((favoritSaatIni) =>
          favoritSaatIni.includes(namaKota)
            ? favoritSaatIni
            : [...favoritSaatIni, namaKota],
        );
      },
    }),
    [kotaFavorit],
  );

  return <FavoritContext.Provider value={nilai}>{children}</FavoritContext.Provider>;
}

export function useFavorit() {
  const context = useContext(FavoritContext);

  if (!context) {
    throw new Error("useFavorit harus digunakan di dalam FavoritProvider.");
  }

  return context;
}
