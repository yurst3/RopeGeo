import type { ReactElement } from "react";
import { NativeViewGestureHandler } from "react-native-gesture-handler";

/** Fine-grained Mapbox gestures while the minimap is expanded (Android ScrollView nesting). */
export const MINIMAP_GESTURE_SETTINGS_EXPANDED = {
  panEnabled: true,
  pinchZoomEnabled: true,
  pinchPanEnabled: true,
  rotateEnabled: true,
  pitchEnabled: true,
  simultaneousRotateAndPinchZoomEnabled: true,
  doubleTapToZoomInEnabled: true,
  doubleTouchToZoomOutEnabled: true,
  quickZoomEnabled: true,
} as const;

/** Disable map gestures while collapsed so the parent page ScrollView keeps ownership. */
export const MINIMAP_GESTURE_SETTINGS_COLLAPSED = {
  panEnabled: false,
  pinchZoomEnabled: false,
  pinchPanEnabled: false,
  rotateEnabled: false,
  pitchEnabled: false,
  simultaneousRotateAndPinchZoomEnabled: false,
  doubleTapToZoomInEnabled: false,
  doubleTouchToZoomOutEnabled: false,
  quickZoomEnabled: false,
} as const;

/** Shared MapView interaction props for expanded vs collapsed minimaps. */
export function miniMapInteractionProps(expanded: boolean) {
  return {
    pointerEvents: (expanded ? "auto" : "none") as "auto" | "none",
    scrollEnabled: expanded,
    zoomEnabled: expanded,
    rotateEnabled: expanded,
    pitchEnabled: expanded,
    requestDisallowInterceptTouchEvent: true as const,
    gestureSettings: expanded
      ? MINIMAP_GESTURE_SETTINGS_EXPANDED
      : MINIMAP_GESTURE_SETTINGS_COLLAPSED,
  };
}

/**
 * Lets the native MapView compete in RNGH’s gesture arena so a parent ScrollView
 * is less likely to steal pan/pinch/rotate on Android (rnmapbox#3420).
 * Pass layout styles on the MapView child (this handler does not accept `style`).
 */
export function MiniMapNativeGestureHost({
  expanded,
  children,
}: {
  expanded: boolean;
  children: ReactElement;
}) {
  return (
    <NativeViewGestureHandler
      enabled={expanded}
      disallowInterruption={expanded}
      shouldCancelWhenOutside={false}
    >
      {children}
    </NativeViewGestureHandler>
  );
}
