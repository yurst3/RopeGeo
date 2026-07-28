import type {
  ExcerptHtml,
  LegendItem,
  MeasurementKey,
  MeasurementsLookup,
  OfflineBetaSectionImage,
  OfflineBetaSectionLookup,
  OfflineImageLookup,
  OnlineBetaSectionImage,
  OnlineBetaSectionLookup,
  OnlineImageLookup,
  RelevanceStrength,
} from "ropegeo-common/models";
import {
  boldRelevantPhraseInHtml,
  RELEVANCE_STRENGTHS,
} from "ropegeo-common/models";
import type { ShowRelevantContextStrengths } from "@/constants/settings";
import { pageStatLabel } from "@/constants/pageStats";
import type { ExpandedImageGalleryPage } from "@/utils/expandedImage/types";

export type BetaSectionLookup = OnlineBetaSectionLookup | OfflineBetaSectionLookup;
export type ImageLookup = OnlineImageLookup | OfflineImageLookup;

export type RelevantContextImage = OnlineBetaSectionImage | OfflineBetaSectionImage;

/** Page-level group key for images with no owning beta section (e.g. banner). */
export const PAGE_LEVEL_SECTION_KEY = "";

export type RelevantMeasurementRow = {
  label: string;
  /**
   * Formatted measurement string(s). A single value for ordinary keys; min then
   * max when both halves of a time-range context are present.
   */
  values: string[];
  relevanceStrength: RelevanceStrength;
};

export type RelevantExcerptRow = {
  html: ExcerptHtml;
  relevanceStrength: RelevanceStrength;
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
      relevanceStrength: RelevanceStrength;
    }
  | {
      resolved: false;
      imageId: string;
      relevanceStrength: RelevanceStrength;
    };

export type RelevantSectionGroup = {
  /** Relevant-context key; `""` refers to page-level images (no owning section). */
  sectionKey: string;
  /** Section title when the key resolves to a beta section in the lookup. */
  title: string | null;
  /** Excerpts split into `before`/`body`/`after` so context can be de-emphasized. */
  excerpts: RelevantExcerptRow[];
  images: RelevantImageRow[];
};

export type HiddenRelevantStrengthCount = {
  strength: RelevanceStrength;
  count: number;
};

export type RelevantContextContent = {
  measurements: RelevantMeasurementRow[];
  groups: RelevantSectionGroup[];
  /** True when any referenced image id could not be resolved in the lookup. */
  hasUnresolvedImages: boolean;
  /** Deduped by image id; order matches the vertical Relevant Info display order. */
  galleryPages: ExpandedImageGalleryPage[];
  /**
   * Contexts omitted by {@link strengthFilter}, grouped by strength.
   * Strongest first (Definitely → Maybe).
   */
  hiddenByStrength: HiddenRelevantStrengthCount[];
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
  if (key === PAGE_LEVEL_SECTION_KEY) return Number.MIN_SAFE_INTEGER;
  const section = lookup?.[key];
  if (section == null) return Number.MAX_SAFE_INTEGER;
  return section.order;
}

export function isRelevanceStrengthInRange(
  strength: RelevanceStrength,
  range: ShowRelevantContextStrengths,
): boolean {
  const index = RELEVANCE_STRENGTHS.indexOf(strength);
  const minIndex = RELEVANCE_STRENGTHS.indexOf(range.min);
  const maxIndex = RELEVANCE_STRENGTHS.indexOf(range.max);
  return index >= minIndex && index <= maxIndex;
}

function toHiddenByStrength(
  counts: Map<RelevanceStrength, number>,
): HiddenRelevantStrengthCount[] {
  return [...RELEVANCE_STRENGTHS]
    .reverse()
    .flatMap((strength) => {
      const count = counts.get(strength) ?? 0;
      return count > 0 ? [{ strength, count }] : [];
    });
}

/**
 * Relevant-context min/max time keys that share a page-stat label. When both
 * halves resolve, they collapse into one measurement row.
 */
