import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/context/ThemeContext";

export function useTheme() {
  const { skemaAktif } = useAppTheme();
  return Colors[skemaAktif];
}
