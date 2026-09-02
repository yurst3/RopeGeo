import { PlaceholderBadge } from "@/components/badges/PlaceholderBadge";
import { BadgeLayoutProvider } from "@/components/badges/Badge";
import { ConstantText } from "@/components/text/ConstantText";
import { StarRating } from "@/components/starRating/StarRating";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  ROUTE_PREVIEW_CARD_BORDER_RADIUS,
  ROUTE_PREVIEW_CARD_MARGIN_H,
  ROUTE_PREVIEW_CARD_PADDING,
  useRoutePreviewMetrics,
} from "@/utils/layout/routePreviewLayout";
import { standardButtonShadowStyle } from "@/utils/theme/standardButtonShadow";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

export type RoutePreviewPlaceholderProps = {
  /** When set, shown instead of the title skeleton bar (loading vs error, like Ropewiki placeholders). */
  errorMessage?: string;
};

export function RoutePreviewPlaceholder({
  errorMessage,
}: RoutePreviewPlaceholderProps) {
  const themeColors = useColorTheme();
  const metrics = useRoutePreviewMetrics();
  const uiScale = useUiScale();
  const style = useTextStyle();
  const { text, image, background, placeholder, loadingIndicator, button } = themeColors;
  const isError = errorMessage != null && errorMessage !== "";

  return (
    <View style={styles.outer}>
      <BadgeLayoutProvider
        size={metrics.badgeSize}
        labelFontSize={metrics.badgeLabelFontSize}
        allowLabelFontScaling={false}
      >
        <View
          style={[
            styles.cardShadow,
            standardButtonShadowStyle(button.shadowColor),
            { width: metrics.cardWidth },
          ]}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: background,
              },
            ]}
          >
          <View style={styles.cardContent}>
            <View
              style={[
                styles.imageContainer,
                {
                  width: metrics.imageWidth,
                  backgroundColor: image.background,
                },
              ]}
            >
              {!isError ? (
                <View
                  style={[
                    styles.imageLoadingOverlay,
                    { backgroundColor: image.background },
                  ]}
                >
                  <ActivityIndicator size="small" color={loadingIndicator} />
                </View>
              ) : null}
            </View>
            <View style={styles.info}>
              <View style={[styles.infoStack, { gap: metrics.infoRowGap }]}>
                <StarRating
                  rating={0}
                  count={0}
                  size={metrics.starRatingSize}
                  labelTypography={style.preview.starRating}
                  labelFontSize={metrics.starRatingFontSize}
                  allowFontScaling={false}
                  placeholderColor
                  style={styles.starRatingRow}
                  textStyle={styles.starRatingText}
                />
                {isError ? (
                  <ConstantText
                    size={uiScale.toast.text.message}
                    typography={style.toast.message}
                    style={[styles.errorMessage, { color: text.error }]}
                    numberOfLines={4}
                  >
                    {errorMessage}
                  </ConstantText>
                ) : (
                  <View
                    style={[
                      styles.titlePlaceholder,
                      {
                        backgroundColor: placeholder,
                        height: metrics.titleCapHeight,
                      },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.locationPlaceholderWrap,
                    { marginTop: metrics.locationMarginTopAfterTitle },
                  ]}
                >
                  <View style={styles.regionPlaceholderRow}>
                    <View
                      style={[styles.regionBar, { width: "40%", backgroundColor: placeholder }]}
                    />
                    <ConstantText
                      size={uiScale.preview.text.other}
                      typography={style.preview.other}
                      style={[styles.regionDot, { color: text.tertiary }]}
                    >
                      {" • "}
                    </ConstantText>
                    <View
                      style={[styles.regionBar, { width: "40%", backgroundColor: placeholder }]}
                    />
                  </View>
                  <View style={styles.regionPlaceholderRow}>
                    <View
                      style={[styles.regionBar, { width: "30%", backgroundColor: placeholder }]}
                    />
                  </View>
                </View>
                <View style={[styles.badgePlaceholderRow, { gap: metrics.badgeGap }]}>
                  {Array.from({ length: metrics.maxVisibleBadges }, (_, i) => (
                    <PlaceholderBadge key={i} size={metrics.badgeSize} />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
        </View>
      </BadgeLayoutProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: ROUTE_PREVIEW_CARD_MARGIN_H,
    marginBottom: 8,
  },
  cardShadow: {
    borderRadius: ROUTE_PREVIEW_CARD_BORDER_RADIUS,
  },
  card: {
    borderRadius: ROUTE_PREVIEW_CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
  },
  imageContainer: {
    alignSelf: "stretch",
    borderTopLeftRadius: ROUTE_PREVIEW_CARD_BORDER_RADIUS,
    borderBottomLeftRadius: ROUTE_PREVIEW_CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  info: {
    flex: 1,
    minWidth: 0,
    paddingTop: ROUTE_PREVIEW_CARD_PADDING,
    paddingBottom: ROUTE_PREVIEW_CARD_PADDING,
    paddingHorizontal: ROUTE_PREVIEW_CARD_PADDING,
    overflow: "hidden",
  },
  infoStack: {
    alignSelf: "stretch",
    justifyContent: "flex-start",
  },
  starRatingRow: {
    gap: 2,
  },
  starRatingText: {
    marginLeft: 6,
  },
  titlePlaceholder: {
    width: "66%",
    alignSelf: "flex-start",
    borderRadius: 4,
  },
  errorMessage: {
    alignSelf: "stretch",
  },
  locationPlaceholderWrap: {
    alignSelf: "stretch",
    gap: 4,
  },
  regionPlaceholderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  regionBar: {
    height: 10,
    borderRadius: 4,
  },
  regionDot: {},
  badgePlaceholderRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    flexShrink: 0,
    alignItems: "center",
  },
});
