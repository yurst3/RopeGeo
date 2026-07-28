import { boundsPaddingForFullScreenMapScaled } from "@/utils/layout/buttonChromeLayout";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useEffect, useMemo, useRef } from "react";
import { Dimensions, useWindowDimensions } from "react-native";
import {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MINI_MAP_BORDER_RADIUS,
  MINI_MAP_COLLAPSED_Z_INDEX,
  MINI_MAP_EXPANDED_Z_INDEX,
} from "@/components/minimap/shared/minimapShared";

export type Rect = { x: number; y: number; width: number; height: number };

/** Card bounds relative to the inline gate host ({@link collapsedMeasureRef}). */
export type MiniMapExpandLayout = {
  collapsed: Rect;
  expanded: Rect;
};

export const MINI_MAP_ANIMATION_MS = 220;

export function useMiniMapAnimation({
  expandLayout,
  expanded,
  collapseGeneration,
  onCollapseAnimationComplete,
}: {
  expandLayout: MiniMapExpandLayout | null;
  expanded: boolean;
  /** Increment to play collapse while `expanded` remains true. */
  collapseGeneration: number;
  /** Fired when collapse timing reaches 0 while still in expanded mode. */
  onCollapseAnimationComplete?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
  const leftSv = useSharedValue(expandLayout?.collapsed.x ?? 0);
  const topSv = useSharedValue(expandLayout?.collapsed.y ?? 0);
  const widthSv = useSharedValue(expandLayout?.collapsed.width ?? 0);
  const heightSv = useSharedValue(expandLayout?.collapsed.height ?? 0);
  const endLeftSv = useSharedValue(expandLayout?.expanded.x ?? 0);
  const endTopSv = useSharedValue(expandLayout?.expanded.y ?? 0);
  const endWidthSv = useSharedValue(expandLayout?.expanded.width ?? windowWidth);
  const endHeightSv = useSharedValue(expandLayout?.expanded.height ?? windowHeight);
  const progressSv = useSharedValue(expanded ? 1 : 0);
  const prevExpandedRef = useRef(expanded);
  const lastCollapseGenerationRef = useRef(0);

  const expandedPadding = useMemo(
    () => boundsPaddingForFullScreenMapScaled(insets, uiScale, fontScale),
    [insets.top, insets.bottom, uiScale, fontScale],
  );

  useEffect(() => {
    if (!expandLayout) return;

    endLeftSv.value = expandLayout.expanded.x;
    endTopSv.value = expandLayout.expanded.y;
    endWidthSv.value = expandLayout.expanded.width;
    endHeightSv.value = expandLayout.expanded.height;

    /**
     * While fully expanded, pin BOTH interpolate endpoints to the expanded rect so layout
     * corrections (uiScale reflow) snap immediately and cannot briefly sample a stale
     * collapsed origin.
     */
    if (progressSv.value >= 0.99) {
      leftSv.value = expandLayout.expanded.x;
      topSv.value = expandLayout.expanded.y;
      widthSv.value = expandLayout.expanded.width;
      heightSv.value = expandLayout.expanded.height;
      return;
    }

    leftSv.value = expandLayout.collapsed.x;
    topSv.value = expandLayout.collapsed.y;
    widthSv.value = expandLayout.collapsed.width;
    heightSv.value = expandLayout.collapsed.height;
  }, [
    expandLayout,
    endHeightSv,
    endLeftSv,
    endTopSv,
    endWidthSv,
    heightSv,
    leftSv,
    progressSv,
    topSv,
    widthSv,
  ]);

  useEffect(() => {
    const wasExpanded = prevExpandedRef.current;
    const changedMode = wasExpanded !== expanded;
    prevExpandedRef.current = expanded;

    const duration = MINI_MAP_ANIMATION_MS;
    const easing = Easing.out(Easing.cubic);

    if (expanded) {
      if (!expandLayout) return;
      const hasLayout =
        expandLayout.collapsed.width > 0 && expandLayout.collapsed.height > 0;
      if (!hasLayout) return;
      const shouldAnimate = changedMode || progressSv.value < 0.99;
      if (!shouldAnimate) return;
      // Expanding: interpolate from collapsed → expanded.
      leftSv.value = expandLayout.collapsed.x;
      topSv.value = expandLayout.collapsed.y;
      widthSv.value = expandLayout.collapsed.width;
      heightSv.value = expandLayout.collapsed.height;
      endLeftSv.value = expandLayout.expanded.x;
      endTopSv.value = expandLayout.expanded.y;
      endWidthSv.value = expandLayout.expanded.width;
      endHeightSv.value = expandLayout.expanded.height;
      progressSv.value = withTiming(1, { duration, easing }, (finished) => {
        if (finished) {
          progressSv.value = 1;
        }
      });
      return;
    }

    if (!changedMode) return;
    progressSv.value = 0;
  }, [
    expandLayout,
    expanded,
    endHeightSv,
    endLeftSv,
    endTopSv,
    endWidthSv,
    heightSv,
    leftSv,
    progressSv,
    topSv,
    widthSv,
  ]);

  useEffect(() => {
    if (collapseGeneration === 0) return;
    if (collapseGeneration === lastCollapseGenerationRef.current) return;
    if (!expandLayout) return;

    lastCollapseGenerationRef.current = collapseGeneration;
    const duration = MINI_MAP_ANIMATION_MS;
    const collapseEasing = Easing.in(Easing.cubic);

    // Collapse: endpoints must be collapsed at p=0 and expanded at p=1.
    leftSv.value = expandLayout.collapsed.x;
    topSv.value = expandLayout.collapsed.y;
    widthSv.value = expandLayout.collapsed.width;
    heightSv.value = expandLayout.collapsed.height;
    endLeftSv.value = expandLayout.expanded.x;
    endTopSv.value = expandLayout.expanded.y;
    endWidthSv.value = expandLayout.expanded.width;
    endHeightSv.value = expandLayout.expanded.height;

    progressSv.value = withTiming(0, { duration, easing: collapseEasing }, (finished) => {
      if (finished) {
        progressSv.value = 0;
        if (onCollapseAnimationComplete) {
          runOnJS(onCollapseAnimationComplete)();
        }
      }
    });
  }, [
    collapseGeneration,
    expandLayout,
    endHeightSv,
    endLeftSv,
    endTopSv,
    endWidthSv,
    heightSv,
    leftSv,
    onCollapseAnimationComplete,
    progressSv,
    topSv,
    widthSv,
  ]);

  const cardStyle = useAnimatedStyle(() => {
    const p = progressSv.value;

    if (expandLayout == null) {
      return {
        position: "relative" as const,
        zIndex: MINI_MAP_COLLAPSED_Z_INDEX,
        width: "100%" as const,
        aspectRatio: 1,
        borderRadius: MINI_MAP_BORDER_RADIUS,
      };
    }

    return {
      position: "absolute" as const,
      zIndex: Math.round(
        interpolate(p, [0, 1], [MINI_MAP_COLLAPSED_Z_INDEX, MINI_MAP_EXPANDED_Z_INDEX]),
      ),
      left: interpolate(p, [0, 1], [leftSv.value, endLeftSv.value]),
      top: interpolate(p, [0, 1], [topSv.value, endTopSv.value]),
      width: Math.max(
        1,
        Math.round(interpolate(p, [0, 1], [widthSv.value, endWidthSv.value])),
      ),
      height: Math.max(
        1,
        Math.round(interpolate(p, [0, 1], [heightSv.value, endHeightSv.value])),
      ),
      borderRadius: interpolate(p, [0, 1], [MINI_MAP_BORDER_RADIUS, 0]),
    };
  });

  const expandedChromeStyle = useAnimatedStyle(() => ({
    opacity: progressSv.value,
  }));

  return { cardStyle, expandedChromeStyle, expandedPadding, insets, progressSv };
}