const MEASUREMENT_RANGE_PARTNER: Partial<Record<MeasurementKey, MeasurementKey>> = {
  minApproachTime: "maxApproachTime",
  maxApproachTime: "minApproachTime",
  minDescentTime: "maxDescentTime",
  maxDescentTime: "minDescentTime",
  minExitTime: "maxExitTime",
  maxExitTime: "minExitTime",
};

const MEASUREMENT_RANGE_MIN_KEYS = new Set<MeasurementKey>([
  "minApproachTime",
  "minDescentTime",
  "minExitTime",
]);

type PendingMeasurement = {
  key: MeasurementKey;
  label: string;
  value: string;
  relevanceStrength: RelevanceStrength;
};

function strongerRelevance(
  a: RelevanceStrength,
  b: RelevanceStrength,
): RelevanceStrength {
  return RELEVANCE_STRENGTHS.indexOf(a) >= RELEVANCE_STRENGTHS.indexOf(b) ? a : b;
}

/** Collapses paired min/max time contexts into one row (min value, then max). */
function collapseMeasurementRanges(
  pending: PendingMeasurement[],
): RelevantMeasurementRow[] {
  const consumed = new Set<number>();
  const rows: RelevantMeasurementRow[] = [];

  for (let i = 0; i < pending.length; i++) {
    if (consumed.has(i)) continue;
    const row = pending[i]!;
    const partnerKey = MEASUREMENT_RANGE_PARTNER[row.key];
    const partnerIdx =
      partnerKey == null
        ? -1
        : pending.findIndex(
            (candidate, j) =>
              j !== i && !consumed.has(j) && candidate.key === partnerKey,
          );

    if (partnerIdx >= 0) {
      const partner = pending[partnerIdx]!;
      const minRow = MEASUREMENT_RANGE_MIN_KEYS.has(row.key) ? row : partner;
      const maxRow = MEASUREMENT_RANGE_MIN_KEYS.has(row.key) ? partner : row;
      rows.push({
        label: minRow.label,
        values: [minRow.value, maxRow.value],
        relevanceStrength: strongerRelevance(
          minRow.relevanceStrength,
          maxRow.relevanceStrength,
        ),
      });
      consumed.add(i);
      consumed.add(partnerIdx);
      continue;
    }

    rows.push({
      label: row.label,
      values: [row.value],
      relevanceStrength: row.relevanceStrength,
    });
    consumed.add(i);
  }

  return rows;
}

/**
 * Builds the display model for the Relevant Info overlay from a legend item's
 * `relevantContext` and page lookups. Returns null when the item has no
 * displayable content (no resolved measurements, excerpts, or image refs).
 *
 * When {@link strengthFilter} is set, measurements / excerpts / images outside
 * the inclusive min–max range are omitted and tallied in {@link RelevantContextContent.hiddenByStrength}.
 */
