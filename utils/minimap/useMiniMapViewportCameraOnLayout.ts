import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Dimensions, type LayoutChangeEvent } from "react-native";

/** Collapsed minimap should be square within this tolerance (px). */
const COLLAPSED_LAYOUT_TOLERANCE_PX = 2;
/** Expanded map should fill most of the window width before expanded bounds fits. */
const EXPANDED_MAP_MIN_WIDTH_RATIO = 0.9;
/** Frames to retry collapsed fit after expand flips false (layout may settle after onLayout). */
const COLLAPSED_APPLY_MAX_FRAMES = 20;

export type MapLayoutSize = { width: number; height: number };

/**
 * Defers camera updates until {@link MapView} `onLayout` reports a stable viewport:
 * - collapsed: square layout (post-collapse animation)
 * - expanded: near full window width (post-expand animation)
 *
 * The collapsed callback receives the stable layout size so callers can compute
 * an explicit zoom (e.g. page minimaps) without relying on native bounds→zoom.
 */
export function useMiniMapViewportCameraOnLayout({
  expanded,
  onCollapsedLayoutStable,
  onExpandedLayoutStable,
}: {
  expanded: boolean;
  onCollapsedLayoutStable?: (size: MapLayoutSize) => void;
  onExpandedLayoutStable?: () => void;
}) {
  const pendingCollapsedRef = useRef(false);
  const [collapsedApplyTick, setCollapsedApplyTick] = useState(0);
  const pendingExpandedRef = useRef(false);
  const lastCollapsedLayoutKeyRef = useRef<string | null>(null);
  const lastExpandedLayoutKeyRef = useRef<string | null>(null);
  const lastMapLayoutRef = useRef({ width: 0, height: 0 });
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  const onCollapsedRef = useRef(onCollapsedLayoutStable);
  const onExpandedRef = useRef(onExpandedLayoutStable);
  onCollapsedRef.current = onCollapsedLayoutStable;
  onExpandedRef.current = onExpandedLayoutStable;

  const tryApplyCollapsedFromLayout = useCallback(
    (width: number, height: number): boolean => {
      let skipReason: string | null = null;

      if (!pendingCollapsedRef.current) skipReason = "not-pending-collapsed";
      else if (onCollapsedRef.current == null) skipReason = "no-handler";
      else if (width <= 0 || height <= 0) skipReason = "zero-size";
      else if (Math.abs(width - height) > COLLAPSED_LAYOUT_TOLERANCE_PX) skipReason = "not-square";
      else {
        const layoutKey = `${Math.round(width)}x${Math.round(height)}`;
        if (lastCollapsedLayoutKeyRef.current === layoutKey) skipReason = "duplicate-layout-key";
      }

      if (skipReason != null) return false;

      const layoutKey = `${Math.round(width)}x${Math.round(height)}`;
      lastCollapsedLayoutKeyRef.current = layoutKey;
      pendingCollapsedRef.current = false;
      onCollapsedRef.current?.({ width, height });
      return true;
    },
    [],
  );

  const markPendingCollapsedCamera = useCallback(() => {
    pendingCollapsedRef.current = true;
    lastCollapsedLayoutKeyRef.current = null;
    setCollapsedApplyTick((t) => t + 1);
  }, []);

  const markPendingExpandedCamera = useCallback(() => {
    pendingCollapsedRef.current = false;
    lastCollapsedLayoutKeyRef.current = null;
    pendingExpandedRef.current = true;
    lastExpandedLayoutKeyRef.current = null;
  }, []);

  /** After parent collapse, layout may not re-fire onLayout; retry with last known sizes. */
  useLayoutEffect(() => {
    if (expanded || !pendingCollapsedRef.current) return;

    let frame = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled || expandedRef.current) return;
      const { width, height } = lastMapLayoutRef.current;
      if (tryApplyCollapsedFromLayout(width, height)) return;
      frame += 1;
      if (frame < COLLAPSED_APPLY_MAX_FRAMES) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, [expanded, collapsedApplyTick, tryApplyCollapsedFromLayout]);

  const onMapLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width <= 0 || height <= 0) return;
      lastMapLayoutRef.current = { width, height };

      if (expanded) {
        const windowWidth = Dimensions.get("window").width;
        const minExpandedW = windowWidth * EXPANDED_MAP_MIN_WIDTH_RATIO;
        let skipReason: string | null = null;
        if (!pendingExpandedRef.current) skipReason = "not-pending-expanded";
        else if (onExpandedRef.current == null) skipReason = "no-handler";
        else if (width < minExpandedW) skipReason = "below-min-width";
        else {
          const layoutKey = `${Math.round(width)}x${Math.round(height)}`;
          if (lastExpandedLayoutKeyRef.current === layoutKey) skipReason = "duplicate-layout-key";
        }
        if (skipReason != null || onExpandedRef.current == null) return;

        const layoutKey = `${Math.round(width)}x${Math.round(height)}`;
        lastExpandedLayoutKeyRef.current = layoutKey;
        pendingExpandedRef.current = false;
        onExpandedRef.current();
        return;
      }

      pendingExpandedRef.current = false;
      tryApplyCollapsedFromLayout(width, height);
    },
    [expanded, tryApplyCollapsedFromLayout],
  );

  return {
    markPendingCollapsedCamera,
    markPendingExpandedCamera,
    onMapLayout,
  };
}
