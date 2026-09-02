import { BackButton } from "@/components/buttons/standard/BackButton";
import { ExpandedImageModal } from "@/components/modals/expandedImage/ExpandedImageModal";
import type { ExpandedImageAnchorRect, ExpandedImageGalleryPage } from "@/utils/expandedImage/types";
import { RegionBanner, type RegionBannerHandle } from "./RegionBanner";
import { RegionContent } from "./RegionContent";
import { RegionSeamButtons } from "./RegionSeamButtons";
import {
  Method,
  RopeGeoDataLoader,
  Service,
} from "ropegeo-common/components";

import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { RopewikiRegionPlaceholder } from "./RopewikiRegionPlaceholder";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkRequestToasts } from "@/utils/toast/useNetworkRequestToasts";
import { useRoutesProgressToast } from "@/utils/toast/useRoutesProgressToast";
import { useHeaderChromeLayout, useToastChromeLayout } from "@/utils/layout/buttonChromeLayout";
import {
  TOAST_KEY_REGION_ERROR,
  TOAST_KEY_ROUTES_ERROR,
} from "@/constants/toasts/toastArchetypes";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useNetworkStatus } from "@/context/app/NetworkStatusContext";
import { REQUEST_TIMEOUT_SECONDS } from "@/utils/network/requestTimeout";
import { isPageIdKeyInSavedPagesStorage } from "@/utils/savedPages/isPageIdKeyInSavedPagesStorage";
import { type RoutesState } from "@/components/screens/explore/RouteMarkersLayer";
import { PageDataSource, RopewikiRegionView } from "ropegeo-common/models";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STARTING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);
const BANNER_HEIGHT_MAX = SCREEN_HEIGHT;
const FALLBACK_BANNER_ASPECT_RATIO = SCREEN_WIDTH / STARTING_HEIGHT;
const CARD_BORDER_RADIUS = 24;
const HERO_SWIPE_ACTIVATE_DX = 16;
const HERO_SWIPE_TRIGGER_DX = 40;
const TAP_MAX_DISPLACEMENT = 10;
const TAP_MAX_DURATION_MS = 300;

