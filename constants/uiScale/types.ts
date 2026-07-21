/** Absolute font-size steps in px (used for defaults, floors, and ceilings). */
export enum FontSizeStep {
  XSMALL = 10,
  SMALL = 12,
  MEDIUM = 14,
  LARGE = 18,
  XLARGE = 22,
}

export type AccessibilityScaling = {
  enabled?: boolean;
  /** Minimum device `fontScale` multiplier (values below are clamped up). */
  min?: number;
  /** Maximum device `fontScale` multiplier (values above are clamped down). */
  max?: number;
};

export type GlobalAccessibilityScaling = AccessibilityScaling & {
  enabled: boolean;
};

export type UiScaleGlobal = {
  accessibilityScaling: GlobalAccessibilityScaling;
  /**
   * Fixed icon scale for profiles with `accessibilityScaling.enabled: false`.
   * When accessibility scaling is on, icons follow capped device `fontScale` instead.
   */
  defaultIconScale?: number;
};

export type ConstantTextSizeSpec = {
  default: FontSizeStep;
  floor?: FontSizeStep;
  ceiling?: FontSizeStep;
  /** Overrides {@link UiScaleGlobal.accessibilityScaling} for this token. */
  accessibilityScaling?: AccessibilityScaling;
};

export type ScalingTextSizeSpec = {
  default: FontSizeStep;
  /**
   * When `true`, shrink floor is `computedFloorConstant * fontScale`. When omitted or
   * `false`, shrink floor is the pixel value of {@link floor}.
   * @default false
   */
  computeFloorFromAccessibilityScaling?: boolean;
  /** Required when {@link computeFloorFromAccessibilityScaling} is `true`. */
  computedFloorConstant?: number;
  floor?: FontSizeStep;
  ceiling?: FontSizeStep;
  /** Overrides {@link UiScaleGlobal.accessibilityScaling} for this token. */
  accessibilityScaling?: AccessibilityScaling;
};

export type IconScaleSpec = {
  scale: number;
  accessibilityScalingStrength?: number;
};

export type ButtonTextSizeSpec = ConstantTextSizeSpec | ScalingTextSizeSpec;

export type ButtonScaleSpec = {
  background?: IconScaleSpec;
  icon?: IconScaleSpec;
  text?: ButtonTextSizeSpec;
  /** Secondary copy paired with the control (hints, chevrons). */
  subtext?: ButtonTextSizeSpec;
  /** Checkbox, radio, and switch control chrome (scales independently from label text). */
  selectable?: IconScaleSpec;
};

export type CommonButtonSizes = {
  back: ButtonScaleSpec;
  share: ButtonScaleSpec;
  save: ButtonScaleSpec;
  filter: ButtonScaleSpec;
  externalLink: ButtonScaleSpec;
};

export type PreviewTextSizes = {
  starRating: ScalingTextSizeSpec;
  title: ScalingTextSizeSpec;
  akaNames: ScalingTextSizeSpec;
  locationHierarchy: ScalingTextSizeSpec;
  other: ScalingTextSizeSpec;
  download: ConstantTextSizeSpec;
};

export type PreviewIconSizes = {
  sourceIcon: IconScaleSpec;
  imageSourceIcon: IconScaleSpec;
  regionIcon: IconScaleSpec;
};

export type PreviewButtonSizes = {
  download: ButtonScaleSpec;
};

export type BetaSectionTextSizes = {
  title: ScalingTextSizeSpec;
  body: ConstantTextSizeSpec;
  caption: ConstantTextSizeSpec;
};

export type BetaSectionButtonSizes = {
  showMore: ButtonScaleSpec;
};

export type PageScreenTextSizes = {
  title: ConstantTextSizeSpec;
  akaNames: ConstantTextSizeSpec;
  locationHierarchy: ConstantTextSizeSpec;
  starRating: ConstantTextSizeSpec;
  stat: ScalingTextSizeSpec;
  statLabel: ScalingTextSizeSpec;
  badgeTypeLabel: ScalingTextSizeSpec;
  badgeLabel: ScalingTextSizeSpec;
  metaData: ConstantTextSizeSpec;
};

