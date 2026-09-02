import { Camera } from "@rnmapbox/maps";
import type { ComponentRef } from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { MINIMAP_FIT_BOUNDS_ANIMATION_MS } from "@/components/modals/minimap/shared/minimapShared";

type Bounds = { north: number; south: number; east: number; west: number };
type Padding = { paddingTop: number; paddingBottom: number; paddingLeft: number; paddingRight: number };

const FIT_MARK_SETTLE_MS = 80;

export function useMiniMapCamera({ expanded }: { expanded: boolean }) {
  const cameraRef = useRef<ComponentRef<typeof Camera>>(null);
  const pitchRef = useRef(0);
  const headingRef = useRef(0);
  const centerRef = useRef<[number, number] | null>(null);
  const zoomRef = useRef<number | null>(null);
  const suppressMoveTrackingRef = useRef(0);
  const [cameraFittedToBounds, setCameraFittedToBounds] = useState(false);
  /** Hides bounds-reset chrome until the first fitted-to-bounds pass after expand (or manual reset). */
  const [awaitingInitialBoundsFit, setAwaitingInitialBoundsFit] = useState(false);
  const [compassVisible, setCompassVisible] = useState(false);
  const [cameraHeadingDeg, setCameraHeadingDeg] = useState(0);

  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  const prevExpandedForBoundsRef = useRef(expanded);
  /**
   * Set synchronously on expand so the bounds slot never mounts visible before
   * `useLayoutEffect` applies `awaitingInitialBoundsFit` (avoids fade + layout slide on expand).
   */
  const suppressBoundsChromeRef = useRef(false);

  if (expanded && !prevExpandedForBoundsRef.current) {
    suppressBoundsChromeRef.current = true;
  }
  if (!expanded) {
    suppressBoundsChromeRef.current = false;
  }
  prevExpandedForBoundsRef.current = expanded;

  const clearInitialBoundsChromeSuppress = useCallback(() => {
    suppressBoundsChromeRef.current = false;
  }, []);

  const markCameraFittedToBounds = useCallback(() => {
    setCameraFittedToBounds(true);
    setAwaitingInitialBoundsFit(false);
    clearInitialBoundsChromeSuppress();
  }, [clearInitialBoundsChromeSuppress]);

  const markCameraMovedFromBounds = useCallback(() => {
    setCameraFittedToBounds(false);
  }, []);

  const markCameraFittedToBoundsAfter = useCallback((delayMs: number) => {
    suppressMoveTrackingRef.current += 1;
    const timer = setTimeout(() => {
      suppressMoveTrackingRef.current = Math.max(0, suppressMoveTrackingRef.current - 1);
      setCameraFittedToBounds(true);
      setAwaitingInitialBoundsFit(false);
      clearInitialBoundsChromeSuppress();
    }, delayMs);
    return () => clearTimeout(timer);
  }, [clearInitialBoundsChromeSuppress]);

  const fitToBounds = useCallback(
    (
      bounds: Bounds,
      padding: Padding,
      duration = MINIMAP_FIT_BOUNDS_ANIMATION_MS,
      options?: { markFitted?: boolean },
    ) => {
      const markFitted = options?.markFitted ?? false;
      suppressMoveTrackingRef.current += 1;
      cameraRef.current?.setCamera({
        type: "CameraStop",
        bounds: {
          ne: [bounds.east, bounds.north],
          sw: [bounds.west, bounds.south],
          ...padding,
        },
        animationDuration: duration,
      });
      setTimeout(() => {
        suppressMoveTrackingRef.current = Math.max(0, suppressMoveTrackingRef.current - 1);
        setCameraFittedToBounds(markFitted);
        if (markFitted) {
          setAwaitingInitialBoundsFit(false);
          clearInitialBoundsChromeSuppress();
        }
      }, duration + FIT_MARK_SETTLE_MS);
    },
    [clearInitialBoundsChromeSuppress],
  );

  const resetPitchAndHeading = useCallback((animationDuration = MINIMAP_FIT_BOUNDS_ANIMATION_MS) => {
    const duration =
      typeof animationDuration === "number"
        ? animationDuration
        : MINIMAP_FIT_BOUNDS_ANIMATION_MS;
    cameraRef.current?.setCamera({
      pitch: 0,
      heading: 0,
      animationDuration: duration,
    });
  }, []);

  const onCameraChanged = useCallback(
    (state: { properties: { pitch: number; heading: number; center: unknown; zoom: number } }) => {
      const { pitch: p, heading: h, center, zoom } = state.properties;
      pitchRef.current = p;
      headingRef.current = h;
      setCameraHeadingDeg(h);
      if (Array.isArray(center) && center.length >= 2) {
        centerRef.current = [center[0] as number, center[1] as number];
        zoomRef.current = zoom;
      }

      if (!expandedRef.current) return;
      if (suppressMoveTrackingRef.current > 0) return;

      const newCompass = Math.abs(p) > 0.5 || Math.abs(h) > 0.5;
      setCompassVisible((prev) => (prev !== newCompass ? newCompass : prev));

      setCameraFittedToBounds((fitted) => (fitted ? false : fitted));
    },
    [],
  );

  useLayoutEffect(() => {
    if (expanded) {
      setAwaitingInitialBoundsFit(true);
      return;
    }
    setCameraFittedToBounds(false);
    setAwaitingInitialBoundsFit(false);
    suppressBoundsChromeRef.current = false;
    suppressMoveTrackingRef.current = 0;
  }, [expanded]);

  const boundsResetButtonVisible =
    expanded &&
    !cameraFittedToBounds &&
    !awaitingInitialBoundsFit &&
    !suppressBoundsChromeRef.current;

  return {
    cameraRef,
    fitToBounds,
    resetPitchAndHeading,
    onCameraChanged,
    compassVisible,
    boundsResetButtonVisible,
    cameraHeadingDeg,
    markCameraFittedToBounds,
    markCameraMovedFromBounds,
    markCameraFittedToBoundsAfter,
  };
}
