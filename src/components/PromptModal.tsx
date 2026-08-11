import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme";

type Props = {
  visible: boolean;
  title: string;
  placeholder?: string;
  confirmLabel?: string;
  initialValue?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
};

export default function PromptModal({
  visible,
  title,
  placeholder,
  confirmLabel = "Salvar",
  initialValue = "",
  onCancel,
  onConfirm,
}: Props) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const confirm = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#9a9a9a"
            value={value}
            onChangeText={setValue}
            autoFocus
            onSubmitEditing={confirm}
            returnKeyType="done"
          />
          <View style={styles.actions}>
            <Pressable style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.confirmButton]} onPress={confirm}>
              <Text style={[styles.buttonText, styles.confirmText]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  title: { fontSize: 17, fontWeight: "700", marginBottom: 12, color: colors.textDark },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  button: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  buttonText: { fontSize: 15, color: colors.textMuted, fontWeight: "600" },
  confirmButton: { backgroundColor: colors.primary },
  confirmText: { color: "#fff" },
});
