import * as FileSystem from "expo-file-system/legacy";
import { MAPBOX_STYLE_KEYS } from "ropegeo-common/download";
import { offlineManager } from "@rnmapbox/maps";
import { legacyMapboxPackName, mapboxPackName } from "@/utils/download/mapboxPackName";
import { removeDownloadedRoutePreviewsForPage } from "@/utils/offline/downloadedRoutePreviewsStorage";
import { getOfflinePageRootUri } from "@/utils/offline/paths";

/**
 * Deletes on-disk offline data for a page (page JSON, images, vector tiles). Idempotent.
 */
export async function deleteOfflineBundleFiles(pageId: string): Promise<void> {
  await removeDownloadedRoutePreviewsForPage(pageId);
  const root = getOfflinePageRootUri(pageId);
  const info = await FileSystem.getInfoAsync(root);
  if (info.exists) {
    await FileSystem.deleteAsync(root, { idempotent: true });
  }
  const packNames = [
    ...MAPBOX_STYLE_KEYS.map((styleKey) => mapboxPackName(pageId, styleKey)),
    legacyMapboxPackName(pageId),
  ];
  for (const packName of packNames) {
    try {
      await offlineManager.deletePack(packName);
    } catch {
      /* pack may not exist */
    }
  }
}
