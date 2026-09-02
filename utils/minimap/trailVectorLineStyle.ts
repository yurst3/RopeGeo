import type { LineLayerStyle } from "@rnmapbox/maps";
import { EXPLORE_TRAIL_LINE_EMISSIVE_STRENGTH } from "@/utils/map/exploreTrailLineColors";

const DEFAULT_STROKE_WIDTH = 2.5;

/** Data-driven line styling for vector tiles with `stroke` and `stroke-width` properties. */
export function trailVectorLineStyle(focusedLineSegment: string): LineLayerStyle {
  return {
    lineColor: ["coalesce", ["get", "stroke"], focusedLineSegment],
    lineWidth: ["coalesce", ["to-number", ["get", "stroke-width"]], DEFAULT_STROKE_WIDTH],
    lineOpacity: 1,
    lineEmissiveStrength: EXPLORE_TRAIL_LINE_EMISSIVE_STRENGTH,
    lineCap: "round",
    lineJoin: "round",
  };
}
