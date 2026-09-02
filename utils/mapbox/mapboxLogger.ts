import { MAPBOX_IGNORABLE_MISSING_LAYER_IDS } from "@/constants/mapbox";
import { Logger, type LogLevel } from "@rnmapbox/maps";

type MapboxLogObject = {
  level: LogLevel;
  tag: string;
  message: string;
};

let installed = false;

function isIgnorableMissingLayerError(log: MapboxLogObject): boolean {
  if (log.level !== "error") {
    return false;
  }
  if (!log.message.includes("is not in style")) {
    return false;
  }
  return MAPBOX_IGNORABLE_MISSING_LAYER_IDS.some((layerId) =>
    log.message.includes(layerId),
  );
}

/**
 * Suppress Mapbox log noise when known overlay layers are absent from the active
 * style (e.g. during basemap switches or styles missing optional layers).
 *
 * Returning `true` from the callback skips default console logging.
 */
export function installMapboxLoggerFilters(): void {
  if (installed) {
    return;
  }
  installed = true;
  Logger.setLogCallback((log) => isIgnorableMissingLayerError(log));
}
