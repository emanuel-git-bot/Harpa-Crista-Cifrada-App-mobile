import React from "react";
import { Alert, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLibrary } from "../context/LibraryContext";
import { useFavorites } from "../context/FavoritesContext";
import ZoomableImage from "../components/ZoomableImage";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Song">;

export default function SongScreen({ route, navigation }: Props) {
  const { categoryId, songId } = route.params;
  const { categories, songsFor, deleteSong } = useLibrary();
  const { isFavorite, toggleFavorite } = useFavorites();
  const insets = useSafeAreaInsets();

  const category = categories.find((c) => c.id === categoryId);
  const song = songsFor(categoryId).find((s) => s.id === songId);

  if (!song || !category) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Música não encontrada.</Text>
      </View>
    );
  }

  const confirmDelete = () => {
    Alert.alert("Remover", `Remover "${song.title}" desta categoria?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          await deleteSong(categoryId, songId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.viewer}>
        <ZoomableImage images={song.images} />
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {song.number != null ? `${song.number} · ` : ""}
          {song.title}
        </Text>
        <View style={styles.headerActions}>
          {!category.builtin && (
            <>
              <Pressable hitSlop={12} onPress={() => navigation.navigate("EditSong", { categoryId, songId })}>
                <Text style={styles.headerEdit}>✎</Text>
              </Pressable>
              <Pressable hitSlop={12} onPress={confirmDelete}>
                <Text style={styles.headerDelete}>🗑</Text>
              </Pressable>
            </>
          )}
          <Pressable hitSlop={12} onPress={() => toggleFavorite(song.id)}>
            <Text style={styles.headerStar}>{isFavorite(song.id) ? "★" : "☆"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  viewer: { flex: 1, overflow: "hidden" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  notFoundText: { fontSize: 16, color: "#333" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  headerButton: { color: "#fff", fontSize: 16 },
  headerTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginHorizontal: 12,
    textAlign: "center",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  headerStar: { color: colors.accent, fontSize: 22 },
  headerDelete: { fontSize: 18 },
  headerEdit: { color: "#fff", fontSize: 19 },
});
