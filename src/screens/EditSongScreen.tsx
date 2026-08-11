import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLibrary } from "../context/LibraryContext";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "EditSong">;

export default function EditSongScreen({ route, navigation }: Props) {
  const { categoryId, songId } = route.params;
  const { songsFor, moveSongImage, removeSongImage, addSongImages } = useLibrary();
  const [busy, setBusy] = useState(false);

  const song = songsFor(categoryId).find((s) => s.id === songId);

  if (!song) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Música não encontrada.</Text>
      </SafeAreaView>
    );
  }

  const runBusy = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = (index: number) => {
    if (song.images.length <= 1) {
      Alert.alert("Não é possível remover", "A música precisa ter pelo menos uma imagem.");
      return;
    }
    Alert.alert("Remover imagem", `Remover a imagem ${index + 1}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => runBusy(() => removeSongImage(categoryId, songId, index)),
      },
    ]);
  };

  const handleAddMore = async () => {
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
    await runBusy(() =>
      addSongImages(
        categoryId,
        songId,
        result.assets.map((img) => ({ uri: img.uri, width: img.width, height: img.height }))
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Editar imagens
        </Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {song.images.map((img, index) => (
          <View key={index} style={styles.row}>
            <Image source={img.source} style={styles.thumbnail} resizeMode="cover" />
            <Text style={styles.pageLabel}>Página {index + 1}</Text>
            <View style={styles.rowActions}>
              <Pressable
                hitSlop={8}
                disabled={busy || index === 0}
                style={[styles.moveButton, (busy || index === 0) && styles.moveButtonDisabled]}
                onPress={() => runBusy(() => moveSongImage(categoryId, songId, index, "up"))}
              >
                <Text style={styles.moveButtonText}>▲</Text>
              </Pressable>
              <Pressable
                hitSlop={8}
                disabled={busy || index === song.images.length - 1}
                style={[
                  styles.moveButton,
                  (busy || index === song.images.length - 1) && styles.moveButtonDisabled,
                ]}
                onPress={() => runBusy(() => moveSongImage(categoryId, songId, index, "down"))}
              >
                <Text style={styles.moveButtonText}>▼</Text>
              </Pressable>
              <Pressable hitSlop={8} disabled={busy} onPress={() => handleRemove(index)}>
                <Text style={styles.removeButtonText}>🗑</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable style={styles.addMoreButton} onPress={handleAddMore} disabled={busy}>
          <Text style={styles.addMoreButtonText}>+ Adicionar mais imagens</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyText: { fontSize: 16, color: colors.textDark, textAlign: "center", marginTop: 40 },
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
  list: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  thumbnail: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.inputBackground },
  pageLabel: { flex: 1, marginLeft: 12, fontSize: 15, color: colors.textDark, fontWeight: "600" },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  moveButton: { padding: 4 },
  moveButtonDisabled: { opacity: 0.25 },
  moveButtonText: { fontSize: 16, color: colors.primary },
  removeButtonText: { fontSize: 18 },
  addMoreButton: {
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  addMoreButtonText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
});
