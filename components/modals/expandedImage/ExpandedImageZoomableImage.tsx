import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Image,
  type ImageLoadEventData,
  type ImageProps,
} from "expo-image";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
/** Below this scale after pinch, snap back to 1× and reset pan. */
const SNAP_DOWN_THRESHOLD = 1.02;

/** 1× horizontal swipe: rubber-band pull + threshold to change image (beta gallery). */
const EDGE_SWIPE_RUBBER = 88;
const EDGE_SWIPE_COMMIT_PX = 72;
const EDGE_SWIPE_COMMIT_VELOCITY = 520;

/**
 * Clamp translation so the `contentFit="contain"` bitmap (after scale around view center)
 * cannot be panned entirely off-screen. Uses the same geometry as `containImageBottomY`.
 */
function clampPanForContain(
  cw: number,
  ch: number,
  iw: number,
  ih: number,
  s: number,
  tx: number,
  ty: number,
): { tx: number; ty: number } {
  "worklet";
  if (cw <= 0 || ch <= 0 || s < MIN_SCALE) {
    return { tx: 0, ty: 0 };
  }
  /** Fallback before intrinsic size is known: symmetric clamp (legacy behavior). */
  if (iw <= 0 || ih <= 0) {
    const maxX = (cw * (s - MIN_SCALE)) / 2;
    const maxY = (ch * (s - MIN_SCALE)) / 2;
    return {
      tx: clamp(tx, -maxX, maxX),
      ty: clamp(ty, -maxY, maxY),
    };
  }

  const fit = Math.min(cw / iw, ch / ih);
  const dispW = iw * fit;
  const dispH = ih * fit;
  const ox = (cw - dispW) / 2;
  const oy = (ch - dispH) / 2;
  const cx = cw / 2;
  const cy = ch / 2;

  const corners = [
    [ox, oy],
    [ox + dispW, oy],
    [ox, oy + dispH],
    [ox + dispW, oy + dispH],
  ];

  let minXp = Infinity;
  let maxXp = -Infinity;
  let minYp = Infinity;
  let maxYp = -Infinity;

  for (let i = 0; i < 4; i++) {
    const px = corners[i][0];
    const py = corners[i][1];
    const xps = cx + s * (px - cx);
    const yps = cy + s * (py - cy);
    if (xps < minXp) minXp = xps;
    if (xps > maxXp) maxXp = xps;
    if (yps < minYp) minYp = yps;
    if (yps > maxYp) maxYp = yps;
  }

  /** Left/right edges in [0, cw]: tx ∈ [-minXp, cw - maxXp] — sort when scaled width > viewport. */
  const txA = -minXp;
  const txB = cw - maxXp;
  const txLo = txA <= txB ? txA : txB;
  const txHi = txA <= txB ? txB : txA;

  /** Top/bottom edges in [0, ch]: ty ∈ [-minYp, ch - maxYp] — sort when scaled height > viewport. */
  const tyA = -minYp;
  const tyB = ch - maxYp;
  const tyLo = tyA <= tyB ? tyA : tyB;
  const tyHi = tyA <= tyB ? tyB : tyA;

  return {
    tx: clamp(tx, txLo, txHi),
    ty: clamp(ty, tyLo, tyHi),
  };
}

export type ExpandedImageZoomableImageProps = {
  source: NonNullable<ImageProps["source"]>;
  /** 0 while loading full bitmap, then 1. */
  imageOpacity: number;
  onLoad: (ev: ImageLoadEventData) => void;
  onLoadEnd: () => void;
  /** Zoom/pan clamp bounds (expanded stage size). */
  containerWidth: number;
  containerHeight: number;
  /** Intrinsic pixel size from `onLoad` (required for accurate contain bounds). */
  intrinsicWidth: number;
  intrinsicHeight: number;
  /** Single tap on the image toggles chrome visibility. */
  onToggleUi?: () => void;
  /** Pinch or pan (when zoomed) hides chrome. */
  onZoomPanHideUi?: () => void;
  /**
   * At 1× zoom only: swipe left → next, swipe right → previous (rubber-band at edges).
   * Omit when there is no adjacent image with a full-res URL.
   */
  onNavigateToNext?: () => void;
  onNavigateToPrevious?: () => void;
  /** When true, 1× horizontal drags do not navigate (e.g. outer gallery `FlatList` handles swipes). */
  disableEdgeNavigation?: boolean;
  /** Fires when pinch ends and the image is effectively zoomed vs 1× (for disabling outer pager scroll). */
  onZoomedChange?: (zoomed: boolean) => void;
  /**
   * When true and `isZoomedForPan` is false, pan fails on horizontal drags so a parent
   * horizontal `FlatList` can scroll immediately (gallery paging).
   */
  deferHorizontalPanToParent?: boolean;
  /** When true, use full pan (user has zoomed in); when false with `deferHorizontalPanToParent`, restrict pan. */
  isZoomedForPan?: boolean;
};

