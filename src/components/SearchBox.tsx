import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

interface SearchBoxProps {
  onCari: (teks: string) => void;
  nilai?: string;
}

export default function SearchBox({ onCari, nilai }: SearchBoxProps) {
  const [teksInternal, setTeksInternal] = useState("");
  const { warna } = useAppTheme();

  const teks = nilai !== undefined ? nilai : teksInternal;

  function handleChange(nilaiBaru: string) {
    setTeksInternal(nilaiBaru);
    onCari(nilaiBaru);
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: warna.border,
        backgroundColor: warna.inputBackground,
        paddingHorizontal: 12,
        borderRadius: 10,
        gap: 8,
      }}
    >
      <Ionicons name="search" size={18} color={warna.textSecondary} />
      <TextInput
        placeholder="Cari nama kota..."
        placeholderTextColor={warna.textSecondary}
        value={teks}
        onChangeText={handleChange}
        accessibilityLabel="Cari cuaca untuk kota yang dimasukkan"
        style={{
          flex: 1,
          paddingVertical: 10,
          color: warna.text,
          fontSize: 15,
        }}
      />
      {teks.length > 0 && (
        <TouchableOpacity
          onPress={() => handleChange("")}
          accessibilityRole="button"
          accessibilityLabel="Bersihkan teks pencarian"
        >
          <Ionicons name="close-circle" size={18} color={warna.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}
