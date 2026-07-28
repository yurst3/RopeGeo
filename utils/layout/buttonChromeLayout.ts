import { getSearchBarMetrics } from "@/utils/search/searchBarMetrics";
import {
  HEADER_BUTTON_SIZE,
  MAP_BUTTON_SIZE,
  MAP_HEADER_ROW_TOP_INSET,
} from "@/utils/minimap/fullScreenMapLayout";
import { useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import type { UiScaleProfile } from "@/constants/uiScale/types";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
  resolveButtonBackgroundScale,
  resolveButtonDimensions,
} from "@/utils/theme/resolvers/resolveUiScale";

/** Base gap between adjacent chrome buttons (multiplied by resolved button `background`). */
export const BASE_CHROME_GAP = 8;

export function resolveChromeGap(
  backgroundScale: number,
  baseGap = BASE_CHROME_GAP,
): number {
  return Math.round(baseGap * backgroundScale);
}

export function resolveChromeGapFromSpec(
  uiScale: UiScaleProfile,
  buttonKey: keyof UiScaleProfile["common"]["buttons"],
  fontScale: number,
  baseGap = BASE_CHROME_GAP,
): number {
  const spec = uiScale.common.buttons[buttonKey];
  return resolveChromeGap(
    resolveButtonBackgroundScale(spec, uiScale.global, fontScale),
    baseGap,
  );
}

/** Base distance from screen edge to expanded minimap header / button stack. */
export const BASE_CHROME_EDGE_INSET = 16;
/** Base vertical padding inside the expanded minimap title pill. */
export const BASE_TITLE_BAR_PADDING_VERTICAL = 12;
/** Base horizontal padding inside the expanded minimap title pill. */
export const BASE_TITLE_BAR_PADDING_HORIZONTAL = 14;
/** Base gap above the tab bar for expanded minimap bottom overlays. */
export const EXPANDED_MINIMAP_OVERLAY_BOTTOM_GAP = 12;

export type HeaderChromeLayout = {
  buttonSize: number;
  gap: number;
  sideSlotWidth: number;
  rowTopInset: number;
  buttonWrapHeight: number;
  /** Distance from screen edge to the header row (scales with button background). */
  edgeInset: number;
  titleBarPaddingVertical: number;
  titleBarPaddingHorizontal: number;
};

export function resolveHeaderChromeLayout(
  uiScale: UiScaleProfile,
  fontScale: number,
): HeaderChromeLayout {
  const spec = uiScale.common.buttons.back;
  const backgroundScale = resolveButtonBackgroundScale(
    spec,
    uiScale.global,
    fontScale,
  );
  const buttonSize = Math.round(HEADER_BUTTON_SIZE * backgroundScale);
  const gap = resolveChromeGap(backgroundScale);
  return {
    buttonSize,
    gap,
    sideSlotWidth: buttonSize + gap,
    rowTopInset: resolveChromeGap(backgroundScale, MAP_HEADER_ROW_TOP_INSET),
    buttonWrapHeight: buttonSize,
    edgeInset: resolveChromeGap(backgroundScale, BASE_CHROME_EDGE_INSET),
    titleBarPaddingVertical: resolveChromeGap(
      backgroundScale,
      BASE_TITLE_BAR_PADDING_VERTICAL,
    ),
    titleBarPaddingHorizontal: resolveChromeGap(
      backgroundScale,
      BASE_TITLE_BAR_PADDING_HORIZONTAL,
    ),
  };
}

export type MapButtonChromeLayout = {
  buttonSize: number;
  gap: number;
  stackMinWidth: number;
  topOffsetBelowHeader: number;
};

export function resolveMapButtonChromeLayout(
  uiScale: UiScaleProfile,
  fontScale: number,
): MapButtonChromeLayout {
  const headerSpec = uiScale.common.buttons.back;
  const mapSpec = uiScale.map.buttons.resetCameraToPosition;
  const headerBg = resolveButtonBackgroundScale(
    headerSpec,
    uiScale.global,
    fontScale,
  );
  const mapBg = resolveButtonBackgroundScale(mapSpec, uiScale.global, fontScale);
  const headerSize = Math.round(HEADER_BUTTON_SIZE * headerBg);
  const mapSize = Math.round(MAP_BUTTON_SIZE * mapBg);
  const headerGap = resolveChromeGap(headerBg);
  const mapGap = resolveChromeGap(mapBg);
  const rowTopInset = resolveChromeGap(headerBg, MAP_HEADER_ROW_TOP_INSET);
  return {
    buttonSize: mapSize,
    gap: mapGap,
    stackMinWidth: mapSize,
    topOffsetBelowHeader: rowTopInset + headerSize + headerGap,
  };
}

