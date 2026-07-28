import { ButtonStack } from "@/components/buttons/ButtonStack";
import { ResetCameraOrientationButton } from "@/components/buttons/standard/ResetCameraOrientationButton";
import { ResetCameraToBoundsButton } from "@/components/buttons/standard/ResetCameraToBoundsButton";
import { ResetCameraToPositionButton } from "@/components/buttons/standard/ResetCameraToPositionButton";
import { useForegroundUserLocation } from "@/utils/location/useForegroundUserLocation";
import { RoutePreview } from "@/components/previews/route/RoutePreview";
import {
  ROUTE_MARKER_CAMERA_ZOOM,
  RouteMarkersLayer,
  type RoutesState,
} from "@/components/screens/explore/RouteMarkersLayer";
import {
  ROUTE_MARKER_NATIVE_ASSET_IMAGES,
  unclusteredRouteMarkerIconImage,
  unclusteredRouteMarkerIconSize,
} from "@/utils/explore/routeMarkerIcons";
import {
  clusterRouteMarkerSymbolStyle,
  unclusteredRouteMarkerSymbolStyle,
} from "@/utils/explore/mapMarkerLayerStyles";
import { TrailsLayer } from "@/components/screens/explore/TrailsLayer";
import { MAPBOX_STYLE_URL } from "@/constants/mapbox";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { expandedMiniMapButtonStackTopScaled, useHeaderChromeLayout } from "@/utils/layout/buttonChromeLayout";
import { routePreviewDockedPaddingBottom } from "@/utils/minimap/fullScreenMapLayout";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { MiniMapHeader, MiniMapHeaderSideSlot } from "./shared/MiniMapHeader";
import { miniMapHostStyles } from "@/utils/minimap/miniMapHostStyles";
import {
  MINIMAP_FIT_BOUNDS_ANIMATION_MS,
  minimapStyles,
} from "./shared/minimapShared";
import { useMiniMapShell } from "@/components/minimap/miniMapAnimatedCard";
import type { MiniMapReloadRegisterRef } from "@/utils/minimap/miniMapHandle";
import { useMiniMapViewportCameraOnLayout } from "@/utils/minimap/useMiniMapViewportCameraOnLayout";
import { useMiniMapCamera } from "@/utils/minimap/useMiniMapCamera";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { useRouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import { useMapMarkerTextFont } from "@/utils/theme/resolvers";
import Animated from "react-native-reanimated";
import {
  Camera,
  Images,
  LocationPuck,
  MapView,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import {
  type OfflineCenteredRegionMiniMap,
  type OnlineCenteredRegionMiniMap,
  PageDataSource,
  RouteFilter,
  RoutesGeojson,
  RoutesParams,
  type OfflinePagePreview,
  type OnlinePagePreview,
} from "ropegeo-common/models";

/** Default map center when `mapDirections` is null (Moab, UT). [lng, lat]. */
const DEFAULT_MAP_CENTER: [number, number] = [-109.5508, 38.5733];
const DEFAULT_ZOOM = 13;
const USER_LOCATION_ZOOM = 14;
const COLLAPSED_CAMERA_ANIMATION_MS = 250;
const FOCUSED_ROUTE_ZOOM = 13;

function mergeCenteredRoutesParams(
  miniMap: OnlineCenteredRegionMiniMap,
  regionRouteFilter: RouteFilter,
  fallbackSource: PageDataSource,
): RoutesParams {
  const base = regionRouteFilter.toRoutesParams();
  const server = miniMap.routesParams;
  const reg = server.region;
  if (reg == null) {
    throw new Error("CenteredRegionMiniMap.routesParams.region is required");
  }
  const catalogue =
    regionRouteFilter.sources != null && regionRouteFilter.sources.length > 0
      ? regionRouteFilter.sources[0]
      : fallbackSource;
  return new RoutesParams({
    region: { id: reg.id, source: catalogue },
    sources: null,
    routeTypes: base.routeTypes ?? server.routeTypes,
    difficulty: base.difficulty ?? server.difficulty,
    limit: server.limit,
    page: server.page,
  });
}

export type CenteredRegionMiniMapViewProps = {
  miniMap: OnlineCenteredRegionMiniMap | OfflineCenteredRegionMiniMap;
  /**
   * When set, used for the initial camera center (before the centered route is located) and for
   * Apple/Google directions on the collapsed minimap (mirrors the tile page minimap).
   */
  mapDirections?: { lat: number; lon: number } | null;
  reloadRegisterRef?: MiniMapReloadRegisterRef;
};

export function CenteredRegionMiniMapView({
  miniMap,
  mapDirections = null,
  reloadRegisterRef,
}: CenteredRegionMiniMapViewProps) {
  const { map } = useColorTheme();
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  const headerChrome = useHeaderChromeLayout();
  const markerMetrics = useRouteMarkerMetrics();
  const markerTextFont = useMapMarkerTextFont();
  const shell = useMiniMapShell();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const defaultCenter = useMemo((): [number, number] => {
    return mapDirections != null
      ? [mapDirections.lon, mapDirections.lat]
      : DEFAULT_MAP_CENTER;
  }, [mapDirections]);

  const [routesState, setRoutesState] = useState<RoutesState>({
    loading: true,
    data: null,
    errors: null,
    received: 0,
    total: null,
    timeoutCountdown: null,
  });

  const [offlineShape, setOfflineShape] = useState<RoutesGeojson | null>(null);
  const [offlineLoadError, setOfflineLoadError] = useState<Error | null>(null);

  const isOffline = miniMap.fetchType === "offline";

  useEffect(() => {
    if (!isOffline || !shell.mountNativeMap) {
      setOfflineShape(null);
      setOfflineLoadError(null);
      return;
    }
    const path = (miniMap as OfflineCenteredRegionMiniMap).downloadedGeojson;
    let cancelled = false;
    void (async () => {
      try {
        const text = await FileSystem.readAsStringAsync(path);
        const raw = JSON.parse(text) as unknown;
        const geo = RoutesGeojson.fromResult(raw);
        if (!cancelled) {
          setOfflineShape(geo);
          setOfflineLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setOfflineShape(null);
          setOfflineLoadError(e instanceof Error ? e : new Error(String(e)));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOffline, miniMap, shell.mountNativeMap]);

  const centeredRouteId = miniMap.centeredRouteId;

  const liveMiniMap = miniMap.fetchType === "online" ? miniMap : null;

  const defaultRegionRouteFilter = useMemo(
    () => new RouteFilter([PageDataSource.Ropewiki]),
    [],
  );

  const liveRoutesParams = useMemo((): RoutesParams | null => {
    if (liveMiniMap == null) return null;
    return mergeCenteredRoutesParams(liveMiniMap, defaultRegionRouteFilter, PageDataSource.Ropewiki);
  }, [liveMiniMap, defaultRegionRouteFilter]);

  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [currentPreview, setCurrentPreview] = useState<
    OnlinePagePreview | OfflinePagePreview | null
  >(null);
  const userFocusedNonCenteredRouteRef = useRef(false);

  const markerAccentRouteId =
    !shell.expanded ||
    focusedRouteId == null ||
    focusedRouteId === centeredRouteId
      ? centeredRouteId
      : null;

  const offlineUnclusteredIconImage = useMemo(
    () =>
      unclusteredRouteMarkerIconImage(
        shell.expanded ? focusedRouteId : null,
        markerAccentRouteId,
      ),
    [shell.expanded, focusedRouteId, markerAccentRouteId],
  );

  const offlineUnclusteredIconSize = useMemo(
    () =>
      unclusteredRouteMarkerIconSize(
        shell.expanded ? focusedRouteId : null,
        markerAccentRouteId,
        markerMetrics.iconSizeScale,
      ),
    [shell.expanded, focusedRouteId, markerAccentRouteId, markerMetrics.iconSizeScale],
  );

  const offlineUnclusteredStyle = useMemo(
    () =>
      unclusteredRouteMarkerSymbolStyle(
        map.marker,
        offlineUnclusteredIconImage,
        offlineUnclusteredIconSize,
        markerMetrics,
        markerTextFont,
      ),
    [map.marker, offlineUnclusteredIconImage, offlineUnclusteredIconSize, markerMetrics, markerTextFont],
  );

  const offlineClusterStyle = useMemo(
    () => clusterRouteMarkerSymbolStyle(map.marker, markerMetrics, markerTextFont),
    [map.marker, markerMetrics, markerTextFont],
  );

  const {
    cameraRef,
    resetPitchAndHeading,
    onCameraChanged,
    compassVisible,
    boundsResetButtonVisible,
    cameraHeadingDeg,
    markCameraMovedFromBounds,
    markCameraFittedToBoundsAfter,
  } = useMiniMapCamera({ expanded: shell.expanded });

  const [mapLiveCenter, setMapLiveCenter] = useState<[number, number] | undefined>(undefined);
  const [mapLiveZoom, setMapLiveZoom] = useState<number | undefined>(undefined);

  const shapeSourceRef = useRef<ComponentRef<typeof ShapeSource>>(null);

  const collapsedHomeCameraRef = useRef<{
    applied: boolean;
    appliedCenterKey: string;
  }>({ applied: false, appliedCenterKey: "" });

  const displayGeojson = isOffline ? offlineShape : routesState.data;

  const routesGeoSettled = useMemo(() => {
    if (isOffline) return offlineShape != null || offlineLoadError != null;
    return routesState.data != null || routesState.errors != null;
  }, [isOffline, offlineShape, offlineLoadError, routesState.data, routesState.errors]);

  const centeredRouteCoordinate = useMemo((): [number, number] | null => {
    if (displayGeojson == null || displayGeojson.features.length === 0) return null;
    const f = displayGeojson.features.find((feat) => feat.properties?.id === centeredRouteId);
    const g = f?.geometry;
    if (g?.type !== "Point" || !Array.isArray(g.coordinates)) return null;
    return g.coordinates as [number, number];
  }, [displayGeojson, centeredRouteId]);

  const collapsedCameraCenter = useMemo(
    (): [number, number] => centeredRouteCoordinate ?? defaultCenter,
    [centeredRouteCoordinate, defaultCenter],
  );

  const applyCollapsedCamera = useCallback((_size: { width: number; height: number }) => {
    if (!shell.mountNativeMap || shell.expanded) return;
    const centerKey = `${collapsedCameraCenter[0]},${collapsedCameraCenter[1]}`;
    resetPitchAndHeading(COLLAPSED_CAMERA_ANIMATION_MS);
    cameraRef.current?.setCamera({
      centerCoordinate: collapsedCameraCenter,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: COLLAPSED_CAMERA_ANIMATION_MS,
    });
    shell.settleCollapsedLayout();
    collapsedHomeCameraRef.current = {
      applied: true,
      appliedCenterKey: centerKey,
    };
  }, [
    collapsedCameraCenter,
    resetPitchAndHeading,
    shell.expanded,
    shell.mountNativeMap,
    shell.settleCollapsedLayout,
  ]);

  const { markPendingCollapsedCamera, onMapLayout } = useMiniMapViewportCameraOnLayout({
    expanded: shell.expanded,
    onCollapsedLayoutStable: applyCollapsedCamera,
  });

  const collapseCleanup = useCallback(() => {
    setFocusedRouteId(null);
    setCurrentPreview(null);
    userFocusedNonCenteredRouteRef.current = false;
    markPendingCollapsedCamera();
  }, [markPendingCollapsedCamera]);

  useEffect(() => {
    shell.registerCollapseCleanup(collapseCleanup);
    return () => shell.registerCollapseCleanup(null);
  }, [shell.registerCollapseCleanup, collapseCleanup]);

  useEffect(() => {
    if (centeredRouteCoordinate == null) return;
    if (!shell.expanded) return;
    if (
      focusedRouteId != null &&
      focusedRouteId !== centeredRouteId
    ) {
      return;
    }
    if (focusedRouteId == null && userFocusedNonCenteredRouteRef.current) {
      return;
    }
    let cancelMarkFitted: (() => void) | undefined;
    const t = setTimeout(() => {
      cameraRef.current?.setCamera({
        centerCoordinate: centeredRouteCoordinate,
        zoomLevel: FOCUSED_ROUTE_ZOOM,
        animationDuration: 300,
      });
      if (shell.expanded) {
        cancelMarkFitted = markCameraFittedToBoundsAfter(300 + 80);
      }
    }, 120);
    return () => {
      clearTimeout(t);
      cancelMarkFitted?.();
    };
  }, [
    centeredRouteCoordinate,
    shell.expanded,
    focusedRouteId,
    centeredRouteId,
    markCameraFittedToBoundsAfter,
  ]);

  useEffect(() => {
    if (!shell.mountNativeMap) {
      collapsedHomeCameraRef.current = { applied: false, appliedCenterKey: "" };
      return;
    }
    if (shell.expanded) {
      const centerKey = `${collapsedCameraCenter[0]},${collapsedCameraCenter[1]}`;
      collapsedHomeCameraRef.current = { applied: false, appliedCenterKey: centerKey };
      return;
    }
    if (!routesGeoSettled) return;
    markPendingCollapsedCamera();
  }, [
    collapsedCameraCenter,
    centeredRouteCoordinate,
    markPendingCollapsedCamera,
    routesGeoSettled,
    shell.expanded,
    shell.mountNativeMap,
  ]);

  /** Same center + zoom as collapsed minimap home camera. */
  const resetToCenteredRouteHome = useCallback(() => {
    userFocusedNonCenteredRouteRef.current = false;
    setFocusedRouteId(null);
    setCurrentPreview(null);
    cameraRef.current?.setCamera({
      centerCoordinate: collapsedCameraCenter,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: MINIMAP_FIT_BOUNDS_ANIMATION_MS,
    });
    markCameraFittedToBoundsAfter(MINIMAP_FIT_BOUNDS_ANIMATION_MS + 80);
  }, [collapsedCameraCenter, markCameraFittedToBoundsAfter]);

  const boundsSlotVisible = boundsResetButtonVisible;

  const userLocationCoord = useForegroundUserLocation(
    shell.expanded && shell.mapBodyVisible,
  );

  const resetCameraToUserPosition = useCallback(() => {
    if (userLocationCoord == null) return;
    markCameraMovedFromBounds();
    cameraRef.current?.setCamera({
      centerCoordinate: userLocationCoord,
      zoomLevel: USER_LOCATION_ZOOM,
      animationDuration: 300,
    });
  }, [markCameraMovedFromBounds, userLocationCoord]);

  const userPositionButtonVisible =
    shell.expanded &&
    userLocationCoord != null &&
    mapLiveCenter != null &&
    mapLiveZoom != null &&
    (Math.abs(mapLiveCenter[0] - userLocationCoord[0]) > 1e-4 ||
      Math.abs(mapLiveCenter[1] - userLocationCoord[1]) > 1e-4 ||
      Math.abs(mapLiveZoom - USER_LOCATION_ZOOM) > 0.05);

  const handleOfflineMarkerPress = async (event: { features?: GeoJSON.Feature[] }) => {
    const features = event.features;
    if (!features?.length || !cameraRef?.current) {
      return;
    }
    const feature = features[0];
    const props = feature?.properties as {
      point_count?: number;
      id?: string;
    } | undefined;
    const geometry = feature?.geometry;
    if (geometry?.type !== "Point" || !Array.isArray(geometry.coordinates)) {
      return;
    }
    const coords = geometry.coordinates as [number, number];
    const [lng, lat] = coords;
    const isCluster = props?.point_count != null;

    if (isCluster && shapeSourceRef.current) {
      markCameraMovedFromBounds();
      try {
        const zoom = await shapeSourceRef.current.getClusterExpansionZoom(
          feature as GeoJSON.Feature<GeoJSON.Point>,
        );
        cameraRef.current.setCamera({
          centerCoordinate: [lng, lat],
          zoomLevel: zoom,
          animationDuration: 300,
        });
      } catch {
        /* ignore */
      }
      return;
    }

    const routeId = props?.id;
    if (routeId && shell.expanded) {
      if (routeId !== centeredRouteId) {
        userFocusedNonCenteredRouteRef.current = true;
      } else {
        userFocusedNonCenteredRouteRef.current = false;
      }
      setFocusedRouteId(routeId);
      setCurrentPreview(null);
      markCameraMovedFromBounds();
      cameraRef.current.setCamera({
        centerCoordinate: coords,
        zoomLevel: ROUTE_MARKER_CAMERA_ZOOM,
        animationDuration: 300,
      });
    }
  };

  const onlineInitialLoading =
    !isOffline &&
    routesState.loading &&
    routesState.data == null &&
    routesState.errors == null;
  const offlineInitialLoading =
    isOffline && offlineShape == null && offlineLoadError == null;

  const onlineGeoError = !isOffline && routesState.errors != null;
  const offlineGeoError = isOffline && offlineLoadError != null;
  const geoErrorMessage = offlineGeoError
    ? offlineLoadError?.message
    : onlineGeoError
      ? routesState.errors?.message
      : undefined;

  const hasRouteGeoData =
    displayGeojson != null && displayGeojson.features.length > 0;
  const blockingGeoErrorMessage =
    geoErrorMessage != null && geoErrorMessage !== "" && !hasRouteGeoData
      ? geoErrorMessage
      : null;

  const showDataLoadingOverlay =
    shell.mountNativeMap &&
    blockingGeoErrorMessage == null &&
    (onlineInitialLoading || offlineInitialLoading);

  useEffect(() => {
    shell.setBlockingErrorMessage(blockingGeoErrorMessage);
  }, [blockingGeoErrorMessage, shell.setBlockingErrorMessage]);

  const reloadMinimap = useCallback(() => {
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
    shell.setLoadingOverlayVisible(showDataLoadingOverlay);
  }, [showDataLoadingOverlay, shell.setLoadingOverlayVisible]);

  const { insets } = shell;

  return (
    <>
      {shell.mapBodyVisible ? (
        <MapView
          styleURL={MAPBOX_STYLE_URL}
          style={minimapStyles.map}
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
          onPress={() => {
            if (!shell.expanded) return;
            setFocusedRouteId(null);
            setCurrentPreview(null);
          }}
          onCameraChanged={(state) => {
            onCameraChanged(state);
            if (shell.expanded) {
              setMapLiveCenter(state.properties.center as [number, number]);
              setMapLiveZoom(state.properties.zoom);
            }
          }}
        >
          <LocationPuck
            puckBearingEnabled
            puckBearing="heading"
            pulsing={{ isEnabled: true, radius: "accuracy" }}
          />
          <Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: collapsedCameraCenter,
              zoomLevel: DEFAULT_ZOOM,
            }}
          />
          {liveRoutesParams != null ? (
            <RouteMarkersLayer
              routesParams={liveRoutesParams}
              onStateChange={setRoutesState}
              cameraRef={cameraRef}
              focusedRouteId={shell.expanded ? focusedRouteId : null}
              accentRouteId={markerAccentRouteId}
              onRoutePress={(routeId) => {
                if (!shell.expanded) return;
                if (routeId !== centeredRouteId) {
                  userFocusedNonCenteredRouteRef.current = true;
                } else {
                  userFocusedNonCenteredRouteRef.current = false;
                }
                setFocusedRouteId(routeId);
                setCurrentPreview(null);
                markCameraMovedFromBounds();
              }}
              onRouteClusterPress={() => {
                if (!shell.expanded) return;
                setFocusedRouteId(null);
                setCurrentPreview(null);
              }}
            />
          ) : offlineShape != null && offlineShape.features.length > 0 ? (
            <ShapeSource
              ref={shapeSourceRef}
              id="centered-offline-routes"
              shape={offlineShape}
              cluster
              clusterRadius={markerMetrics.clusterRadius}
              onPress={handleOfflineMarkerPress}
            >
              <SymbolLayer
                id="centered-offline-unclustered"
                filter={["!", ["has", "point_count"]]}
                style={offlineUnclusteredStyle}
              />
              <SymbolLayer
                id="centered-offline-clusters"
                filter={["has", "point_count"]}
                style={offlineClusterStyle}
              />
              <Images nativeAssetImages={[...ROUTE_MARKER_NATIVE_ASSET_IMAGES]} />
            </ShapeSource>
          ) : null}
          <TrailsLayer
            focusedRouteId={shell.expanded ? focusedRouteId : null}
            visibleTrailIds={
              shell.expanded && currentPreview?.mapData != null ? [currentPreview.mapData] : []
            }
          />
        </MapView>
      ) : null}
      {shell.expanded ? (
        <Animated.View
          style={[expandedChromeStyles.layer, shell.expandedChromeStyle]}
          pointerEvents="box-none"
        >
          <MiniMapHeader
            title={miniMap.title}
            onBack={shell.requestCollapse}
            top={insets.top + headerChrome.rowTopInset}
            rightSlot={
              boundsSlotVisible ? (
                <MiniMapHeaderSideSlot>
                  <ResetCameraToBoundsButton
                    stacked
                    onPress={resetToCenteredRouteHome}
                    visible
                  />
                </MiniMapHeaderSideSlot>
              ) : undefined
            }
          />
          <RoutePreview
            routeId={focusedRouteId}
            containerStyle={[
              miniMapHostStyles.previewContainer,
              {
                paddingBottom: routePreviewDockedPaddingBottom(
                  insets.bottom,
                  tabBarHeight,
                ),
              },
            ]}
            routeType={
              displayGeojson?.features?.find((f) => f.properties?.id === focusedRouteId)
                ?.properties?.type ?? null
            }
            onCurrentPreviewChange={setCurrentPreview}
            onPreviewPress={(preview) => {
              if (preview.source === "ropewiki") {
                router.push({
                  pathname: "/(tabs)/explore/[id]/page",
                  params: {
                    id: preview.id,
                    source: PageDataSource.Ropewiki,
                  },
                } as unknown as Parameters<typeof router.push>[0]);
              } else {
                router.push("/explore/technical-info");
              }
            }}
          />
          <ButtonStack
            top={expandedMiniMapButtonStackTopScaled(
              insets.top,
              boundsSlotVisible,
              uiScale,
              fontScale,
            )}
          >
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
  },
});
