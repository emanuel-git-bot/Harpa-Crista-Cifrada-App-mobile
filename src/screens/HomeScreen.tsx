import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { hymns, type Hymn } from "../data/hymnManifest";
import { useFavorites } from "../context/FavoritesContext";
import { normalize } from "../utils/normalize";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [search, setSearch] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const filtered = useMemo(() => {
    const query = normalize(search);
    return hymns.filter((hymn) => {
      if (onlyFavorites && !favorites.includes(hymn.number)) return false;
      if (!query) return true;
      return (
        String(hymn.number).includes(query) || normalize(hymn.title).includes(query)
      );
    });
  }, [search, onlyFavorites, favorites]);

  const renderItem = ({ item }: { item: Hymn }) => (
    <Pressable
      style={styles.row}
      onPress={() => navigation.navigate("Hymn", { number: item.number })}
    >
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{item.number}</Text>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Pressable hitSlop={12} onPress={() => toggleFavorite(item.number)}>
        <Text style={styles.star}>{isFavorite(item.number) ? "★" : "☆"}</Text>
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Harpa com Cifra</Text>

      <TextInput
        style={styles.search}
        placeholder="Buscar por número ou título..."
        placeholderTextColor="#8a8a8a"
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
      />

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, !onlyFavorites && styles.tabActive]}
          onPress={() => setOnlyFavorites(false)}
        >
          <Text style={[styles.tabText, !onlyFavorites && styles.tabTextActive]}>
            Todos
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, onlyFavorites && styles.tabActive]}
          onPress={() => setOnlyFavorites(true)}
        >
          <Text style={[styles.tabText, onlyFavorites && styles.tabTextActive]}>
            Favoritos
          </Text>
        </Pressable>
      </View>

      {hymns.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhum hino encontrado</Text>
          <Text style={styles.emptyText}>
            Adicione imagens em assets/hymns/&lt;número&gt;/ e rode `npm start`
            novamente. Veja assets/hymns/README.md para o passo a passo.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.number)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    fontSize: 22,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    fontSize: 16,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: "#2d5f3f" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#555" },
  tabTextActive: { color: "#fff" },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  separator: { height: 1, backgroundColor: "#eee" },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2d5f3f",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  numberText: { color: "#fff", fontWeight: "700" },
  title: { flex: 1, fontSize: 16, color: "#222" },
  star: { fontSize: 22, color: "#e0a30f", marginLeft: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
});
