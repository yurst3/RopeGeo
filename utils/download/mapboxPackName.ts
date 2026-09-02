import type { MapboxStyleKey } from "ropegeo-common/download";

export function mapboxPackName(pageId: string, styleKey: MapboxStyleKey): string {
  const safeId = pageId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `ropegeo-page-${safeId}-${styleKey}`;
}

/** Legacy single-style pack name (pre–dual-basemap downloads). */
export function legacyMapboxPackName(pageId: string): string {
  return `ropegeo-page-${pageId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
