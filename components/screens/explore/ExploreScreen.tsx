import { ButtonStack } from "@/components/buttons/ButtonStack";
import { ResetCameraOrientationButton } from "@/components/buttons/standard/ResetCameraOrientationButton";
import { ResetCameraToPositionButton } from "@/components/buttons/standard/ResetCameraToPositionButton";
import { useExploreHeaderLayout, useToastChromeLayout } from "@/utils/layout/buttonChromeLayout";
import { FilterBottomSheet } from "@/components/filters/FilterBottomSheet";
import { FilterButton } from "@/components/buttons/standard/FilterButton";
import { MapLayersButton } from "@/components/buttons/standard/MapLayersButton";
import { MapStyleLayers } from "@/components/mapLayers/MapStyleLayers";
import { useMapLayersSheet } from "@/context/ui/MapLayersSheetContext";
import { useMapLayersSettings } from "@/hooks/map/useMapLayersSettings";
import { useMapStyleLoadGate } from "@/hooks/map/useMapStyleLoadGate";
import { useSavedFilters } from "@/context/data/SavedFiltersContext";
import { useNetworkRequestToasts } from "@/utils/toast/useNetworkRequestToasts";
import { useRoutesProgressToast } from "@/utils/toast/useRoutesProgressToast";
import { TOAST_KEY_ROUTES_ERROR } from "@/constants/toasts/toastArchetypes";
import { useNetworkStatus } from "@/context/app/NetworkStatusContext";
import { RouteMarkersLayer, type RoutesState } from "./RouteMarkersLayer";
import { TrailsLayer } from "./TrailsLayer";
import {
  PageDataSource,
  RouteFilter,
  type OnlinePagePreview,
  type OfflinePagePreview,
  type RoutesParams,
} from "ropegeo-common/models";
import { SearchBar } from "@/components/search/SearchBar";
import { RoutePreview } from "@/components/previews/route/RoutePreview";
import { Camera, LocationPuck, MapView } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import type { ComponentRef } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Default map center when location is unavailable (Moab, UT). [lng, lat]. */
const DEFAULT_CURRENT_POSITION: [number, number] = [-109.5508, 38.5733];
const DEFAULT_ZOOM = 12.1;