export type ExploreHeaderLayout = HeaderChromeLayout & {
  searchBarRightClearance: number;
  stackMinWidth: number;
};

export function resolveExploreHeaderLayout(
  uiScale: UiScaleProfile,
  fontScale: number,
): ExploreHeaderLayout {
  const header = resolveHeaderChromeLayout(uiScale, fontScale);
  const map = resolveMapButtonChromeLayout(uiScale, fontScale);
  return {
    ...header,
    stackMinWidth: map.stackMinWidth,
    searchBarRightClearance: map.stackMinWidth + map.gap,
  };
}

/** Design gap between search chrome row bottom and stacked toasts / scroll content. */
export const SEARCH_CHROME_GAP_BELOW_DESIGN = 12;

export type SearchChromeStackedLayout = {
  rowTop: number;
  searchBarHeight: number;
  chromeRowHeight: number;
  gapBelowChrome: number;
  /** Distance from safe-area top to toast anchor / scroll content inset (includes gap). */
  stackedAnchorOffset: number;
};

/**
 * Layout for explore / search / saved headers: search bar row + optional side buttons.
 * Matches header `top` + vertically centered row height used on those screens.
 */
export function resolveSearchChromeStackedLayout(
  uiScale: UiScaleProfile,
  fontScale: number,
  baseGapBelowChrome = SEARCH_CHROME_GAP_BELOW_DESIGN,
): SearchChromeStackedLayout {
  const header = resolveHeaderChromeLayout(uiScale, fontScale);
  const search = getSearchBarMetrics(fontScale, uiScale);
  const chromeRowHeight = Math.max(search.height, header.buttonWrapHeight);
  const backSpec = uiScale.common.buttons.back;
  const backgroundScale = resolveButtonBackgroundScale(
    backSpec,
    uiScale.global,
    fontScale,
  );
  const gapBelowChrome = Math.round(baseGapBelowChrome * backgroundScale);
  const stackedAnchorOffset = Math.round(
    header.rowTopInset + chromeRowHeight + gapBelowChrome,
  );
  return {
    rowTop: header.rowTopInset,
    searchBarHeight: search.height,
    chromeRowHeight,
    gapBelowChrome,
    stackedAnchorOffset,
  };
}

export function resolveStackedToastBaseOffsetBelowSafeTop(
  uiScale: UiScaleProfile,
  fontScale: number,
): number {
  return resolveSearchChromeStackedLayout(uiScale, fontScale).stackedAnchorOffset;
}

export function resolveToastHorizontalInset(
  uiScale: UiScaleProfile,
  fontScale: number,
  edgeMargin = 16,
): number {
  const header = resolveHeaderChromeLayout(uiScale, fontScale);
  return edgeMargin + header.sideSlotWidth;
}

export type RoutePreviewFloaterLayout = {
  floaterSize: number;
  floaterGap: number;
  floaterTopOffset: number;
};

export function resolveRoutePreviewFloaterLayout(
  uiScale: UiScaleProfile,
  fontScale: number,
): RoutePreviewFloaterLayout {
  const spec = uiScale.common.buttons.externalLink;
  const { size } = resolveButtonDimensions(
    spec,
    MAP_BUTTON_SIZE,
    uiScale.global,
    fontScale,
  );
  const gap = resolveChromeGapFromSpec(uiScale, "externalLink", fontScale);
  return {
    floaterSize: size,
    floaterGap: gap,
    floaterTopOffset: -(size + gap),
  };
}

