import type { MapLightPreset } from "@/constants/settings/mapLayersTypes";
import type { MarkerColors } from "@/constants/colors/types";

export type MapOverlayColors = {
  marker: MarkerColors;
  unfocusedLineSegment: string;
  focusedLineSegment: string;
};

const DAY_OVERLAY: MapOverlayColors = {
  marker: {
    defaultIcon: "#000000",
    clusterIcon: "#000000",
    text: "#000000",
    textHalo: "#ffffff",
  },
  unfocusedLineSegment: "#6b7280",
  focusedLineSegment: "#000000",
};

const NIGHT_OVERLAY: MapOverlayColors = {
  marker: {
    defaultIcon: "#ffffff",
    clusterIcon: "#ffffff",
    text: "#ffffff",
    textHalo: "#000000",
  },
  unfocusedLineSegment: "#d1d5db",
  focusedLineSegment: "#ffffff",
};

export function resolveMapOverlayColors(
  lightPreset: MapLightPreset,
): MapOverlayColors {
  if (lightPreset === "dusk" || lightPreset === "night") {
    return NIGHT_OVERLAY;
  }
  return DAY_OVERLAY;
}
