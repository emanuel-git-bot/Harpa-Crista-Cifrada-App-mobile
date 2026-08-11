import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLibrary } from "../context/LibraryContext";
import { useFavorites } from "../context/FavoritesContext";
import { normalize } from "../utils/normalize";
import PromptModal from "../components/PromptModal";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { Song } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Category">;

export default function CategoryScreen({ route, navigation }: Props) {
  const { categoryId } = route.params;
  const { categories, songsFor, addSong, moveSong } = useLibrary();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const insets = useSafeAreaInsets();

  const category = categories.find((c) => c.id === categoryId);
  const songs = songsFor(categoryId);

  const [search, setSearch] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [pendingImages, setPendingImages] = useState<ImagePicker.ImagePickerAsset[] | null>(null);
  const [adding, setAdding] = useState(false);

  // Reordering only makes sense against the canonical (unsearched,
  // unfiltered) order, and only for categories the user can actually edit.
  const canReorder = !category?.builtin && !search && !onlyFavorites;

  const filtered = useMemo(() => {
    const query = normalize(search);
    return songs.filter((song) => {
      if (onlyFavorites && !favorites.includes(song.id)) return false;
      if (!query) return true;
      const numberMatch = song.number != null && String(song.number).includes(query);
      return numberMatch || normalize(song.title).includes(query);
    });
  }, [songs, search, onlyFavorites, favorites]);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Preciso de acesso às suas fotos para adicionar uma imagem."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsMultipleSelection: true,
    });
    if (result.canceled || result.assets.length === 0) return;
    setPendingImages(result.assets);
  };

  const confirmAddSong = async (title: string) => {
    if (!pendingImages) return;
    setAdding(true);
    try {
      await addSong(categoryId, {
        title,
        pickedImages: pendingImages.map((img) => ({
          uri: img.uri,
          width: img.width,
          height: img.height,
        })),
      });
    } finally {
      setAdding(false);
      setPendingImages(null);
    }
  };

  const renderItem = ({ item, index }: { item: Song; index: number }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate("Song", { categoryId, songId: item.id })}
    >
      <View style={styles.cardHeader}>
        {item.number != null && (
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{item.number}</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        {canReorder && (
          <View style={styles.reorderButtons}>
            <Pressable
              hitSlop={8}
              disabled={index === 0}
              onPress={() => moveSong(categoryId, item.id, "up")}
            >
              <Text style={[styles.reorderText, index === 0 && styles.reorderTextDisabled]}>▲</Text>
            </Pressable>
            <Pressable
              hitSlop={8}
              disabled={index === filtered.length - 1}
              onPress={() => moveSong(categoryId, item.id, "down")}
            >
              <Text
                style={[styles.reorderText, index === filtered.length - 1 && styles.reorderTextDisabled]}
              >
                ▼
              </Text>
            </Pressable>
          </View>
        )}
        <Pressable hitSlop={12} onPress={() => toggleFavorite(item.id)}>
          <Text style={styles.star}>{isFavorite(item.id) ? "★" : "☆"}</Text>
        </Pressable>
      </View>
      <Image source={item.images[0].source} style={styles.thumbnail} resizeMode="cover" />
    </Pressable>
  );

  if (!category) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Categoria não encontrada.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Categorias</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {category.name}
        </Text>
        <View style={{ width: 70 }} />
      </View>

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
          <Text style={[styles.tabText, !onlyFavorites && styles.tabTextActive]}>Todos</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, onlyFavorites && styles.tabActive]}
          onPress={() => setOnlyFavorites(true)}
        >
          <Text style={[styles.tabText, onlyFavorites && styles.tabTextActive]}>Favoritos</Text>
        </Pressable>
      </View>

      {songs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nada por aqui ainda</Text>
          <Text style={styles.emptyText}>
            {category.builtin
              ? "Adicione imagens em assets/hymns/ e rode `npm start` novamente."
              : "Toque em \"Adicionar\" para colocar a primeira imagem."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {!category.builtin && (
        <Pressable
          style={[styles.addButton, { bottom: insets.bottom + 56 }]}
          onPress={pickImages}
          disabled={adding}
        >
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>+ Adicionar</Text>
          )}
        </Pressable>
      )}

      <PromptModal
        visible={pendingImages !== null}
        title={
          pendingImages && pendingImages.length > 1
            ? `Título da música (${pendingImages.length} imagens)`
            : "Título da música"
        }
        placeholder="Ex: Nome da música"
        confirmLabel="Adicionar"
        onCancel={() => setPendingImages(null)}
        onConfirm={confirmAddSong}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: { fontSize: 15, color: colors.primary, fontWeight: "600", width: 90 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.inputBackground,
    fontSize: 16,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  tabTextActive: { color: "#fff" },
  listContent: { paddingHorizontal: 16, paddingBottom: 96 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  thumbnail: { width: "100%", height: 150, backgroundColor: colors.inputBackground },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  numberText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  title: { flex: 1, fontSize: 16, color: colors.textDark, fontWeight: "600" },
  reorderButtons: { flexDirection: "row", gap: 10, marginLeft: 8 },
  reorderText: { fontSize: 15, color: colors.primary },
  reorderTextDisabled: { opacity: 0.25 },
  star: { fontSize: 22, color: colors.accent, marginLeft: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20 },
  addButton: {
    position: "absolute",
    right: 16,
    bottom: 24,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