function RegionScreenBody({
  data,
  regionId,
  onBackPress,
  onRetryRequest,
}: {
  data: RopewikiRegionView;
  regionId: string;
  onBackPress: () => void;
  onRetryRequest: () => void;
}) {
  const { background } = useColorTheme();
  const insets = useSafeAreaInsets();
  const headerChrome = useHeaderChromeLayout();
  const toastChrome = useToastChromeLayout();
  const isFocused = useIsFocused();
  const scrollY = useSharedValue(0);
  const paddingTopSv = useSharedValue(STARTING_HEIGHT);
  const aspectRatioSv = useSharedValue(FALLBACK_BANNER_ASPECT_RATIO);
  const startHeightSv = useSharedValue(STARTING_HEIGHT);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [regionPageVerticalScrollActive, setRegionPageVerticalScrollActive] =
    useState(false);
  const expandAnchorRef = useRef<View>(null);
  const bannerRef = useRef<RegionBannerHandle | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const [expandedModalVisible, setExpandedModalVisible] = useState(false);
  const [expandedAnchorRect, setExpandedAnchorRect] = useState<ExpandedImageAnchorRect | null>(null);
  const [expandedPageTitle, setExpandedPageTitle] = useState("");
  const [expandedInitialIndex, setExpandedInitialIndex] = useState(0);
  const [regionRoutesState, setRegionRoutesState] = useState<RoutesState>({
    loading: false,
    data: null,
    errors: null,
    received: 0,
    total: null,
    timeoutCountdown: null,
  });
  useRoutesProgressToast(regionRoutesState, {
    resetKey: regionId,
    horizontalInset: toastChrome.horizontalInset,
    surfaceActive: isFocused,
  });

  useNetworkRequestToasts({
    errors: regionRoutesState.errors,
    timeoutCountdown: regionRoutesState.timeoutCountdown,
    resetKey: regionId,
    errorToastKey: TOAST_KEY_ROUTES_ERROR,
    errorToastTitle: `Error loading ${data.name} routes`,
    incrementErrorMultipleOnCollision: true,
    onRetryRequest,
  });

  const bottomPadding = insets.bottom + 16;
  const paddingTop =
    cardHeight != null && cardHeight < SCREEN_HEIGHT / 2
      ? Math.max(0, SCREEN_HEIGHT - cardHeight - bottomPadding)
      : STARTING_HEIGHT;

  useEffect(() => {
    // Must match scroll content `paddingTop` so the banner meets the card (no gray strip).
    startHeightSv.value = Math.min(paddingTop, BANNER_HEIGHT_MAX);
  }, [paddingTop, startHeightSv]);
  useEffect(() => {
    paddingTopSv.value = paddingTop;
  }, [paddingTop, paddingTopSv]);

  const expandedPages = useMemo((): ExpandedImageGalleryPage[] => {
    const slides = bannerRef.current?.getAllSlides() ?? [];
    if (!expandedModalVisible || slides.length === 0) return [];
    return slides.map((s) => ({
      itemKey: s.id,
      fullUrl: s.fullUrl,
      bannerUrl: s.bannerUrl,
      linkUrl: s.linkUrl,
      captionHtml: s.captionHtml,
    }));
  }, [expandedModalVisible]);

  const handleBannerTap = useCallback(() => {
    const handle = bannerRef.current;
    if (handle == null) return;
    const slide = handle.getCurrentSlide();
    if (slide == null) return;
    const anchorHeight = Math.min(paddingTop, SCREEN_HEIGHT / 2);
    setExpandedAnchorRect({ x: 0, y: 0, width: SCREEN_WIDTH, height: anchorHeight });
    setExpandedPageTitle(slide.pageName);
    setExpandedInitialIndex(handle.getCurrentIndex());
    setExpandedModalVisible(true);
  }, [paddingTop]);

  const handleExpandedPageChange = useCallback(
    (_pageIndex: number, _itemKey: string) => {
      const slides = bannerRef.current?.getAllSlides() ?? [];
      const next = slides.find((s) => s.id === _itemKey);
      if (next != null) {
        setExpandedPageTitle(next.pageName);
      }
    },
    [],
  );

  const handleExpandedDismissed = useCallback(() => {
    setExpandedModalVisible(false);
    setExpandedAnchorRect(null);
  }, []);

  const heroSwipeLayerStyle = useAnimatedStyle(() => ({
    height: Math.max(0, paddingTopSv.value - CARD_BORDER_RADIUS - scrollY.value),
  }));

  const bannerImageFrameStyle = useAnimatedStyle(() => {
    const height = Math.max(
      Math.round(SCREEN_WIDTH / aspectRatioSv.value),
      Math.min(BANNER_HEIGHT_MAX, startHeightSv.value - scrollY.value)
    );
    const width = height * aspectRatioSv.value;
    return {
      height,
      width,
      left: (SCREEN_WIDTH - width) / 2,
    };
  });

  useEffect(() => {
    if (mapExpanded) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBackPress();
      return true;
    });
    return () => sub.remove();
  }, [mapExpanded, onBackPress]);

  const heroSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > HERO_SWIPE_ACTIVATE_DX &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < HERO_SWIPE_TRIGGER_DX) return;
        bannerRef.current?.swipeBy(g.dx < 0 ? 1 : -1);
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  return (
    <View
      ref={expandAnchorRef}
      style={[styles.container, { backgroundColor: background }]}
      collapsable={false}
    >
      <RegionBanner
        ref={bannerRef}
        regionId={regionId}
        regionName={data.name}
        layoutWidth={SCREEN_WIDTH}
        layoutHeight={BANNER_HEIGHT_MAX}
        imageFrameStyle={bannerImageFrameStyle}
        verticalScrollActive={regionPageVerticalScrollActive}
      />

      {!mapExpanded ? (
        <Animated.View
          {...heroSwipeResponder.panHandlers}
          pointerEvents="box-only"
          onTouchStart={(e) => {
            touchStartRef.current = {
              x: e.nativeEvent.pageX,
              y: e.nativeEvent.pageY,
              time: Date.now(),
            };
          }}
          onTouchEnd={(e) => {
            const start = touchStartRef.current;
            touchStartRef.current = null;
            if (start == null) return;
            const dx = Math.abs(e.nativeEvent.pageX - start.x);
            const dy = Math.abs(e.nativeEvent.pageY - start.y);
            const dt = Date.now() - start.time;
            if (dx < TAP_MAX_DISPLACEMENT && dy < TAP_MAX_DISPLACEMENT && dt < TAP_MAX_DURATION_MS) {
              handleBannerTap();
            }
          }}
          style={[
            styles.heroSwipeLayer,
            heroSwipeLayerStyle,
          ]}
        />
      ) : null}

      <RegionContent
        regionId={regionId}
        region={data}
        insets={insets}
        scrollY={scrollY}
        expandAnchorRef={expandAnchorRef}
        paddingTop={paddingTop}
        onCardHeightLayout={setCardHeight}
        onMapExpandedChange={(expanded) => {
          setMapExpanded(expanded);
          if (expanded) {
            setRegionPageVerticalScrollActive(false);
          }
        }}
        onRoutesStateChange={setRegionRoutesState}
        onVerticalScrollActiveChange={setRegionPageVerticalScrollActive}
      />

      <RegionSeamButtons
        url={data.externalLink ?? null}
        scrollY={scrollY}
        paddingTop={paddingTop}
        mapExpanded={mapExpanded}
      />

      {!mapExpanded && (
        <BackButton
          onPress={onBackPress}
          top={insets.top + headerChrome.rowTopInset}
        />
      )}
      {expandedModalVisible && expandedAnchorRect != null && expandedPages.length > 0 ? (
        <ExpandedImageModal
          anchorRect={expandedAnchorRect}
          pages={expandedPages}
          initialPageIndex={expandedInitialIndex}
          onPageChange={handleExpandedPageChange}
          headerPageTitle={expandedPageTitle}
          onDismissed={handleExpandedDismissed}
        />
      ) : null}
    </View>
  );
}

