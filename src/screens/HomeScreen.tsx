import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLibrary } from "../context/LibraryContext";
import PromptModal from "../components/PromptModal";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { Category } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const CARD_COLORS = ["#6B3A1F", "#8a4b2d", "#7a5a2d", "#8a3d3d", "#8a7c2d", "#5a6b3a"];

function colorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CARD_COLORS[hash % CARD_COLORS.length];
}

export default function HomeScreen({ navigation }: Props) {
  const { categories, songsFor, createCategory } = useLibrary();
  const [promptVisible, setPromptVisible] = useState(false);

  const handleCreate = async (name: string) => {
    setPromptVisible(false);
    const category = await createCategory(name);
    navigation.navigate("Category", { categoryId: category.id });
  };

  const renderItem = ({ item }: { item: Category }) => {
    const count = songsFor(item.id).length;
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("Category", { categoryId: item.id })}
      >
        <View style={[styles.avatar, { backgroundColor: colorFor(item.id) }]}>
          <Text style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardSubtitle}>
            {count} {count === 1 ? "item" : "itens"}
            {item.builtin ? " · letra e cifra" : ""}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🎵 Meu Cancioneiro</Text>
        <Text style={styles.heroSubtitle}>Letras, cifras e louvores, tudo num lugar só</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={
          <Pressable style={styles.newCategoryButton} onPress={() => setPromptVisible(true)}>
            <Text style={styles.newCategoryButtonText}>+ Nova categoria</Text>
          </Pressable>
        }
      />

      <PromptModal
        visible={promptVisible}
        title="Nova categoria"
        placeholder="Ex: Corinhos, Músicas..."
        confirmLabel="Criar"
        onCancel={() => setPromptVisible(false)}
        onConfirm={handleCreate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.primary,
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  heroTitle: { fontSize: 26, fontWeight: "800", color: "#fff" },
  heroSubtitle: { fontSize: 14, color: "#EAD9C0", marginTop: 6 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarLetter: { color: "#fff", fontSize: 20, fontWeight: "700" },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.textDark },
  cardSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.cardBorder, marginLeft: 8 },
  newCategoryButton: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  newCategoryButtonText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
});
