/**
 * Mapbox style image ids registered via `Images#nativeAssetImages`.
 * PNGs are copied into native projects by `plugins/withMapboxNativeMarkerImages`
 * during `expo prebuild` (see `plugins/mapboxNativeMarkerAssets.js`).
 */
export const ROUTE_MARKER_IMAGE = "route_marker" as const;
export const ROUTE_MARKER_SELECTED_IMAGE = "route_marker_selected" as const;
export const ROUTE_MARKER_CLUSTER_IMAGE = "route_marker_cluster" as const;

/** Passed to `<Images nativeAssetImages={...} />` on explore and minimap maps. */
export const ROUTE_MARKER_NATIVE_ASSET_IMAGES = [
  { name: ROUTE_MARKER_IMAGE, sdf: true },
  { name: ROUTE_MARKER_SELECTED_IMAGE, sdf: true },
  { name: ROUTE_MARKER_CLUSTER_IMAGE, sdf: true },
] as const;
