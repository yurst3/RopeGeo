import {
  MAPBOX_CONTOUR_LAYER_IDS,
  MAPBOX_STYLE_IMPORT_ID,
} from "@/constants/mapbox";
import type { MapLightPreset } from "@/constants/settings/mapLayersTypes";
import { StyleImport, LineLayer, SymbolLayer } from "@rnmapbox/maps";

type MapStyleLayersProps = {
  lightPreset: MapLightPreset;
  showElevationContours: boolean;
};

export function MapStyleImport({ lightPreset }: { lightPreset: MapLightPreset }) {
  return (
    <StyleImport
      id={MAPBOX_STYLE_IMPORT_ID}
      existing
      config={{ lightPreset }}
    />
  );
}

export function ElevationContourLayers({
  visible,
}: {
  visible: boolean;
}) {
  const visibility = visible ? "visible" : "none";

  return (
    <>
      <LineLayer
        id={MAPBOX_CONTOUR_LAYER_IDS[0]}
        existing
        style={{ visibility }}
      />
      <LineLayer
        id={MAPBOX_CONTOUR_LAYER_IDS[1]}
        existing
        style={{ visibility }}
      />
      <SymbolLayer
        id={MAPBOX_CONTOUR_LAYER_IDS[2]}
        existing
        style={{ visibility }}
      />
    </>
  );
}

/** @deprecated Use {@link ElevationContourLayers}. */
export const SatelliteContourLayers = ElevationContourLayers;

export function MapStyleLayers({
  lightPreset,
  showElevationContours,
}: MapStyleLayersProps) {
  return (
    <>
      <MapStyleImport lightPreset={lightPreset} />
      <ElevationContourLayers visible={showElevationContours} />
    </>
  );
}
