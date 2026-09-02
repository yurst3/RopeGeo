import { BadgeLayoutProvider } from "@/components/badges/Badge";
import {
  ROUTE_PREVIEW_CARD_BORDER_RADIUS,
  ROUTE_PREVIEW_CARD_MARGIN_H,
  ROUTE_PREVIEW_CARD_PADDING,
  ROUTE_PREVIEW_SLIDE_MARGIN_RIGHT,
  useRoutePreviewMetrics,
} from "@/utils/layout/routePreviewLayout";
import { SavedPageGlyph } from "@/components/buttons/standard/SavedPageGlyph";
import { useNetworkRequestToasts } from "@/utils/toast/useNetworkRequestToasts";
import { TOAST_KEY_ROUTE_PREVIEW_ERROR } from "@/constants/toasts/toastArchetypes";
import { useNetworkStatus } from "@/context/app/NetworkStatusContext";
import { loadDownloadedRoutePreviewsForPage } from "@/utils/offline/downloadedRoutePreviewsStorage";
import { REQUEST_TIMEOUT_SECONDS } from "@/utils/network/requestTimeout";
import {
  Method,
  RopeGeoDataLoader,
  Service,
} from "ropegeo-common/components";
import { useSavedPages } from "@/context/data/SavedPagesContext";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import Animated, {
  type AnimatedStyle,
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ExternalLinkButton } from "@/components/buttons/standard/ExternalLinkButton";
import { StarRating } from "@/components/starRating/StarRating";
import { ConstantText } from "@/components/text/ConstantText";
import {
  AcaDifficultyRating,
  type OnlinePagePreview,
  type OfflinePagePreview,
  RouteType,
} from "ropegeo-common/models";
import { BadgeRow } from "./BadgeRow";
import { RoutePreviewAka, RoutePreviewLocation, RoutePreviewTitle } from "./RoutePreviewText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useRoutePreviewFloaterLayout } from "@/utils/layout/buttonChromeLayout";
import { RoutePreviewPlaceholder } from "./RoutePreviewPlaceholder";
import { standardButtonShadowStyle } from "@/utils/theme/standardButtonShadow";

const NO_IMAGE_ICON_SIZE = 36;

const SLIDE_ENTER_MS = 320;
const SLIDE_EXIT_MS = 260;
const slideEnterEasing = Easing.out(Easing.cubic);
const slideExitEasing = Easing.in(Easing.cubic);

/**
 * Placeholder path param while no route is focused. {@link RopeGeoDataLoader} stays mounted with
 * `offlineData={null}` so the network effect never runs; this value is never requested.
 */
const ROUTE_PREVIEW_LOADER_IDLE_ROUTE_ID = "__ropegeo_route_preview_inactive__";

type PreviewCardData = OnlinePagePreview | OfflinePagePreview;

function hasDifficultyInfo(difficulty: PreviewCardData["difficultyRating"]): boolean {
  if (!(difficulty instanceof AcaDifficultyRating)) return false;
  return (
    difficulty.technical != null ||
    difficulty.water != null ||
    difficulty.time != null ||
    difficulty.getEffectiveRiskForDisplay() != null
  );
}

function showBadges(
  preview: PreviewCardData,
  routeType?: RouteType | null,
): boolean {
  return (
    preview.permit != null ||
    routeType === RouteType.Cave ||
    routeType === RouteType.POI ||
    hasDifficultyInfo(preview.difficultyRating)
  );
}

