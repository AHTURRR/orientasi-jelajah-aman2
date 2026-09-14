import { Pressable, View, Text } from "react-native";

interface RiwayatListProps {
  daftarKota: string[];
  onPilihKota: (kota: string) => void;
}

export default function RiwayatList({ daftarKota, onPilihKota }: RiwayatListProps) {
  return (
    <View>
      <Text><b>Riwayat Pencarian</b></Text>
      <View>
      {daftarKota.map((kota) => (
        <Pressable key={kota} onPress={() => onPilihKota(kota)}>
          <Text>{kota}</Text>
        </Pressable>
      ))}
    </View>
    </View>
    
  );
}
