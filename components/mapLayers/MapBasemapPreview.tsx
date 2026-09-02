import {
  MAP_LAYERS_PREVIEW_CENTER,
  MAP_LAYERS_PREVIEW_ZOOM,
  MAPBOX_STYLE_URLS,
} from "@/constants/mapbox";
import type { MapBasemap, MapLightPreset } from "@/constants/settings/mapLayersTypes";
import { MapStyleImport, ElevationContourLayers } from "@/components/mapLayers/MapStyleLayers";
import { Camera, MapView } from "@rnmapbox/maps";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

type MapBasemapPreviewProps = {
  basemap: MapBasemap;
  lightPreset: MapLightPreset;
  showSatelliteContours: boolean;
  selected: boolean;
  width: number;
  height: number;
  /** When false, keep the frame sized but do not mount MapView yet. */
  allowMount?: boolean;
  /** Fired once after this preview's MapView finishes loading (or on load error). */
  onMapReady?: () => void;
};

type LaidOutSize = { width: number; height: number };

export function MapBasemapPreview({
  basemap,
  lightPreset,
  showSatelliteContours,
  selected,
  width,
  height,
  allowMount = true,
  onMapReady,
}: MapBasemapPreviewProps) {
  const [laidOut, setLaidOut] = useState<LaidOutSize | null>(null);
  const readyReportedRef = useRef(false);
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    readyReportedRef.current = false;
  }, [basemap, allowMount]);

  const reportReady = useCallback(() => {
    if (readyReportedRef.current) return;
    readyReportedRef.current = true;
    onMapReadyRef.current?.();
  }, []);

  const onFrameLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w <= 0 || h <= 0) {
      setLaidOut(null);
      return;
    }
    setLaidOut((prev) =>
      prev != null && prev.width === w && prev.height === h ? prev : { width: w, height: h },
    );
  }, []);

  const propsReady = width > 0 && height > 0;
  const mountMap = allowMount && propsReady && laidOut != null;

  return (
    <View
      style={[
        styles.frame,
        {
          width: propsReady ? width : undefined,
          height: propsReady ? height : undefined,
          borderColor: selected ? "#dc732b" : "transparent",
          borderWidth: selected ? 2 : 0,
        },
      ]}
      pointerEvents="none"
      onLayout={onFrameLayout}
      collapsable={false}
    >
      {mountMap ? (
        <MapView
          style={{ width: laidOut.width, height: laidOut.height }}
          styleURL={MAPBOX_STYLE_URLS[basemap]}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          scaleBarEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
          pointerEvents="none"
          onDidFinishLoadingMap={reportReady}
          onMapLoadingError={reportReady}
        >
          <Camera
            defaultSettings={{
              centerCoordinate: MAP_LAYERS_PREVIEW_CENTER,
              zoomLevel: MAP_LAYERS_PREVIEW_ZOOM,
            }}
          />
          <MapStyleImport lightPreset={lightPreset} />
          <ElevationContourLayers visible={showSatelliteContours} />
        </MapView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
});
