import type {
  LegendItem,
  OfflineBetaSectionImage,
  OfflineBetaSectionLookup,
  OnlineBetaSectionImage,
  OnlineBetaSectionLookup,
} from "ropegeo-common/models";
import type { ExpandedImageGalleryPage } from "@/utils/expandedImage/types";

export type BetaSectionLookup = OnlineBetaSectionLookup | OfflineBetaSectionLookup;

export type RelevantContextImage = OnlineBetaSectionImage | OfflineBetaSectionImage;

export type RelevantMeasurementRow = {
  label: string;
  value: string;
};

export type RelevantImageRow =
  | {
      resolved: true;
      imageId: string;
      /** Compact rendition for the inline thumbnail (preview, falling back to banner). */
      previewSource: string | null;
      /** Full rendition; when present the thumbnail is pressable and joins the gallery. */
      fullSource: string | null;
      captionHtml: string | null;
    }
  | {
      resolved: false;
      imageId: string;
    };

export type RelevantSectionGroup = {
  /** Relevant-context key; `""` refers to page-level images (no owning section). */
  sectionKey: string;
  /** Section title when the key resolves to a beta section in the lookup. */
  title: string | null;
  excerptHtmls: string[];
  images: RelevantImageRow[];
};

export type RelevantContextContent = {
  measurements: RelevantMeasurementRow[];
  groups: RelevantSectionGroup[];
  /** True when any referenced image id could not be resolved in the lookup. */
  hasUnresolvedImages: boolean;
  /** Deduped by image id; order matches the vertical Relevant Info display order. */
  galleryPages: ExpandedImageGalleryPage[];
};

function imagePreviewSource(image: RelevantContextImage): string | null {
  if (image.fetchType === "online") {
    return image.previewUrl ?? image.bannerUrl;
  }
  return image.downloadedPreviewPath ?? image.downloadedBannerPath;
}

function imageFullSource(image: RelevantContextImage): string | null {
  return image.fetchType === "online" ? image.fullUrl : image.downloadedFullPath;
}

function imageBannerSource(image: RelevantContextImage): string | null {
  return image.fetchType === "online"
    ? image.bannerUrl
    : image.downloadedBannerPath;
}

/** Page order for resolved sections; page-level (`""`) first, unresolved keys last. */
function sectionKeyRank(key: string, lookup: BetaSectionLookup | null): number {
  if (key === "") return Number.MIN_SAFE_INTEGER;
  const section = lookup?.[key]?.section;
  if (section == null) return Number.MAX_SAFE_INTEGER;
  return section.order;
}

/**
 * Builds the display model for the Relevant Info overlay from a legend item's
 * `relevantContext` and the page's beta-section lookup. Returns null when the
 * item has no displayable content (no measurements, excerpts, or image refs).
 */
export function buildRelevantContextContent(
  item: LegendItem,
  lookup: BetaSectionLookup | null | undefined,
): RelevantContextContent | null {
  const relevantContext = item.relevantContext;
  if (relevantContext == null) return null;
  const resolvedLookup = lookup ?? null;

  const measurements: RelevantMeasurementRow[] = relevantContext.measurements.map(
    (m) => ({ label: m.label, value: m.measurement.toString() }),
  );

  const sectionKeys = [
    ...new Set([
      ...Object.keys(relevantContext.betaSectionExcerpts),
      ...Object.keys(relevantContext.images),
    ]),
  ].sort(
    (a, b) => sectionKeyRank(a, resolvedLookup) - sectionKeyRank(b, resolvedLookup),
  );

  let hasUnresolvedImages = false;
  const groups: RelevantSectionGroup[] = [];
  for (const sectionKey of sectionKeys) {
    const entry = resolvedLookup?.[sectionKey] ?? null;
    const excerpts = relevantContext.betaSectionExcerpts[sectionKey] ?? [];
    const excerptHtmls = excerpts
      .map((excerpt) =>
        entry?.section != null
          ? entry.section.toExcerptHtml(excerpt)
          : excerpt.toHtml(),
      )
      .filter((html) => html.trim().length > 0);

    const images: RelevantImageRow[] = (
      relevantContext.images[sectionKey] ?? []
    ).map((imageContext) => {
      const image = entry?.imagesById[imageContext.id];
      if (image == null) {
        hasUnresolvedImages = true;
        return { resolved: false, imageId: imageContext.id };
      }
      return {
        resolved: true,
        imageId: image.id,
        previewSource: imagePreviewSource(image),
        fullSource: imageFullSource(image),
        captionHtml: image.caption ?? null,
      };
    });

    if (excerptHtmls.length === 0 && images.length === 0) continue;
    groups.push({
      sectionKey,
      title: entry?.section?.title ?? null,
      excerptHtmls,
      images,
    });
  }

  if (measurements.length === 0 && groups.length === 0) return null;

  const galleryPages: ExpandedImageGalleryPage[] = [];
  const galleryImageIds = new Set<string>();
  for (const group of groups) {
    const entry = resolvedLookup?.[group.sectionKey] ?? null;
    for (const row of group.images) {
      if (!row.resolved || row.fullSource == null) continue;
      if (galleryImageIds.has(row.imageId)) continue;
      galleryImageIds.add(row.imageId);
      const image = entry?.imagesById[row.imageId];
      galleryPages.push({
        itemKey: row.imageId,
        fullUrl: row.fullSource,
        bannerUrl: image != null ? imageBannerSource(image) : null,
        linkUrl: image?.linkUrl ?? null,
        captionHtml: row.captionHtml,
      });
    }
  }

  return { measurements, groups, hasUnresolvedImages, galleryPages };
}
