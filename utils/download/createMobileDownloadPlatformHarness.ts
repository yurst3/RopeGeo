import { MAPBOX_STYLE_KEYS, type MapboxStyleKey } from "ropegeo-common/download";
import { deleteOfflineBundleFiles } from "@/utils/offline/deleteOfflineBundle";
import { setDownloadedRoutePreviewsForPage } from "@/utils/offline/downloadedRoutePreviewsStorage";
import {
  getOfflineImageFileUri,
  getOfflineMapDataRootUri,
  getOfflinePageJsonUri,
  getOfflinePageRootUri,
  getOfflinePageZipTempUri,
  getOfflineRegionRoutesGeojsonUri,
} from "@/utils/offline/paths";
import { extractZipArchive } from "./extractZipArchive";
import { gunzipVectorTileFileIfNeeded } from "@/utils/offline/prepareOfflineVectorTiles";
import { offlineManager } from "@rnmapbox/maps";
import * as FileSystem from "expo-file-system/legacy";
import { FileSystemSessionType } from "expo-file-system/legacy";
import { AppState, type AppStateStatus } from "react-native";
import type { DownloadPlatformHarness } from "ropegeo-common/download";
import { ensureParentDir } from "./ensureParentDir";
import { loadDownloadJobStore, saveDownloadJobStore } from "./downloadJobStore";
import { legacyMapboxPackName, mapboxPackName } from "./mapboxPackName";

const mapboxAppStateSubs = new Map<string, { remove: () => void }>();
/** Progress from createPack callbacks; keyed by pack name. */
const mapboxPackProgressByName = new Map<string, number>();

function clearMapboxListener(packName: string): void {
  mapboxAppStateSubs.get(packName)?.remove();
  mapboxAppStateSubs.delete(packName);
}

function clearMapboxPackProgress(packName: string): void {
  mapboxPackProgressByName.delete(packName);
}

function attachMapboxResumeListener(packName: string): void {
  clearMapboxListener(packName);
  const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
    if (next !== "active") {
      return;
    }
    void (async () => {
      try {
        const pack = await offlineManager.getPack(packName);
        if (pack == null) {
          return;
        }
        const status = await pack.status();
        if (status.percentage < 100) {
          await pack.resume();
        }
      } catch {
        // Pack may not exist yet.
      }
    })();
  });
  mapboxAppStateSubs.set(packName, sub);
}

async function deleteMapboxPacksForPage(pageId: string): Promise<void> {
  const packNames = [
    ...MAPBOX_STYLE_KEYS.map((styleKey) => mapboxPackName(pageId, styleKey)),
    legacyMapboxPackName(pageId),
  ];
  for (const packName of packNames) {
    clearMapboxListener(packName);
    clearMapboxPackProgress(packName);
    try {
      await offlineManager.deletePack(packName);
    } catch {
      // Pack may not exist.
    }
  }
}

function downloadProgressFraction(
  totalBytesWritten: number,
  totalBytesExpectedToWrite: number,
): number | null {
  if (totalBytesExpectedToWrite <= 0) {
    return null;
  }
  return Math.max(0, Math.min(1, totalBytesWritten / totalBytesExpectedToWrite));
}

async function deleteFailedDownload(destPath: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(destPath, { idempotent: true });
  } catch {
    // Ignore cleanup failure.
  }
}

async function assertDownloadSucceeded(
  status: number,
  destPath: string,
): Promise<void> {
  if (status >= 400) {
    await deleteFailedDownload(destPath);
    throw new Error(`Download failed: HTTP ${status}`);
  }
}

