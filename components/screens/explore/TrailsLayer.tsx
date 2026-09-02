import {
  MAPBOX_TRAILS_ABOVE_LAYER_ID,
  MAPBOX_TRAILS_LINE_LAYER_IDS,
} from "@/constants/mapbox";
import {
  EXPLORE_TRAIL_LINE_COLORS,
  EXPLORE_TRAIL_LINE_EMISSIVE_STRENGTH,
} from "@/utils/map/exploreTrailLineColors";
import { trailVectorLineStyle } from "@/utils/minimap/trailVectorLineStyle";
import { LineLayer, VectorSource, type LineLayerStyle } from "@rnmapbox/maps";
import { useMemo } from "react";

/**
 * Vector tile source for trails. Tiles at /trails/{z}/{x}/{y}.pbf.
 * Each feature has an "id" property; layer shows only features whose id is in visibleTrailIds when a route is focused.
 */
const TRAILS_TILE_URL_TEMPLATES = [
  "https://api.webscraper.ropegeo.com/mapdata/tiles/trails/{z}/{x}/{y}.pbf",
];

/**
 * Name of the vector tile layer in the trails tiles (e.g. tippecanoe -l trails).
 */
const TRAILS_SOURCE_LAYER_ID = "trails";
const MATCH_NOTHING_FILTER = ["==", ["get", "id"], ""] as const;

export const UNFOCUSED_ROUTE_LINE_WIDTH = 2;

export type TrailsLayerProps = {
  /** When null, no trails are shown. When set, only trails whose id is in visibleTrailIds are shown. */
  focusedRouteId: string | null;
  /** Trail IDs to show for the currently viewed PagePreview (from mapData). Empty when no route focused or no mapData. */
  visibleTrailIds: string[];
};

/**
 * Renders trail lines from vector tiles. Hidden by default; when a route marker is focused,
 * shows only trails whose "id" is in the current preview's mapData.
 */
export function TrailsLayer({
  focusedRouteId,
  visibleTrailIds,
}: TrailsLayerProps) {
  const unfocusedTrailLineStyle = useMemo(
    (): LineLayerStyle => ({
      lineColor: EXPLORE_TRAIL_LINE_COLORS.unfocused,
      lineWidth: UNFOCUSED_ROUTE_LINE_WIDTH,
      lineOpacity: 1,
      lineEmissiveStrength: EXPLORE_TRAIL_LINE_EMISSIVE_STRENGTH,
      lineCap: "round",
      lineJoin: "round",
    }),
    [],
  );
  const focusedTrailLineStyle = useMemo(
    () => trailVectorLineStyle(EXPLORE_TRAIL_LINE_COLORS.focused),
    [],
  );
  const isFocused = focusedRouteId != null;
  const hasIdsToShow = visibleTrailIds.length > 0;
  const lineOnly: ["==", ["geometry-type"], "LineString"] = [
    "==",
    ["geometry-type"],
    "LineString",
  ];
  const focusedTrailFilter =
    isFocused && hasIdsToShow
      ? (["in", ["get", "id"], ["literal", visibleTrailIds]] as const)
      : MATCH_NOTHING_FILTER;
  const focusedFilter = ["all", lineOnly, focusedTrailFilter] as const;

  const unfocusedTrailFilter =
    isFocused && hasIdsToShow
      ? (["!", ["in", ["get", "id"], ["literal", visibleTrailIds]]] as const)
      : (["!=", ["get", "id"], ""] as const);
  const unfocusedFilter = ["all", lineOnly, unfocusedTrailFilter] as const;

  const [unfocusedLayerId, focusedLayerId] = MAPBOX_TRAILS_LINE_LAYER_IDS;

  return (
    <VectorSource id="trails-source" tileUrlTemplates={TRAILS_TILE_URL_TEMPLATES}>
      <LineLayer
        id={unfocusedLayerId}
        sourceLayerID={TRAILS_SOURCE_LAYER_ID}
        aboveLayerID={MAPBOX_TRAILS_ABOVE_LAYER_ID}
        filter={unfocusedFilter}
        style={unfocusedTrailLineStyle}
      />
      <LineLayer
        id={focusedLayerId}
        sourceLayerID={TRAILS_SOURCE_LAYER_ID}
        aboveLayerID={unfocusedLayerId}
        filter={focusedFilter}
        style={focusedTrailLineStyle}
      />
    </VectorSource>
  );
}