function isSameRoutesState(prev: RoutesState, next: RoutesState): boolean {
  // `reload` is intentionally ignored — stable ref from ropegeo-common; explore retry uses a ref.
  if (
    prev.loading !== next.loading ||
    prev.received !== next.received ||
    prev.total !== next.total ||
    prev.timeoutCountdown !== next.timeoutCountdown ||
    prev.data !== next.data
  ) {
    return false;
  }
  if (prev.errors === next.errors) {
    return true;
  }
  if (prev.errors == null || next.errors == null) {
    return false;
  }
  return (
    prev.errors.message === next.errors.message &&
    prev.errors.name === next.errors.name
  );
}

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const exploreHeader = useExploreHeaderLayout();
  const toastChrome = useToastChromeLayout();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { isOnline } = useNetworkStatus();
  const {
    exploreRoutesParams,
    explorePersisted,
    persistExploreFilter,
    getEffectiveRouteFilterForExplore,
  } = useSavedFilters();
  const { openMapLayersSheet } = useMapLayersSheet();
  const mapLayers = useMapLayersSettings();
  const {
    styleReady,
    onDidFinishLoadingMap: onStyleReady,
    onDidFinishLoadingStyle: onStyleFinishedLoading,
    onMapLoadingError: onStyleLoadError,
  } = useMapStyleLoadGate(mapLayers.styleUrl);

  const [routeFilterSheetOpen, setRouteFilterSheetOpen] = useState(false);
  /** Snapshot of `/routes` params at sheet open — map fetch stays on this until the sheet closes. */
  const [frozenExploreRoutesParams, setFrozenExploreRoutesParams] =
    useState<RoutesParams | null>(null);
  const [exploreRouteDraft, setExploreRouteDraft] = useState<RouteFilter | null>(
    null,
  );
  const cameraRef = useRef<ComponentRef<typeof Camera>>(null);
  const hasCenteredOnLocationRef = useRef(false);
  const [currentPosition, setCurrentPosition] = useState<
    [number, number] | undefined
  >(undefined);
  const [pitch, setPitch] = useState(0);
  const [heading, setHeading] = useState(0);
  const [cameraCenter, setCameraCenter] = useState<
    [number, number] | undefined
  >(undefined);
  const [cameraZoom, setCameraZoom] = useState<number | undefined>(undefined);
  const [followCurrentPosition, setFollowCurrentPosition] = useState(true);
  const [routesState, setRoutesState] = useState<RoutesState>({
    loading: true,
    data: null,
    errors: null,
    received: 0,
    total: null,
    timeoutCountdown: null,
  });
  const routesReloadRef = useRef<(() => void) | null>(null);

  const onRoutesStateChange = useCallback((next: RoutesState) => {
    routesReloadRef.current = next.reload ?? null;
    setRoutesState((prev) =>
      isSameRoutesState(prev, next) ? prev : next,
    );
  }, []);
  const routesParamsForExploreMap = useMemo(() => {
    if (routeFilterSheetOpen && frozenExploreRoutesParams != null) {
      return frozenExploreRoutesParams;
    }
    return exploreRoutesParams;
  }, [
    routeFilterSheetOpen,
    frozenExploreRoutesParams,
    exploreRoutesParams,
  ]);

  const exploreRoutesKey = useMemo(
    () => routesParamsForExploreMap.toQueryString(),
    [routesParamsForExploreMap],
  );

  useRoutesProgressToast(routesState, {
    resetKey: exploreRoutesKey,
    horizontalInset: toastChrome.horizontalInset,
    surfaceActive: isFocused,
  });

  useNetworkRequestToasts({
    errors: routesState.errors,
    timeoutCountdown: routesState.timeoutCountdown,
    resetKey: exploreRoutesKey,
    offlineSurfaceActive: isFocused,
    errorToastKey: TOAST_KEY_ROUTES_ERROR,
    errorToastTitle: "Error loading routes",
    incrementErrorMultipleOnCollision: true,
    onRetryRequest: () => {
      routesReloadRef.current?.();
    },
  });
  const prevExploreRoutesKeyRef = useRef<string | null>(null);
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [currentPreview, setCurrentPreview] = useState<
    OnlinePagePreview | OfflinePagePreview | null
  >(null);

  useEffect(() => {
    const prev = prevExploreRoutesKeyRef.current;
    prevExploreRoutesKeyRef.current = exploreRoutesKey;
    if (prev !== null && prev !== exploreRoutesKey) {
      setFocusedRouteId(null);
      setCurrentPreview(null);
    }
  }, [exploreRoutesKey]);

  const defaultCenter = currentPosition ?? DEFAULT_CURRENT_POSITION;
  const isCompassVisible =
    Math.abs(pitch) > 0.5 || Math.abs(heading) > 0.5;
  const isPositionButtonVisible =
    cameraCenter != null &&
    cameraZoom != null &&
    (Math.abs(cameraCenter[0] - defaultCenter[0]) > 1e-5 ||
      Math.abs(cameraCenter[1] - defaultCenter[1]) > 1e-5 ||
      Math.abs(cameraZoom - DEFAULT_ZOOM) > 0.01);

  // Subscribe to continuous location updates; LocationPuck and initial camera center use this.
  // timeInterval: 1000ms is a good balance (use 500 for snappier updates, 2000 for battery).
  // distanceInterval: 0 so we get time-based updates; set > 0 to update only after moving N meters.
  useEffect(() => {
    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || !mounted) {
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (position) => {
          if (!mounted) return;
          setCurrentPosition([
            position.coords.longitude,
            position.coords.latitude,
          ]);
        }
      );
    };

    startWatching().catch(() => {
      // Keep default camera fallback if location is unavailable.
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  // Recenter the map camera on the user's location once when it is first fetched (not on every update).
  useEffect(() => {
    if (!currentPosition || hasCenteredOnLocationRef.current) {
      return;
    }

    cameraRef.current?.setCamera({
      centerCoordinate: currentPosition,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 800,
    });
    hasCenteredOnLocationRef.current = true;
  }, [currentPosition]);

  // While follow mode is on, keep the camera centered on the current position.
  useEffect(() => {
    if (!followCurrentPosition || !currentPosition) return;
    cameraRef.current?.setCamera({
      centerCoordinate: currentPosition,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 0,
    });
  }, [followCurrentPosition, currentPosition]);

  const resetPitchAndHeading = useCallback(() => {
    cameraRef.current?.setCamera({
      pitch: 0,
      heading: 0,
      animationDuration: 300,
    });
  }, []);

  const resetPosition = useCallback(() => {
    setFocusedRouteId(null);
    setFollowCurrentPosition(true);
    cameraRef.current?.setCamera({
      centerCoordinate: currentPosition ?? DEFAULT_CURRENT_POSITION,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 300,
    });
  }, [currentPosition]);

  return (
    <>
      <View style={styles.container}>
        <View
          style={[
            styles.searchBarRow,
            {
              top: insets.top + exploreHeader.rowTopInset,
              paddingRight: exploreHeader.searchBarRightClearance,
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={[styles.searchBarSpacer, { width: exploreHeader.sideSlotWidth }]} />
          <SearchBar
            style={styles.searchBarFlex}
            placeholder="Search"
            onPress={() => router.push("/explore/search")}
            accessibilityLabel="Search"
          />
        </View>
        <MapView
              styleURL={mapLayers.styleUrl}
              style={styles.map}
              projection="globe"
              scaleBarEnabled={false}
              requestDisallowInterceptTouchEvent
              logoPosition={Platform.OS === "android" ? { bottom: 40, left: 10 } : undefined}
              attributionPosition={Platform.OS === "android" ? { bottom: 40, right: 10 } : undefined}
              onDidFinishLoadingMap={onStyleReady}
              onDidFinishLoadingStyle={onStyleFinishedLoading}
              onMapLoadingError={onStyleLoadError}
              onPress={() => {
                setFocusedRouteId(null);
                setCurrentPreview(null);
              }}
              onCameraChanged={(state) => {
                const { pitch: p, heading: h, center, zoom } = state.properties;
                setPitch(p);
                setHeading(h);
                setCameraCenter(center as [number, number]);
                setCameraZoom(zoom);
                // User moved the map (center or zoom differs from default) → stop following.
                const centerCoord = center as [number, number];
                if (
                  centerCoord != null &&
                  zoom != null &&
                  (Math.abs(centerCoord[0] - defaultCenter[0]) > 1e-5 ||
                    Math.abs(centerCoord[1] - defaultCenter[1]) > 1e-5 ||
                    Math.abs(zoom - DEFAULT_ZOOM) > 0.01)
                ) {
                  setFollowCurrentPosition(false);
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
                  centerCoordinate: currentPosition ?? DEFAULT_CURRENT_POSITION,
                  zoomLevel: DEFAULT_ZOOM,
                }}
              />
              {styleReady ? (
                <>
                  <MapStyleLayers
                    lightPreset={mapLayers.mapLightPreset}
                    showElevationContours={mapLayers.showContoursOnMap}
                  />
                  <TrailsLayer
                    focusedRouteId={focusedRouteId}
                    visibleTrailIds={currentPreview?.mapData != null ? [currentPreview.mapData] : []}
                  />
                </>
              ) : null}
              <RouteMarkersLayer
                mapLayersReady={styleReady}
                routesParams={routesParamsForExploreMap}
                onStateChange={onRoutesStateChange}
                cameraRef={cameraRef}
                focusedRouteId={focusedRouteId}
                onRoutePress={(routeId) => {
                  setFollowCurrentPosition(false);
                  setFocusedRouteId(routeId);
                  setCurrentPreview(null); // Clear until new preview loads so we don't show previous route's trails
                }}
                onRouteClusterPress={() => {
                  setFollowCurrentPosition(false);
                  setFocusedRouteId(null);
                  setCurrentPreview(null);
                }}
              />
        </MapView>
        <RoutePreview
          routeId={focusedRouteId}
          containerStyle={[styles.previewContainer, { paddingBottom: insets.bottom + 8 }]}
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
        <ButtonStack top={insets.top + exploreHeader.rowTopInset}>
          <ButtonStack.Slot id="filter" visible animateLayout={false}>
            <FilterButton
              persisted={explorePersisted}
              onPress={() => {
                setFrozenExploreRoutesParams(exploreRoutesParams);
                setExploreRouteDraft(
                  RouteFilter.fromJsonString(
                    getEffectiveRouteFilterForExplore().toString(),
                  ),
                );
                setRouteFilterSheetOpen(true);
              }}
            />
          </ButtonStack.Slot>
          <ButtonStack.Slot id="map-layers" visible animateLayout={false}>
            <MapLayersButton
              customized={mapLayers.customized}
              onPress={openMapLayersSheet}
            />
          </ButtonStack.Slot>
          <ButtonStack.Slot id="position" visible={isPositionButtonVisible}>
            <ResetCameraToPositionButton
              stacked
              onPress={resetPosition}
              visible={isPositionButtonVisible}
            />
          </ButtonStack.Slot>
          <ButtonStack.Slot id="orientation" visible={isCompassVisible}>
            <ResetCameraOrientationButton
              stacked
              iconRotation={-heading}
              onPress={() => resetPitchAndHeading()}
              visible={isCompassVisible}
            />
          </ButtonStack.Slot>
        </ButtonStack>
        <FilterBottomSheet
          visible={routeFilterSheetOpen}
          onClose={() => {
            setRouteFilterSheetOpen(false);
            setFrozenExploreRoutesParams(null);
            setExploreRouteDraft(null);
          }}
          mode={
            routeFilterSheetOpen && exploreRouteDraft != null
              ? {
                  kind: "explore-route",
                  draft: exploreRouteDraft,
                  onDraftChange: (f) => {
                    setExploreRouteDraft(f);
                    persistExploreFilter(
                      RouteFilter.fromJsonString(f.toString()),
                    );
                  },
                  persisted: explorePersisted,
                  onRevert: () => {
                    persistExploreFilter(null);
                    setExploreRouteDraft(new RouteFilter());
                  },
                }
              : null
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarRow: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  searchBarSpacer: {},
  searchBarFlex: {
    flex: 1,
    minWidth: 0,
  },
  map: {
    flex: 1,
    width: "100%",
  },
  previewContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
});
