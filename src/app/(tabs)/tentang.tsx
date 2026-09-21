import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typeScale } from "../../constants/styles";

export default function TabTentang() {
	return (
		<SafeAreaView
			accessibilityLabel="Halaman Tentang Jelajah Aman"
			style={{ flex: 1, padding: spacing.sedang, gap: spacing.kecil }}
		>
			<Text style={{ fontSize: typeScale.judul, fontWeight: "bold" }}>
				Jelajah Aman
			</Text>
			<Text style={{ fontSize: typeScale.subjudul }}>Versi 1.0.0</Text>
			<Text style={{ fontSize: typeScale.isi }}>Dibuat oleh Tim Jelajah Aman</Text>
		</SafeAreaView>
	);
}
