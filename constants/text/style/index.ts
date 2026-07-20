import type { TextStyleProfile } from "./types";

/**
 * Fixed typography per text role. Not profiled — size and typeface come from
 * {@link UI_SCALE_PROFILES} and {@link FONT_PROFILES}.
 */
export const TEXT_STYLE: TextStyleProfile = {
  preview: {
    starRating: { fontSlot: "ui", fontWeight: "400" },
    title: { fontSlot: "display", fontWeight: "700" },
    akaNames: { fontSlot: "body", fontWeight: "400" },
    locationHierarchy: { fontSlot: "body", fontWeight: "400" },
    other: { fontSlot: "ui", fontWeight: "400" },
  },
  betaSection: {
    title: { fontSlot: "display", fontWeight: "700" },
    body: { fontSlot: "body", fontWeight: "400", lineHeight: 22 },
    caption: { fontSlot: "body", fontWeight: "400" },
    showMore: { fontSlot: "ui", fontWeight: "500" },
  },
  pageScreen: {
    title: { fontSlot: "display", fontWeight: "700" },
    akaNames: { fontSlot: "body", fontWeight: "400" },
    locationHierarchy: { fontSlot: "body", fontWeight: "400" },
    starRating: { fontSlot: "ui", fontWeight: "400" },
    stat: { fontSlot: "display", fontWeight: "700" },
    statLabel: { fontSlot: "body", fontWeight: "400" },
    badgeTypeLabel: { fontSlot: "ui", fontWeight: "500" },
    badgeLabel: { fontSlot: "ui", fontWeight: "700" },
    metaData: { fontSlot: "body", fontWeight: "400" },
  },
  filter: {
    title: { fontSlot: "display", fontWeight: "600" },
    sectionTitle: { fontSlot: "ui", fontWeight: "600" },
    optionLabel: { fontSlot: "ui", fontWeight: "400" },
    optionSublabel: { fontSlot: "body", fontWeight: "400" },
    note: { fontSlot: "body", fontWeight: "400" },
    revertButton: { fontSlot: "ui", fontWeight: "500" },
  },
  map: {
    title: { fontSlot: "display", fontWeight: "600" },
    markerLabel: { fontSlot: "ui", fontWeight: "400" },
    clusterLabel: { fontSlot: "ui", fontWeight: "400" },
    markerTooltip: { fontSlot: "ui", fontWeight: "600" },
    legendTitle: { fontSlot: "ui", fontWeight: "600" },
    legendItem: { fontSlot: "ui", fontWeight: "400" },
    relevantInfoTitle: { fontSlot: "ui", fontWeight: "600" },
    relevantInfoMeasurement: { fontSlot: "ui", fontWeight: "400" },
    relevantInfoSectionTitle: { fontSlot: "ui", fontWeight: "700" },
    relevantInfoBody: { fontSlot: "body", fontWeight: "400" },
    relevantInfoCaption: { fontSlot: "body", fontWeight: "400" },
    relevantInfoError: { fontSlot: "ui", fontWeight: "400" },
  },
  button: {
    searchBar: { fontSlot: "ui", fontWeight: "400" },
    download: { fontSlot: "ui", fontWeight: "700" },
    tabLabel: { fontSlot: "ui", fontWeight: "400" },
  },
  toast: {
    message: { fontSlot: "ui", fontWeight: "600" },
    subtitle: { fontSlot: "body", fontWeight: "500" },
  },
  regionScreen: {
    title: { fontSlot: "display", fontWeight: "700" },
    locationHierarchy: { fontSlot: "body", fontWeight: "400" },
    previewCount: { fontSlot: "body", fontWeight: "400" },
  },
  infoScreen: {
    title: { fontSlot: "display", fontWeight: "700", textAlign: "center" },
    description: { fontSlot: "body", fontWeight: "400", lineHeight: 22 },
    badgeLabel: { fontSlot: "ui", fontWeight: "400" },
    badgeDescription: { fontSlot: "body", fontWeight: "400", lineHeight: 22 },
    badgeDescriptionHeader: { fontSlot: "ui", fontWeight: "600" },
  },
};

export type {
  BetaSectionTypography,
  ButtonTypography,
  FilterTypography,
  InfoScreenTypography,
  MapTypography,
  PageScreenTypography,
  PreviewTypography,
  RegionScreenTypography,
  TextStyleProfile,
  ToastTypography,
  TypographySpec,
} from "./types";

export type { FontSlot } from "../font/types";
