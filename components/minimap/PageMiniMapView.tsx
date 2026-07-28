import { ButtonStack } from "@/components/buttons/ButtonStack";
import { ResetCameraOrientationButton } from "@/components/buttons/standard/ResetCameraOrientationButton";
import { ResetCameraToBoundsButton } from "@/components/buttons/standard/ResetCameraToBoundsButton";
import { ResetCameraToPositionButton } from "@/components/buttons/standard/ResetCameraToPositionButton";
import { useHeaderChromeLayout, useMapButtonChromeLayout, expandedMiniMapHeaderRowStackTop, expandedMiniMapOverlayBottomOffset, expandedMiniMapOverlayEdgeGap } from "@/utils/layout/buttonChromeLayout";
import { useRouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import { useMapMarkerTextFont } from "@/utils/theme/resolvers";
import { useForegroundUserLocation } from "@/utils/location/useForegroundUserLocation";
import { MiniMapHeader } from "./shared/MiniMapHeader";
import { MapLegendPanel } from "./panels/MapLegendPanel";
import { RelevantInfoPanel } from "./panels/RelevantInfoPanel";
import { useToast } from "@/context/ui/ToastContext";
import { useSettings } from "@/context/app/SettingsContext";
import {
  buildRelevantContextContent,
  type BetaSectionLookup,
  type ImageLookup,
  type RelevantContextContent,
} from "@/utils/minimap/relevantContextContent";
import {
  focusCameraPadding,
  pointFocusCameraStop,
  POINT_FOCUS_MIN_ZOOM,
} from "@/utils/minimap/focusedFeatureCamera";
import { boundsFocusCameraStop } from "@/utils/minimap/zoomForBounds";
import {
  boundsFromLegendItem,
  boundsFromPositions,
  contrastHaloColor,
  filterRenderedLinesForSelectionKey,
  isLineRowSelectionKey,
  legendItemForKey,
  resolveLineLegendSelectionId,
  lineSelectionBounds,
  lineSelectionStyle,
} from "@/utils/minimap/pageMiniMapSegments";
import {
  CAMERA_PADDING,
  MINIMAP_FIT_BOUNDS_ANIMATION_MS,
  minimapStyles,
} from "./shared/minimapShared";
import { ConstantText } from "@/components/text/ConstantText";
import { MAPBOX_STYLE_URL } from "@/constants/mapbox";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { trailVectorLineStyle } from "@/utils/minimap/trailVectorLineStyle";
import { useMiniMapShell } from "@/components/minimap/miniMapAnimatedCard";
import type { MiniMapReloadRegisterRef } from "@/utils/minimap/miniMapHandle";
import { useMiniMapViewportCameraOnLayout } from "@/utils/minimap/useMiniMapViewportCameraOnLayout";
import { useMiniMapCamera } from "@/utils/minimap/useMiniMapCamera";
import { pagePointLabelSymbolStyle } from "@/utils/explore/mapMarkerLayerStyles";
import { pageMiniMapPointIconSize } from "@/utils/explore/routeMarkerIcons";
import {
  Camera,
  Images,
  LineLayer,
  LocationPuck,
  MapView,
  ShapeSource,
  SymbolLayer,
  VectorSource,
} from "@rnmapbox/maps";
import {
  ROUTE_MARKER_IMAGE,
  ROUTE_MARKER_NATIVE_ASSET_IMAGES,
  ROUTE_MARKER_SELECTED_IMAGE,
} from "@/utils/mapbox/nativeMarkerImages";
import {
  offlineVectorTilesRootFromTemplate,
  prepareOfflineVectorTilesForMapbox,
} from "@/utils/offline/prepareOfflineVectorTiles";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import type { ComponentRef } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import {
  Bounds,
  LegendFeatureType,
  PointLegendItem,
  type MeasurementsLookup,
  type OfflinePageMiniMap,
  type OnlinePageMiniMap,
} from "ropegeo-common/models";

const PAGE_VECTOR_SOURCE_ID = "page-mini-map-tiles";
const PAGE_LINE_LAYER_ID = "page-mini-map-line";
const PAGE_POINT_LABEL_LAYER_ID = "page-mini-map-point-labels";
const PAGE_POINT_ICON_LAYER_ID = "page-mini-map-point-icons";
const PAGE_SELECTED_HALO_SOURCE_ID = "page-mini-map-selected-halo";
const PAGE_SELECTED_HALO_LAYER_ID = "page-mini-map-selected-halo-line";
const PAGE_SELECTED_OVERLAY_LAYER_ID = "page-mini-map-selected-overlay-line";

/** Stable empty collection so the line-highlight ShapeSource can stay mounted. */
const EMPTY_LINE_HIGHLIGHT: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const DEFAULT_LINE_HIGHLIGHT_WIDTH = 3;

const USER_LOCATION_ZOOM = 14;
const COLLAPSED_CAMERA_ANIMATION_MS = 250;
/** Horizontal gap between the Relevant Info card and the map legend card. */
const RELEVANT_INFO_LEGEND_GAP = 8;

const LINE_ONLY_FILTER: ["==", ["geometry-type"], "LineString"] = [
  "==",
  ["geometry-type"],
  "LineString",
];

const POINT_ONLY_FILTER: ["==", ["geometry-type"], "Point"] = [
  "==",
  ["geometry-type"],
  "Point",
];

/** Mapbox `queryRenderedFeaturesInRect` bbox: `[top, left, bottom, right]` ≈ `[minY, minX, maxY, maxX]`. */
async function mapBoundsToRenderedScreenRect(
  map: ComponentRef<typeof MapView>,
  bounds: Bounds,
  padPx: number,
  viewW: number,
  viewH: number,
): Promise<[number, number, number, number]> {
  const corners: GeoJSON.Position[] = [
    [bounds.west, bounds.north],
    [bounds.east, bounds.north],
    [bounds.east, bounds.south],
    [bounds.west, bounds.south],
  ];
  const xs: number[] = [];
  const ys: number[] = [];
  for (const c of corners) {
    try {
      const [x, y] = await map.getPointInView(c);
      xs.push(x as number);
      ys.push(y as number);
    } catch {
      /* ignore */
    }
  }
  if (xs.length === 0) {
    return [0, 0, Math.max(1, viewH), Math.max(1, viewW)];
  }
  let minX = Math.min(...xs) - padPx;
  let maxX = Math.max(...xs) + padPx;
  let minY = Math.min(...ys) - padPx;
  let maxY = Math.max(...ys) + padPx;
  const minEdge = 28;
  if (maxX - minX < minEdge) {
    const cx = (minX + maxX) / 2;
    minX = cx - minEdge / 2;
    maxX = cx + minEdge / 2;
  }
  if (maxY - minY < minEdge) {
    const cy = (minY + maxY) / 2;
    minY = cy - minEdge / 2;
    maxY = cy + minEdge / 2;
  }
  minX = Math.max(0, minX);
  maxX = Math.min(viewW, maxX);
  minY = Math.max(0, minY);
  maxY = Math.min(viewH, maxY);
  return [minY, minX, maxY, maxX];
}

/** Online or offline page tile minimap configuration from ropegeo-common. */
export type PageMiniMapTileProps = OnlinePageMiniMap | OfflinePageMiniMap;

export type PageMiniMapViewProps = {
  miniMap: PageMiniMapTileProps;
  /** Relevant-context lookups from the owning page view. */
  betaSectionLookup?: BetaSectionLookup | null;
  imageLookup?: ImageLookup | null;
  measurementsLookup?: MeasurementsLookup | null;
  reloadRegisterRef?: MiniMapReloadRegisterRef;
};

export function PageMiniMapView({
  miniMap,
  betaSectionLookup,
  imageLookup,
  measurementsLookup,
  reloadRegisterRef,
}: PageMiniMapViewProps) {
  const themeColors = useColorTheme();
  const { map } = themeColors;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const { settings } = useSettings();
  const markerMetrics = useRouteMarkerMetrics();
  const markerTextFont = useMapMarkerTextFont();
  const shell = useMiniMapShell();
  const headerChrome = useHeaderChromeLayout();
  const mapChrome = useMapButtonChromeLayout();
  const tabBarHeight = useBottomTabBarHeight();
  const b = miniMap.bounds;
  const { height: windowHeight, width: windowWidth, fontScale } = useWindowDimensions();
  const tileTemplate =
    miniMap.fetchType === "offline"
      ? miniMap.offlineTilesTemplate
      : miniMap.onlineTilesTemplate;
  const isOfflineTiles = miniMap.fetchType === "offline";
  const [offlineTilesPrepared, setOfflineTilesPrepared] = useState(!isOfflineTiles);

  useEffect(() => {
    if (!isOfflineTiles || !shell.mountNativeMap) {
      setOfflineTilesPrepared(!isOfflineTiles);
      return;
    }
    let cancelled = false;
    setOfflineTilesPrepared(false);
    void (async () => {
      const tilesRoot = offlineVectorTilesRootFromTemplate(tileTemplate);
      if (tilesRoot == null) {
        if (!cancelled) setOfflineTilesPrepared(true);
        return;
      }
      try {
        await prepareOfflineVectorTilesForMapbox(tilesRoot);
      } catch {
        /* still mount map; load error UI handles failures */
      }
      if (!cancelled) setOfflineTilesPrepared(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOfflineTiles, shell.mountNativeMap, tileTemplate]);

  const miniMapReloadKey = useMemo(
    () =>
      `${miniMap.fetchType}:${miniMap.polyLineLayerId}:${miniMap.pointLayerId}:${tileTemplate}`,
    [miniMap.fetchType, miniMap.polyLineLayerId, miniMap.pointLayerId, tileTemplate],
  );
  const hasPageLegend = useMemo(
    () => miniMap.legend != null && Object.keys(miniMap.legend).length > 0,
    [miniMap.legend],
  );
  const {
    cameraRef,
    fitToBounds,
    resetPitchAndHeading,
    onCameraChanged,
    compassVisible,
    boundsResetButtonVisible,
    cameraHeadingDeg,
    markCameraMovedFromBounds,
    markCameraFittedToBoundsAfter,
  } = useMiniMapCamera({
    expanded: shell.expanded,
  });

  const mapRef = useRef<ComponentRef<typeof MapView>>(null);
  const selectedPointLngLatRef = useRef<[number, number] | null>(null);
  /** After line selection + `fitToBounds`, wait before `queryRenderedFeaturesInRect` so tiles match the camera. */
  const lineHighlightWaitForCameraRef = useRef(false);

  const [selectedSegmentKey, setSelectedSegmentKey] = useState<string | null>(null);
  const [pointTooltip, setPointTooltip] = useState<{ x: number; y: number; fullName: string } | null>(
    null,
  );
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [relevantExpanded, setRelevantExpanded] = useState(false);
  /** Incremented only on map line press so the legend auto-scrolls for map-driven selection, not legend taps. */
  const [legendScrollIntoViewEpoch, setLegendScrollIntoViewEpoch] = useState(0);
  /** Measured chrome for focused-feature camera framing. */
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);
  const [legendFootprint, setLegendFootprint] = useState<number | null>(null);
  const [relevantFootprint, setRelevantFootprint] = useState<number | null>(null);
  /** Feature currently framed by the focus camera (refit after overlay layout changes). */
  const focusedFeatureRef = useRef<
    | { type: "point"; lngLat: [number, number] }
    | { type: "bounds"; bounds: Bounds }
    | null
  >(null);
  const [mapLiveCenter, setMapLiveCenter] = useState<[number, number] | undefined>(undefined);
  const [mapLiveZoom, setMapLiveZoom] = useState<number | undefined>(undefined);
  const [selectedLineHighlight, setSelectedLineHighlight] = useState<GeoJSON.FeatureCollection | null>(
    null,
  );
  const [selectedLineStyle, setSelectedLineStyle] = useState<{
    stroke: string;
    strokeWidth: number;
  } | null>(null);

  /**
   * Invalidates in-flight async point-focus `setCamera` calls so a later line
   * bounds frame is not overwritten by a stale marking focus.
   */
  const cameraFocusGenerationRef = useRef(0);
  const beginCameraFocus = useCallback(() => {
    cameraFocusGenerationRef.current += 1;
    return cameraFocusGenerationRef.current;
  }, []);

  const clearMapSelections = useCallback(() => {
    cameraFocusGenerationRef.current += 1;
    setSelectedSegmentKey(null);
    setPointTooltip(null);
    selectedPointLngLatRef.current = null;
    focusedFeatureRef.current = null;
    setRelevantExpanded(false);
  }, []);

  /**
   * Frame geographic bounds with explicit center+zoom (same approach as collapsed
   * recenter). Native Mapbox bounds→zoom can leave zoom stuck after point focus
   * ({@link POINT_FOCUS_MIN_ZOOM}); this path forces a computed zoom instead.
   */
  const fitFocusedBounds = useCallback(
    (
      bounds: Bounds,
      padding: {
        paddingTop: number;
        paddingBottom: number;
        paddingLeft: number;
        paddingRight: number;
      },
      duration = MINIMAP_FIT_BOUNDS_ANIMATION_MS,
      options?: { heading?: number; pitch?: number; markFitted?: boolean },
    ) => {
      const stop = boundsFocusCameraStop(
        bounds,
        { width: windowWidth, height: windowHeight },
        padding,
        duration,
        {
          offsetCenterWithPadding: true,
          ...(options?.heading != null ? { heading: options.heading } : {}),
          ...(options?.pitch != null ? { pitch: options.pitch } : {}),
        },
      );
      if (stop == null) {
        fitToBounds(bounds, padding, duration, {
          markFitted: options?.markFitted,
        });
        return;
      }
      cameraRef.current?.setCamera(stop);
      if (options?.markFitted === true) {
        markCameraFittedToBoundsAfter(duration + 80);
      }
    },
    [
      cameraRef,
      fitToBounds,
      markCameraFittedToBoundsAfter,
      windowHeight,
      windowWidth,
    ],
  );

  /**
   * Collapsed recenter uses an explicit center+zoom (not native bounds→zoom).
   * After focus, Mapbox's bounds fit updates center but can leave zoom pinned at
   * the focused level when the surface size is wrong post-collapse animation.
   */
  const applyCollapsedCamera = useCallback(
    (size: { width: number; height: number }) => {
      if (!shell.mountNativeMap || shell.expanded) return;
      const stop = boundsFocusCameraStop(
        b,
        size,
        CAMERA_PADDING,
        COLLAPSED_CAMERA_ANIMATION_MS,
        { heading: 0, pitch: 0 },
      );
      if (stop == null) {
        fitToBounds(b, CAMERA_PADDING, COLLAPSED_CAMERA_ANIMATION_MS);
        shell.settleCollapsedLayout();
        return;
      }
      cameraRef.current?.setCamera(stop);
      shell.settleCollapsedLayout();
    },
    [
      b,
      cameraRef,
      fitToBounds,
      shell.expanded,
      shell.mountNativeMap,
      shell.settleCollapsedLayout,
    ],
  );

  const applyExpandedCamera = useCallback(() => {
    if (!shell.mountNativeMap || !shell.expanded) return;
    fitFocusedBounds(b, shell.expandedPadding, MINIMAP_FIT_BOUNDS_ANIMATION_MS, {
      markFitted: true,
    });
  }, [b, fitFocusedBounds, shell.expanded, shell.expandedPadding, shell.mountNativeMap]);

  const { markPendingCollapsedCamera, markPendingExpandedCamera, onMapLayout } =
    useMiniMapViewportCameraOnLayout({
      expanded: shell.expanded,
      onCollapsedLayoutStable: applyCollapsedCamera,
      onExpandedLayoutStable: applyExpandedCamera,
    });

  useEffect(() => {
    const cleanup = () => {
      clearMapSelections();
      setLegendExpanded(false);
      markPendingCollapsedCamera();
    };
    shell.registerCollapseCleanup(cleanup);
    return () => shell.registerCollapseCleanup(null);
  }, [
    shell.registerCollapseCleanup,
    clearMapSelections,
    markPendingCollapsedCamera,
  ]);

  useEffect(() => {
    if (!shell.expanded) {
      clearMapSelections();
      setLegendExpanded(false);
    }
  }, [shell.expanded, clearMapSelections]);

  useEffect(() => {
    if (!shell.mountNativeMap || !shell.expanded) return;
    markPendingExpandedCamera();
  }, [shell.expanded, shell.mountNativeMap, markPendingExpandedCamera]);

  const resetPosition = useCallback(() => {
    clearMapSelections();
    setLegendExpanded(false);
    setSelectedLineHighlight(null);
    setSelectedLineStyle(null);
    lineHighlightWaitForCameraRef.current = false;
    beginCameraFocus();
    fitFocusedBounds(b, shell.expandedPadding, MINIMAP_FIT_BOUNDS_ANIMATION_MS, {
      markFitted: true,
    });
  }, [
    beginCameraFocus,
    clearMapSelections,
    fitFocusedBounds,
    b,
    shell.expandedPadding,
  ]);

  const userLocationCoord = useForegroundUserLocation(
    shell.expanded && shell.mapBodyVisible,
  );

  const resetCameraToUserPosition = useCallback(() => {
    if (userLocationCoord == null) return;
    cameraRef.current?.setCamera({
      centerCoordinate: userLocationCoord,
      zoomLevel: USER_LOCATION_ZOOM,
      animationDuration: 300,
    });
  }, [userLocationCoord]);

  const userPositionButtonVisible =
    userLocationCoord != null &&
    mapLiveCenter != null &&
    mapLiveZoom != null &&
    (Math.abs(mapLiveCenter[0] - userLocationCoord[0]) > 1e-4 ||
      Math.abs(mapLiveCenter[1] - userLocationCoord[1]) > 1e-4 ||
      Math.abs(mapLiveZoom - USER_LOCATION_ZOOM) > 0.05);

  const [mapFinishedLoading, setMapFinishedLoading] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (!shell.mountNativeMap) {
      setMapFinishedLoading(false);
    }
  }, [shell.mountNativeMap]);

  useEffect(() => {
    setMapFinishedLoading(false);
    setMapLoadError(null);
    setSelectedLineHighlight(null);
    setSelectedLineStyle(null);
    clearMapSelections();
    setLegendExpanded(false);
    setLegendScrollIntoViewEpoch(0);
  }, [miniMapReloadKey, clearMapSelections]);

  const mapBlockingErrorMessage =
    mapLoadError != null && !mapFinishedLoading ? mapLoadError.message : null;

  useEffect(() => {
    shell.setBlockingErrorMessage(mapBlockingErrorMessage);
  }, [mapBlockingErrorMessage, shell.setBlockingErrorMessage]);

  const reloadMinimap = useCallback(() => {
    setMapLoadError(null);
    setMapFinishedLoading(false);
    shell.setBlockingErrorMessage(null);
  }, [shell.setBlockingErrorMessage]);

  useEffect(() => {
    if (reloadRegisterRef == null) return;
    reloadRegisterRef.current = reloadMinimap;
    return () => {
      reloadRegisterRef.current = null;
    };
  }, [reloadRegisterRef, reloadMinimap]);

  useEffect(() => {
    shell.setLoadingOverlayVisible(
      shell.mapBodyVisible &&
        mapBlockingErrorMessage == null &&
        !mapFinishedLoading &&
        (!isOfflineTiles || offlineTilesPrepared),
    );
  }, [
    isOfflineTiles,
    mapFinishedLoading,
    mapBlockingErrorMessage,
    offlineTilesPrepared,
    shell.mapBodyVisible,
    shell.setLoadingOverlayVisible,
  ]);

  const refreshTooltipScreenPosition = useCallback(async () => {
    const map = mapRef.current;
    const ll = selectedPointLngLatRef.current;
    if (!map || ll == null) return;
    try {
      const [x, y] = await map.getPointInView(ll);
      setPointTooltip((prev) =>
        prev ? { ...prev, x: x as number, y: y as number } : prev,
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mapFinishedLoading || !shell.expanded || mapRef.current == null) {
      setSelectedLineHighlight(null);
      setSelectedLineStyle(null);
      return;
    }
    if (selectedSegmentKey == null) {
      setSelectedLineHighlight(null);
      setSelectedLineStyle(null);
      return;
    }
    const geoBounds = lineSelectionBounds(selectedSegmentKey, miniMap.legend);
    if (geoBounds == null) {
      setSelectedLineHighlight(null);
      setSelectedLineStyle(null);
      return;
    }
    const style = lineSelectionStyle(
      selectedSegmentKey,
      miniMap.legend,
      map.focusedLineSegment,
    );
    const legend = miniMap.legend;
    const key = selectedSegmentKey;
    let cancelled = false;
    const run = async () => {
      const longDelay = lineHighlightWaitForCameraRef.current;
      await new Promise((r) =>
        setTimeout(r, longDelay ? MINIMAP_FIT_BOUNDS_ANIMATION_MS : 90),
      );
      if (cancelled || mapRef.current == null) return;
      const map = mapRef.current;
      try {
        const rect = await mapBoundsToRenderedScreenRect(
          map,
          geoBounds,
          14,
          windowWidth,
          windowHeight,
        );
        const fc = await map.queryRenderedFeaturesInRect(rect, LINE_ONLY_FILTER, [PAGE_LINE_LAYER_ID]);
        if (cancelled) return;
        const hits = fc?.features ?? [];
        const lines = filterRenderedLinesForSelectionKey(hits, key, legend);
        if (lines.length === 0) {
          lineHighlightWaitForCameraRef.current = false;
          setSelectedLineHighlight(null);
          setSelectedLineStyle(null);
          return;
        }
        lineHighlightWaitForCameraRef.current = false;
        setSelectedLineHighlight({ type: "FeatureCollection", features: lines });
        setSelectedLineStyle(style);
      } catch {
        lineHighlightWaitForCameraRef.current = false;
        if (!cancelled) {
          setSelectedLineHighlight(null);
          setSelectedLineStyle(null);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    selectedSegmentKey,
    mapFinishedLoading,
    shell.expanded,
    miniMap.legend,
    map.focusedLineSegment,
    miniMapReloadKey,
    windowWidth,
    windowHeight,
  ]);

  const pointIconImageExpr = useMemo(() => {
    const none = "__none__";
    const key = selectedSegmentKey ?? none;
    return [
      "case",
      ["==", ["to-string", ["get", "legendId"]], key],
      ROUTE_MARKER_SELECTED_IMAGE,
      ROUTE_MARKER_IMAGE,
    ] as const;
  }, [selectedSegmentKey]);

  const onMapPress = useCallback(
    async (feature: GeoJSON.Feature<GeoJSON.Point, { screenPointX: number; screenPointY: number }>) => {
      if (!shell.expanded) return;
      const map = mapRef.current;
      if (!map) return;
      const { screenPointX, screenPointY } = feature.properties;
      try {
        const fc = await map.queryRenderedFeaturesAtPoint(
          [screenPointX, screenPointY],
          [],
          [
            PAGE_POINT_ICON_LAYER_ID,
            PAGE_POINT_LABEL_LAYER_ID,
            PAGE_LINE_LAYER_ID,
          ],
        );
        const hits = fc?.features ?? [];
        const pointHit = hits.find(
          (h: GeoJSON.Feature) => h.geometry?.type === "Point",
        ) as GeoJSON.Feature<GeoJSON.Point> | undefined;
        const lineHit = hits.find(
          (h: GeoJSON.Feature) => h.geometry?.type === "LineString",
        ) as GeoJSON.Feature<GeoJSON.LineString> | undefined;

        if (pointHit?.geometry?.type === "Point") {
          const focusGen = beginCameraFocus();
          markCameraMovedFromBounds();
          const props = pointHit.properties as Record<string, unknown> | null;
          const key = String(props?.legendId ?? "").trim();
          if (!key) return;
          const fullName = String(props?.name ?? "").trim();
          const [lng, lat] = pointHit.geometry.coordinates;
          selectedPointLngLatRef.current = [lng, lat];
          focusedFeatureRef.current = { type: "point", lngLat: [lng, lat] };
          setSelectedSegmentKey(key);
          setRelevantExpanded(true);
          const z = await map.getZoom();
          if (cameraFocusGenerationRef.current !== focusGen) return;
          cameraRef.current?.setCamera(
            pointFocusCameraStop([lng, lat], z, focusPaddingRef.current),
          );
          try {
            const [px, py] = await map.getPointInView([lng, lat]);
            setPointTooltip({ x: px as number, y: py as number, fullName: fullName || " " });
          } catch {
            setPointTooltip({ x: screenPointX, y: screenPointY - 40, fullName: fullName || " " });
          }
          if (hasPageLegend) setLegendExpanded(true);
          return;
        }

        if (lineHit?.geometry?.type === "LineString") {
          beginCameraFocus();
          markCameraMovedFromBounds();
          const lineName = String(
            (lineHit.properties as Record<string, unknown> | null)?.name ?? "",
          ).trim();
          if (!lineName) {
            clearMapSelections();
            return;
          }
          const key = resolveLineLegendSelectionId(miniMap.legend, lineHit);
          const legendItem = legendItemForKey(miniMap.legend, key);
          let fitBounds: Bounds | null =
            legendItem != null ? boundsFromLegendItem(legendItem) : null;
          if (fitBounds == null) {
            fitBounds = boundsFromPositions(lineHit.geometry.coordinates);
          }
          lineHighlightWaitForCameraRef.current = fitBounds != null;
          focusedFeatureRef.current =
            fitBounds != null ? { type: "bounds", bounds: fitBounds } : null;
          if (fitBounds != null) {
            fitFocusedBounds(fitBounds, focusPaddingRef.current);
          }
          setSelectedSegmentKey(key);
          setRelevantExpanded(true);
          setPointTooltip(null);
          selectedPointLngLatRef.current = null;
          if (hasPageLegend) {
            setLegendExpanded(true);
            setLegendScrollIntoViewEpoch((n) => n + 1);
          }
          return;
        }
      } catch {
        /* fall through to clear */
      }
      clearMapSelections();
    },
    [
      beginCameraFocus,
      shell.expanded,
      cameraRef,
      clearMapSelections,
      hasPageLegend,
      miniMap.legend,
      fitFocusedBounds,
      markCameraMovedFromBounds,
    ],
  );

  const onCameraChangedWrapped = useCallback(
    (state: { properties: { pitch: number; heading: number; center: unknown; zoom: number } }) => {
      onCameraChanged(state);
      if (shell.expanded) {
        const c = state.properties.center as [number, number];
        setMapLiveCenter(c);
        setMapLiveZoom(state.properties.zoom);
      }
      if (selectedPointLngLatRef.current != null) void refreshTooltipScreenPosition();
    },
    [onCameraChanged, refreshTooltipScreenPosition, shell.expanded],
  );

  const handleLegendSelectSegment = useCallback(
    (key: string) => {
      const focusGen = beginCameraFocus();
      markCameraMovedFromBounds();
      setPointTooltip(null);
      selectedPointLngLatRef.current = null;
      setSelectedSegmentKey(key);
      setLegendExpanded(true);
      setRelevantExpanded(true);
      const item = legendItemForKey(miniMap.legend, key);
      if (item?.featureType === LegendFeatureType.Point) {
        const point = item as PointLegendItem;
        const lngLat: [number, number] = [point.coordinates.lon, point.coordinates.lat];
        focusedFeatureRef.current = { type: "point", lngLat };
        lineHighlightWaitForCameraRef.current = false;
        void (async () => {
          const z = (await mapRef.current?.getZoom()) ?? POINT_FOCUS_MIN_ZOOM;
          if (cameraFocusGenerationRef.current !== focusGen) return;
          cameraRef.current?.setCamera(
            pointFocusCameraStop(lngLat, z, focusPaddingRef.current),
          );
        })();
        return;
      }
      const bounds = item != null ? boundsFromLegendItem(item) : undefined;
      const willFit = bounds != null;
      focusedFeatureRef.current =
        bounds != null ? { type: "bounds", bounds } : null;
      lineHighlightWaitForCameraRef.current =
        willFit && isLineRowSelectionKey(key, miniMap.legend);
      if (bounds != null) {
        fitFocusedBounds(bounds, focusPaddingRef.current);
      }
    },
    [
      beginCameraFocus,
      miniMap.legend,
      fitFocusedBounds,
      markCameraMovedFromBounds,
      cameraRef,
    ],
  );

  useEffect(() => {
    void refreshTooltipScreenPosition();
  }, [pointTooltip?.fullName, refreshTooltipScreenPosition]);

  const { insets } = shell;
  const headerTop = insets.top + headerChrome.rowTopInset;
  const buttonStackTop = expandedMiniMapHeaderRowStackTop(
    headerTop,
    headerChrome,
    mapChrome,
  );

  const legendMaxH = windowHeight / 3;
  const overlayEdgeGap = useMemo(
    () => expandedMiniMapOverlayEdgeGap(uiScale, fontScale),
    [uiScale, fontScale],
  );
  /** Tab bar + scaled gap so the legend sits above the tab bar (same as docked RoutePreview). */
  const legendBottomOffset = useMemo(
    () => expandedMiniMapOverlayBottomOffset(tabBarHeight, uiScale, fontScale),
    [tabBarHeight, uiScale, fontScale],
  );

  const selectedLegendItem = useMemo(
    () =>
      selectedSegmentKey != null
        ? legendItemForKey(miniMap.legend, selectedSegmentKey) ?? null
        : null,
    [miniMap.legend, selectedSegmentKey],
  );

  const relevantContent = useMemo(() => {
    if (!settings.showRelevantContext || selectedLegendItem == null) return null;
    return buildRelevantContextContent(
      selectedLegendItem,
      betaSectionLookup,
      imageLookup,
      measurementsLookup,
      settings.showRelevantContextStrengths,
    );
  }, [
    settings.showRelevantContext,
    settings.showRelevantContextStrengths,
    selectedLegendItem,
    betaSectionLookup,
    imageLookup,
    measurementsLookup,
  ]);

  const showRelevantInfo =
    shell.expanded && selectedLegendItem != null && relevantContent != null;

  /**
   * Keep the last Relevant Info payload mounted while the map is expanded so
   * Fabric does not remount the Relevant Info tree on every selection change.
   * Hide via opacity when the current selection has no content.
   */
  const [pinnedRelevant, setPinnedRelevant] = useState<{
    content: RelevantContextContent;
    legendItemName: string;
  } | null>(null);

  useEffect(() => {
    if (relevantContent != null && selectedLegendItem != null) {
      setPinnedRelevant({
        content: relevantContent,
        legendItemName: selectedLegendItem.name,
      });
    }
  }, [relevantContent, selectedLegendItem]);

  useEffect(() => {
    if (!shell.expanded) {
      setPinnedRelevant(null);
      setRelevantFootprint(null);
    }
  }, [shell.expanded]);

  useEffect(() => {
    setPinnedRelevant(null);
    setRelevantFootprint(null);
  }, [miniMapReloadKey]);

  useEffect(() => {
    if (!showRelevantInfo) {
      setRelevantFootprint(null);
    }
  }, [showRelevantInfo]);

  const lineHighlightShape =
    selectedLineHighlight != null && selectedLineHighlight.features.length > 0
      ? selectedLineHighlight
      : EMPTY_LINE_HIGHLIGHT;
  const lineHighlightStroke =
    selectedLineStyle?.stroke ?? map.focusedLineSegment;
  const lineHighlightWidth =
    selectedLineStyle?.strokeWidth ?? DEFAULT_LINE_HIGHLIGHT_WIDTH;
  const lineHighlightOpacity =
    selectedLineHighlight != null && selectedLineHighlight.features.length > 0
      ? 1
      : 0;

  /**
   * When Relevant Info is visible, split the pair around the screen center so the
   * fixed gap between the cards is centered. Alone, the legend still starts at mid-screen.
   */
  const halfGap = RELEVANT_INFO_LEGEND_GAP / 2;
  const screenCenterX = windowWidth / 2;
  const legendLeftOffset = showRelevantInfo
    ? screenCenterX + halfGap
    : screenCenterX;
  const relevantInfoRightOffset = screenCenterX + halfGap;

  const toast = useToast();
  /** One toast per selected legend item with unresolved relevant images. */
  const lastUnresolvedToastItemIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedLegendItem == null) {
      lastUnresolvedToastItemIdRef.current = null;
      return;
    }
    if (!showRelevantInfo || relevantContent?.hasUnresolvedImages !== true) return;
    if (lastUnresolvedToastItemIdRef.current === selectedLegendItem.id) return;
    lastUnresolvedToastItemIdRef.current = selectedLegendItem.id;
    toast.upsertPill({
      key: "error-relevant-context",
      message: `Error loading relevant info for ${selectedLegendItem.name}`,
      messageMaxLines: 2,
      durationMs: 5000,
    });
  }, [selectedLegendItem, showRelevantInfo, relevantContent, toast]);

  const headerBottomY = headerHeight != null ? headerTop + headerHeight : null;
  const overlayFootprint = Math.max(
    legendFootprint ?? 0,
    showRelevantInfo ? relevantFootprint ?? 0 : 0,
  );
  const overlayTopY =
    overlayFootprint > 0
      ? windowHeight - legendBottomOffset - overlayFootprint
      : null;
  const focusPadding = useMemo(
    () =>
      focusCameraPadding({
        headerBottomY,
        overlayTopY,
        windowHeight,
        fallback: shell.expandedPadding,
      }),
    [headerBottomY, overlayTopY, windowHeight, shell.expandedPadding],
  );
  const focusPaddingRef = useRef(focusPadding);
  focusPaddingRef.current = focusPadding;

  /** Refit the focused feature when the header/overlay footprint changes (panel expand/collapse, layout). */
  useEffect(() => {
    if (!shell.expanded) return;
    const focused = focusedFeatureRef.current;
    if (focused == null) return;
    const focusGen = beginCameraFocus();
    if (focused.type === "point") {
      const lngLat = focused.lngLat;
      void (async () => {
        const z = (await mapRef.current?.getZoom()) ?? POINT_FOCUS_MIN_ZOOM;
        if (cameraFocusGenerationRef.current !== focusGen) return;
        if (focusedFeatureRef.current?.type !== "point") return;
        cameraRef.current?.setCamera(pointFocusCameraStop(lngLat, z, focusPadding));
        void refreshTooltipScreenPosition();
      })();
      return;
    }
    fitFocusedBounds(focused.bounds, focusPadding);
  }, [
    beginCameraFocus,
    focusPadding,
    shell.expanded,
    fitFocusedBounds,
    cameraRef,
    refreshTooltipScreenPosition,
  ]);

  const pagePointLabelStyle = useMemo(
    () => pagePointLabelSymbolStyle(map.marker, markerMetrics, markerTextFont),
    [map.marker, markerMetrics, markerTextFont],
  );

  const pagePointIconStyle = useMemo(
    () => ({
      iconImage: pointIconImageExpr,
      iconSize: pageMiniMapPointIconSize(
        selectedSegmentKey,
        markerMetrics.iconSizeScale,
      ),
      iconColor: map.marker.defaultIcon,
      iconAllowOverlap: true,
      iconIgnorePlacement: true,
      iconAnchor: "center" as const,
    }),
    [
      map.marker.defaultIcon,
      markerMetrics.iconSizeScale,
      pointIconImageExpr,
      selectedSegmentKey,
    ],
  );

  const pageLineLayerStyle = useMemo(
    () => trailVectorLineStyle(map.focusedLineSegment),
    [map.focusedLineSegment],
  );

  return (
    <>
      {shell.mapBodyVisible && (!isOfflineTiles || offlineTilesPrepared) ? (
        <View
          style={minimapStyles.map}
          pointerEvents={shell.expanded ? "auto" : "none"}
        >
          <MapView
            key={`${miniMapReloadKey}:offline-prepared`}
            ref={mapRef}
            styleURL={MAPBOX_STYLE_URL}
            style={StyleSheet.absoluteFill}
            projection="globe"
            onLayout={onMapLayout}
            pointerEvents={shell.expanded ? "auto" : "none"}
            scrollEnabled={shell.expanded}
            zoomEnabled={shell.expanded}
            rotateEnabled={shell.expanded}
            pitchEnabled={shell.expanded}
            scaleBarEnabled={false}
            attributionEnabled={shell.expanded}
            logoEnabled={shell.expanded}
            logoPosition={Platform.OS === "android" ? { bottom: 40, left: 10 } : undefined}
            attributionPosition={Platform.OS === "android" ? { bottom: 40, right: 10 } : undefined}
            onCameraChanged={onCameraChangedWrapped}
            onPress={onMapPress}
            onDidFinishLoadingMap={() => setMapFinishedLoading(true)}
            onMapLoadingError={() => setMapLoadError(new Error("Could not load map"))}
          >
            <LocationPuck
              puckBearingEnabled
              puckBearing="heading"
              pulsing={{ isEnabled: true, radius: "accuracy" }}
            />
            <Camera
              ref={cameraRef}
              defaultSettings={{
                bounds: {
                  ne: [b.east, b.north],
                  sw: [b.west, b.south],
                  ...CAMERA_PADDING,
                },
              }}
            />
            <Images nativeAssetImages={[...ROUTE_MARKER_NATIVE_ASSET_IMAGES]} />
            <VectorSource id={PAGE_VECTOR_SOURCE_ID} tileUrlTemplates={[tileTemplate]}>
              <LineLayer
                id={PAGE_LINE_LAYER_ID}
                sourceLayerID={miniMap.polyLineLayerId}
                filter={LINE_ONLY_FILTER}
                style={pageLineLayerStyle}
              />
              <SymbolLayer
                id={PAGE_POINT_LABEL_LAYER_ID}
                sourceLayerID={miniMap.pointLayerId}
                filter={POINT_ONLY_FILTER}
                style={pagePointLabelStyle}
              />
              <SymbolLayer
                id={PAGE_POINT_ICON_LAYER_ID}
                sourceLayerID={miniMap.pointLayerId}
                filter={POINT_ONLY_FILTER}
                style={pagePointIconStyle}
              />
            </VectorSource>
            <ShapeSource id={PAGE_SELECTED_HALO_SOURCE_ID} shape={lineHighlightShape}>
              <LineLayer
                id={PAGE_SELECTED_HALO_LAYER_ID}
                style={{
                  lineColor: contrastHaloColor(lineHighlightStroke),
                  lineWidth: Math.max(8, lineHighlightWidth + 6),
                  lineOpacity: lineHighlightOpacity,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <LineLayer
                id={PAGE_SELECTED_OVERLAY_LAYER_ID}
                style={{
                  lineColor: lineHighlightStroke,
                  lineWidth: lineHighlightWidth,
                  lineOpacity: lineHighlightOpacity,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </ShapeSource>
          </MapView>
          {shell.expanded && pointTooltip != null ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View
                style={[
                  styles.tooltip,
                  {
                    left: Math.max(8, pointTooltip.x - 90),
                    top: Math.max(8, pointTooltip.y - 52),
                  },
                ]}
              >
                <ConstantText
                  size={uiScale.map.text.markerTooltip}
                  typography={textStyle.map.markerTooltip}
                  style={styles.tooltipText}
                  numberOfLines={4}
                >
                  {pointTooltip.fullName}
                </ConstantText>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
      {shell.expanded ? (
        <Animated.View
          style={[expandedChromeStyles.layer, shell.expandedChromeStyle]}
          pointerEvents="box-none"
        >
          <MiniMapHeader
            title={miniMap.title}
            onBack={shell.requestCollapse}
            top={headerTop}
            onHeaderHeightChange={setHeaderHeight}
          />
          {hasPageLegend && miniMap.legend != null ? (
            <MapLegendPanel
              legend={miniMap.legend}
              expanded={legendExpanded}
              selectedKey={selectedSegmentKey}
              scrollIntoViewEpoch={legendScrollIntoViewEpoch}
              maxHeight={legendMaxH}
              leftOffset={legendLeftOffset}
              bottomOffset={legendBottomOffset}
              rightInset={insets.right + overlayEdgeGap}
              onToggleExpanded={() => setLegendExpanded((e) => !e)}
              onSelectLegendId={handleLegendSelectSegment}
              onExpandedFootprintChange={setLegendFootprint}
            />
          ) : null}
          {pinnedRelevant != null ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                !showRelevantInfo ? styles.relevantInfoHidden : null,
              ]}
              pointerEvents={showRelevantInfo ? "box-none" : "none"}
            >
              <RelevantInfoPanel
                content={pinnedRelevant.content}
                legendItemName={
                  showRelevantInfo && selectedLegendItem != null
                    ? selectedLegendItem.name
                    : pinnedRelevant.legendItemName
                }
                miniMapTitle={miniMap.title}
                expanded={showRelevantInfo && relevantExpanded}
                maxHeight={legendMaxH}
                leftOffset={insets.left + overlayEdgeGap}
                rightOffset={relevantInfoRightOffset}
                bottomOffset={legendBottomOffset}
                onToggleExpanded={() => setRelevantExpanded((e) => !e)}
                onExpandedFootprintChange={
                  showRelevantInfo ? setRelevantFootprint : undefined
                }
              />
            </View>
          ) : null}
          <ButtonStack top={buttonStackTop}>
            <ButtonStack.Slot id="bounds" visible={boundsResetButtonVisible}>
              <ResetCameraToBoundsButton
                stacked
                onPress={resetPosition}
                visible={boundsResetButtonVisible}
              />
            </ButtonStack.Slot>
            <ButtonStack.Slot id="orientation" visible={compassVisible}>
              <ResetCameraOrientationButton
                stacked
                iconRotation={-cameraHeadingDeg}
                onPress={() => resetPitchAndHeading()}
                visible={compassVisible}
              />
            </ButtonStack.Slot>
            <ButtonStack.Slot id="user-position" visible={userPositionButtonVisible}>
              <ResetCameraToPositionButton
                stacked
                onPress={resetCameraToUserPosition}
                visible={userPositionButtonVisible}
              />
            </ButtonStack.Slot>
          </ButtonStack>
        </Animated.View>
      ) : null}
    </>
  );
}

const expandedChromeStyles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    elevation: 4,
  },
});

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    maxWidth: 200,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(17,17,17,0.92)",
  },
  tooltipText: {
    color: "#fff",
  },
  /** Keep Relevant Info mounted but invisible when the current selection has no content. */
  relevantInfoHidden: {
    opacity: 0,
  },
});
