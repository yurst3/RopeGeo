/** Geographic bounds used by page / region minimap cameras. */
export type GeoBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type CameraPadding = {
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
};

export type ViewportSize = {
  width: number;
  height: number;
};

/**
 * Mapbox GL / MapLibre camera world size in CSS pixels at zoom 0.
 * Bounds→zoom math must use this (not the 256 tile size).
 */
export const MAPBOX_WORLD_SIZE = 512;

/**
 * Arithmetic center of a bounds box. Fine for canyon-scale spans; continent-scale
 * boxes would want a Mercator midpoint for latitude.
 */
export function centerOfBounds(bounds: GeoBounds): [number, number] {
  return [(bounds.west + bounds.east) / 2, (bounds.south + bounds.north) / 2];
}

/** Mercator Y used by the classic Mapbox/Leaflet bounds-zoom algorithm. */
function latToMercatorY(latDeg: number): number {
  const sin = Math.sin((latDeg * Math.PI) / 180);
  const y = Math.log((1 + sin) / (1 - sin)) / 2;
  return Math.max(Math.min(y, Math.PI), -Math.PI) / 2;
}

function zoomForFraction(mapPx: number, worldPx: number, fraction: number): number {
  return Math.log(mapPx / worldPx / fraction) / Math.LN2;
}

/**
 * Zoom that fits `bounds` into a padded viewport, using Web Mercator math so the
 * caller can `setCamera({ centerCoordinate, zoomLevel })` without relying on
 * native bounds→zoom (which can leave zoom unchanged when the map surface size
 * is wrong after a collapse animation).
 *
 * Returns `-Infinity` when the usable viewport or geographic span is degenerate.
 */
export function zoomForBounds(
  bounds: GeoBounds,
  viewport: ViewportSize,
  padding: CameraPadding,
  worldSize: number = MAPBOX_WORLD_SIZE,
): number {
  const w = viewport.width - padding.paddingLeft - padding.paddingRight;
  const h = viewport.height - padding.paddingTop - padding.paddingBottom;
  if (w <= 0 || h <= 0) return Number.NEGATIVE_INFINITY;

  let lngSpan = bounds.east - bounds.west;
  if (lngSpan < 0) lngSpan += 360;
  const lngFraction = Math.max(lngSpan / 360, Number.EPSILON);

  const latFraction = Math.max(
    (latToMercatorY(bounds.north) - latToMercatorY(bounds.south)) / Math.PI,
    Number.EPSILON,
  );

  return Math.min(
    zoomForFraction(w, worldSize, lngFraction),
    zoomForFraction(h, worldSize, latFraction),
  );
}

export type BoundsFocusCameraStop = {
  centerCoordinate: [number, number];
  zoomLevel: number;
  animationDuration: number;
  heading?: number;
  pitch?: number;
  /** When set, Mapbox places `centerCoordinate` in the padded content region. */
  padding?: CameraPadding;
};

export type BoundsFocusCameraStopOptions = {
  heading?: number;
  pitch?: number;
  /**
   * When true, attach `padding` to the camera stop so the geographic center is
   * visually offset into the usable (non-chrome) area — same idea as point focus.
   */
  offsetCenterWithPadding?: boolean;
};

/**
 * Explicit center+zoom camera stop that fits `bounds` into a padded viewport.
 * Prefer this over Mapbox native bounds→zoom after a high zoom (e.g. point focus),
 * which can update center while leaving zoom stuck.
 *
 * Returns `null` when {@link zoomForBounds} is non-finite (degenerate viewport/span).
 */
export function boundsFocusCameraStop(
  bounds: GeoBounds,
  viewport: ViewportSize,
  padding: CameraPadding,
  animationDuration: number,
  options?: BoundsFocusCameraStopOptions,
): BoundsFocusCameraStop | null {
  const zoomLevel = zoomForBounds(bounds, viewport, padding);
  if (!Number.isFinite(zoomLevel)) return null;
  return {
    centerCoordinate: centerOfBounds(bounds),
    zoomLevel,
    animationDuration,
    ...(options?.heading != null ? { heading: options.heading } : {}),
    ...(options?.pitch != null ? { pitch: options.pitch } : {}),
    ...(options?.offsetCenterWithPadding === true ? { padding } : {}),
  };
}
