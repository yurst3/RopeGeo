import { AppleDirectionsButton } from "@/components/buttons/standard/AppleDirectionsButton";
import { GoogleDirectionsButton } from "@/components/buttons/standard/GoogleDirectionsButton";
import { openAppleMaps, openGoogleMaps } from "@/utils/navigation/openExternalMaps";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { MiniMapType } from "ropegeo-common/models";

import {
  EXPAND_BUTTON_INSET,
  MAP_OVERLAY_BUTTON_GAP,
} from "@/utils/minimap/miniMapOverlayLayout";

export {
  EXPAND_BUTTON_SIZE,
  EXPAND_BUTTON_INSET,
  MAP_OVERLAY_BUTTON_GAP,
} from "@/utils/minimap/miniMapOverlayLayout";

/** True when the minimap is a page tile map ({@link MiniMapType.Page}). */
export function isPageMiniMapType(t: MiniMapType): boolean {
  return t === MiniMapType.Page;
}

/** True when the minimap is the centered-region fallback ({@link MiniMapType.CenteredRegion}). */
export function isCenteredRegionMiniMapType(t: MiniMapType): boolean {
  return t === MiniMapType.CenteredRegion;
}

export const MINI_MAP_BORDER_RADIUS = 12;
/** Above scroll content (1000), below seam/header chrome (2001+ / 3600). */
export const MINI_MAP_COLLAPSED_Z_INDEX = 1100;
/** Fullscreen expand: above page chrome while expanded. */
export const MINI_MAP_EXPANDED_Z_INDEX = 5000;

export const CAMERA_PADDING = {
  paddingTop: 12,
  paddingBottom: 52,
  paddingLeft: 12,
  paddingRight: 12,
} as const;

/** Default `animationDuration` for `Camera#setCamera` bounds fits; line-highlight wait uses the same value. */
export const MINIMAP_FIT_BOUNDS_ANIMATION_MS = 300;

export const minimapStyles = StyleSheet.create({
  wrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: MINI_MAP_BORDER_RADIUS,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e5e7eb",
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: MINI_MAP_BORDER_RADIUS,
  },
  mapPlaceholder: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  expandButton: {
    position: "absolute",
    bottom: EXPAND_BUTTON_INSET,
    right: EXPAND_BUTTON_INSET,
  },
  directionsButtonRow: {
    position: "absolute",
    bottom: EXPAND_BUTTON_INSET,
    left: EXPAND_BUTTON_INSET,
    flexDirection: "row",
    alignItems: "center",
    gap: MAP_OVERLAY_BUTTON_GAP,
  },
});

export function MiniMapDirectionsButtons({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}) {
  const onApple = useCallback(() => {
    void openAppleMaps(lat, lon);
  }, [lat, lon]);

  const onGoogle = useCallback(() => {
    void openGoogleMaps(lat, lon);
  }, [lat, lon]);

  return (
    <View style={minimapStyles.directionsButtonRow} pointerEvents="box-none">
      <AppleDirectionsButton onPress={onApple} />
      <GoogleDirectionsButton onPress={onGoogle} />
    </View>
  );
}
