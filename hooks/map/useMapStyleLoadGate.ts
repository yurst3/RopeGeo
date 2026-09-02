import { useCallback, useState } from "react";

/**
 * Gate Mapbox style-dependent children until the MapView finishes loading the
 * *current* `styleUrl`.
 *
 * Important: readiness is derived synchronously (`loadedStyleUrl === styleUrl`)
 * so children unmount on the same render that changes `styleUrl`. A useEffect
 * that flips a boolean one frame later is too late and can native-crash when
 * StyleImport / existing layers stay mounted across a style switch.
 *
 * Style URL changes often fire `onDidFinishLoadingStyle` without a second
 * `onDidFinishLoadingMap`, so both events must mark the style ready.
 */
export function useMapStyleLoadGate(styleUrl: string): {
  styleReady: boolean;
  onDidFinishLoadingMap: () => void;
  onDidFinishLoadingStyle: () => void;
  onMapLoadingError: () => void;
} {
  const [loadedStyleUrl, setLoadedStyleUrl] = useState<string | null>(null);
  const styleReady = loadedStyleUrl === styleUrl;

  const markStyleLoaded = useCallback(() => {
    setLoadedStyleUrl(styleUrl);
  }, [styleUrl]);

  return {
    styleReady,
    onDidFinishLoadingMap: markStyleLoaded,
    onDidFinishLoadingStyle: markStyleLoaded,
    onMapLoadingError: markStyleLoaded,
  };
}