function SinglePreviewCard({
  preview,
  routeType = null,
  onPress,
  fillCarouselHeight = false,
}: {
  preview: PreviewCardData;
  routeType?: RouteType | null;
  onPress?: (preview: PreviewCardData) => void;
  /** Stretch to the carousel row height (tallest sibling) via flex. */
  fillCarouselHeight?: boolean;
}) {
  const themeColors = useColorTheme();
  const textStyle = useTextStyle();
  const metrics = useRoutePreviewMetrics();
  const { text, image, background, button } = themeColors;
  const previewImageUri =
    preview.fetchType === "online" ? preview.imageUrl : preview.downloadedImagePath;
  const [imageLoading, setImageLoading] = useState(!!previewImageUri);
  const rating = preview.rating ?? 0;
  const ratingCount = preview.ratingCount ?? 0;
  const location = preview.regions?.length
    ? preview.regions.slice(0, 3).join(" • ")
    : "";
  const akaNames = preview.aka?.length ? preview.aka : [];
  const hasBadges = showBadges(preview, routeType);

  const cardContent = (
    <BadgeLayoutProvider
      size={metrics.badgeSize}
      labelFontSize={metrics.badgeLabelFontSize}
      allowLabelFontScaling={false}
    >
      <View
        style={[
          styles.cardShadow,
          standardButtonShadowStyle(button.shadowColor),
          {
            width: metrics.cardWidth,
          },
          fillCarouselHeight ? styles.cardFillCarousel : null,
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: background,
            },
            fillCarouselHeight ? styles.cardFillCarousel : null,
          ]}
        >
        <View
          style={[
            styles.cardContent,
            fillCarouselHeight ? styles.cardContentFill : null,
          ]}
        >
          <View
            style={[
              styles.imageContainer,
              {
                width: metrics.imageWidth,
                backgroundColor: image.background,
              },
            ]}
          >
          {previewImageUri ? (
            <>
              {imageLoading && (
                <View
                  style={[
                    styles.imageLoadingOverlay,
                    { backgroundColor: image.background },
                  ]}
                >
                  <ActivityIndicator size="small" color={themeColors.loadingIndicator} />
                </View>
              )}
              <Image
                source={previewImageUri}
                style={styles.image}
                contentFit="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
            </>
          ) : (
            <View
              style={[styles.noImageWrap, { backgroundColor: image.background }]}
            >
              <Image
                source={require("@/assets/images/icons/noImage.png")}
                style={[
                  styles.noImageIcon,
                  {
                    width: NO_IMAGE_ICON_SIZE,
                    height: NO_IMAGE_ICON_SIZE,
                    tintColor: image.missingIcon,
                  },
                ]}
                contentFit="contain"
              />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <View style={[styles.infoStack, { gap: metrics.infoRowGap }]}>
            <StarRating
              rating={rating}
              count={ratingCount}
              size={metrics.starRatingSize}
              labelTypography={textStyle.preview.starRating}
              labelFontSize={metrics.starRatingFontSize}
              allowFontScaling={false}
              style={styles.starRatingRow}
              textStyle={styles.starRatingText}
            />
            <RoutePreviewTitle title={preview.title} color={text.primary} />
            {akaNames.length > 0 ? (
              <RoutePreviewAka aka={akaNames} color={text.secondary} />
            ) : null}
            {location ? (
              <RoutePreviewLocation
                location={location}
                color={text.secondary}
                compactBelowTitle={akaNames.length === 0}
              />
            ) : null}
            {hasBadges ? (
              <BadgeRow
                difficultyRating={preview.difficultyRating}
                permit={preview.permit}
                routeType={routeType}
                badgeGap={metrics.badgeGap}
                maxVisibleBadges={metrics.maxVisibleBadges}
              />
            ) : null}
          </View>
        </View>
      </View>
      </View>
      </View>
    </BadgeLayoutProvider>
  );

  if (onPress != null) {
    return (
      <Pressable
        onPress={() => onPress(preview)}
        style={({ pressed }) => [
          { opacity: pressed ? 0.9 : 1 },
          fillCarouselHeight ? styles.cardFillCarousel : null,
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }
  return cardContent;
}

function CurrentPreviewNotifier({
  loading,
  data,
  currentIndex,
  onCurrentPreviewChange,
}: {
  loading: boolean;
  data: PreviewCardData[] | null;
  currentIndex: number;
  onCurrentPreviewChange?: (preview: PreviewCardData | null) => void;
}) {
  useEffect(() => {
    if (!onCurrentPreviewChange) return;
    if (loading || !data || data.length === 0) {
      onCurrentPreviewChange(null);
    } else {
      const preview = data[currentIndex] ?? data[0];
      onCurrentPreviewChange(preview);
    }
  }, [loading, data, currentIndex, onCurrentPreviewChange]);
  return null;
}

type VisibleRouteSnapshot = { id: string; routeType: RouteType | null };

export type RoutePreviewProps = {
  /** When null, the preview slides out and unmounts after the exit animation. */
  routeId: string | null;
  /** Route type from map/list (e.g. Cave, POI) so the preview can show the correct badge. */
  routeType?: RouteType | null;
  /** Layout for bottom-docked previews (e.g. absolute + safe-area padding). */
  containerStyle?: StyleProp<ViewStyle>;
  /** Called when the currently viewed preview page changes (initial load or swipe). Use to sync mapData for TrailsLayer. */
  onCurrentPreviewChange?: (preview: PreviewCardData | null) => void;
  /** Called when the user presses the preview card. Receives the tapped preview. */
  onPreviewPress?: (preview: PreviewCardData) => void;
};

function RoutePreviewDataView({
  data,
  loading,
  routeType,
  onPreviewPress,
  onCurrentPreviewChange,
}: {
  data: PreviewCardData[];
  loading: boolean;
  routeType?: RouteType | null;
  onPreviewPress?: (preview: PreviewCardData) => void;
  onCurrentPreviewChange?: (preview: PreviewCardData | null) => void;
}) {
  const themeColors = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const metrics = useRoutePreviewMetrics();
  const floaterLayout = useRoutePreviewFloaterLayout();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isSaved } = useSavedPages();

  const slideItemLength = metrics.cardWidth + ROUTE_PREVIEW_SLIDE_MARGIN_RIGHT;

  useEffect(() => {
    setCurrentIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [data]);

  const currentPreview =
    data.length > 0
      ? data.length === 1
        ? data[0]
        : data[Math.min(currentIndex, data.length - 1)] ?? data[0]
      : null;
  const showExternalLink =
    currentPreview?.source === "ropewiki" &&
    currentPreview?.externalLink != null;

  return (
    <View style={styles.previewWrapper}>
      <CurrentPreviewNotifier
        loading={loading}
        data={data.length > 0 ? data : null}
        currentIndex={currentIndex}
        onCurrentPreviewChange={onCurrentPreviewChange}
      />
      {currentPreview != null && isSaved(currentPreview.id) && (
        <View
          style={[
            styles.savedGlyphWrap,
            {
              top: floaterLayout.floaterTopOffset,
              width: floaterLayout.floaterSize,
              height: floaterLayout.floaterSize,
            },
          ]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.savedGlyphCircle,
              {
                width: floaterLayout.floaterSize,
                height: floaterLayout.floaterSize,
                borderRadius: floaterLayout.floaterSize / 2,
                backgroundColor: themeColors.background,
                ...standardButtonShadowStyle(themeColors.button.shadowColor),
              },
            ]}
            pointerEvents="none"
          >
            <SavedPageGlyph isSaved />
          </View>
        </View>
      )}
      {showExternalLink && currentPreview.externalLink != null && (
          <View
            style={[
              styles.externalLinkButtonWrap,
              { top: floaterLayout.floaterTopOffset },
            ]}
          >
            <ExternalLinkButton
              icon={require("@/assets/images/icons/ropewiki.png")}
              link={currentPreview.externalLink}
              accessibilityLabel="Open on RopeWiki"
            />
          </View>
        )}
      {data.length === 1 ? (
        <View style={styles.outer}>
          <SinglePreviewCard
            preview={data[0]}
            routeType={routeType}
            onPress={onPreviewPress ?? undefined}
          />
        </View>
      ) : (
        <View style={styles.outerCarousel}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={slideItemLength}
            snapToAlignment="start"
            disableIntervalMomentum
            onMomentumScrollEnd={(e) => {
              const i = Math.round(
                e.nativeEvent.contentOffset.x / slideItemLength,
              );
              setCurrentIndex(
                Math.max(0, Math.min(i, data.length - 1)),
              );
            }}
            contentContainerStyle={styles.scrollContent}
          >
            {data.map((preview) => (
              <View
                key={preview.id}
                style={[
                  styles.carouselSlide,
                  {
                    width: metrics.cardWidth,
                    marginRight: ROUTE_PREVIEW_SLIDE_MARGIN_RIGHT,
                  },
                ]}
              >
                <SinglePreviewCard
                  preview={preview}
                  routeType={routeType}
                  onPress={onPreviewPress ?? undefined}
                  fillCarouselHeight
                />
              </View>
            ))}
          </ScrollView>
          <View
            style={styles.pageIndex}
            pointerEvents="none"
            accessibilityLabel={`Page ${currentIndex + 1} of ${data.length}`}
          >
            <ConstantText
              size={uiScale.pageScreen.text.metaData}
              typography={textStyle.pageScreen.metaData}
              style={[
                styles.pageIndexText,
                {
                  color: themeColors.image.text,
                  backgroundColor: themeColors.image.textBackground,
                },
              ]}
            >
              {`(${currentIndex + 1}/${data.length})`}
            </ConstantText>
          </View>
        </View>
      )}
    </View>
  );
}

function RoutePreviewInner({
  pipelineActive,
  routeId,
  routeType,
  onPreviewPress,
  onCurrentPreviewChange,
  data,
  errors,
  timeoutCountdown,
  onRetryRequest,
  slideWrapperStyle,
  slideMotionStyle,
}: {
  /** When false, the loader is idle; render no preview UI (collapsed shell). */
  pipelineActive: boolean;
  routeId: string;
  routeType?: RouteType | null;
  onPreviewPress?: (preview: PreviewCardData) => void;
  onCurrentPreviewChange?: (preview: PreviewCardData | null) => void;
  data: OnlinePagePreview[] | null;
  errors: Error | null;
  timeoutCountdown: number | null;
  onRetryRequest: () => void;
  slideWrapperStyle?: StyleProp<ViewStyle>;
  slideMotionStyle: AnimatedStyle<ViewStyle>;
}) {
  useNetworkRequestToasts({
    errors,
    timeoutCountdown,
    resetKey: routeId,
    watchOffline: false,
    errorToastKey: TOAST_KEY_ROUTE_PREVIEW_ERROR,
    errorToastTitle: "Error loading route preview",
    incrementErrorMultipleOnCollision: true,
    onRetryRequest,
  });

  if (!pipelineActive) {
    return (
      <Animated.View
        style={[
          slideWrapperStyle,
          slideMotionStyle,
          routePreviewShellStyles.idleShell,
        ]}
        pointerEvents="none"
        collapsable
      />
    );
  }

  let body: ReactElement;
  if (data == null) {
    body = <RoutePreviewPlaceholder errorMessage={errors?.message} />;
  } else if (data.length === 0) {
    body = (
      <RoutePreviewPlaceholder errorMessage="No page previews for this route" />
    );
  } else {
    body = (
      <RoutePreviewDataView
        data={data}
        loading={false}
        routeType={routeType}
        onPreviewPress={onPreviewPress}
        onCurrentPreviewChange={onCurrentPreviewChange}
      />
    );
  }

  return (
    <Animated.View
      style={[slideWrapperStyle, slideMotionStyle]}
      pointerEvents="box-none"
    >
      {body}
    </Animated.View>
  );
}

export function RoutePreview({
  routeId,
  routeType = null,
  containerStyle,
  onCurrentPreviewChange,
  onPreviewPress,
}: RoutePreviewProps) {
  const { isOnline } = useNetworkStatus();
  const { height: windowHeight } = useWindowDimensions();
  const slideDistance = useMemo(
    () => Math.min(Math.round(windowHeight * 0.42), 420),
    [windowHeight],
  );

  const [visible, setVisible] = useState<VisibleRouteSnapshot | null>(null);
  const translateY = useSharedValue(slideDistance);
  const prevFocusedRef = useRef<string | null>(null);
  const exitStartedRef = useRef(false);
  const visibleRef = useRef<VisibleRouteSnapshot | null>(null);
  visibleRef.current = visible;
  const routeIdRef = useRef(routeId);
  routeIdRef.current = routeId;

  /** Runs on JS after slide-out timing; only hides if still unfocused (avoids racing a new focus). */
  const onSlideOutComplete = useCallback(() => {
    exitStartedRef.current = false;
    if (routeIdRef.current != null) {
      return;
    }
    setVisible(null);
  }, []);

  useEffect(() => {
    if (routeId != null) {
      cancelAnimation(translateY);
      exitStartedRef.current = false;
      const previous = prevFocusedRef.current;
      prevFocusedRef.current = routeId;
      setVisible({ id: routeId, routeType });

      if (previous === null) {
        translateY.value = slideDistance;
        translateY.value = withTiming(0, {
          duration: SLIDE_ENTER_MS,
          easing: slideEnterEasing,
        });
      } else {
        translateY.value = 0;
      }
      return;
    }

    prevFocusedRef.current = null;
    if (visibleRef.current == null) {
      exitStartedRef.current = false;
      return;
    }
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;
    translateY.value = withTiming(
      slideDistance,
      { duration: SLIDE_EXIT_MS, easing: slideExitEasing },
      () => {
        runOnJS(onSlideOutComplete)();
      },
    );
  }, [routeId, routeType, slideDistance, onSlideOutComplete]);

  const slideMotionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const previewId = visible?.id ?? null;

  const [diskPreviews, setDiskPreviews] = useState<OfflinePagePreview[] | null>(
    null,
  );
  const [diskLoading, setDiskLoading] = useState(false);

  useEffect(() => {
    if (previewId == null) {
      return;
    }
    let cancelled = false;
    setDiskPreviews(null);
    setDiskLoading(true);
    void loadDownloadedRoutePreviewsForPage(previewId).then((rows) => {
      if (!cancelled) {
        setDiskPreviews(rows);
        setDiskLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [previewId]);

  const loaderOfflineData: OnlinePagePreview[] | null | undefined = (() => {
    if (previewId == null) {
      return undefined;
    }
    if (isOnline) {
      return undefined;
    }
    if (diskLoading) {
      return null;
    }
    if (diskPreviews != null && diskPreviews.length > 0) {
      return diskPreviews as unknown as OnlinePagePreview[];
    }
    return undefined;
  })();

  const pipelineActive = visible != null;
  const loaderRouteId = visible?.id ?? ROUTE_PREVIEW_LOADER_IDLE_ROUTE_ID;
  const loaderOfflinePayload: OnlinePagePreview[] | null | undefined =
    visible == null ? null : loaderOfflineData;

  return (
    <RopeGeoDataLoader<OnlinePagePreview[]>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      onlinePath="/route/:routeId/preview"
      onlinePathParams={{ routeId: loaderRouteId }}
      timeoutAfterSeconds={REQUEST_TIMEOUT_SECONDS}
      isOnline={isOnline}
      offlineData={loaderOfflinePayload}
    >
      {({ data, errors, timeoutCountdown, reload }) => (
        <RoutePreviewInner
          pipelineActive={pipelineActive}
          routeId={loaderRouteId}
          routeType={visible?.routeType ?? null}
          onPreviewPress={onPreviewPress}
          onCurrentPreviewChange={onCurrentPreviewChange}
          data={data}
          errors={errors}
          timeoutCountdown={timeoutCountdown}
          onRetryRequest={reload}
          slideWrapperStyle={containerStyle}
          slideMotionStyle={slideMotionStyle}
        />
      )}
    </RopeGeoDataLoader>
  );
}

const routePreviewShellStyles = StyleSheet.create({
  idleShell: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
  },
});

const styles = StyleSheet.create({
  previewWrapper: {
    position: "relative",
  },
  savedGlyphWrap: {
    position: "absolute",
    left: ROUTE_PREVIEW_CARD_MARGIN_H,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  savedGlyphCircle: {
    justifyContent: "center",
    alignItems: "center",
  },
  externalLinkButtonWrap: {
    position: "absolute",
    right: ROUTE_PREVIEW_CARD_MARGIN_H,
    zIndex: 1,
  },
  outer: {
    position: "relative",
    paddingHorizontal: ROUTE_PREVIEW_CARD_MARGIN_H,
    marginBottom: 8,
  },
  /** Full-bleed carousel; side inset comes from scroll content padding. */
  outerCarousel: {
    position: "relative",
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: ROUTE_PREVIEW_CARD_MARGIN_H,
    // Stretch every slide to the tallest card's height (no onLayout measuring).
    alignItems: "stretch",
  },
  carouselSlide: {
    alignSelf: "stretch",
  },
  cardShadow: {
    borderRadius: ROUTE_PREVIEW_CARD_BORDER_RADIUS,
  },
  card: {
    borderRadius: ROUTE_PREVIEW_CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  cardFillCarousel: {
    flex: 1,
    alignSelf: "stretch",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  cardContent: {
    flexDirection: "row",
  },
  cardContentFill: {
    flex: 1,
  },
  imageContainer: {
    alignSelf: "stretch",
    borderTopLeftRadius: ROUTE_PREVIEW_CARD_BORDER_RADIUS,
    borderBottomLeftRadius: ROUTE_PREVIEW_CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  noImageWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageIcon: {},
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
  // Drawn below the card without affecting docked card Y (uses bottom padding gap).
  pageIndex: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    marginTop: 8,
    alignItems: "center",
  },
  pageIndexText: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
});