export function expandedMiniMapButtonStackTopScaled(
  safeTop: number,
  boundsResetButtonVisible: boolean,
  uiScale: UiScaleProfile,
  fontScale: number,
  options?: { otherHeaderRowActionVisible?: boolean },
): number {
  const header = resolveHeaderChromeLayout(uiScale, fontScale);
  const map = resolveMapButtonChromeLayout(uiScale, fontScale);
  const shiftUpWhenBoundsHidden =
    !boundsResetButtonVisible && !options?.otherHeaderRowActionVisible;
  const rowTop = shiftUpWhenBoundsHidden
    ? header.rowTopInset
    : map.topOffsetBelowHeader;
  // Center the (often larger) map buttons on the header button row when sharing that row.
  const alignToHeaderRow = shiftUpWhenBoundsHidden
    ? (header.buttonWrapHeight - map.buttonSize) / 2
    : 0;
  return safeTop + rowTop + alignToHeaderRow;
}

/**
 * Top offset for a map {@link ButtonStack} that shares the expanded minimap header row
 * (bounds/compass/user controls aligned with the back button).
 */
export function expandedMiniMapHeaderRowStackTop(
  headerTop: number,
  header: HeaderChromeLayout,
  map: MapButtonChromeLayout,
): number {
  return headerTop + (header.buttonWrapHeight - map.buttonSize) / 2;
}

/** Bottom offset for legend / relevant-info overlays above the tab bar. */
export function expandedMiniMapOverlayBottomOffset(
  tabBarHeight: number,
  uiScale: UiScaleProfile,
  fontScale: number,
): number {
  return (
    tabBarHeight +
    resolveChromeGapFromSpec(
      uiScale,
      "back",
      fontScale,
      EXPANDED_MINIMAP_OVERLAY_BOTTOM_GAP,
    )
  );
}

/** Horizontal inset for bottom overlays (safe-area edge + scaled gap). */
export function expandedMiniMapOverlayEdgeGap(
  uiScale: UiScaleProfile,
  fontScale: number,
): number {
  return resolveChromeGapFromSpec(
    uiScale,
    "back",
    fontScale,
    EXPANDED_MINIMAP_OVERLAY_BOTTOM_GAP,
  );
}

export function boundsPaddingForFullScreenMapScaled(
  insets: { top: number; bottom: number },
  uiScale: UiScaleProfile,
  fontScale: number,
) {
  const map = resolveMapButtonChromeLayout(uiScale, fontScale);
  return {
    paddingTop: insets.top + map.topOffsetBelowHeader + 24,
    paddingBottom: insets.bottom + 40,
    paddingLeft: 20,
    paddingRight: 20,
  } as const;
}

export function resolvePageHeaderStackLayout(
  uiScale: UiScaleProfile,
  fontScale: number,
) {
  const header = resolveHeaderChromeLayout(uiScale, fontScale);
  return {
    rowTop: header.rowTopInset,
    circleSize: header.buttonSize,
    stackGap: header.gap,
  };
}

export function useHeaderChromeLayout(): HeaderChromeLayout {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveHeaderChromeLayout(uiScale, fontScale),
    [uiScale, fontScale],
  );
}

export function useMapButtonChromeLayout(): MapButtonChromeLayout {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveMapButtonChromeLayout(uiScale, fontScale),
    [uiScale, fontScale],
  );
}

export function useExploreHeaderLayout(): ExploreHeaderLayout {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveExploreHeaderLayout(uiScale, fontScale),
    [uiScale, fontScale],
  );
}

export function useSearchChromeStackedLayout(): SearchChromeStackedLayout {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveSearchChromeStackedLayout(uiScale, fontScale),
    [uiScale, fontScale],
  );
}

export function useRoutePreviewFloaterLayout(): RoutePreviewFloaterLayout {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => resolveRoutePreviewFloaterLayout(uiScale, fontScale),
    [uiScale, fontScale],
  );
}

export function useToastChromeLayout() {
  const uiScale = useUiScale();
  const { fontScale } = useWindowDimensions();
  return useMemo(
    () => ({
      horizontalInset: resolveToastHorizontalInset(uiScale, fontScale),
      stackedOffsetBelowSafeTop: resolveStackedToastBaseOffsetBelowSafeTop(
        uiScale,
        fontScale,
      ),
      compactHeaderRowTop: resolveHeaderChromeLayout(uiScale, fontScale)
        .rowTopInset,
    }),
    [uiScale, fontScale],
  );
}
