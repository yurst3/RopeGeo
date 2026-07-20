import {
  BetaSectionExcerpt,
  FEET,
  ImageContext,
  LengthMeasurement,
  MeasurementContext,
  OfflineBetaSection,
  OfflineBetaSectionImage,
  OnlineBetaSection,
  OnlineBetaSectionImage,
  PointLegendItem,
  RelevantContext,
  type OfflineBetaSectionLookup,
  type OnlineBetaSectionLookup,
} from "ropegeo-common/models";
import { buildRelevantContextContent } from "../relevantContextContent";

const REVISION_DATE = new Date("2025-01-15T00:00:00.000Z");

const SECTION_A_ID = "11111111-1111-4111-8111-111111111111";
const SECTION_B_ID = "22222222-2222-4222-8222-222222222222";
const MISSING_SECTION_ID = "33333333-3333-4333-8333-333333333333";
const IMAGE_A_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const IMAGE_B_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const MISSING_IMAGE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function onlineImage(
  id: string,
  overrides?: Partial<{
    previewUrl: string | null;
    bannerUrl: string | null;
    fullUrl: string | null;
    caption: string | null;
  }>,
): OnlineBetaSectionImage {
  return new OnlineBetaSectionImage(
    1,
    id,
    overrides?.bannerUrl !== undefined
      ? overrides.bannerUrl
      : `https://img/${id}-banner.avif`,
    overrides?.fullUrl !== undefined
      ? overrides.fullUrl
      : `https://img/${id}-full.avif`,
    `https://ropewiki.com/File:${id}`,
    overrides?.caption !== undefined ? overrides.caption : `Caption ${id}`,
    REVISION_DATE,
    null,
    overrides?.previewUrl !== undefined
      ? overrides.previewUrl
      : `https://img/${id}-preview.avif`,
  );
}

function offlineImage(
  id: string,
  overrides?: Partial<{
    downloadedPreviewPath: string | null;
    downloadedBannerPath: string | null;
    downloadedFullPath: string | null;
  }>,
): OfflineBetaSectionImage {
  return new OfflineBetaSectionImage(
    1,
    id,
    overrides?.downloadedBannerPath !== undefined
      ? overrides.downloadedBannerPath
      : `file:///images/${id}-banner.avif`,
    overrides?.downloadedFullPath !== undefined
      ? overrides.downloadedFullPath
      : `file:///images/${id}-full.avif`,
    `https://ropewiki.com/File:${id}`,
    null,
    REVISION_DATE,
    overrides?.downloadedPreviewPath !== undefined
      ? overrides.downloadedPreviewPath
      : `file:///images/${id}-preview.avif`,
  );
}

function legendPoint(relevantContext: RelevantContext | null): PointLegendItem {
  return new PointLegendItem(
    "legend-1",
    "First Rappel",
    { lat: 37.1, lon: -113.5 },
    undefined,
    relevantContext,
  );
}