/**
 * Pinch-to-zoom and pan when zoomed, for the expanded full image.
 */
export function ExpandedImageZoomableImage({
  source,
  imageOpacity,
  onLoad,
  onLoadEnd,
  containerWidth,
  containerHeight,
  intrinsicWidth,
  intrinsicHeight,
  onToggleUi,
  onZoomPanHideUi,
  onNavigateToNext,
  onNavigateToPrevious,
  disableEdgeNavigation = false,
  onZoomedChange,
  deferHorizontalPanToParent = false,
  isZoomedForPan = false,
}: ExpandedImageZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTX = useSharedValue(0);
  const savedTY = useSharedValue(0);
  /** Horizontal rubber-band at 1× when navigating between images. */
  const edgeSwipeX = useSharedValue(0);
  const canNavigateNextSv = useSharedValue(false);
  const canNavigatePrevSv = useSharedValue(false);
  const disableEdgeNavSv = useSharedValue(false);
  /** One-shot per pinch: notify parent scroll lock as soon as scale crosses zoom threshold. */
  const pinchCrossedZoomThresholdSv = useSharedValue(false);

  const cwSv = useSharedValue(0);
  const chSv = useSharedValue(0);
  const iwSv = useSharedValue(0);
  const ihSv = useSharedValue(0);

  useEffect(() => {
    cwSv.value = containerWidth;
    chSv.value = containerHeight;
  }, [containerWidth, containerHeight, cwSv, chSv]);

  useEffect(() => {
    iwSv.value = intrinsicWidth;
    ihSv.value = intrinsicHeight;
  }, [intrinsicWidth, intrinsicHeight, iwSv, ihSv]);

  useEffect(() => {
    canNavigateNextSv.value = onNavigateToNext != null;
    canNavigatePrevSv.value = onNavigateToPrevious != null;
  }, [
    onNavigateToNext,
    onNavigateToPrevious,
    canNavigateNextSv,
    canNavigatePrevSv,
  ]);

  useEffect(() => {
    disableEdgeNavSv.value = disableEdgeNavigation;
  }, [disableEdgeNavigation, disableEdgeNavSv]);

  const notifyZoomed = useCallback((zoomed: boolean) => {
    onZoomedChange?.(zoomed);
  }, [onZoomedChange]);

  const onZoomPanHideUiRef = useRef(onZoomPanHideUi);
  onZoomPanHideUiRef.current = onZoomPanHideUi;
  const onToggleUiRef = useRef(onToggleUi);
  onToggleUiRef.current = onToggleUi;

  const fireNavigateNext = useCallback(() => {
    onNavigateToNext?.();
  }, [onNavigateToNext]);

  const fireNavigatePrevious = useCallback(() => {
    onNavigateToPrevious?.();
  }, [onNavigateToPrevious]);

  /* eslint-disable react-hooks/exhaustive-deps -- shared values stable; reset zoom only when `source` changes */
  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTX.value = 0;
    savedTY.value = 0;
    edgeSwipeX.value = 0;
  }, [source]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const restrictHorizontalPanForParent =
    deferHorizontalPanToParent && !isZoomedForPan;

  const runHideChrome = useCallback(() => {
    onZoomPanHideUiRef.current?.();
  }, []);

  const runToggleUi = useCallback(() => {
    onToggleUiRef.current?.();
  }, []);

  const composed = useMemo(() => {
    const pinchGesture = Gesture.Pinch()
      .onBegin(() => {
        savedScale.value = scale.value;
        edgeSwipeX.value = 0;
        pinchCrossedZoomThresholdSv.value = false;
        runOnJS(runHideChrome)();
      })
      .onUpdate((e) => {
        const cw = cwSv.value;
        const ch = chSv.value;
        const prevScale = scale.value;
        const nextScale = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
        const cx = cw / 2;
        const cy = ch / 2;
        if (cw > 0 && ch > 0 && prevScale > 0) {
          const ratio = nextScale / prevScale;
          const fx = e.focalX;
          const fy = e.focalY;
          translateX.value = fx - cx - ratio * (fx - cx - translateX.value);
          translateY.value = fy - cy - ratio * (fy - cy - translateY.value);
        }
        scale.value = nextScale;
        if (
          nextScale > 1.08 &&
          !pinchCrossedZoomThresholdSv.value
        ) {
          pinchCrossedZoomThresholdSv.value = true;
          runOnJS(notifyZoomed)(true);
        }
        const iw = iwSv.value;
        const ih = ihSv.value;
        const c = clampPanForContain(
          cw,
          ch,
          iw,
          ih,
          nextScale,
          translateX.value,
          translateY.value,
        );
        translateX.value = c.tx;
        translateY.value = c.ty;
      })
      .onEnd(() => {
        if (scale.value < SNAP_DOWN_THRESHOLD) {
          scale.value = withTiming(1, { duration: 200 }, (finished) => {
            if (finished) {
              runOnJS(notifyZoomed)(false);
            }
          });
          translateX.value = withTiming(0, { duration: 200 });
          translateY.value = withTiming(0, { duration: 200 });
          savedScale.value = 1;
          savedTX.value = 0;
          savedTY.value = 0;
          return;
        }
        savedScale.value = scale.value;
        const cw = cwSv.value;
        const ch = chSv.value;
        const iw = iwSv.value;
        const ih = ihSv.value;
        const s = scale.value;
        const c = clampPanForContain(
          cw,
          ch,
          iw,
          ih,
          s,
          translateX.value,
          translateY.value,
        );
        translateX.value = c.tx;
        translateY.value = c.ty;
        savedTX.value = translateX.value;
        savedTY.value = translateY.value;
        runOnJS(notifyZoomed)(true);
      });

    const panBase = Gesture.Pan().maxPointers(1);
    const panConfigured = restrictHorizontalPanForParent
      ? panBase
          .activeOffsetY([-16, 16])
          .failOffsetX([-12, 12])
      : panBase
          .activeOffsetX([-12, 12])
          .activeOffsetY([-12, 12]);

    const panGesture = panConfigured
      .onBegin(() => {
        savedTX.value = translateX.value;
        savedTY.value = translateY.value;
      })
      .onStart(() => {
        if (scale.value > MIN_SCALE) {
          runOnJS(runHideChrome)();
        }
      })
      .onUpdate((e) => {
        if (scale.value <= MIN_SCALE) {
          if (disableEdgeNavSv.value) {
            return;
          }
          let minR = 0;
          let maxR = 0;
          if (canNavigateNextSv.value) {
            minR = -EDGE_SWIPE_RUBBER;
          }
          if (canNavigatePrevSv.value) {
            maxR = EDGE_SWIPE_RUBBER;
          }
          edgeSwipeX.value = clamp(e.translationX, minR, maxR);
          return;
        }
        const cw = cwSv.value;
        const ch = chSv.value;
        const iw = iwSv.value;
        const ih = ihSv.value;
        const s = scale.value;
        let nx = savedTX.value + e.translationX;
        let ny = savedTY.value + e.translationY;
        const c = clampPanForContain(cw, ch, iw, ih, s, nx, ny);
        nx = c.tx;
        ny = c.ty;
        translateX.value = nx;
        translateY.value = ny;
      })
      .onEnd((e) => {
        if (scale.value <= MIN_SCALE) {
          if (!disableEdgeNavSv.value) {
            const tx = e.translationX;
            const vx = e.velocityX;
            const goNext =
              canNavigateNextSv.value &&
              (tx < -EDGE_SWIPE_COMMIT_PX || vx < -EDGE_SWIPE_COMMIT_VELOCITY);
            const goPrev =
              canNavigatePrevSv.value &&
              (tx > EDGE_SWIPE_COMMIT_PX || vx > EDGE_SWIPE_COMMIT_VELOCITY);
            if (goNext) {
              runOnJS(fireNavigateNext)();
            } else if (goPrev) {
              runOnJS(fireNavigatePrevious)();
            }
            edgeSwipeX.value = withTiming(0, { duration: 180 });
          }
          return;
        }
        savedTX.value = translateX.value;
        savedTY.value = translateY.value;
      });

    const tapGesture = Gesture.Tap()
      .numberOfTaps(1)
      .maxDuration(300)
      .onEnd((_e, success) => {
        if (success) {
          runOnJS(runToggleUi)();
        }
      });

    return Gesture.Simultaneous(tapGesture, pinchGesture, panGesture);
    /* Shared values (scale, translate*, etc.) are stable object refs; worklets always read `.value`. */
  }, [
    restrictHorizontalPanForParent,
    notifyZoomed,
    fireNavigateNext,
    fireNavigatePrevious,
    runHideChrome,
    runToggleUi,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    const at1x = scale.value <= MIN_SCALE + 0.001;
    return {
      transform: [
        { translateX: at1x ? edgeSwipeX.value : translateX.value },
        { translateY: at1x ? 0 : translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: imageOpacity },
          animatedStyle,
        ]}
      >
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          onLoad={onLoad}
          onLoadEnd={onLoadEnd}
        />
      </Animated.View>
    </GestureDetector>
  );
}
