import {
  RouteGeoJsonFeature,
  RoutesGeojson,
  RoutesParams,
} from "ropegeo-common/models";
import {
  Method,
  RopeGeoProgressDataLoader,
  Service,
} from "ropegeo-common/components";
import {
  Camera,
  Images,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import type { ComponentRef } from "react";
import { useEffect, useMemo, useRef } from "react";
import { MAPBOX_ROUTES_ABOVE_LAYER_ID, MAPBOX_ROUTES_SYMBOL_LAYER_IDS } from "@/constants/mapbox";
import { useNetworkStatus } from "@/context/app/NetworkStatusContext";
import { useMapOverlayColors } from "@/hooks/map/useMapOverlayColors";
import { useRouteMarkerMetrics } from "@/utils/layout/routeMarkerLayout";
import { useMapMarkerTextFont } from "@/utils/theme/resolvers";
import {
  clusterRouteMarkerSymbolStyle,
  unclusteredRouteMarkerSymbolStyle,
} from "@/utils/explore/mapMarkerLayerStyles";
import { REQUEST_TIMEOUT_SECONDS } from "@/utils/network/requestTimeout";
import {
  ROUTE_MARKER_NATIVE_ASSET_IMAGES,
  unclusteredRouteMarkerIconImage,
  unclusteredRouteMarkerIconSize,
} from "@/utils/explore/routeMarkerIcons";

export type RoutesState = {
  /** True while all `/routes` pages are still merging (`data` is still null). */
  loading: boolean;
  data: RoutesGeojson | null;
  errors: Error | null;
  /** Items merged from completed pages so far. */
  received: number;
  /** Total from API when known; `null` until the first page returns. */
  total: number | null;
  /** Seconds until request timeout from {@link RopeGeoProgressDataLoader}; `null` when idle. */
  timeoutCountdown: number | null;
  /** Re-fetch all route pages ({@link RopeGeoProgressDataLoader} `reload`). */
  reload?: () => void;
};

/** @deprecated Use {@link ROUTE_MARKER_DESIGN_CLUSTER_RADIUS} from routeMarkerLayout. */
export { ROUTE_MARKER_DESIGN_CLUSTER_RADIUS as CLUSTER_RADIUS } from "@/utils/layout/routeMarkerLayout";

/** Zoom when focusing a route from a marker tap — matches `ExploreScreen` default map zoom (12.1). */
export const ROUTE_MARKER_CAMERA_ZOOM = 12.1;

type RouteMarkersLayerProps = {
  onStateChange?: (state: RoutesState) => void;
  cameraRef?: React.RefObject<ComponentRef<typeof Camera> | null>;
  onRoutePress?: (routeId: string, coordinates: [number, number]) => void;
  onRouteClusterPress?: () => void;
  /** Optional GET /routes query string params (e.g. region-scoped routes). */
  routesQueryParams?: Record<string, string | number | boolean | undefined>;
  /** Preferred: validated params object (global or region-scoped). */
  routesParams?: RoutesParams | null;
  /** Marker uses selected icon when this route id is focused (e.g. tap / preview). */
  focusedRouteId?: string | null;
  /** Marker uses selected icon for this id even without tap focus (e.g. page centered route). */
  accentRouteId?: string | null;
  /**
   * When false, keep `/routes` loading but do not mount Mapbox marker layers.
   * Use during style switches so a basemap change does not remount the data loader.
   */
  mapLayersReady?: boolean;
};

type RouteMarkersLayerContentProps = {
  loading: boolean;
  /** Raw features from pagination; wrapped in {@link RoutesGeojson} with a stable memo. */
  rawRouteFeatures: RouteGeoJsonFeature[] | null;
  errors: Error | null;
  received: number;
  total: number | null;
  timeoutCountdown: number | null;
  reload: () => void;
  onStateChange?: (state: RoutesState) => void;
  cameraRef?: React.RefObject<ComponentRef<typeof Camera> | null>;
  onRoutePress?: (routeId: string, coordinates: [number, number]) => void;
  onRouteClusterPress?: () => void;
  focusedRouteId?: string | null;
  accentRouteId?: string | null;
  mapLayersReady: boolean;
};

function RouteMarkersLayerContent({
  loading,
  rawRouteFeatures,
  errors,
  received,
  total,
  timeoutCountdown,
  reload,
  onStateChange,
  cameraRef,
  onRoutePress,
  onRouteClusterPress,
  focusedRouteId,
  accentRouteId,
  mapLayersReady,
}: RouteMarkersLayerContentProps) {
  const overlay = useMapOverlayColors();
  const markerMetrics = useRouteMarkerMetrics();
  const markerTextFont = useMapMarkerTextFont();
  const shapeSourceRef = useRef<ComponentRef<typeof ShapeSource>>(null);

  const data = useMemo(
    () =>
      rawRouteFeatures != null
        ? new RoutesGeojson(rawRouteFeatures)
        : null,
    [rawRouteFeatures],
  );

  const unclusteredIconImage = useMemo(
    () => unclusteredRouteMarkerIconImage(focusedRouteId, accentRouteId),
    [focusedRouteId, accentRouteId],
  );

  const unclusteredIconSize = useMemo(
    () =>
      unclusteredRouteMarkerIconSize(
        focusedRouteId,
        accentRouteId,
        markerMetrics.iconSizeScale,
      ),
    [focusedRouteId, accentRouteId, markerMetrics.iconSizeScale],
  );

  const unclusteredStyle = useMemo(
    () =>
      unclusteredRouteMarkerSymbolStyle(
        overlay.marker,
        unclusteredIconImage,
        unclusteredIconSize,
        markerMetrics,
        markerTextFont,
      ),
    [overlay.marker, unclusteredIconImage, unclusteredIconSize, markerMetrics, markerTextFont],
  );

  const clusterStyle = useMemo(
    () => clusterRouteMarkerSymbolStyle(overlay.marker, markerMetrics, markerTextFont),
    [overlay.marker, markerMetrics, markerTextFont],
  );

  const [unclusteredSymbolId, clusterSymbolId] = MAPBOX_ROUTES_SYMBOL_LAYER_IDS;

  useEffect(() => {
    onStateChange?.({
      loading,
      data,
      errors,
      received,
      total,
      timeoutCountdown,
      reload,
    });
  }, [
    loading,
    data,
    errors,
    received,
    total,
    timeoutCountdown,
    reload,
    onStateChange,
  ]);

  const handlePress = async (event: { features?: GeoJSON.Feature[] }) => {
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
        // getClusterExpansionZoom can fail on some platforms; ignore
      }
      // After camera moves so parent re-renders (e.g. clearing preview) cannot race the fly-to.
      onRouteClusterPress?.();
      return;
    }

    const routeId = props?.id;
    if (routeId) {
      onRoutePress?.(routeId, coords);
      cameraRef.current.setCamera({
        centerCoordinate: coords,
        animationDuration: 300,
      });
    }
  };

  if (!mapLayersReady || data == null || data.features.length === 0) {
    return null;
  }

  return (
    <ShapeSource
      ref={shapeSourceRef}
      id="routes-source"
      shape={data}
      cluster
      clusterRadius={markerMetrics.clusterRadius}
      onPress={handlePress}
    >
      <SymbolLayer
        id={unclusteredSymbolId}
        aboveLayerID={MAPBOX_ROUTES_ABOVE_LAYER_ID}
        filter={["!", ["has", "point_count"]]}
        style={unclusteredStyle}
      />
      <SymbolLayer
        id={clusterSymbolId}
        aboveLayerID={unclusteredSymbolId}
        filter={["has", "point_count"]}
        style={clusterStyle}
      />
      <Images nativeAssetImages={[...ROUTE_MARKER_NATIVE_ASSET_IMAGES]} />
    </ShapeSource>
  );
}

