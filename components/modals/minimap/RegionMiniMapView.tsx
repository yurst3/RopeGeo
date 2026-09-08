import { ButtonStack } from "@/components/buttons/ButtonStack";
import { MapLayersButton } from "@/components/buttons/standard/MapLayersButton";
import { MapStyleLayers } from "@/components/modals/mapLayers/MapStyleLayers";
import { useMapLayersSheet } from "@/context/ui/MapLayersSheetContext";
import { useMapLayersSettings } from "@/hooks/map/useMapLayersSettings";
import { useMapStyleLoadGate } from "@/hooks/map/useMapStyleLoadGate";
import { ResetCameraOrientationButton } from "@/components/buttons/standard/ResetCameraOrientationButton";
import { ResetCameraToBoundsButton } from "@/components/buttons/standard/ResetCameraToBoundsButton";
import { ResetCameraToPositionButton } from "@/components/buttons/standard/ResetCameraToPositionButton";
import { useForegroundUserLocation } from "@/utils/location/useForegroundUserLocation";
import { RoutePreview } from "@/components/previews/route/RoutePreview";
import {
  RouteMarkersLayer,
  type RoutesState,
} from "@/components/screens/explore/RouteMarkersLayer";
import { TrailsLayer } from "@/components/screens/explore/TrailsLayer";
import {
  expandedMiniMapHeaderRowStackTop,
  useHeaderChromeLayout,
  useMapButtonChromeLayout,
} from "@/utils/layout/buttonChromeLayout";
import {
  routePreviewDockedPaddingBottom,
} from "@/utils/minimap/fullScreenMapLayout";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { MiniMapHeader } from "./shared/MiniMapHeader";
import { miniMapHostStyles } from "@/utils/minimap/miniMapHostStyles";
import {
  MiniMapNativeGestureHost,
  miniMapInteractionProps,
} from "./shared/miniMapMapGestures";
import {
  CAMERA_PADDING,
  MINIMAP_FIT_BOUNDS_ANIMATION_MS,
  minimapStyles,
} from "./shared/minimapShared";
import { useMiniMapShell } from "@/components/modals/minimap/miniMapAnimatedCard";
import type { MiniMapReloadRegisterRef } from "@/utils/minimap/miniMapHandle";
import { useMiniMapViewportCameraOnLayout } from "@/utils/minimap/useMiniMapViewportCameraOnLayout";
import { useMiniMapCamera } from "@/utils/minimap/useMiniMapCamera";
import { Camera, LocationPuck, MapView } from "@rnmapbox/maps";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import {
  type OfflinePagePreview,
  type OnlinePagePreview,
  PageDataSource,
  RouteFilter,
  RoutesParams,
  type OnlineRegionMiniMap,
} from "ropegeo-common/models";

const USER_LOCATION_ZOOM = 14;
const COLLAPSED_CAMERA_ANIMATION_MS = 250;

type RegionFitBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

function boundsToFit(b: OnlineRegionMiniMap["bounds"]): RegionFitBounds | null {
  if (b == null) return null;
  return {
    north: b.north,
    south: b.south,
    east: b.east,
    west: b.west,
  };
}

export type RegionMiniMapViewProps = {
  regionMiniMap: OnlineRegionMiniMap;
  regionId: string;
  source: PageDataSource;
  onRoutesStateChange?: (state: RoutesState) => void;
  /** Filled by parent `MiniMap` for imperative `reload`. */
  reloadRegisterRef?: MiniMapReloadRegisterRef;
};

/**
 * Region minimap: fits the camera to API bounds when present and loads route markers via GET /routes
 * using merged filter + {@link OnlineRegionMiniMap.routesParams}.
 */
