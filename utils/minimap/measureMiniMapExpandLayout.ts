import type { MiniMapExpandLayout } from "@/utils/minimap/useMiniMapAnimation";
import { Dimensions, type RefObject, type View } from "react-native";

/** Gate-relative rects for the in-ScrollView minimap (iOS + Android collapsed / collapse handoff). */
export function measureInlineExpandLayout(
  expandAnchorRef: RefObject<View | null>,
  collapsedMeasureRef: RefObject<View | null>,
): Promise<MiniMapExpandLayout | null> {
  return new Promise((resolve) => {
    const anchor = expandAnchorRef.current;
    const collapsedNode = collapsedMeasureRef.current;
    if (anchor == null || collapsedNode == null) {
      resolve(null);
      return;
    }
    anchor.measureInWindow((ax, ay) => {
      collapsedNode.measureInWindow((cx, cy, cw, ch) => {
        if (cw <= 0 || ch <= 0) {
          resolve(null);
          return;
        }
        const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
        resolve({
          collapsed: {
            x: 0,
            y: 0,
            width: cw,
            height: ch,
          },
          expanded: {
            x: ax - cx,
            y: ay - cy,
            width: windowWidth,
            height: windowHeight,
          },
        });
      });
    });
  });
}

/**
 * Rects relative to a fullscreen portal host (Android expanded map outside the ScrollView).
 * `portalHostRef` should be the absolute-fill parent that will host the portal MiniMap.
 */
export function measurePortalExpandLayout(
  portalHostRef: RefObject<View | null>,
  collapsedMeasureRef: RefObject<View | null>,
): Promise<MiniMapExpandLayout | null> {
  return new Promise((resolve) => {
    const host = portalHostRef.current;
    const collapsedNode = collapsedMeasureRef.current;
    if (host == null || collapsedNode == null) {
      resolve(null);
      return;
    }
    host.measureInWindow((hx, hy, hw, hh) => {
      collapsedNode.measureInWindow((cx, cy, cw, ch) => {
        if (cw <= 0 || ch <= 0) {
          resolve(null);
          return;
        }
        const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
        resolve({
          collapsed: {
            x: cx - hx,
            y: cy - hy,
            width: cw,
            height: ch,
          },
          expanded: {
            x: 0,
            y: 0,
            width: hw > 0 ? hw : windowWidth,
            height: hh > 0 ? hh : windowHeight,
          },
        });
      });
    });
  });
}
