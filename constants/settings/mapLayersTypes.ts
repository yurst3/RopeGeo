export const MAP_BASEMAPS = ["standard", "satellite"] as const;
export type MapBasemap = (typeof MAP_BASEMAPS)[number];

export const MAP_LIGHT_PRESETS = ["dawn", "day", "dusk", "night"] as const;
export type MapLightPreset = (typeof MAP_LIGHT_PRESETS)[number];

export const DEFAULT_MAP_BASEMAP: MapBasemap = "standard";
export const DEFAULT_MAP_LIGHT_PRESET: MapLightPreset = "day";
export const DEFAULT_SHOW_SATELLITE_CONTOURS = true;

export function isMapBasemap(v: unknown): v is MapBasemap {
  return v === "standard" || v === "satellite";
}

export function isMapLightPreset(v: unknown): v is MapLightPreset {
  return (
    v === "dawn" ||
    v === "day" ||
    v === "dusk" ||
    v === "night"
  );
}
