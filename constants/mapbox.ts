import type { MapBasemap } from "@/constants/settings/mapLayersTypes";

export const MAPBOX_STYLE_URLS: Record<MapBasemap, string> = {
  standard: "mapbox://styles/yurst3/cmt3184os002w01sk44ph6dl0",
  satellite: "mapbox://styles/yurst3/cmt95nmi200au01sk8uul4i0o",
};

/** @deprecated Use MAPBOX_STYLE_URLS with map basemap settings. */
export const MAPBOX_STYLE_URL = MAPBOX_STYLE_URLS.standard;

/** Insert custom layers into the style's `top` slot (above basemap, below place labels). */
export const MAPBOX_CUSTOM_LAYER_SLOT = "top" as const;

export const MAPBOX_STYLE_IMPORT_ID = "basemap";

export const MAPBOX_CONTOUR_LAYER_IDS = [
  "contour",
  "contour-halo",
  "contour-label",
] as const;

/** Custom trail overlay layers on Explore (see {@link TrailsLayer}). */
export const MAPBOX_TRAILS_LINE_LAYER_IDS = [
  "trails-line-layer-unfocused",
  "trails-line-layer-focused",
] as const;

/** Route marker overlay layers on Explore (see {@link RouteMarkersLayer}). */
export const MAPBOX_ROUTES_SYMBOL_LAYER_IDS = [
  "routes-symbol-layer-unclustered",
  "routes-symbol-layer-clusters",
] as const;

/** Place trail lines above elevation contour labels. */
export const MAPBOX_TRAILS_ABOVE_LAYER_ID = MAPBOX_CONTOUR_LAYER_IDS[2];

/** Place route markers above the focused trail line layer. */
export const MAPBOX_ROUTES_ABOVE_LAYER_ID =
  MAPBOX_TRAILS_LINE_LAYER_IDS[MAPBOX_TRAILS_LINE_LAYER_IDS.length - 1];

/** Style / overlay layer ids whose absence during style transitions is safe to ignore. */
export const MAPBOX_IGNORABLE_MISSING_LAYER_IDS = [
  ...MAPBOX_CONTOUR_LAYER_IDS,
  ...MAPBOX_TRAILS_LINE_LAYER_IDS,
  ...MAPBOX_ROUTES_SYMBOL_LAYER_IDS,
] as const;

/** @deprecated Use {@link MAPBOX_CONTOUR_LAYER_IDS}. */
export const MAPBOX_SATELLITE_CONTOUR_LAYER_IDS = MAPBOX_CONTOUR_LAYER_IDS;

/** Zion National Park — [lng, lat]. Used for map-layers sheet previews. */
export const MAP_LAYERS_PREVIEW_CENTER: [number, number] = [-112.987139, 37.200190];

export const MAP_LAYERS_PREVIEW_ZOOM = 12;