export function RegionMiniMapView({
  regionMiniMap,
  regionId,
  source,
  onRoutesStateChange,
  reloadRegisterRef,
}: RegionMiniMapViewProps) {
  const shell = useMiniMapShell();
  const mapLayers = useMapLayersSettings();
  const {
    styleReady,
    onDidFinishLoadingMap: onStyleReady,
    onDidFinishLoadingStyle: onStyleFinishedLoading,
    onMapLoadingError: onStyleLoadError,
  } = useMapStyleLoadGate(mapLayers.styleUrl);
  const { openMapLayersSheet } = useMapLayersSheet();
  const headerChrome = useHeaderChromeLayout();
  const mapChrome = useMapButtonChromeLayout();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const apiBounds = regionMiniMap.bounds;
  const regionFitBounds = useMemo(
    () => boundsToFit(apiBounds),
    [apiBounds?.north, apiBounds?.south, apiBounds?.east, apiBounds?.west],
  );

  const [routesState, setRoutesState] = useState<RoutesState>({
    loading: true,
    data: null,
    errors: null,
    received: 0,
    total: null,
    timeoutCountdown: null,
  });

  const handleRoutesStateChange = useCallback(
    (state: RoutesState) => {
      setRoutesState(state);
      onRoutesStateChange?.(state);
    },
    [onRoutesStateChange],
  );
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [currentPreview, setCurrentPreview] = useState<
    OnlinePagePreview | OfflinePagePreview | null
  >(null);
  const [mapLiveCenter, setMapLiveCenter] = useState<[number, number] | undefined>(undefined);
  const [mapLiveZoom, setMapLiveZoom] = useState<number | undefined>(undefined);

  const regionRoutesParams = useMemo((): RoutesParams => {
    const base = new RouteFilter([source]).toRoutesParams();
    const server = regionMiniMap.routesParams;
    const reg = server.region;
    if (reg == null) {
      throw new Error("OnlineRegionMiniMap.routesParams.region is required");
    }
    return new RoutesParams({
      region: { id: reg.id, source },
      sources: null,
      routeTypes: base.routeTypes ?? server.routeTypes,
      difficulty: base.difficulty ?? server.difficulty,
      limit: server.limit,
      page: server.page,
    });
  }, [regionMiniMap.routesParams, source]);

  const {
    cameraRef,
    fitToBounds,
    resetPitchAndHeading,
    onCameraChanged,
    compassVisible,
    boundsResetButtonVisible,
    cameraHeadingDeg,
    markCameraMovedFromBounds,
    markCameraFittedToBounds,
  } = useMiniMapCamera({ expanded: shell.expanded });

  const applyCollapsedCamera = useCallback((_size: { width: number; height: number }) => {
    if (!shell.mountNativeMap || shell.expanded || regionFitBounds == null) return;
    resetPitchAndHeading(COLLAPSED_CAMERA_ANIMATION_MS);
    fitToBounds(regionFitBounds, CAMERA_PADDING, COLLAPSED_CAMERA_ANIMATION_MS);
    shell.settleCollapsedLayout();
  }, [
    fitToBounds,
    regionFitBounds,
    resetPitchAndHeading,
    shell.expanded,
    shell.mountNativeMap,
    shell.settleCollapsedLayout,
  ]);

  const applyExpandedCamera = useCallback(() => {
    if (!shell.mountNativeMap || !shell.expanded) return;
    if (regionFitBounds) {
      fitToBounds(regionFitBounds, shell.expandedPadding, MINIMAP_FIT_BOUNDS_ANIMATION_MS, {
        markFitted: true,
      });
    } else {
      markCameraFittedToBounds();
    }
  }, [
    fitToBounds,
    markCameraFittedToBounds,
    regionFitBounds,
    shell.expanded,
    shell.expandedPadding,
    shell.mountNativeMap,
  ]);

  const { markPendingCollapsedCamera, markPendingExpandedCamera, onMapLayout } =
    useMiniMapViewportCameraOnLayout({
      expanded: shell.expanded,
      onCollapsedLayoutStable: applyCollapsedCamera,
      onExpandedLayoutStable: applyExpandedCamera,
    });

  const collapseCleanup = useCallback(() => {
    setFocusedRouteId(null);
    setCurrentPreview(null);
    markPendingCollapsedCamera();
  }, [markPendingCollapsedCamera]);

  useEffect(() => {
    shell.registerCollapseCleanup(collapseCleanup);
    return () => shell.registerCollapseCleanup(null);
  }, [shell.registerCollapseCleanup, collapseCleanup]);

  useEffect(() => {
    if (!shell.mountNativeMap || !regionFitBounds || shell.expanded) return;
    markPendingCollapsedCamera();
  }, [
    markPendingCollapsedCamera,
    regionFitBounds,
    shell.expanded,
    shell.mountNativeMap,
  ]);

  useEffect(() => {
    if (!shell.mountNativeMap || !shell.expanded) return;
    markPendingExpandedCamera();
  }, [shell.expanded, shell.mountNativeMap, markPendingExpandedCamera]);

  const resetPosition = useCallback(() => {
    setFocusedRouteId(null);
    setCurrentPreview(null);
    if (regionFitBounds) {
      fitToBounds(regionFitBounds, shell.expandedPadding, MINIMAP_FIT_BOUNDS_ANIMATION_MS, {
        markFitted: true,
      });
    }
  }, [fitToBounds, regionFitBounds, shell.expandedPadding]);

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

  const onCameraChangedWrapped = useCallback(
    (state: { properties: { pitch: number; heading: number; center: unknown; zoom: number } }) => {
      onCameraChanged(state);
      if (shell.expanded) {
        setMapLiveCenter(state.properties.center as [number, number]);
        setMapLiveZoom(state.properties.zoom);
      }
    },
    [onCameraChanged, shell.expanded],
  );

  const routesRequestError = routesState.errors;
  const hasRoutesData =
    routesState.data != null && routesState.data.features.length > 0;
  const routesBlockingErrorMessage =
    routesRequestError != null && !hasRoutesData
      ? routesRequestError.message
      : null;
  const routesInitialLoading =
    routesState.loading &&
    routesState.data == null &&
    routesState.errors == null;

  useEffect(() => {
    shell.setBlockingErrorMessage(routesBlockingErrorMessage);
  }, [routesBlockingErrorMessage, shell.setBlockingErrorMessage]);

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
    shell.setMapContentReady(
      shell.mapBodyVisible &&
        routesBlockingErrorMessage == null &&
        styleReady &&
        !routesInitialLoading,
    );
  }, [
    routesInitialLoading,
    routesBlockingErrorMessage,
    shell.mapBodyVisible,
    shell.setMapContentReady,
    styleReady,
  ]);

  const { insets } = shell;
  const headerTop = insets.top + headerChrome.rowTopInset;
  const buttonStackTop = expandedMiniMapHeaderRowStackTop(
    headerTop,
    headerChrome,
    mapChrome,
  );

  return (
    <>
      {shell.mapBodyVisible ? (
        <MiniMapNativeGestureHost expanded={shell.expanded}>
          <MapView
          styleURL={mapLayers.styleUrl}
          style={[
            minimapStyles.map,
            !shell.mapChromeInteractive ? { opacity: 0 } : null,
          ]}
          projection="globe"
          onLayout={onMapLayout}
          {...miniMapInteractionProps(shell.expanded)}
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
          onCameraChanged={onCameraChangedWrapped}
          onDidFinishLoadingMap={onStyleReady}
          onDidFinishLoadingStyle={onStyleFinishedLoading}
          onMapLoadingError={onStyleLoadError}
        >
          <LocationPuck
            puckBearingEnabled
            puckBearing="heading"
            pulsing={{ isEnabled: true, radius: "accuracy" }}
          />
          <Camera
            ref={cameraRef}
            defaultSettings={
              regionFitBounds != null
                ? {
                    bounds: {
                      ne: [regionFitBounds.east, regionFitBounds.north],
                      sw: [regionFitBounds.west, regionFitBounds.south],
                      ...CAMERA_PADDING,
                    },
                  }
                : undefined
            }
          />
          {styleReady ? (
            <>
              <MapStyleLayers
                lightPreset={mapLayers.mapLightPreset}
                showElevationContours={mapLayers.showContoursOnMap}
              />
              <TrailsLayer
                focusedRouteId={shell.expanded ? focusedRouteId : null}
                visibleTrailIds={
                  shell.expanded && currentPreview?.mapData != null ? [currentPreview.mapData] : []
                }
              />
            </>
          ) : null}
          <RouteMarkersLayer
            mapLayersReady={styleReady}
            routesParams={regionRoutesParams}
            onStateChange={handleRoutesStateChange}
            cameraRef={cameraRef}
            focusedRouteId={shell.expanded ? focusedRouteId : null}
            onRoutePress={(routeId) => {
              if (!shell.expanded) return;
              markCameraMovedFromBounds();
              setFocusedRouteId(routeId);
              setCurrentPreview(null);
            }}
            onRouteClusterPress={() => {
              if (!shell.expanded) return;
              setFocusedRouteId(null);
              setCurrentPreview(null);
            }}
          />
        </MapView>
        </MiniMapNativeGestureHost>
      ) : null}
      {shell.expanded ? (
        <Animated.View
          style={[expandedChromeStyles.layer, shell.expandedChromeStyle]}
          pointerEvents="box-none"
        >
          <MiniMapHeader
            title={regionMiniMap.title}
            onBack={shell.requestCollapse}
            top={headerTop}
            chromeInteractive={shell.mapChromeInteractive}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              !shell.mapChromeInteractive ? expandedChromeStyles.chromeDimmed : null,
            ]}
            pointerEvents={shell.mapChromeInteractive ? "box-none" : "none"}
          >
            <RoutePreview
              routeId={focusedRouteId}
              containerStyle={[
                miniMapHostStyles.previewContainer,
                {
                  paddingBottom: routePreviewDockedPaddingBottom(
                    shell.layoutHost === "portal" ? 0 : insets.bottom,
                    shell.layoutHost === "portal" ? 0 : tabBarHeight,
                  ),
                },
              ]}
              routeType={
                routesState.data?.features?.find((f) => f.properties?.id === focusedRouteId)
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
            <ButtonStack top={buttonStackTop}>
              <ButtonStack.Slot id="map-layers" visible>
                <MapLayersButton
                  stacked
                  customized={mapLayers.customized}
                  onPress={openMapLayersSheet}
                  disabled={!shell.mapChromeInteractive}
                />
              </ButtonStack.Slot>
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
          </View>
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
  chromeDimmed: {
    opacity: 0.45,
  },
});