export function createMobileDownloadPlatformHarness(): DownloadPlatformHarness {
  return {
    async downloadFile({ url, destPath, background, onProgress }) {
      await ensureParentDir(destPath);
      const options = background
        ? { sessionType: FileSystemSessionType.BACKGROUND }
        : undefined;

      if (onProgress != null) {
        const download = FileSystem.createDownloadResumable(
          url,
          destPath,
          options,
          ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
            const fraction = downloadProgressFraction(
              totalBytesWritten,
              totalBytesExpectedToWrite,
            );
            if (fraction != null) {
              onProgress(fraction);
            }
          },
        );
        const result = await download.downloadAsync();
        if (result == null) {
          await deleteFailedDownload(destPath);
          throw new Error("Download failed");
        }
        await assertDownloadSucceeded(result.status, destPath);
        return;
      }

      const result = await FileSystem.downloadAsync(url, destPath, options);
      await assertDownloadSucceeded(result.status, destPath);
    },
    async fileExists(path) {
      const info = await FileSystem.getInfoAsync(path);
      return {
        exists: info.exists,
        size: info.exists && "size" in info ? info.size : undefined,
      };
    },
    readTextFile(path) {
      return FileSystem.readAsStringAsync(path);
    },
    async writeTextFile(path, content) {
      await ensureParentDir(path);
      await FileSystem.writeAsStringAsync(path, content);
    },
    ensureParentDir,
    async deletePageBundle(pageId) {
      await deleteMapboxPacksForPage(pageId);
      return deleteOfflineBundleFiles(pageId);
    },
    async gunzipTileIfNeeded(path) {
      await gunzipVectorTileFileIfNeeded(path);
    },
    extractZipArchive,
    paths: {
      pageRoot: getOfflinePageRootUri,
      pageJson: getOfflinePageJsonUri,
      pageJsonTemp: (pageId) => `${getOfflinePageJsonUri(pageId)}.tmp`,
      zipTemp: getOfflinePageZipTempUri,
      imageDest(pageId, imageId, slot, ext) {
        return `${getOfflineImageFileUri(pageId, imageId, slot)}${ext}`;
      },
      tileDest(pageId, relativePath) {
        return `${getOfflineMapDataRootUri(pageId)}${relativePath}`;
      },
      regionGeojson: getOfflineRegionRoutesGeojsonUri,
    },
    mapbox: {
      async startPack({ pageId, styleKey, styleUrl, bounds }) {
        const packName = mapboxPackName(pageId, styleKey as MapboxStyleKey);
        const packBounds: [[number, number], [number, number]] = [
          [bounds.east, bounds.north],
          [bounds.west, bounds.south],
        ];
        clearMapboxListener(packName);
        clearMapboxPackProgress(packName);
        mapboxPackProgressByName.set(packName, 0);
        try {
          await offlineManager.deletePack(packName);
        } catch {
          // Pack may not exist.
        }
        attachMapboxResumeListener(packName);
        try {
          await offlineManager.createPack(
            {
              name: packName,
              styleURL: styleUrl,
              bounds: packBounds,
              minZoom: 10,
              maxZoom: 20,
            },
            (_pack, status) => {
              const percentage =
                status != null && typeof status === "object"
                  ? (status as { percentage?: number }).percentage
                  : undefined;
              if (typeof percentage === "number") {
                mapboxPackProgressByName.set(packName, percentage);
              }
            },
            (_pack, err) => {
              clearMapboxPackProgress(packName);
              console.warn("[DownloadJob] Mapbox pack error", err.message);
            },
          );
        } catch (error) {
          console.warn("[DownloadJob] Mapbox createPack failed", error);
          throw error;
        }
      },
      async getPackProgress(pageId, styleKey) {
        const packName = mapboxPackName(pageId, styleKey as MapboxStyleKey);
        const cached = mapboxPackProgressByName.get(packName);
        if (cached !== undefined) {
          return cached;
        }
        try {
          const pack = await offlineManager.getPack(packName);
          if (pack == null) {
            return 0;
          }
          const status = await pack.status();
          return status.percentage;
        } catch {
          return 0;
        }
      },
      async deletePack(pageId, styleKey) {
        const packName = mapboxPackName(pageId, styleKey as MapboxStyleKey);
        clearMapboxListener(packName);
        clearMapboxPackProgress(packName);
        try {
          await offlineManager.deletePack(packName);
        } catch {
          // Pack may not exist.
        }
      },
    },
    loadJobStore: loadDownloadJobStore,
    saveJobStore: saveDownloadJobStore,
    setRoutePreviewsForPage: setDownloadedRoutePreviewsForPage,
  };
}
