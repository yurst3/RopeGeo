import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { DEFAULT_BADGE_SIZE } from "@/components/badges/Badge";
import type { UiScaleProfile } from "@/constants/uiScale/types";
import { useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { resolveGlobalIconSizeScale, resolveScalingBounds, resolvePreviewSpacingScale } from "@/utils/theme/resolvers";
import {
  computeStarRatingMetrics,
  resolveStarRatingIconBounds,
} from "@/utils/layout/starRatingLayout";

export const ROUTE_PREVIEW_CARD_MARGIN_H = 16;
export const ROUTE_PREVIEW_CARD_PADDING = 12;
export const ROUTE_PREVIEW_CARD_BORDER_RADIUS = 12;
/** How much of the next/previous preview card is visible beside the active slide. */
export const ROUTE_PREVIEW_SLIDE_PEEK = 8;
/**
 * Trailing margin between carousel slides. Combined with side inset
 * {@link ROUTE_PREVIEW_CARD_MARGIN_H}, leaves {@link ROUTE_PREVIEW_SLIDE_PEEK} of the neighbor visible.
 */
export const ROUTE_PREVIEW_SLIDE_MARGIN_RIGHT =
  ROUTE_PREVIEW_CARD_MARGIN_H - ROUTE_PREVIEW_SLIDE_PEEK;
export const ROUTE_PREVIEW_IMAGE_WIDTH_RATIO = 0.35;
export const ROUTE_PREVIEW_MAX_BADGES = 5;
export const ROUTE_PREVIEW_BADGE_GAP = 8;
export const ROUTE_PREVIEW_DEFAULT_BADGE_SCALE = 0.65;
/** Reserve space for sub-badge overhang on the trailing badge. */
export const ROUTE_PREVIEW_BADGE_WIDTH_SAFETY_MARGIN = 4;

/** Badges that must fit horizontally when font scale is at its preview maximum. */
export const ROUTE_PREVIEW_BADGE_MIN_VISIBLE_AT_MAX_SCALE = 3;

/** Reserve space so native layout does not exceed the clipped container. */
export const ROUTE_PREVIEW_TITLE_WIDTH_SAFETY_MARGIN = 4;
/** Extra space below the title for descenders (e.g. y, g). */
export const ROUTE_PREVIEW_TITLE_DESCENDER_PADDING = 2;
/** Vertical gap between all rows in the preview info column. */
export const ROUTE_PREVIEW_INFO_ROW_GAP = 4;

export const ROUTE_PREVIEW_LOCATION_MAX_LINES = 2;
export const ROUTE_PREVIEW_AKA_MAX_LINES = 1;
export const ROUTE_PREVIEW_LOCATION_WIDTH_SAFETY_MARGIN = 4;

export type RoutePreviewMetrics = {
  screenWidth: number;
  fontScale: number;
  cardWidth: number;
  imageWidth: number;
  infoContentWidth: number;
  badgeSize: number;
  badgeGap: number;
  badgeLabelFontSize: number;
  maxVisibleBadges: number;
  titleCapHeight: number;
  titleDescenderPadding: number;
  titleWidthSafetyMargin: number;
  locationMarginTopAfterTitle: number;
  locationWidthSafetyMargin: number;
  starRatingSize: number;
  starRatingFontSize: number;
  infoRowGap: number;
};

function computeLegacyBadgeSize(infoContentWidth: number): number {
  const badgesNeeded =
    ROUTE_PREVIEW_MAX_BADGES * DEFAULT_BADGE_SIZE +
    (ROUTE_PREVIEW_MAX_BADGES - 1) * ROUTE_PREVIEW_BADGE_GAP;
  const scale = Math.min(
    ROUTE_PREVIEW_DEFAULT_BADGE_SCALE,
    infoContentWidth / badgesNeeded,
  );
  return Math.round(DEFAULT_BADGE_SIZE * scale);
}

/** How many badges of the given size fit in the row without clipping. */
export function countRoutePreviewBadgesThatFit(
  containerWidth: number,
  badgeSize: number,
  badgeGap: number,
  maxCount: number,
): number {
  if (containerWidth <= 0 || badgeSize <= 0) {
    return maxCount;
  }
  let fit = 0;
  for (let count = 1; count <= maxCount; count++) {
    const width = count * badgeSize + (count - 1) * badgeGap;
    if (width <= containerWidth) {
      fit = count;
    } else {
      break;
    }
  }
  return fit;
}

/** Highest badge scale where at least `minVisible` badges fit in the info column. */
export function computeRoutePreviewBadgeMaxLayoutScale(
  infoContentWidth: number,
  minVisible = ROUTE_PREVIEW_BADGE_MIN_VISIBLE_AT_MAX_SCALE,
): number {
  if (infoContentWidth <= 0 || minVisible <= 0) {
    return 1;
  }

  const designBadgeSize =
    DEFAULT_BADGE_SIZE * ROUTE_PREVIEW_DEFAULT_BADGE_SCALE;
  let lo = 1;
  let hi = 3;

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const badgeSize = Math.round(designBadgeSize * mid);
    const badgeGap = Math.max(
      4,
      Math.round(ROUTE_PREVIEW_BADGE_GAP * (badgeSize / designBadgeSize)),
    );
    const availableWidth = Math.max(
      0,
      infoContentWidth - ROUTE_PREVIEW_BADGE_WIDTH_SAFETY_MARGIN * mid,
    );
    const fit = countRoutePreviewBadgesThatFit(
      availableWidth,
      badgeSize,
      badgeGap,
      minVisible,
    );

    if (fit >= minVisible) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return lo;
}

/** @deprecated Use {@link computeRoutePreviewBadgeMaxLayoutScale}. */
export const computeRoutePreviewBadgeMaxFontScale =
  computeRoutePreviewBadgeMaxLayoutScale;

function computeRoutePreviewBadgeLayout(
  infoContentWidth: number,
  iconScale: number,
): {
  badgeSize: number;
  badgeGap: number;
  maxVisibleBadges: number;
} {
  const designBadgeSize =
    DEFAULT_BADGE_SIZE * ROUTE_PREVIEW_DEFAULT_BADGE_SCALE;
  const maxLayoutScale =
    computeRoutePreviewBadgeMaxLayoutScale(infoContentWidth);
  const effectiveScale = Math.min(iconScale, maxLayoutScale);
  let badgeSize = Math.round(designBadgeSize * effectiveScale);
  let badgeGap = Math.max(
    4,
    Math.round(ROUTE_PREVIEW_BADGE_GAP * (badgeSize / designBadgeSize)),
  );
  let maxVisibleBadges = countRoutePreviewBadgesThatFit(
    Math.max(
      0,
      infoContentWidth -
        ROUTE_PREVIEW_BADGE_WIDTH_SAFETY_MARGIN * effectiveScale,
    ),
    badgeSize,
    badgeGap,
    ROUTE_PREVIEW_MAX_BADGES,
  );

  if (maxVisibleBadges < ROUTE_PREVIEW_MAX_BADGES) {
    if (iconScale <= 1) {
      badgeSize = computeLegacyBadgeSize(infoContentWidth);
      const badgeScale = badgeSize / DEFAULT_BADGE_SIZE;
      badgeGap = Math.max(
        4,
        Math.round(ROUTE_PREVIEW_BADGE_GAP * badgeScale),
      );
      maxVisibleBadges = ROUTE_PREVIEW_MAX_BADGES;
    } else if (maxVisibleBadges === 0) {
      badgeSize = Math.min(badgeSize, infoContentWidth);
      maxVisibleBadges = badgeSize > 0 ? 1 : 0;
    }
  }

  return { badgeSize, badgeGap, maxVisibleBadges };
}

export function getRoutePreviewMetrics(
  screenWidth: number,
  fontScale = 1,
  sizeProfile: UiScaleProfile,
): RoutePreviewMetrics {
  const { global, preview, pageScreen } = sizeProfile;
  const iconScale = resolveGlobalIconSizeScale(global, fontScale);
  const cardWidth = screenWidth - ROUTE_PREVIEW_CARD_MARGIN_H * 2;
  const imageWidth = cardWidth * ROUTE_PREVIEW_IMAGE_WIDTH_RATIO;
  const infoContentWidth =
    cardWidth - imageWidth - ROUTE_PREVIEW_CARD_PADDING * 2;
  const { badgeSize, badgeGap, maxVisibleBadges } =
    computeRoutePreviewBadgeLayout(infoContentWidth, iconScale);
  const badgeLabelBase = resolveScalingBounds(
    pageScreen.text.badgeLabel,
    global,
    fontScale,
  ).maxFontSize;
  const badgeLabelFontSize = Math.max(
    10,
    Math.round(badgeLabelBase * (badgeSize / DEFAULT_BADGE_SIZE)),
  );
  const titleBounds = resolveScalingBounds(
    preview.text.title,
    global,
    fontScale,
  );
  const spacingScale = resolvePreviewSpacingScale(global, fontScale);
  const titleDescenderPadding =
    ROUTE_PREVIEW_TITLE_DESCENDER_PADDING * spacingScale;
  const titleWidthSafetyMargin =
    ROUTE_PREVIEW_TITLE_WIDTH_SAFETY_MARGIN * spacingScale;
  const locationWidthSafetyMargin =
    ROUTE_PREVIEW_LOCATION_WIDTH_SAFETY_MARGIN * spacingScale;
  const locationMarginTopAfterTitle = -titleDescenderPadding;
  const starRatingBounds = resolveStarRatingIconBounds(
    preview.text.starRating,
    global,
    fontScale,
  );
  const { size: starRatingSize, fontSize: starRatingFontSize } =
    computeStarRatingMetrics(infoContentWidth, starRatingBounds);
  const infoRowGap = ROUTE_PREVIEW_INFO_ROW_GAP * spacingScale;

  return {
    screenWidth,
    fontScale,
    cardWidth,
    imageWidth,
    infoContentWidth,
    badgeSize,
    badgeGap,
    badgeLabelFontSize,
    maxVisibleBadges,
    titleCapHeight: titleBounds.maxFontSize + titleDescenderPadding,
    titleDescenderPadding,
    titleWidthSafetyMargin,
    locationMarginTopAfterTitle,
    locationWidthSafetyMargin,
    starRatingSize,
    starRatingFontSize,
    infoRowGap,
  };
}

export function useRoutePreviewMetrics(): RoutePreviewMetrics {
  const uiScale = useUiScale();
  const { width, fontScale } = useWindowDimensions();
  return useMemo(
    () => getRoutePreviewMetrics(width, fontScale, uiScale),
    [width, fontScale, uiScale],
  );
}
