import { Settings } from "@/constants/settings";
import type { MapBasemap, MapLightPreset } from "@/constants/settings/mapLayersTypes";
import type { FontProfileKey } from "@/constants/text/font/types";
import type { UiScaleProfileKey } from "@/constants/uiScale/types";
import type { ThemePreference, UnitsPreference } from "@/constants/settings/types";
import type { RelevanceStrength } from "ropegeo-common/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "ropegeo:settings";

void SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash may already be hidden in dev */
});

function cloneSettings(settings: Settings): Settings {
  return Settings.fromJsonString(settings.toString());
}

async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw == null || raw === "") {
    const defaults = new Settings();
    await AsyncStorage.setItem(STORAGE_KEY, defaults.toString());
    return defaults;
  }
  try {
    return Settings.fromJsonString(raw);
  } catch (e) {
    console.warn("[Settings] invalid storage, resetting", e);
    const defaults = new Settings();
    await AsyncStorage.setItem(STORAGE_KEY, defaults.toString());
    return defaults;
  }
}

async function persistSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, settings.toString());
}

type SettingsContextValue = {
  settings: Settings;
  isLoaded: boolean;
  setTheme: (theme: ThemePreference) => void;
  setFont: (font: FontProfileKey) => void;
  setUiScale: (uiScale: UiScaleProfileKey) => void;
  setUnits: (units: UnitsPreference) => void;
  setShowRelevantContext: (show: boolean) => void;
  setShowRelevantContextStrengths: (
    min: RelevanceStrength,
    max: RelevanceStrength,
  ) => void;
  setMapLayersDraft: (draft: {
    mapBasemap: MapBasemap;
    mapLightPreset: MapLightPreset;
    showSatelliteContours: boolean;
  }) => void;
  resetMapLayers: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(new Settings());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const loaded = await loadSettings();
        if (!cancelled) setSettings(loaded);
      } catch (e) {
        console.warn("[Settings] load failed", e);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void SplashScreen.hideAsync().catch(() => {
      /* ignore */
    });
  }, [isLoaded]);

  const schedulePersist = useCallback((next: Settings) => {
    void (async () => {
      try {
        await persistSettings(next);
      } catch (e) {
        console.warn("[Settings] persist failed", e);
      }
    })();
  }, []);

  const setTheme = useCallback(
    (theme: ThemePreference) => {
      setSettings((prev) => {
        const next = cloneSettings(prev);
        next.setTheme(theme);
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const setFont = useCallback(
    (font: FontProfileKey) => {
      setSettings((prev) => {
        const next = cloneSettings(prev);
        next.setFont(font);
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const setUiScale = useCallback(
    (uiScale: UiScaleProfileKey) => {
      setSettings((prev) => {
        const next = cloneSettings(prev);
        next.setUiScale(uiScale);
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const setUnits = useCallback(
    (units: UnitsPreference) => {
      setSettings((prev) => {
        const next = cloneSettings(prev);
        next.setUnits(units);
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const setShowRelevantContext = useCallback(
    (show: boolean) => {
      setSettings((prev) => {
        const next = cloneSettings(prev);
        next.setShowRelevantContext(show);
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const setShowRelevantContextStrengths = useCallback(
    (min: RelevanceStrength, max: RelevanceStrength) => {
      setSettings((prev) => {
        const next = cloneSettings(prev);
        next.setShowRelevantContextStrengths(min, max);
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const resetMapLayers = useCallback(() => {
    setSettings((prev) => {
      const next = cloneSettings(prev);
      next.resetMapLayers();
      schedulePersist(next);
      return next;
    });
  }, [schedulePersist]);

  const setMapLayersDraft = useCallback(
    (draft: {
      mapBasemap: MapBasemap;
      mapLightPreset: MapLightPreset;
      showSatelliteContours: boolean;
    }) => {
      setSettings((prev) => {
        const next = cloneSettings(prev);
        next.applyMapLayersDraft(draft);
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isLoaded,
      setTheme,
      setFont,
      setUiScale,
      setUnits,
      setShowRelevantContext,
      setShowRelevantContextStrengths,
      setMapLayersDraft,
      resetMapLayers,
    }),
    [
      settings,
      isLoaded,
      setTheme,
      setFont,
      setUiScale,
      setUnits,
      setShowRelevantContext,
      setShowRelevantContextStrengths,
      setMapLayersDraft,
      resetMapLayers,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (ctx == null) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}

export function SettingsAppGate({ children }: { children: ReactNode }) {
  const { isLoaded } = useSettings();
  if (!isLoaded) return null;
  return children;
}
