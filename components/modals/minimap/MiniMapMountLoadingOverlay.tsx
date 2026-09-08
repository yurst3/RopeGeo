import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/**
 * Full-bleed cover while a handoff / remounted MapView is still loading.
 * Sits under expanded chrome (header, legend, buttons) so those stay visible.
 */
export function MiniMapMountLoadingOverlay() {
  const { loadingIndicator, map } = useColorTheme();

  return (
    <View
      style={[styles.overlay, { backgroundColor: map.minimap.background }]}
      pointerEvents="auto"
      accessibilityLabel="Loading map"
    >
      <ActivityIndicator size="large" color={loadingIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    elevation: 3,
    justifyContent: "center",
    alignItems: "center",
  },
});
