import { ResetMapOrientationButton } from "@/components/buttons/ResetMapOrientationButton";
import { ResetMapPositionButton } from "@/components/buttons/ResetMapPositionButton";
import { RequestToastNotifier } from "@/components/RequestToastNotifier";
import { RouteMarkersLayer } from "@/components/RouteMarkersLayer";
import type { RoutesGeoJSON } from "@/components/RouteMarkersLayer";
import { Camera, LocationPuck, MapView } from "@rnmapbox/maps";
import * as Location from "expo-location";
import type { ComponentRef } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Default map center when location is unavailable (Moab, UT). [lng, lat]. */
const DEFAULT_CURRENT_POSITION: [number, number] = [-109.5508, 38.5733];
const DEFAULT_ZOOM = 12.1;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
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
    data: RoutesGeoJSON | null;
    errors: Error | null;
  }>({ loading: true, data: null, errors: null });

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
              />
        </MapView>
        <ResetMapOrientationButton
          onPress={resetPitchAndHeading}
          visible={isCompassVisible}
          top={insets.top + 16}
        />
        <ResetMapPositionButton
          onPress={resetPosition}
          visible={isPositionButtonVisible}
          top={insets.top + 16 + 48 + 8}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