export function buildRelevantContextContent(
  item: LegendItem,
  betaSectionLookup: BetaSectionLookup | null | undefined,
  imageLookup: ImageLookup | null | undefined,
  measurementsLookup: MeasurementsLookup | null | undefined,
  strengthFilter?: ShowRelevantContextStrengths | null,
): RelevantContextContent | null {
  const relevantContext = item.relevantContext;
  if (relevantContext == null) return null;
  const resolvedBetaLookup = betaSectionLookup ?? null;
  const resolvedImageLookup = imageLookup ?? null;
  const resolvedMeasurementsLookup = measurementsLookup ?? null;
  const allowsStrength = (strength: RelevanceStrength) =>
    strengthFilter == null || isRelevanceStrengthInRange(strength, strengthFilter);
  const hiddenCounts = new Map<RelevanceStrength, number>();
  const noteHidden = (strength: RelevanceStrength) => {
    hiddenCounts.set(strength, (hiddenCounts.get(strength) ?? 0) + 1);
  };

  const pendingMeasurements: PendingMeasurement[] = [];
  for (const measurementContext of relevantContext.measurements) {
    const measurement = resolvedMeasurementsLookup?.[measurementContext.key];
    if (measurement == null) continue;
    if (!allowsStrength(measurementContext.relevanceStrength)) {
      noteHidden(measurementContext.relevanceStrength);
      continue;
    }
    pendingMeasurements.push({
      key: measurementContext.key,
      label: pageStatLabel(measurementContext.key),
      value: measurement.toString(),
      relevanceStrength: measurementContext.relevanceStrength,
    });
  }
  const measurements = collapseMeasurementRanges(pendingMeasurements);

  const imagesBySectionKey = new Map<string, RelevantImageRow[]>();
  let hasUnresolvedImages = false;
  for (const imageContext of relevantContext.images) {
    if (!allowsStrength(imageContext.relevanceStrength)) {
      noteHidden(imageContext.relevanceStrength);
      continue;
    }
    const entry = resolvedImageLookup?.[imageContext.id];
    const sectionKey = entry?.betaSectionId ?? PAGE_LEVEL_SECTION_KEY;
    let rows = imagesBySectionKey.get(sectionKey);
    if (rows == null) {
      rows = [];
      imagesBySectionKey.set(sectionKey, rows);
    }
    if (entry == null) {
      hasUnresolvedImages = true;
      rows.push({
        resolved: false,
        imageId: imageContext.id,
        relevanceStrength: imageContext.relevanceStrength,
      });
      continue;
    }
    const image = entry.image;
    const caption = image.caption;
    rows.push({
      resolved: true,
      imageId: image.id,
      previewSource: imagePreviewSource(image),
      fullSource: imageFullSource(image),
      captionHtml:
        caption != null
          ? boldRelevantPhraseInHtml(caption, imageContext.relevantPhrase)
          : null,
      relevanceStrength: imageContext.relevanceStrength,
    });
  }

  const sectionKeys = [
    ...new Set([
      ...Object.keys(relevantContext.betaSectionExcerpts),
      ...imagesBySectionKey.keys(),
    ]),
  ].sort(
    (a, b) =>
      sectionKeyRank(a, resolvedBetaLookup) - sectionKeyRank(b, resolvedBetaLookup),
  );

  const groups: RelevantSectionGroup[] = [];
  for (const sectionKey of sectionKeys) {
    const section = resolvedBetaLookup?.[sectionKey] ?? null;
    const sectionExcerpts = relevantContext.betaSectionExcerpts[sectionKey] ?? [];
    const excerpts: RelevantExcerptRow[] = [];
    for (const excerpt of sectionExcerpts) {
      const html =
        section != null
          ? section.toExcerptHtml(excerpt)
          : { body: excerpt.toHtml() };
      const hasDisplayableHtml =
        `${html.before ?? ""}${html.body}${html.after ?? ""}`.trim().length > 0;
      if (!allowsStrength(excerpt.relevanceStrength)) {
        if (hasDisplayableHtml) noteHidden(excerpt.relevanceStrength);
        continue;
      }
      if (!hasDisplayableHtml) continue;
      excerpts.push({
        html,
        relevanceStrength: excerpt.relevanceStrength,
      });
    }

    const images = imagesBySectionKey.get(sectionKey) ?? [];
    if (excerpts.length === 0 && images.length === 0) continue;
    groups.push({
      sectionKey,
      title: section?.title ?? null,
      excerpts,
      images,
    });
  }

  const hiddenByStrength = toHiddenByStrength(hiddenCounts);
  if (
    measurements.length === 0 &&
    groups.length === 0 &&
    hiddenByStrength.length === 0
  ) {
    return null;
  }

  const galleryPages: ExpandedImageGalleryPage[] = [];
  const galleryImageIds = new Set<string>();
  for (const group of groups) {
    for (const row of group.images) {
      if (!row.resolved || row.fullSource == null) continue;
      if (galleryImageIds.has(row.imageId)) continue;
      galleryImageIds.add(row.imageId);
      const entry = resolvedImageLookup?.[row.imageId];
      const image = entry?.image;
      galleryPages.push({
        itemKey: row.imageId,
        fullUrl: row.fullSource,
        bannerUrl: image != null ? imageBannerSource(image) : null,
        linkUrl: image?.linkUrl ?? null,
        captionHtml: row.captionHtml,
      });
    }
  }

  return {
    measurements,
    groups,
    hasUnresolvedImages,
    galleryPages,
    hiddenByStrength,
  };
}
