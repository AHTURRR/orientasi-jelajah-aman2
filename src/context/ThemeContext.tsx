import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "../hooks/use-color-scheme";

export type ModeTema = "light" | "dark" | "system";
export type SkemaWarnaAktif = "light" | "dark";

const KUNCI_TEMA = "@jelajah_aman:preferensi_tema";

export interface PaletWarna {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  danger: string;
  inputBackground: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  statusFreshBg: string;
  statusFreshText: string;
  statusStaleBg: string;
  statusStaleText: string;
}

export const PaletTema: Record<SkemaWarnaAktif, PaletWarna> = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    card: "#F1F5F9",
    text: "#0F172A",
    textSecondary: "#475569",
    border: "#CBD5E1",
    primary: "#0284C7",
    danger: "#DC2626",
    inputBackground: "#FFFFFF",
    tabBarBackground: "#FFFFFF",
    tabBarActive: "#0284C7",
    tabBarInactive: "#64748B",
    statusFreshBg: "#EAFBF6",
    statusFreshText: "#13795F",
    statusStaleBg: "#FEF3E2",
    statusStaleText: "#B45309",
  },
  dark: {
    background: "#0F172A",
    surface: "#1E293B",
    card: "#1E293B",
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    border: "#334155",
    primary: "#38BDF8",
    danger: "#F87171",
    inputBackground: "#1E293B",
    tabBarBackground: "#1E293B",
    tabBarActive: "#38BDF8",
    tabBarInactive: "#94A3B8",
    statusFreshBg: "#064E3B",
    statusFreshText: "#6EE7B7",
    statusStaleBg: "#78350F",
    statusStaleText: "#FCD34D",
  },
};

interface ThemeContextValue {
  modeTema: ModeTema;
  skemaAktif: SkemaWarnaAktif;
  warna: PaletWarna;
  ubahModeTema: (modeBaru: ModeTema) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const skemaSistem = useColorScheme();
  const [modeTema, setModeTema] = useState<ModeTema>("system");

  useEffect(() => {
    AsyncStorage.getItem(KUNCI_TEMA)
      .then((tersimpan) => {
        if (
          tersimpan === "light" ||
          tersimpan === "dark" ||
          tersimpan === "system"
        ) {
          setModeTema(tersimpan);
        }
      })
      .catch(() => {
        // Gunakan default system jika gagal membaca
      });
  }, []);

  async function ubahModeTema(modeBaru: ModeTema) {
    setModeTema(modeBaru);
    try {
      await AsyncStorage.setItem(KUNCI_TEMA, modeBaru);
    } catch {
      // Abaikan kegagalan simpan bila terjadi
    }
  }

  const skemaAktif: SkemaWarnaAktif =
    modeTema === "system"
      ? skemaSistem === "dark"
        ? "dark"
        : "light"
      : modeTema;

  const warna = PaletTema[skemaAktif];

  return (
    <ThemeContext.Provider
      value={{ modeTema, skemaAktif, warna, ubahModeTema }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      modeTema: "light",
      skemaAktif: "light",
      warna: PaletTema.light,
      ubahModeTema: async () => {},
    };
  }
  return ctx;
}
