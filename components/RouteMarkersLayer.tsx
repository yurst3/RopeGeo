import {
  Method,
  RopeGeoHttpRequest,
  Service,
} from "@/components/RopeGeoHttpRequest";
import { Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { useEffect } from "react";

/**
 * GeoJSON FeatureCollection returned by GET /routes.
 * Matches the API docs: https://api.webscraper.ropegeo.com/docs/index.html#tag/routes/operation/getRoutes
 */
export type RoutesGeoJSON = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
    properties: {
      id: string;
      name: string;
      type: string;
    };
  }>;
};

export type RoutesState = {
  loading: boolean;
  data: RoutesGeoJSON | null;
  errors: Error | null;
};

/**
 * Route marker icon size (constant screen size at all zoom levels).
 * - Lower value = smaller markers (e.g. 0.08, 0.1).
 * - Higher value = larger markers (e.g. 0.25, 0.3).
 * The zoom-22 value must be (ICON_SIZE_AT_ZOOM_0 * 2^-22) so the icon doesn't scale with zoom.
 */
const ROUTE_ICON_SIZE_AT_ZOOM_0 = 0.05;
const ROUTE_ICON_SIZE_AT_ZOOM_22 = ROUTE_ICON_SIZE_AT_ZOOM_0 * 2 ** -22;

type RouteMarkersLayerProps = {
  /** Called when loading, data, or errors change so the parent can sync state (e.g. for toasts and loading indicator). */
  onStateChange?: (state: RoutesState) => void;
};

function RouteMarkersLayerContent({
  loading,
  data,
  errors,
  onStateChange,
}: RoutesState & { onStateChange?: (state: RoutesState) => void }) {
  useEffect(() => {
    onStateChange?.({ loading, data, errors });
  }, [loading, data, errors, onStateChange]);

  if (data == null || data.features.length === 0) {
    return null;
  }

  return (
    <ShapeSource id="routes-source" shape={data}>
      <SymbolLayer
        id="routes-symbol-layer"
        style={{
          iconImage: "map-marker",
          iconSize: [
            "interpolate",
            ["exponential", 2],
            ["zoom"],
            0,
            ROUTE_ICON_SIZE_AT_ZOOM_0,
            22,
            ROUTE_ICON_SIZE_AT_ZOOM_22,
          ],
          iconAllowOverlap: true,
          iconAnchor: "bottom",
          textField: ["get", "name"],
          textSize: 12,
          textColor: "#333333",
          textHaloColor: "#ffffff",
          textHaloWidth: 1.5,
          textOffset: [0, 0.2],
          textAnchor: "top",
        }}
      />
      <Images
        images={{
          "map-marker": require("@/assets/images/location-dot-solid.png"),
        }}
      />
    </ShapeSource>
  );
}

export function RouteMarkersLayer({ onStateChange }: RouteMarkersLayerProps) {
  return (
    <RopeGeoHttpRequest<RoutesGeoJSON>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      path="/routes"
    >
      {({ loading, data, errors }) => (
        <RouteMarkersLayerContent
          loading={loading}
          data={data}
          errors={errors}
          onStateChange={onStateChange}
        />
      )}
    </RopeGeoHttpRequest>
  );
}