export type PageScreenButtonSizes = {
  download: ButtonScaleSpec;
  removeDownload: ButtonScaleSpec;
};

export type FilterTextSizes = {
  title: ConstantTextSizeSpec;
  sectionTitle: ConstantTextSizeSpec;
  note: ConstantTextSizeSpec;
  multiSliderThumbLabel: ScalingTextSizeSpec;
  multiSliderTickLabel: ScalingTextSizeSpec;
};

export type FilterIconSizes = {
  multiSliderThumb: IconScaleSpec;
};

export type FilterButtonSizes = {
  checkbox: ButtonScaleSpec;
  radio: ButtonScaleSpec;
  switch: ButtonScaleSpec;
  revert: ButtonScaleSpec;
  chip: ButtonScaleSpec;
};

export type MapTextSizes = {
  title: ScalingTextSizeSpec;
  markerLabel: ConstantTextSizeSpec;
  clusterLabel: ConstantTextSizeSpec;
  markerTooltip: ConstantTextSizeSpec;
  legendTitle: ScalingTextSizeSpec;
  legendItem: ScalingTextSizeSpec;
  /** MiniMapRelevantContext card header ("Relevant Info"). */
  relevantInfoTitle: ScalingTextSizeSpec;
  /** Measurement label/value chips in Relevant Info. */
  relevantInfoMeasurement: ConstantTextSizeSpec;
  /** Beta-section group titles inside Relevant Info. */
  relevantInfoSectionTitle: ScalingTextSizeSpec;
  /** Excerpt HTML body inside Relevant Info. */
  relevantInfoBody: ConstantTextSizeSpec;
  /** Image caption HTML inside Relevant Info. */
  relevantInfoCaption: ConstantTextSizeSpec;
  /** Unresolved-image placeholder text inside Relevant Info. */
  relevantInfoError: ConstantTextSizeSpec;
};

export type MapButtonSizes = {
  searchBar: ButtonScaleSpec;
  expandMiniMap: ButtonScaleSpec;
  resetCameraToPosition: ButtonScaleSpec;
  resetCameraOrientation: ButtonScaleSpec;
  resetCameraToBounds: ButtonScaleSpec;
  appleDirections: ButtonScaleSpec;
  googleDirections: ButtonScaleSpec;
};

export type TabButtonSizes = {
  tabBar: ButtonScaleSpec;
};

export type ToastTextSizes = {
  message: ScalingTextSizeSpec;
  subtitle: ScalingTextSizeSpec;
};

export type ToastButtonSizes = {
  action: ButtonScaleSpec;
};

export type RegionScreenTextSizes = {
  title: ConstantTextSizeSpec;
  locationHierarchy: ConstantTextSizeSpec;
  previewCount: ConstantTextSizeSpec;
};

export type InfoScreenTextSizes = {
  title: ConstantTextSizeSpec;
  description: ConstantTextSizeSpec;
  badgeLabel: ConstantTextSizeSpec;
  badgeDescription: ConstantTextSizeSpec;
  badgeDescriptionHeader: ConstantTextSizeSpec;
};

export type SettingsScreenTextSizes = {
  /** Unit conversion preview values shown under the Units control. */
  unitConversion: ScalingTextSizeSpec;
};

export type UiScaleProfile = {
  global: UiScaleGlobal;
  common: { buttons: CommonButtonSizes };
  preview: { text: PreviewTextSizes; icon: PreviewIconSizes; buttons: PreviewButtonSizes };
  filter: { text: FilterTextSizes; icon: FilterIconSizes; buttons: FilterButtonSizes };
  betaSection: { text: BetaSectionTextSizes; buttons: BetaSectionButtonSizes };
  pageScreen: { text: PageScreenTextSizes; buttons: PageScreenButtonSizes };
  map: { text: MapTextSizes; buttons: MapButtonSizes };
  tabs: { buttons: TabButtonSizes };
  toast: { text: ToastTextSizes; buttons: ToastButtonSizes };
  regionScreen: { text: RegionScreenTextSizes };
  infoScreen: { text: InfoScreenTextSizes };
  settingsScreen: { text: SettingsScreenTextSizes };
};

export type UiScaleProfileKey = "Auto" | "Small" | "Medium" | "Large";
