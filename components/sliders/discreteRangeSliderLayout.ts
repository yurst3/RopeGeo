import { DEFAULT_BADGE_SIZE } from "@/components/badges/Badge";

/**
 * Extra horizontal room for merged thumb titles beyond the track width.
 * Matches typical screen/sheet content inset (16) so labels can bleed slightly.
 */
const DEFAULT_HORIZONTAL_BLEED = 16;

export const THUMB_HIT = 48;
export const TRACK_HEIGHT = 10;
/** Diameter of each step dot on the track */
export const TICK_SIZE = 10;
export const TICK_RADIUS = TICK_SIZE / 2;

export const THUMB_TOP = 0;
export const THUMB_TITLE_COL_W = 64;
export const THUMB_TITLE_MERGED_W = 168;
export const THUMB_LABEL_MAX_LINES = 2;
export const TICK_LABEL_MAX_LINES = 2;

const TEXT_LINE_HEIGHT_FACTOR = 1.2;
const LABEL_TRACK_OVERLAP = 8;
const CANVAS_BOTTOM_PAD = 2;
/** Pull tick labels up into the lower hit-band so they sit closer to the track. */
const TICK_LABELS_OVERLAP_INTO_HIT = 10;
/** Thumb titles stay just below scaled badge bottoms (not the full tick row). */
const THUMB_TITLES_GAP_BELOW_BADGE = 0;

/**
 * Pan must move this many px horizontally before the thumb gesture activates,
 * so slight vertical motion doesn’t hand off to the parent ScrollView first.
 */
export const THUMB_PAN_ACTIVE_OFFSET_X = 10;
/**
 * Allow this much vertical wander (px) before the pan fails; larger = more
 * forgiving diagonal drags, but very vertical scrolls may feel stickier first.
 */
export const THUMB_PAN_FAIL_OFFSET_Y = 40;

/** Gap between 48px hit boxes when min === max so both thumbs stay grabbable. */
const THUMB_GAP_WHEN_COLLAPSED = 24;

export function computeMultiSliderCanvasLayout(
  multiSliderThumbScale: number,
  thumbLabelMaxPx: number,
  tickLabelMaxPx: number,
  showTickLabels: boolean,
) {
  const badgeOverflowBelow = Math.max(
    0,
    Math.round((DEFAULT_BADGE_SIZE * multiSliderThumbScale - THUMB_HIT) / 2),
  );
  const tickRowH = Math.ceil(
    tickLabelMaxPx * TICK_LABEL_MAX_LINES * TEXT_LINE_HEIGHT_FACTOR,
  );
  const thumbRowH = Math.ceil(
    thumbLabelMaxPx * THUMB_LABEL_MAX_LINES * TEXT_LINE_HEIGHT_FACTOR,
  );
  const thumbTitlesBelowBadge =
    THUMB_HIT + badgeOverflowBelow + THUMB_TITLES_GAP_BELOW_BADGE;
  const tickLabelsTop = showTickLabels
    ? THUMB_HIT - TICK_LABELS_OVERLAP_INTO_HIT
    : thumbTitlesBelowBadge;
  const thumbTitlesTop = showTickLabels
    ? Math.max(
        tickLabelsTop + tickRowH - LABEL_TRACK_OVERLAP,
        thumbTitlesBelowBadge,
      )
    : thumbTitlesBelowBadge;
  const canvasHeight = thumbTitlesTop + thumbRowH + CANVAS_BOTTOM_PAD;

  return {
    canvasHeight,
    tickLabelsTop,
    tickRowH,
    thumbTitlesTop,
    thumbRowH,
  };
}

export function thumbCenterX(
  index: number,
  trackWidth: number,
  n: number,
): number {
  if (n <= 1) return trackWidth / 2;
  const inner = Math.max(0, trackWidth - THUMB_HIT);
  return THUMB_HIT / 2 + (index / (n - 1)) * inner;
}

/**
 * Tick-label slot centered on {@link thumbCenterX}, as wide as possible without
 * crossing midpoints between neighboring ticks (or the track edges).
 */
export function tickLabelSlotBounds(
  index: number,
  trackWidth: number,
  n: number,
): { left: number; width: number } {
  if (n <= 0 || trackWidth <= 0) return { left: 0, width: 0 };
  const cx = thumbCenterX(index, trackWidth, n);
  const leftEdge =
    index === 0 ? 0 : (thumbCenterX(index - 1, trackWidth, n) + cx) / 2;
  const rightEdge =
    index === n - 1
      ? trackWidth
      : (cx + thumbCenterX(index + 1, trackWidth, n)) / 2;
  const maxWidth = 2 * Math.min(cx - leftEdge, rightEdge - cx);
  const width = Math.max(0, maxWidth);
  return {
    left: cx - width / 2,
    width,
  };
}

/**
 * When low and high share the same discrete index, nudge centers apart (with edge clamp)
 * so PanResponder hit areas do not stack.
 */
export function thumbDisplayCenters(
  lowIdx: number,
  highIdx: number,
  trackWidth: number,
  n: number,
): { xLow: number; xHigh: number } {
  const baseLow = thumbCenterX(lowIdx, trackWidth, n);
  const baseHigh = thumbCenterX(highIdx, trackWidth, n);
  if (lowIdx !== highIdx) {
    return { xLow: baseLow, xHigh: baseHigh };
  }
  const halfSep = (THUMB_HIT + THUMB_GAP_WHEN_COLLAPSED) / 4;
  let xLow = baseLow - halfSep;
  let xHigh = baseHigh + halfSep;
  const minC = THUMB_HIT / 2;
  const maxC = trackWidth - THUMB_HIT / 2;
  if (xLow < minC) {
    const shift = minC - xLow;
    xLow = minC;
    xHigh = Math.min(maxC, xHigh + shift);
  }
  if (xHigh > maxC) {
    const shift = xHigh - maxC;
    xHigh = maxC;
    xLow = Math.max(minC, xLow - shift);
  }
  return { xLow, xHigh };
}

export function mergedThumbLabelBounds(
  centerX: number,
  trackWidth: number,
  maxW: number = THUMB_TITLE_MERGED_W,
  horizontalBleed: number = DEFAULT_HORIZONTAL_BLEED,
): { left: number; width: number } {
  const halfAvailable = Math.min(
    centerX + horizontalBleed,
    trackWidth - centerX + horizontalBleed,
  );
  const width = Math.min(maxW, Math.max(0, halfAvailable * 2));
  return {
    left: centerX - width / 2,
    width,
  };
}