function queryRecordToRoutesParams(
  q: Record<string, string | number | boolean | undefined>,
): RoutesParams {
  const str: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== "") str[k] = String(v);
  }
  return RoutesParams.fromQueryStringParams(str);
}

/**
 * Route markers with client-side clustering. Fetches all pages of GET /routes via
 * {@link RopeGeoProgressDataLoader} and builds a single GeoJSON collection.
 */
export function RouteMarkersLayer({
  onStateChange,
  cameraRef,
  onRoutePress,
  onRouteClusterPress,
  routesQueryParams,
  routesParams,
  focusedRouteId = null,
  accentRouteId = null,
  mapLayersReady = true,
}: RouteMarkersLayerProps) {
  const { isOnline } = useNetworkStatus();
  const paginationParams = useMemo((): RoutesParams => {
    if (routesParams != null) return routesParams;
    return queryRecordToRoutesParams(routesQueryParams ?? {});
  }, [routesParams, routesQueryParams]);

  return (
    <RopeGeoProgressDataLoader<RouteGeoJsonFeature>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      onlinePath="/routes"
      queryParams={paginationParams}
      timeoutAfterSeconds={REQUEST_TIMEOUT_SECONDS}
      isOnline={isOnline}
    >
      {({ data, errors, received, total, timeoutCountdown, reload }) => {
        const loading = data === null && errors === null;
        return (
          <RouteMarkersLayerContent
            loading={loading}
            rawRouteFeatures={data}
            errors={errors}
            received={received}
            total={total}
            timeoutCountdown={timeoutCountdown}
            reload={reload}
            onStateChange={onStateChange}
            cameraRef={cameraRef}
            onRoutePress={onRoutePress}
            onRouteClusterPress={onRouteClusterPress}
            focusedRouteId={focusedRouteId}
            accentRouteId={accentRouteId}
            mapLayersReady={mapLayersReady}
          />
        );
      }}
    </RopeGeoProgressDataLoader>
  );
}