describe("buildRelevantContextContent", () => {
  it("returns null when the item has no relevant context or no displayable data", () => {
    expect(buildRelevantContextContent(legendPoint(null), {})).toBeNull();
    expect(
      buildRelevantContextContent(
        legendPoint(new RelevantContext([], {}, {})),
        {},
      ),
    ).toBeNull();
  });

  it("maps measurements to label/value rows", () => {
    const context = new RelevantContext(
      [new MeasurementContext("Rappel", new LengthMeasurement(120, FEET), 0.9)],
      {},
      {},
    );
    const content = buildRelevantContextContent(legendPoint(context), {});
    expect(content).not.toBeNull();
    expect(content!.measurements).toEqual([{ label: "Rappel", value: "120ft" }]);
    expect(content!.groups).toEqual([]);
    expect(content!.hasUnresolvedImages).toBe(false);
    expect(content!.galleryPages).toEqual([]);
  });

  it("orders groups by section page order with page-level images first and unresolved keys last", () => {
    const sectionA = new OnlineBetaSection(
      2,
      "Approach",
      "Approach text.",
      REVISION_DATE,
      [onlineImage(IMAGE_A_ID)],
      SECTION_A_ID,
    );
    const sectionB = new OnlineBetaSection(
      1,
      "Overview",
      "Overview text.",
      REVISION_DATE,
      [],
      SECTION_B_ID,
    );
    const pageLevelImage = onlineImage(IMAGE_B_ID);
    const lookup: OnlineBetaSectionLookup = {
      [SECTION_A_ID]: {
        section: sectionA,
        imagesById: { [IMAGE_A_ID]: onlineImage(IMAGE_A_ID) },
      },
      [SECTION_B_ID]: { section: sectionB, imagesById: {} },
      "": { section: null, imagesById: { [IMAGE_B_ID]: pageLevelImage } },
    };
    const context = new RelevantContext(
      [],
      {
        [SECTION_A_ID]: [new BetaSectionExcerpt("Approach text.", 0, 14, 0.8)],
        [SECTION_B_ID]: [new BetaSectionExcerpt("Overview text.", 0, 14, 0.8)],
        [MISSING_SECTION_ID]: [new BetaSectionExcerpt("Orphan text.", undefined, undefined, 0.5)],
      },
      {
        [SECTION_A_ID]: [new ImageContext(IMAGE_A_ID, 0.9)],
        "": [new ImageContext(IMAGE_B_ID, 0.9)],
      },
    );

    const content = buildRelevantContextContent(legendPoint(context), lookup);
    expect(content).not.toBeNull();
    expect(content!.groups.map((g) => g.sectionKey)).toEqual([
      "",
      SECTION_B_ID,
      SECTION_A_ID,
      MISSING_SECTION_ID,
    ]);
    expect(content!.groups.map((g) => g.title)).toEqual([
      null,
      "Overview",
      "Approach",
      null,
    ]);
  });

  it("renders excerpts through the section when resolved and excerpt.toHtml() when not", () => {
    const section = new OnlineBetaSection(
      1,
      "Approach",
      "<ul><li>first</li><li>second</li><li>third</li></ul>",
      REVISION_DATE,
      [],
      SECTION_A_ID,
    );
    const lookup: OnlineBetaSectionLookup = {
      [SECTION_A_ID]: { section, imagesById: {} },
    };
    const excerpt = section.toExcerpt("<li>second</li>", 0.8);
    const context = new RelevantContext(
      [],
      {
        [SECTION_A_ID]: [excerpt],
        [MISSING_SECTION_ID]: [
          new BetaSectionExcerpt("<li>floating item</li>", undefined, undefined, 0.5),
        ],
      },
      {},
    );

    const content = buildRelevantContextContent(legendPoint(context), lookup);
    expect(content).not.toBeNull();
    const resolvedGroup = content!.groups.find((g) => g.sectionKey === SECTION_A_ID)!;
    expect(resolvedGroup.excerptHtmls).toEqual([
      section.toExcerptHtml(excerpt),
    ]);
    const fallbackGroup = content!.groups.find(
      (g) => g.sectionKey === MISSING_SECTION_ID,
    )!;
    expect(fallbackGroup.title).toBeNull();
    expect(fallbackGroup.excerptHtmls).toEqual(["<ul><li>floating item</li></ul>"]);
  });

  it("selects preview renditions online with banner fallback", () => {
    const withPreview = onlineImage(IMAGE_A_ID);
    const withoutPreview = onlineImage(IMAGE_B_ID, { previewUrl: null });
    const section = new OnlineBetaSection(
      1,
      "Approach",
      "text",
      REVISION_DATE,
      [withPreview, withoutPreview],
      SECTION_A_ID,
    );
    const lookup: OnlineBetaSectionLookup = {
      [SECTION_A_ID]: {
        section,
        imagesById: { [IMAGE_A_ID]: withPreview, [IMAGE_B_ID]: withoutPreview },
      },
    };
    const context = new RelevantContext(
      [],
      {},
      {
        [SECTION_A_ID]: [
          new ImageContext(IMAGE_A_ID, 0.9),
          new ImageContext(IMAGE_B_ID, 0.9),
        ],
      },
    );

    const content = buildRelevantContextContent(legendPoint(context), lookup);
    const rows = content!.groups[0].images;
    expect(rows).toEqual([
      {
        resolved: true,
        imageId: IMAGE_A_ID,
        previewSource: `https://img/${IMAGE_A_ID}-preview.avif`,
        fullSource: `https://img/${IMAGE_A_ID}-full.avif`,
        captionHtml: `Caption ${IMAGE_A_ID}`,
      },
      {
        resolved: true,
        imageId: IMAGE_B_ID,
        previewSource: `https://img/${IMAGE_B_ID}-banner.avif`,
        fullSource: `https://img/${IMAGE_B_ID}-full.avif`,
        captionHtml: `Caption ${IMAGE_B_ID}`,
      },
    ]);
  });

  it("selects preview renditions offline with banner fallback", () => {
    const withPreview = offlineImage(IMAGE_A_ID);
    const withoutPreview = offlineImage(IMAGE_B_ID, { downloadedPreviewPath: null });
    const section = new OfflineBetaSection(
      1,
      "Approach",
      "text",
      REVISION_DATE,
      [withPreview, withoutPreview],
      SECTION_A_ID,
    );
    const lookup: OfflineBetaSectionLookup = {
      [SECTION_A_ID]: {
        section,
        imagesById: { [IMAGE_A_ID]: withPreview, [IMAGE_B_ID]: withoutPreview },
      },
    };
    const context = new RelevantContext(
      [],
      {},
      {
        [SECTION_A_ID]: [
          new ImageContext(IMAGE_A_ID, 0.9),
          new ImageContext(IMAGE_B_ID, 0.9),
        ],
      },
    );

    const content = buildRelevantContextContent(legendPoint(context), lookup);
    const rows = content!.groups[0].images;
    expect(rows[0]).toMatchObject({
      resolved: true,
      previewSource: `file:///images/${IMAGE_A_ID}-preview.avif`,
      fullSource: `file:///images/${IMAGE_A_ID}-full.avif`,
    });
    expect(rows[1]).toMatchObject({
      resolved: true,
      previewSource: `file:///images/${IMAGE_B_ID}-banner.avif`,
    });
  });

  it("marks unresolved image references and keeps other content displayable", () => {
    const section = new OnlineBetaSection(
      1,
      "Approach",
      "text",
      REVISION_DATE,
      [onlineImage(IMAGE_A_ID)],
      SECTION_A_ID,
    );
    const lookup: OnlineBetaSectionLookup = {
      [SECTION_A_ID]: {
        section,
        imagesById: { [IMAGE_A_ID]: onlineImage(IMAGE_A_ID) },
      },
    };
    const context = new RelevantContext(
      [],
      {},
      {
        [SECTION_A_ID]: [
          new ImageContext(IMAGE_A_ID, 0.9),
          new ImageContext(MISSING_IMAGE_ID, 0.9),
        ],
      },
    );

    const content = buildRelevantContextContent(legendPoint(context), lookup);
    expect(content!.hasUnresolvedImages).toBe(true);
    expect(content!.groups[0].images).toEqual([
      expect.objectContaining({ resolved: true, imageId: IMAGE_A_ID }),
      { resolved: false, imageId: MISSING_IMAGE_ID },
    ]);
  });

  it("builds the gallery from resolved full-rendition images only, deduped by id, in display order", () => {
    const imageA = onlineImage(IMAGE_A_ID);
    const noFull = onlineImage(IMAGE_B_ID, { fullUrl: null });
    const sectionA = new OnlineBetaSection(
      1,
      "Approach",
      "text",
      REVISION_DATE,
      [imageA, noFull],
      SECTION_A_ID,
    );
    const sectionB = new OnlineBetaSection(
      2,
      "Descent",
      "text",
      REVISION_DATE,
      [onlineImage(IMAGE_A_ID)],
      SECTION_B_ID,
    );
    const lookup: OnlineBetaSectionLookup = {
      [SECTION_A_ID]: {
        section: sectionA,
        imagesById: { [IMAGE_A_ID]: imageA, [IMAGE_B_ID]: noFull },
      },
      [SECTION_B_ID]: {
        section: sectionB,
        imagesById: { [IMAGE_A_ID]: onlineImage(IMAGE_A_ID) },
      },
    };
    const context = new RelevantContext(
      [],
      {},
      {
        [SECTION_A_ID]: [
          new ImageContext(IMAGE_A_ID, 0.9),
          new ImageContext(IMAGE_B_ID, 0.9),
          new ImageContext(MISSING_IMAGE_ID, 0.9),
        ],
        [SECTION_B_ID]: [new ImageContext(IMAGE_A_ID, 0.9)],
      },
    );

    const content = buildRelevantContextContent(legendPoint(context), lookup);
    expect(content!.galleryPages).toEqual([
      {
        itemKey: IMAGE_A_ID,
        fullUrl: `https://img/${IMAGE_A_ID}-full.avif`,
        bannerUrl: `https://img/${IMAGE_A_ID}-banner.avif`,
        linkUrl: `https://ropewiki.com/File:${IMAGE_A_ID}`,
        captionHtml: `Caption ${IMAGE_A_ID}`,
      },
    ]);
  });
});