export type RopewikiRegionScreenProps = {
  regionId: string;
  source: PageDataSource;
  /**
   * Ropewiki page id from route param `savedPage` when opening region from the Saved tab.
   * Back replaces onto that saved page only if the id is still a key in saved-pages storage.
   */
  savedPageId?: string | null;
};

function RopewikiRegionScreenInner({
  regionId,
  source,
  backTop,
  data,
  errors,
  timeoutCountdown,
  onBackPress,
  onRetryRequest,
}: {
  regionId: string;
  source: PageDataSource;
  backTop: number;
  data: RopewikiRegionView | null;
  errors: Error | null;
  timeoutCountdown: number | null;
  onBackPress: () => void;
  onRetryRequest: () => void;
}) {
  useNetworkRequestToasts({
    errors,
    timeoutCountdown,
    resetKey: regionId,
    watchOffline: false,
    errorToastKey: TOAST_KEY_REGION_ERROR,
    errorToastTitle: "Error loading region",
    incrementErrorMultipleOnCollision: true,
    onRetryRequest,
  });

  if (data == null) {
    return (
      <RopewikiRegionPlaceholder
        backTop={backTop}
        source={source}
        errorMessage={errors?.message}
        onBackPress={onBackPress}
      />
    );
  }
  return (
    <RegionScreenBody
      data={data}
      regionId={regionId}
      onBackPress={onBackPress}
      onRetryRequest={onRetryRequest}
    />
  );
}

export function RopewikiRegionScreen({
  regionId,
  source,
  savedPageId,
}: RopewikiRegionScreenProps) {
  const insets = useSafeAreaInsets();
  const headerChrome = useHeaderChromeLayout();
  const { isOnline } = useNetworkStatus();
  const backTop = insets.top + headerChrome.rowTopInset;
  const router = useRouter();
  const handleBack = useCallback(() => {
    void (async () => {
      if (savedPageId != null && savedPageId !== "") {
        const stillSaved = await isPageIdKeyInSavedPagesStorage(savedPageId);
        if (stillSaved) {
          router.replace({
            pathname: "/(tabs)/saved/[id]/page",
            params: {
              id: savedPageId,
              source: String(PageDataSource.Ropewiki),
            },
          } as unknown as Parameters<typeof router.replace>[0]);
          return;
        }
      }
      router.back();
    })();
  }, [router, savedPageId]);

  return (
    <RopeGeoDataLoader<RopewikiRegionView>
      key={regionId}
      service={Service.WEBSCRAPER}
      method={Method.GET}
      onlinePath="/ropewiki/region/:id"
      onlinePathParams={{ id: regionId }}
      timeoutAfterSeconds={REQUEST_TIMEOUT_SECONDS}
      isOnline={isOnline}
    >
      {({ data, errors, timeoutCountdown, reload }) => (
        <RopewikiRegionScreenInner
          regionId={regionId}
          source={source}
          backTop={backTop}
          data={data}
          errors={errors}
          timeoutCountdown={timeoutCountdown}
          onBackPress={handleBack}
          onRetryRequest={reload}
        />
      )}
    </RopeGeoDataLoader>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSwipeLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
  },
});
