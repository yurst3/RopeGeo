import { useSettings } from "@/context/app/SettingsContext";
import {
  mapLayersAreCustomized,
  resolvedMapStyleUrl,
  shouldShowSatelliteContours,
} from "@/utils/map/mapLayersSettings";
import { useMemo } from "react";

export function useMapLayersSettings() {
  const { settings } = useSettings();
  return useMemo(
    () => ({
      mapBasemap: settings.mapBasemap,
      mapLightPreset: settings.mapLightPreset,
      showSatelliteContours: settings.showSatelliteContours,
      styleUrl: resolvedMapStyleUrl(settings),
      showContoursOnMap: shouldShowSatelliteContours(settings),
      customized: mapLayersAreCustomized(settings),
    }),
    [
      settings.mapBasemap,
      settings.mapLightPreset,
      settings.showSatelliteContours,
      settings,
    ],
  );
}
