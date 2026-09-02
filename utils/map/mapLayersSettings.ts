import { MAPBOX_STYLE_URLS } from "@/constants/mapbox";
import type { Settings } from "@/constants/settings";
import {
  DEFAULT_MAP_BASEMAP,
  DEFAULT_MAP_LIGHT_PRESET,
  DEFAULT_SHOW_SATELLITE_CONTOURS,
  type MapBasemap,
} from "@/constants/settings/mapLayersTypes";

export function resolvedMapStyleUrl(settings: Settings): string {
  return MAPBOX_STYLE_URLS[settings.mapBasemap];
}

export function mapLayersAreCustomized(settings: Settings): boolean {
  return (
    settings.mapBasemap !== DEFAULT_MAP_BASEMAP ||
    settings.mapLightPreset !== DEFAULT_MAP_LIGHT_PRESET ||
    settings.showSatelliteContours !== DEFAULT_SHOW_SATELLITE_CONTOURS
  );
}

export function shouldShowSatelliteContours(settings: Settings): boolean {
  return settings.showSatelliteContours;
}

export type MapLayersDraft = {
  mapBasemap: MapBasemap;
  mapLightPreset: Settings["mapLightPreset"];
  showSatelliteContours: boolean;
};

export function mapLayersDraftFromSettings(settings: Settings): MapLayersDraft {
  return {
    mapBasemap: settings.mapBasemap,
    mapLightPreset: settings.mapLightPreset,
    showSatelliteContours: settings.showSatelliteContours,
  };
}
