import type {
  AcaRiskSubRating,
  AcaTechnicalSubRating,
  AcaTimeSubRating,
  AcaWaterSubRating,
  DifficultyRatingSystem,
  PermitStatus,
  RelevanceStrength,
  RopewikiVehicleType,
  RouteType,
} from "ropegeo-common/models";

export type StandardButtonKeys =
  | "back"
  | "filter"
  | "mapLayers"
  | "save"
  | "share"
  | "externalLink"
  | "expandMiniMap"
  | "appleDirections"
  | "googleDirections"
  | "resetCameraToBounds"
  | "resetCameraToPosition"
  | "resetCameraOrientation"
  | "savedPageGlyph"
  | "removeDownload";

export type NonstandardButtonKeys = "download" | "miniDownload" | "badgeButton";

export type StandardButtonColors = {
  background: string;
  icon: string;
  iconHighlight?: string;
  border?: string;
};

export type DownloadButtonColors = {
  background: string;
  downloadCompleteBackground: string;
  icon: string;
  downloadCompleteIcon: string;
  inProgressBackground: string;
  inProgressSolid: string;
  shadowColor: string;
};

export type MiniDownloadButtonColors = {
  background: string;
  downloadCompleteBackground: string;
  icon: string;
  downloadCompleteIcon: string;
  inProgressBackground: string;
  inProgressSolid: string;
  inProgress: string;
  shadowColor: string;
};

export type BadgeButtonColors = {
  infoIconBackground: string;
  infoIcon: string;
};

export type NonstandardButtonColors =
  | DownloadButtonColors
  | MiniDownloadButtonColors
  | BadgeButtonColors;

export type ButtonColors = {
  standard: Record<StandardButtonKeys, StandardButtonColors>;
  nonstandard: Record<NonstandardButtonKeys, NonstandardButtonColors>;
  shadowColor: string;
};

export type DifficultySubRating =
  | AcaTechnicalSubRating
  | AcaWaterSubRating
  | AcaTimeSubRating
  | AcaRiskSubRating;

export type DifficultyRatingBadgeColors = {
  background: string;
  icon: string;
};

export type RouteTypeBadgeColors = {
  background: string;
  icon: string;
};

export type PermitBadgeColors = {
  background: string;
  icon: string;
};

export type ShuttleBadgeKeys = "noShuttle" | "shuttleRequired";

export type ShuttleBadgeColors = {
  background: string;
  icon: string;
};

export type VehicleBadgeColors = {
  background: string;
  icon: string;
};

export type UnknownBadgeColors = {
  background: string;
  icon: string;
};

export type SubBadgeColors = {
  background: string;
  icon: string;
};

export type RelevanceStrengthBadgeColors = {
  background: string;
  icon: string;
};

export type BadgeColors = {
  difficultyRating: Record<
    DifficultyRatingSystem,
    Record<DifficultySubRating, DifficultyRatingBadgeColors>
  >;
  routeType: Record<RouteType, RouteTypeBadgeColors>;
  permit: Record<PermitStatus, PermitBadgeColors>;
  shuttle: Record<ShuttleBadgeKeys, ShuttleBadgeColors>;
  vehicle: Record<RopewikiVehicleType, VehicleBadgeColors>;
  relevanceStrength: Record<RelevanceStrength, RelevanceStrengthBadgeColors>;
  unknown: UnknownBadgeColors;
  placeholder: string;
  subBadge: SubBadgeColors;
  border: string;
};

export type TextColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  link: string;
  error: string;
};

export type MarkerColors = {
  defaultIcon: string;
  clusterIcon: string;
  text: string;
  textHalo: string;
};

export type SearchBarColors = {
  background: string;
  shadow: string;
  icon: string;
};

export type MiniMapTitleColors = {
  background: string;
  shadow: string;
};

export type MiniMapLegendColors = {
  bodyBackground: string;
  headerBackground: string;
  shadow: string;
  collapseIcon: string;
  /** Tint used only for point marker icons inside the legend swatches. */
  markerIcon: string;
};

export type MiniMapColors = {
  /** Full-bleed mount/handoff loading cover behind chrome. */
  background: string;
  title: MiniMapTitleColors;
  legend: MiniMapLegendColors;
};

export type MapColors = {
  minimap: MiniMapColors;
};

export type TabBarColors = {
  background: string;
  iconUnfocused: string;
  iconFocused: string;
  /** Saved-tab “page saved” halo (not the tab icon tint). */
  iconHighlight: string;
};

export type ImageColors = {
  textBackground: string;
  text: string;
  missingIcon: string;
  missingText: string;
  background: string;
  /** Tint over blurred banners (darken in dark theme, brighten in light). */
  blurOverlay: string;
};

export type ToastStyle = "success" | "error" | "warning" | "info";

export type ToastColors = {
  background: string;
  text: string;
  filledTrack: string;
  unfilledTrack: string;
  icon: string;
};

export type PagePreviewColors = {
  sourceIconBackground: string;
};

export type RegionPreviewColors = {
  regionIconBackground: string;
  regionIcon: string;
  shadowColor: string;
  sourceIconBackground: string;
};

export type PreviewColors = {
  page: PagePreviewColors;
  region: RegionPreviewColors;
};

export type FilterCheckboxColors = {
  uncheckedOutline: string;
  checkedOutline: string;
  checkedFill: string;
};

export type FilterRadioButtonColors = {
  uncheckedOutline: string;
  checkedFill: string;
};

export type FilterSwitchColors = {
  onBackground: string;
  offBackground: string;
  thumb: string;
};

export type FilterSliderColors = {
  filledBar: string;
  unfilledBar: string;
  thumb: string;
};

export type FilterDropdownColors = {
  outline: string;
  modalBackground: string;
};

export type FilterBadgeSliderColors = {
  filledBar: string;
  unfilledBar: string;
  tick: string;
};

export type FilterColors = {
  checkbox: FilterCheckboxColors;
  radioButton: FilterRadioButtonColors;
  switch: FilterSwitchColors;
  slider: FilterSliderColors;
  dropdown: FilterDropdownColors;
  badgeSlider: FilterBadgeSliderColors;
  disableSection: string;
  noteText: string;
  revertText: string;
};

export type ThemeColors = {
  background: string;
  cardHighlight: string;
  placeholder: string;
  separator: string;
  starRating: string;
  loadingIndicator: string;
  button: ButtonColors;
  badge: BadgeColors;
  text: TextColors;
  image: ImageColors;
  preview: PreviewColors;
  filter: FilterColors;
  tabBar: TabBarColors;
  map: MapColors;
  searchBar: SearchBarColors;
  toast: Record<ToastStyle, ToastColors>;
};
