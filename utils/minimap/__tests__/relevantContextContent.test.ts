import {
  BetaSectionExcerpt,
  FEET,
  HOURS,
  ImageContext,
  LengthMeasurement,
  MeasurementContext,
  OfflineBetaSection,
  OfflineBetaSectionImage,
  OnlineBetaSection,
  OnlineBetaSectionImage,
  PointLegendItem,
  RelevantContext,
  TimeMeasurement,
  boldRelevantPhraseInHtml,
  type MeasurementsLookup,
  type OfflineBetaSectionLookup,
  type OfflineImageLookup,
  type OnlineBetaSectionLookup,
  type OnlineImageLookup,
} from "ropegeo-common/models";
import {
  PAGE_LEVEL_SECTION_KEY,
  buildRelevantContextContent,
} from "../relevantContextContent";

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
    caption: string | null;
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
    overrides?.caption !== undefined ? overrides.caption : null,
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
    expect(buildRelevantContextContent(legendPoint(null), {}, {}, {})).toBeNull();
    expect(
      buildRelevantContextContent(
        legendPoint(new RelevantContext([], {}, [])),
        {},
        {},
        {},
      ),
    ).toBeNull();
  });

  it("resolves measurements via measurementsLookup and skips missing keys", () => {
    const measurementsLookup: MeasurementsLookup = {
      approachElevGain: new LengthMeasurement(400, FEET),
    };
    const context = new RelevantContext(
      [
        new MeasurementContext("approachElevGain", "Definitely Relevant"),
        new MeasurementContext("descentLength", "Somewhat Relevant"),
      ],
      {},
      [],
    );
    const content = buildRelevantContextContent(
      legendPoint(context),
      {},
      {},
      measurementsLookup,
    );
    expect(content).not.toBeNull();
    expect(content!.measurements).toEqual([
      {
        label: "Approach Gain",
        values: ["400ft"],
        relevanceStrength: "Definitely Relevant",
      },
    ]);
    expect(content!.groups).toEqual([]);
    expect(content!.hasUnresolvedImages).toBe(false);
    expect(content!.galleryPages).toEqual([]);
  });

  it("combines min/max time contexts into one row with both values", () => {
    const measurementsLookup: MeasurementsLookup = {
      minDescentTime: new TimeMeasurement(3.5, HOURS),
      maxDescentTime: new TimeMeasurement(5, HOURS),
      descentLength: new LengthMeasurement(1.1, FEET),
    };
    const context = new RelevantContext(
      [
        new MeasurementContext("descentLength", "Somewhat Relevant"),
        new MeasurementContext("maxDescentTime", "Somewhat Relevant"),
        new MeasurementContext("minDescentTime", "Definitely Relevant"),
      ],
      {},
      [],
    );
    const content = buildRelevantContextContent(
      legendPoint(context),
      {},
      {},
      measurementsLookup,
    );
    expect(content!.measurements).toEqual([
      {
        label: "Descent Dist.",
        values: ["1.1ft"],
        relevanceStrength: "Somewhat Relevant",
      },
      {
        label: "Descent Est.",
        values: ["3.5h", "5h"],
        relevanceStrength: "Definitely Relevant",
      },
    ]);
  });

  it("keeps a lone min or max time context as its own row", () => {
    const measurementsLookup: MeasurementsLookup = {
      minDescentTime: new TimeMeasurement(3.5, HOURS),
    };
    const context = new RelevantContext(
      [new MeasurementContext("minDescentTime", "Somewhat Relevant")],
      {},
      [],
    );
    const content = buildRelevantContextContent(
      legendPoint(context),
      {},
      {},
      measurementsLookup,
    );
    expect(content!.measurements).toEqual([
      {
        label: "Descent Est.",
        values: ["3.5h"],
        relevanceStrength: "Somewhat Relevant",
      },
    ]);
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
    const betaSectionLookup: OnlineBetaSectionLookup = {
      [SECTION_A_ID]: sectionA,
      [SECTION_B_ID]: sectionB,
    };
    const imageLookup: OnlineImageLookup = {
      [IMAGE_A_ID]: { image: onlineImage(IMAGE_A_ID), betaSectionId: SECTION_A_ID },
      [IMAGE_B_ID]: { image: pageLevelImage },
    };
    const context = new RelevantContext(
      [],
      {
        [SECTION_A_ID]: [
          new BetaSectionExcerpt("Approach text.", 0, 14, "Somewhat Relevant", "Approach"),
        ],
        [SECTION_B_ID]: [
          new BetaSectionExcerpt("Overview text.", 0, 14, "Somewhat Relevant", "Overview"),
        ],
        [MISSING_SECTION_ID]: [
          new BetaSectionExcerpt(
            "Orphan text.",
            undefined,
            undefined,
            "Maybe Relevant",
            "Orphan",
          ),
        ],
      },
      [
        new ImageContext(IMAGE_A_ID, "Somewhat Relevant", "Caption"),
        new ImageContext(IMAGE_B_ID, "Somewhat Relevant", "Caption"),
      ],
    );

    const content = buildRelevantContextContent(
      legendPoint(context),
      betaSectionLookup,
      imageLookup,
      {},
    );
    expect(content).not.toBeNull();
    expect(content!.groups.map((g) => g.sectionKey)).toEqual([
      PAGE_LEVEL_SECTION_KEY,
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
    const betaSectionLookup: OnlineBetaSectionLookup = {
      [SECTION_A_ID]: section,
    };
    const excerpt = section.toExcerpt("<li>second</li>", "Somewhat Relevant", "second");
    const context = new RelevantContext(
      [],
      {
        [SECTION_A_ID]: [excerpt],
        [MISSING_SECTION_ID]: [
          new BetaSectionExcerpt(
            "<li>floating item</li>",
            undefined,
            undefined,
            "Maybe Relevant",
            "floating",
          ),
        ],
      },
      [],
    );

    const content = buildRelevantContextContent(
      legendPoint(context),
      betaSectionLookup,
      {},
      {},
    );
    expect(content).not.toBeNull();
    const resolvedGroup = content!.groups.find((g) => g.sectionKey === SECTION_A_ID)!;
    expect(resolvedGroup.excerpts).toEqual([
      {
        html: section.toExcerptHtml(excerpt),
        relevanceStrength: "Somewhat Relevant",
      },
    ]);
    const fallbackGroup = content!.groups.find(
      (g) => g.sectionKey === MISSING_SECTION_ID,
    )!;
    expect(fallbackGroup.title).toBeNull();
    expect(fallbackGroup.excerpts).toEqual([
      {
        html: {
          body: boldRelevantPhraseInHtml(
            "<ul><li>floating item</li></ul>",
            "floating",
          ),
        },
        relevanceStrength: "Maybe Relevant",
      },
    ]);
  });

  it("selects preview renditions online with banner fallback and bolds captions", () => {
    const withPreview = onlineImage(IMAGE_A_ID, {
      caption: "The first rappel is bolted.",
    });
    const withoutPreview = onlineImage(IMAGE_B_ID, {
      previewUrl: null,
      caption: "See R2 below.",
    });
    const section = new OnlineBetaSection(
      1,
      "Approach",
      "text",
      REVISION_DATE,
      [withPreview, withoutPreview],
      SECTION_A_ID,
    );
    const betaSectionLookup: OnlineBetaSectionLookup = {
      [SECTION_A_ID]: section,
    };
    const imageLookup: OnlineImageLookup = {
      [IMAGE_A_ID]: { image: withPreview, betaSectionId: SECTION_A_ID },
      [IMAGE_B_ID]: { image: withoutPreview, betaSectionId: SECTION_A_ID },
    };
    const context = new RelevantContext(
      [],
      {},
      [
        new ImageContext(IMAGE_A_ID, "Somewhat Relevant", "first rappel"),
        new ImageContext(IMAGE_B_ID, "Definitely Relevant", "R2"),
      ],
    );

    const content = buildRelevantContextContent(
      legendPoint(context),
      betaSectionLookup,
      imageLookup,
      {},
    );
    const rows = content!.groups[0].images;
    expect(rows).toEqual([
      {
        resolved: true,
        imageId: IMAGE_A_ID,
        previewSource: `https://img/${IMAGE_A_ID}-preview.avif`,
        fullSource: `https://img/${IMAGE_A_ID}-full.avif`,
        captionHtml: boldRelevantPhraseInHtml(
          "The first rappel is bolted.",
          "first rappel",
        ),
        relevanceStrength: "Somewhat Relevant",
      },
      {
        resolved: true,
        imageId: IMAGE_B_ID,
        previewSource: `https://img/${IMAGE_B_ID}-banner.avif`,
        fullSource: `https://img/${IMAGE_B_ID}-full.avif`,
        captionHtml: boldRelevantPhraseInHtml("See R2 below.", "R2"),
        relevanceStrength: "Definitely Relevant",
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
    const betaSectionLookup: OfflineBetaSectionLookup = {
      [SECTION_A_ID]: section,
    };
    const imageLookup: OfflineImageLookup = {
      [IMAGE_A_ID]: { image: withPreview, betaSectionId: SECTION_A_ID },
      [IMAGE_B_ID]: { image: withoutPreview, betaSectionId: SECTION_A_ID },
    };
    const context = new RelevantContext(
      [],
      {},
      [
        new ImageContext(IMAGE_A_ID, "Somewhat Relevant"),
        new ImageContext(IMAGE_B_ID, "Somewhat Relevant"),
      ],
    );

    const content = buildRelevantContextContent(
      legendPoint(context),
      betaSectionLookup,
      imageLookup,
      {},
    );
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
    const betaSectionLookup: OnlineBetaSectionLookup = {
      [SECTION_A_ID]: section,
    };
    const imageLookup: OnlineImageLookup = {
      [IMAGE_A_ID]: { image: onlineImage(IMAGE_A_ID), betaSectionId: SECTION_A_ID },
    };
    const context = new RelevantContext(
      [],
      {},
      [
        new ImageContext(IMAGE_A_ID, "Somewhat Relevant"),
        new ImageContext(MISSING_IMAGE_ID, "Somewhat Relevant"),
      ],
    );

    const content = buildRelevantContextContent(
      legendPoint(context),
      betaSectionLookup,
      imageLookup,
      {},
    );
    expect(content!.hasUnresolvedImages).toBe(true);
    const sectionGroup = content!.groups.find((g) => g.sectionKey === SECTION_A_ID)!;
    const pageGroup = content!.groups.find(
      (g) => g.sectionKey === PAGE_LEVEL_SECTION_KEY,
    )!;
    expect(sectionGroup.images).toEqual([
      expect.objectContaining({ resolved: true, imageId: IMAGE_A_ID }),
    ]);
    expect(pageGroup.images).toEqual([
      {
        resolved: false,
        imageId: MISSING_IMAGE_ID,
        relevanceStrength: "Somewhat Relevant",
      },
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
    const betaSectionLookup: OnlineBetaSectionLookup = {
      [SECTION_A_ID]: sectionA,
      [SECTION_B_ID]: sectionB,
    };
    const imageLookup: OnlineImageLookup = {
      [IMAGE_A_ID]: { image: imageA, betaSectionId: SECTION_A_ID },
      [IMAGE_B_ID]: { image: noFull, betaSectionId: SECTION_A_ID },
    };
    const context = new RelevantContext(
      [],
      {},
      [
        new ImageContext(IMAGE_A_ID, "Somewhat Relevant"),
        new ImageContext(IMAGE_B_ID, "Somewhat Relevant"),
        new ImageContext(MISSING_IMAGE_ID, "Somewhat Relevant"),
        // Duplicate id — should only appear once in the gallery.
        new ImageContext(IMAGE_A_ID, "Definitely Relevant"),
      ],
    );

    const content = buildRelevantContextContent(
      legendPoint(context),
      betaSectionLookup,
      imageLookup,
      {},
    );
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

  it("excludes measurements, excerpts, and images outside the strength filter range", () => {
    const section = new OnlineBetaSection(
      1,
      "Approach",
      "<p>maybe phrase</p><p>definite phrase</p>",
      REVISION_DATE,
      [onlineImage(IMAGE_A_ID), onlineImage(IMAGE_B_ID)],
      SECTION_A_ID,
    );
    const betaSectionLookup: OnlineBetaSectionLookup = {
      [SECTION_A_ID]: section,
    };
    const imageLookup: OnlineImageLookup = {
      [IMAGE_A_ID]: { image: onlineImage(IMAGE_A_ID), betaSectionId: SECTION_A_ID },
      [IMAGE_B_ID]: { image: onlineImage(IMAGE_B_ID), betaSectionId: SECTION_A_ID },
    };
    const measurementsLookup: MeasurementsLookup = {
      approachElevGain: new LengthMeasurement(400, FEET),
      descentLength: new LengthMeasurement(100, FEET),
    };
    const context = new RelevantContext(
      [
        new MeasurementContext("approachElevGain", "Definitely Relevant"),
        new MeasurementContext("descentLength", "Maybe Relevant"),
      ],
      {
        [SECTION_A_ID]: [
          section.toExcerpt("<p>maybe phrase</p>", "Maybe Relevant", "maybe"),
          section.toExcerpt(
            "<p>definite phrase</p>",
            "Definitely Relevant",
            "definite",
          ),
        ],
      },
      [
        new ImageContext(IMAGE_A_ID, "Maybe Relevant"),
        new ImageContext(IMAGE_B_ID, "Definitely Relevant"),
      ],
    );

    const content = buildRelevantContextContent(
      legendPoint(context),
      betaSectionLookup,
      imageLookup,
      measurementsLookup,
      { min: "Definitely Relevant", max: "Definitely Relevant" },
    );

    expect(content).not.toBeNull();
    expect(content!.measurements).toEqual([
      {
        label: "Approach Gain",
        values: ["400ft"],
        relevanceStrength: "Definitely Relevant",
      },
    ]);
    expect(content!.groups).toHaveLength(1);
    expect(content!.groups[0].excerpts).toHaveLength(1);
    expect(content!.groups[0].excerpts[0].relevanceStrength).toBe(
      "Definitely Relevant",
    );
    expect(content!.groups[0].images).toEqual([
      expect.objectContaining({
        imageId: IMAGE_B_ID,
        relevanceStrength: "Definitely Relevant",
      }),
    ]);
    expect(content!.hiddenByStrength).toEqual([
      { strength: "Maybe Relevant", count: 3 },
    ]);
  });
});
