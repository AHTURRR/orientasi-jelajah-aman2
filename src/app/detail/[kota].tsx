// app/detail/[kota].tsx
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Link } from "expo-router";
import WeatherCard from "../../components/WeatherCard";

function buatDataCuaca(kota: string) {
	const totalKarakter = kota
		.split("")
		.reduce((total, karakter) => total + karakter.charCodeAt(0), 0);
	const indeksAQI = 25 + (totalKarakter % 120);

	return {
		suhu: 24 + (totalKarakter % 12),
		tingkatAQI:
			indeksAQI <= 50
				? "BAIK"
				: indeksAQI <= 100
				? "SEDANG"
				: "TIDAK_SEHAT",
	} as const;
}

export default function HalamanDetail() {
	const { kota } = useLocalSearchParams<{ kota: string }>();
	const namaKota = kota ?? "Kota tidak diketahui";
	const dataCuaca = buatDataCuaca(namaKota);

	return (
		<View style={{ padding: 16, gap: 16 }}>
			<WeatherCard
				kota={namaKota}
				suhu={dataCuaca.suhu}
				tingkatAQI={dataCuaca.tingkatAQI}
			/>
			<Link href="/tambah-favorit" accessibilityLabel={`Tambah ${namaKota} ke favorit`}>
				Tambah Favorit
			</Link>
		</View>
	);
}