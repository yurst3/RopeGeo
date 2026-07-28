import type { FontSlot } from "../font/types";
import type { TextStyle } from "react-native";

/**
 * Fixed typography for a text role (not profiled). Size and typeface come from
 * {@link UiScaleProfile} and {@link FontProfile}; this holds weight, decoration, etc.
 */
export type TypographySpec = {
  fontSlot: FontSlot;
  fontWeight?: TextStyle["fontWeight"];
  fontStyle?: TextStyle["fontStyle"];
  textDecorationLine?: TextStyle["textDecorationLine"];
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: TextStyle["textTransform"];
  textAlign?: TextStyle["textAlign"];
};

export type PreviewTypography = {
  starRating: TypographySpec;
  title: TypographySpec;
  akaNames: TypographySpec;
  locationHierarchy: TypographySpec;
  other: TypographySpec;
};

export type BetaSectionTypography = {
  title: TypographySpec;
  body: TypographySpec;
  caption: TypographySpec;
  showMore: TypographySpec;
};

export type PageScreenTypography = {
  title: TypographySpec;
  akaNames: TypographySpec;
  locationHierarchy: TypographySpec;
  starRating: TypographySpec;
  stat: TypographySpec;
  statLabel: TypographySpec;
  badgeTypeLabel: TypographySpec;
  badgeLabel: TypographySpec;
  metaData: TypographySpec;
};

export type FilterTypography = {
  title: TypographySpec;
  sectionTitle: TypographySpec;
  optionLabel: TypographySpec;
  optionSublabel: TypographySpec;
  note: TypographySpec;
  revertButton: TypographySpec;
};

export type MapTypography = {
  title: TypographySpec;
  markerLabel: TypographySpec;
  clusterLabel: TypographySpec;
  markerTooltip: TypographySpec;
  legendTitle: TypographySpec;
  legendItem: TypographySpec;
  relevantInfoTitle: TypographySpec;
  relevantInfoMeasurement: TypographySpec;
  relevantInfoSectionTitle: TypographySpec;
  relevantInfoBody: TypographySpec;
  relevantInfoStrengthLabel: TypographySpec;
  relevantInfoHiddenPill: TypographySpec;
  measurementContextPill: TypographySpec;
  relevantInfoCaption: TypographySpec;
  relevantInfoError: TypographySpec;
};

export type ButtonTypography = {
  searchBar: TypographySpec;
  download: TypographySpec;
  tabLabel: TypographySpec;
};

export type ToastTypography = {
  message: TypographySpec;
  subtitle: TypographySpec;
};

export type RegionScreenTypography = {
  title: TypographySpec;
  locationHierarchy: TypographySpec;
  previewCount: TypographySpec;
};

export type InfoScreenTypography = {
  title: TypographySpec;
  description: TypographySpec;
  badgeLabel: TypographySpec;
  badgeDescription: TypographySpec;
  badgeDescriptionHeader: TypographySpec;
};

/** Fixed typography tree; shared across all size and font profile combinations. */
export type TextStyleProfile = {
  preview: PreviewTypography;
  betaSection: BetaSectionTypography;
  pageScreen: PageScreenTypography;
  filter: FilterTypography;
  map: MapTypography;
  button: ButtonTypography;
  toast: ToastTypography;
  regionScreen: RegionScreenTypography;
  infoScreen: InfoScreenTypography;
};
