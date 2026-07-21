export type FocusCameraPadding = {
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
};

/** Breathing room between the focused feature and the header/overlay edges. */
export const FOCUS_PADDING_GAP = 12;
/**
 * Smallest usable viewport between top and bottom padding; below this the
 * measured chrome is inconsistent (e.g. mid-animation) and we keep the fallback.
 */
export const MIN_FOCUS_VIEWPORT_HEIGHT = 120;

/**
 * Camera padding that frames a focused feature between the minimap header and
 * the bottom overlay row (legend / relevant-info cards). Both edges come from
 * measured layout; when either is missing or the remaining viewport is too
 * small, the generic expanded padding is used instead.
 */
export function focusCameraPadding({
  headerBottomY,
  overlayTopY,
  windowHeight,
  fallback,
}: {
  /** Window-Y of the bottom edge of the minimap title/header row. */
  headerBottomY: number | null;
  /** Window-Y of the top edge of the tallest bottom overlay card. */
  overlayTopY: number | null;
  windowHeight: number;
  fallback: FocusCameraPadding;
}): FocusCameraPadding {
  if (headerBottomY == null || overlayTopY == null) return fallback;
  const paddingTop = headerBottomY + FOCUS_PADDING_GAP;
  const paddingBottom = Math.max(0, windowHeight - overlayTopY) + FOCUS_PADDING_GAP;
  if (windowHeight - paddingTop - paddingBottom < MIN_FOCUS_VIEWPORT_HEIGHT) {
    return fallback;
  }
  return {
    paddingTop,
    paddingBottom,
    paddingLeft: fallback.paddingLeft,
    paddingRight: fallback.paddingRight,
  };
}

export const POINT_FOCUS_MIN_ZOOM = 15;
export const POINT_FOCUS_ANIMATION_MS = 280;

/**
 * `setCamera` stop for a selected point: keeps at least {@link POINT_FOCUS_MIN_ZOOM}
 * and centers the marker halfway between the header and the overlay row via padding.
 */
export function pointFocusCameraStop(
  lngLat: [number, number],
  currentZoom: number,
  padding: FocusCameraPadding,
): {
  centerCoordinate: [number, number];
  zoomLevel: number;
  padding: FocusCameraPadding;
  animationDuration: number;
} {
  return {
    centerCoordinate: lngLat,
    zoomLevel: Math.max(currentZoom, POINT_FOCUS_MIN_ZOOM),
    padding,
    animationDuration: POINT_FOCUS_ANIMATION_MS,
  };
}
