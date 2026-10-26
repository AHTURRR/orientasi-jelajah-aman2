import { Text, View } from "react-native";
import { SumberData } from "../../types/cache";
import { useAppTheme } from "../context/ThemeContext";

interface StatusDataProps {
  sumber: SumberData;
  disimpanPada: number;
}

function formatUmur(disimpanPada: number): string {
  const menit = Math.floor((Date.now() - disimpanPada) / 60000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  return `${Math.floor(jam / 24)} hari lalu`;
}

function labelSumber(sumber: SumberData): string {
  if (sumber === "jaringan") return "Data terbaru dari internet";
  if (sumber === "cache-segar") return "Data tersimpan (masih segar)";
  return "Mode offline - data tersimpan mungkin sudah usang";
}

export default function StatusData({ sumber, disimpanPada }: StatusDataProps) {
  const { warna } = useAppTheme();
  const basi = sumber === "cache-basi";
  const label = labelSumber(sumber);
  const umur = formatUmur(disimpanPada);

  return (
    <View
      accessible
      accessibilityLabel={`${label}, diperbarui ${umur}`}
      style={{
        padding: 10,
        borderRadius: 8,
        backgroundColor: basi ? warna.statusStaleBg : warna.statusFreshBg,
        borderWidth: 1,
        borderColor: basi ? warna.statusStaleText : warna.statusFreshText,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: basi ? warna.statusStaleText : warna.statusFreshText,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 11, color: warna.textSecondary }}>
        Diperbarui {umur}
      </Text>
    </View>
  );
}
