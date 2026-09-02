import type { MarkerColors } from "@/constants/colors/types";
import { ROUTE_MARKER_CLUSTER_IMAGE } from "@/utils/mapbox/nativeMarkerImages";
import type { SymbolLayerStyle } from "@rnmapbox/maps";
import type { RouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import { routeMarkerIconSizeInterpolate } from "./routeMarkerIcons";

export const MAP_MARKER_ICON_OPACITY = 1;
export const MAP_MARKER_ICON_EMISSIVE_STRENGTH = 1;

function mapMarkerIconPaint(iconColor: string) {
  return {
    iconColor,
    iconOpacity: MAP_MARKER_ICON_OPACITY,
    iconEmissiveStrength: MAP_MARKER_ICON_EMISSIVE_STRENGTH,
  };
}

export function unclusteredRouteMarkerSymbolStyle(
  marker: MarkerColors,
  iconImage: SymbolLayerStyle["iconImage"],
  iconSize: SymbolLayerStyle["iconSize"],
  markerMetrics: RouteMarkerMetrics,
  textFont: readonly string[],
): SymbolLayerStyle {
  return {
    iconImage,
    iconSize,
    ...mapMarkerIconPaint(marker.defaultIcon),
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconAnchor: "bottom",
    textField: ["get", "name"],
    textFont: [...textFont],
    textSize: markerMetrics.textSize,
    textColor: marker.text,
    textHaloColor: marker.textHalo,
    textHaloWidth: markerMetrics.textHaloWidth,
    textOffset: [0, markerMetrics.textOffsetY],
    textAnchor: "top",
    textAllowOverlap: true,
    textIgnorePlacement: true,
  };
}

export function clusterRouteMarkerSymbolStyle(
  marker: MarkerColors,
  markerMetrics: RouteMarkerMetrics,
  textFont: readonly string[],
): SymbolLayerStyle {
  return {
    iconImage: ROUTE_MARKER_CLUSTER_IMAGE,
    iconSize: routeMarkerIconSizeInterpolate(markerMetrics.iconSizeScale),
    ...mapMarkerIconPaint(marker.clusterIcon),
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconAnchor: "bottom",
    textField: [
      "concat",
      "(",
      ["to-string", ["get", "point_count"]],
      ")",
    ],
    textFont: [...textFont],
    textSize: markerMetrics.textSize,
    textColor: marker.text,
    textHaloColor: marker.textHalo,
    textHaloWidth: markerMetrics.textHaloWidth,
    textOffset: [0, markerMetrics.textOffsetY],
    textAnchor: "top",
    textAllowOverlap: true,
    textIgnorePlacement: true,
  };
}

export function pagePointIconSymbolStyle(
  marker: MarkerColors,
  iconImage: SymbolLayerStyle["iconImage"],
  iconSize: SymbolLayerStyle["iconSize"],
): SymbolLayerStyle {
  return {
    iconImage,
    iconSize,
    ...mapMarkerIconPaint(marker.defaultIcon),
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconAnchor: "center",
  };
}

/** Vector-tile point labels on page minimaps (smaller type than route markers). */
export function pagePointLabelSymbolStyle(
  marker: MarkerColors,
  markerMetrics: RouteMarkerMetrics,
  textFont: readonly string[],
): SymbolLayerStyle {
  return {
    textField: ["coalesce", ["get", "name"], " "],
    textFont: [...textFont],
    textSize: markerMetrics.textSize,
    textColor: marker.text,
    textHaloColor: marker.textHalo,
    textHaloWidth: markerMetrics.textHaloWidth,
    textOffset: [0, markerMetrics.pageMiniMapTextOffsetY],
    textAnchor: "top",
    textPadding: markerMetrics.textPadding,
    textAllowOverlap: false,
    textIgnorePlacement: false,
    textMaxWidth: 8,
  };
}
