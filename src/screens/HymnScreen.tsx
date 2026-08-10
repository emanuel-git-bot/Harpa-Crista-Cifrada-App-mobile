import React from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { hymns } from "../data/hymnManifest";
import { useFavorites } from "../context/FavoritesContext";
import ZoomableImage from "../components/ZoomableImage";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Hymn">;

export default function HymnScreen({ route, navigation }: Props) {
  const { number } = route.params;
  const hymn = hymns.find((h) => h.number === number);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!hymn) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Hino nº {number} não encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.viewer}>
        <ZoomableImage source={hymn.image} naturalWidth={hymn.width} naturalHeight={hymn.height} />
      </View>

      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {hymn.number} · {hymn.title}
        </Text>
        <Pressable hitSlop={12} onPress={() => toggleFavorite(hymn.number)}>
          <Text style={styles.headerStar}>{isFavorite(hymn.number) ? "★" : "☆"}</Text>
        </Pressable>
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
    paddingTop: 48,
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
  headerStar: { color: "#e0a30f", fontSize: 22 },
});
