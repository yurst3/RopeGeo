import { ResetMapOrientationButton } from "@/components/buttons/ResetMapOrientationButton";
import { ResetMapPositionButton } from "@/components/buttons/ResetMapPositionButton";
import { RouteMarkersLayer } from "@/components/MapLayers/RouteMarkersLayer";
import { TrailsLayer } from "@/components/MapLayers/TrailsLayer";
import { RequestToastNotifier } from "@/components/RequestToastNotifier";
import { PageDataSource, type PagePreview, type RoutesGeojson, RouteType } from "ropegeo-common";
import { RoutePreview } from "@/components/routePreview/RoutePreview";
import { Camera, LocationPuck, MapView } from "@rnmapbox/maps";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import type { ComponentRef } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Default map center when location is unavailable (Moab, UT). [lng, lat]. */
const DEFAULT_CURRENT_POSITION: [number, number] = [-109.5508, 38.5733];
const DEFAULT_ZOOM = 12.1;

/** Matches search screen: button size and gap. */
const HEADER_BUTTON_SIZE = 44;
const HEADER_BUTTON_GAP = 8;
const SEARCH_BAR_SIDE_WIDTH = HEADER_BUTTON_SIZE + HEADER_BUTTON_GAP;

/** Vertical offset for the first map button: below search bar row (8 + 44) + gap (8). */
const MAP_BUTTON_TOP_OFFSET = 8 + HEADER_BUTTON_SIZE + 8;
const MAP_BUTTON_SIZE = 48;
const MAP_BUTTON_GAP = 8;

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
  const [routesState, setRoutesState] = useState<{
    loading: boolean;
    data: RoutesGeojson | null;
    errors: Error | null;
  }>({ loading: true, data: null, errors: null });
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [currentPreview, setCurrentPreview] = useState<PagePreview | null>(null);

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

  const resetPitchAndHeading = () => {
    cameraRef.current?.setCamera({
      pitch: 0,
      heading: 0,
      animationDuration: 300,
    });
  };

  const resetPosition = () => {
    setFocusedRouteId(null);
    setFollowCurrentPosition(true);
    cameraRef.current?.setCamera({
      centerCoordinate: currentPosition ?? DEFAULT_CURRENT_POSITION,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 300,
    });
  };

  return (
    <>
      <RequestToastNotifier
        loading={routesState.loading}
        data={routesState.data}
        errors={routesState.errors}
        successMessage={(data) =>
          `Successfully loaded ${data.features.length} routes.`
        }
        topOffset={insets.top}
      />
      <View style={styles.container}>
        <View
          style={[styles.searchBarRow, { top: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <View style={styles.searchBarSpacer} />
          <Pressable
            style={styles.searchBar}
            onPress={() => router.push("/explore/search")}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <FontAwesome5 name="search" size={16} color="#6b7280" />
            <Text style={styles.searchBarPlaceholder}>Search</Text>
          </Pressable>
          <View style={[styles.headerButtonWrap, { width: HEADER_BUTTON_SIZE, marginLeft: HEADER_BUTTON_GAP }]}>
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
              accessibilityLabel="Filter"
              accessibilityRole="button"
            >
              <FontAwesome5 name="filter" size={18} color="#111827" />
            </Pressable>
          </View>
        </View>
        {routesState.loading && (
          <View
            style={[styles.loadingOverlay, { paddingTop: insets.top + 16 }]}
            pointerEvents="none"
          >
            <ActivityIndicator size="large" />
          </View>
        )}
        <MapView
              styleURL="mapbox://styles/mapbox/outdoors-v12"
              style={styles.map}
              projection="globe"
              scaleBarEnabled={false}
              logoPosition={Platform.OS === "android" ? { bottom: 40, left: 10 } : undefined}
              attributionPosition={Platform.OS === "android" ? { bottom: 40, right: 10 } : undefined}
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
              <LocationPuck />
              <Camera
                ref={cameraRef}
                defaultSettings={{
                  centerCoordinate: currentPosition ?? DEFAULT_CURRENT_POSITION,
                  zoomLevel: DEFAULT_ZOOM,
                }}
              />
              <RouteMarkersLayer
                onStateChange={setRoutesState}
                cameraRef={cameraRef}
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
              <TrailsLayer
                focusedRouteId={focusedRouteId}
                visibleTrailIds={currentPreview?.mapData != null ? [currentPreview.mapData] : []}
              />
        </MapView>
        {focusedRouteId != null && (
          <View style={[styles.previewContainer, { paddingBottom: insets.bottom + 8 }]}>
            <RoutePreview
              routeId={focusedRouteId}
              routeType={
                routesState.data?.features?.find(
                  (f) => f.properties?.id === focusedRouteId
                )?.properties?.type ?? null
              }
              onCurrentPreviewChange={setCurrentPreview}
              onPreviewPress={(preview) => {
                if (preview.source === "ropewiki") {
                  router.push({
                    pathname: "/explore/[id]/page",
                    params: {
                      id: preview.id,
                      source: PageDataSource.Ropewiki,
                      routeType:
                        routesState.data?.features?.find(
                          (f) => f.properties?.id === focusedRouteId
                        )?.properties?.type ?? RouteType.Unknown,
                    },
                  } as unknown as Parameters<typeof router.push>[0]);
                } else {
                  router.push("/explore/technical-info");
                }
              }}
            />
          </View>
        )}
        <ResetMapPositionButton
          onPress={resetPosition}
          visible={isPositionButtonVisible}
          top={insets.top + MAP_BUTTON_TOP_OFFSET}
        />
        <ResetMapOrientationButton
          onPress={resetPitchAndHeading}
          visible={isCompassVisible}
          top={insets.top + MAP_BUTTON_TOP_OFFSET + MAP_BUTTON_SIZE + MAP_BUTTON_GAP}
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
  searchBarSpacer: {
    width: SEARCH_BAR_SIDE_WIDTH,
  },
  headerButtonWrap: {
    height: HEADER_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  headerButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    borderRadius: HEADER_BUTTON_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerButtonPressed: {
    opacity: 0.6,
  },
  searchBar: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchBarPlaceholder: {
    fontSize: 16,
    color: "#9ca3af",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  previewContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
});
