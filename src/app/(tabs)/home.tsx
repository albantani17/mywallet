import { ScrollView, View } from "react-native";

import { Dashboard } from "@/components/features/dashboard";

export default function Home() {
  return (
    <View className="flex-1 bg-brand-sheet">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Kartu hijau full-width (sapaan + Total Aset + aksi cepat) */}
        <Dashboard />

        {/* Konten beranda berikutnya (daftar dompet, dll.) */}
        <View className="px-6 pt-6">{/* TODO: langkah berikutnya */}</View>
      </ScrollView>
    </View>
  );
}
