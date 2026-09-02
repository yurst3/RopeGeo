import { useSettings } from "@/context/app/SettingsContext";
import { resolveMapOverlayColors } from "@/utils/map/resolveMapOverlayColors";
import { useMemo } from "react";

export function useMapOverlayColors() {
  const { settings } = useSettings();
  return useMemo(
    () => resolveMapOverlayColors(settings.mapLightPreset),
    [settings.mapLightPreset],
  );
}
