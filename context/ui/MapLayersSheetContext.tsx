import { MapLayersBottomSheet } from "@/components/mapLayers/MapLayersBottomSheet";
import { Settings } from "@/constants/settings";
import { useSettings } from "@/context/app/SettingsContext";
import {
  mapLayersAreCustomized,
  mapLayersDraftFromSettings,
  type MapLayersDraft,
} from "@/utils/map/mapLayersSettings";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MapLayersSheetContextValue = {
  openMapLayersSheet: () => void;
};

const MapLayersSheetContext = createContext<MapLayersSheetContextValue | null>(null);

export function MapLayersSheetProvider({ children }: { children: ReactNode }) {
  const { settings, setMapLayersDraft, resetMapLayers } = useSettings();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<MapLayersDraft | null>(null);

  const openMapLayersSheet = useCallback(() => {
    setDraft(mapLayersDraftFromSettings(settings));
    setVisible(true);
  }, [settings]);

  const closeSheet = useCallback(() => {
    setVisible(false);
    setDraft(null);
  }, []);

  const persistDraft = useCallback(
    (next: MapLayersDraft) => {
      setDraft(next);
      setMapLayersDraft(next);
    },
    [setMapLayersDraft],
  );

  const handleRevert = useCallback(() => {
    resetMapLayers();
    setDraft(mapLayersDraftFromSettings(new Settings()));
  }, [resetMapLayers]);

  const value = useMemo<MapLayersSheetContextValue>(
    () => ({ openMapLayersSheet }),
    [openMapLayersSheet],
  );

  return (
    <MapLayersSheetContext.Provider value={value}>
      {children}
      <MapLayersBottomSheet
        visible={visible}
        onClose={closeSheet}
        draft={draft}
        onDraftChange={persistDraft}
        customized={mapLayersAreCustomized(settings)}
        onRevert={handleRevert}
      />
    </MapLayersSheetContext.Provider>
  );
}

export function useMapLayersSheet(): MapLayersSheetContextValue {
  const ctx = useContext(MapLayersSheetContext);
  if (ctx == null) {
    throw new Error("useMapLayersSheet must be used within MapLayersSheetProvider");
  }
  return ctx;
}
