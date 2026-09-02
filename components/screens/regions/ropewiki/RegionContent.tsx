import { BetaSection } from "@/components/betaSection/BetaSection";
import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { MiniMap } from "@/components/modals/minimap/MiniMap";
import type { RoutesState } from "@/components/screens/explore/RouteMarkersLayer";
import { useNetworkStatus } from "@/context/app/NetworkStatusContext";
import { RegionLinks } from "@/components/screens/pages/ropewiki/RegionLinks";
import {
  RopeGeoPagedDataLoader,
  Service,
} from "ropegeo-common/components";
import { OfflineLoadMoreBlockedFooter } from "@/components/lists/OfflineLoadMoreBlockedFooter";
import { PlaceholderPreview } from "@/components/previews/PlaceholderPreview";
import { useNetworkRequestToasts } from "@/utils/toast/useNetworkRequestToasts";
import { TOAST_KEY_ROUTE_PREVIEW_ERROR } from "@/constants/toasts/toastArchetypes";
import { PagePreview } from "@/components/previews/PagePreview";
import { RegionPreview } from "@/components/previews/RegionPreview";
import { REQUEST_TIMEOUT_SECONDS } from "@/utils/network/requestTimeout";
import { usePreviewTextMetrics } from "@/utils/layout/previewLayout";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MINI_MAP_BORDER_RADIUS,
  MINI_MAP_EXPANDED_Z_INDEX,
} from "@/components/modals/minimap/shared/minimapShared";
import {
  ActivityIndicator,
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  type SharedValue,
  runOnJS,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import {
  type OnlinePagePreview,
  type RopewikiRegionView,
  MiniMapType,
  PageDataSource,
  Preview,
  RopewikiRegionPreviewsParams,
} from "ropegeo-common/models";

const PREVIEWS_PAGE_LIMIT = 10;
const LOAD_MORE_THRESHOLD = 100;
const CARD_BORDER_RADIUS = 24;
/** Matches header row top inset on {@link RopewikiRegionScreen}. */
const MINI_MAP_VIEWPORT_HEADER_TOP = 8;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const INITIAL_LOADING_MIN_HEIGHT = SCREEN_HEIGHT * 0.5;

function formatCounts(pageCount: number, regionCount: number): string {
  if (regionCount === 0) {
    return `(${pageCount} ${pageCount === 1 ? "page" : "pages"})`;
  }
  const pages = `${pageCount} ${pageCount === 1 ? "page" : "pages"}`;
  const regions = `${regionCount} ${regionCount === 1 ? "region" : "regions"}`;
  return `(${pages} and ${regions})`;
}

export type RegionContentProps = {
  regionId: string;
  region: RopewikiRegionView;
  insets: { top: number; bottom: number };
  scrollY: SharedValue<number>;
  expandAnchorRef: React.RefObject<View | null>;
  paddingTop: number;
  onCardHeightLayout: (height: number) => void;
  onMapExpandedChange?: (expanded: boolean) => void;
  onRoutesStateChange?: (state: RoutesState) => void;
  /** True while the user is dragging or flinging the page vertically (parallax scroll). */
  onVerticalScrollActiveChange?: (active: boolean) => void;
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

function RegionPreviewsToasts({
  regionId,
  regionName,
  errors,
  timeoutCountdown,
  onRetryRequest,
}: {
  regionId: string;
  regionName: string;
  errors: Error | null;
  timeoutCountdown: number | null;
  onRetryRequest: () => void;
}) {
  useNetworkRequestToasts({
    errors,
    timeoutCountdown,
    resetKey: `${regionId}-previews`,
    watchOffline: false,
    errorToastKey: TOAST_KEY_ROUTE_PREVIEW_ERROR,
    errorToastTitle: `Error loading ${regionName} previews`,
    incrementErrorMultipleOnCollision: true,
    onRetryRequest,
  });

  return null;
}

export function RegionContent({
  regionId,
  region,
  insets,
  scrollY,
  expandAnchorRef,
  paddingTop,
  onCardHeightLayout,
  onMapExpandedChange,
  onRoutesStateChange,
  onVerticalScrollActiveChange,
}: RegionContentProps) {
  const { background, text, loadingIndicator } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const previewMetrics = usePreviewTextMetrics();
  const { isOnline } = useNetworkStatus();
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;
  const loadMoreRef = useRef<() => void>(() => {});
  const previewErrorsRef = useRef<Error | null>(null);
  const previewsListAtBottomRef = useRef(false);
  const lastScrollMetricsRef = useRef({ y: 0, contentH: 0, layoutH: 0 });
  const [previewsListNearBottom, setPreviewsListNearBottom] = useState(false);
  const miniMapGateRef = useRef<View>(null);
  const miniMapUnlockedRef = useRef(false);
  const [mountMiniMapNative, setMountMiniMapNative] = useState(false);
  const [mapMode, setMapMode] = useState<"collapsed" | "expanded">("collapsed");
  const mapExpanded = mapMode === "expanded";
  const scrollIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const countsText = formatCounts(region.pageCount, region.regionCount);
  const regions = region.regions ?? [];
  const regionMiniMap =
    region.miniMap?.miniMapType === MiniMapType.Region ? region.miniMap : null;
  const hasMiniMap = regionMiniMap != null;

  const onMapExpandedChangeRef = useRef(onMapExpandedChange);
  onMapExpandedChangeRef.current = onMapExpandedChange;

  const setMapModeAndNotify = useCallback(
    (mode: "collapsed" | "expanded") => {
      setMapMode(mode);
      onMapExpandedChangeRef.current?.(mode === "expanded");
    },
    [],
  );

  useEffect(() => {
    miniMapUnlockedRef.current = false;
    setMountMiniMapNative(false);
    setMapMode("collapsed");
    onMapExpandedChangeRef.current?.(false);
  }, [regionId]);

  const checkMiniMapInView = useCallback(() => {
    if (!hasMiniMap) return;
    const node = miniMapGateRef.current;
    if (node == null) return;
    node.measureInWindow((_x, y, _width, h) => {
      const winH = Dimensions.get("window").height;
      const visTop = insets.top + MINI_MAP_VIEWPORT_HEADER_TOP;
      const visBottom = winH - insets.bottom - 72;
      const intersects = y + h > visTop && y < visBottom;
      if (intersects && !miniMapUnlockedRef.current) {
        miniMapUnlockedRef.current = true;
        setMountMiniMapNative(true);
      }
    });
  }, [hasMiniMap, insets.bottom, insets.top]);

  const queryParams = useMemo(
    () => new RopewikiRegionPreviewsParams(PREVIEWS_PAGE_LIMIT),
    []
  );

  const pathParams = useMemo(() => ({ regionId }), [regionId]);

  const reportScrollForPreviews = useCallback(
    (contentOffsetY: number, contentHeight: number, layoutHeight: number) => {
      lastScrollMetricsRef.current = {
        y: contentOffsetY,
        contentH: contentHeight,
        layoutH: layoutHeight,
      };
      const canScroll = contentHeight > layoutHeight;
      const isNearBottom =
        contentOffsetY + layoutHeight >= contentHeight - LOAD_MORE_THRESHOLD;
      const atBottom = !canScroll || isNearBottom;
      previewsListAtBottomRef.current = atBottom;
      setPreviewsListNearBottom(atBottom);

      if (!isOnlineRef.current) {
        return;
      }
      if (previewErrorsRef.current != null) return;
      if (canScroll && isNearBottom) {
        loadMoreRef.current();
      }
    },
    [],
  );

  useEffect(() => {
    if (isOnline) {
      setPreviewsListNearBottom(false);
      return;
    }
    setPreviewsListNearBottom(previewsListAtBottomRef.current);
  }, [isOnline]);

  useEffect(() => {
    if (!hasMiniMap) return;
    const t = setTimeout(() => checkMiniMapInView(), 0);
    return () => clearTimeout(t);
  }, [hasMiniMap, checkMiniMapInView]);

  useEffect(() => {
    return () => {
      if (scrollIdleTimeoutRef.current != null) {
        clearTimeout(scrollIdleTimeoutRef.current);
      }
    };
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      runOnJS(reportScrollForPreviews)(
        event.contentOffset.y,
        event.contentSize.height,
        event.layoutMeasurement.height
      );
    },
  });

  const clearScrollIdleTimeout = useCallback(() => {
    if (scrollIdleTimeoutRef.current != null) {
      clearTimeout(scrollIdleTimeoutRef.current);
      scrollIdleTimeoutRef.current = null;
    }
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    clearScrollIdleTimeout();
    onVerticalScrollActiveChange?.(true);
  }, [clearScrollIdleTimeout, onVerticalScrollActiveChange]);

  const handleMomentumScrollBegin = useCallback(() => {
    clearScrollIdleTimeout();
  }, [clearScrollIdleTimeout]);

  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      checkMiniMapInView();
      const vy = e.nativeEvent.velocity?.y;
      if (vy != null && Math.abs(vy) >= 8) {
        return;
      }
      if (vy != null) {
        onVerticalScrollActiveChange?.(false);
        return;
      }
      clearScrollIdleTimeout();
      scrollIdleTimeoutRef.current = setTimeout(() => {
        scrollIdleTimeoutRef.current = null;
        onVerticalScrollActiveChange?.(false);
      }, 100);
    },
    [
      checkMiniMapInView,
      clearScrollIdleTimeout,
      onVerticalScrollActiveChange,
    ]
  );

  const handleMomentumScrollEnd = useCallback(() => {
    clearScrollIdleTimeout();
    onVerticalScrollActiveChange?.(false);
    checkMiniMapInView();
  }, [
    checkMiniMapInView,
    clearScrollIdleTimeout,
    onVerticalScrollActiveChange,
  ]);

  return (
    <RopeGeoPagedDataLoader<Preview>
      service={Service.WEBSCRAPER}
      onlinePath="/ropewiki/region/:regionId/previews"
      onlinePathParams={pathParams}
      queryParams={queryParams}
      timeoutAfterSeconds={REQUEST_TIMEOUT_SECONDS}
      isOnline={isOnline}
    >
      {({
        loadingNextPage,
        data,
        errors,
        loadNextPage,
        morePages,
        timeoutCountdown,
        reload,
      }) => {
        loadMoreRef.current = loadNextPage;
        previewErrorsRef.current = errors;
        const items = data ?? [];
        const loading = data === null && errors === null;
        return (
          <>
          <AnimatedScrollView
            style={[styles.scrollView, mapExpanded && styles.scrollViewMapExpanded]}
            contentContainerStyle={{
              paddingTop,
              paddingBottom: 0,
              flexGrow: 1,
            }}
            pointerEvents="auto"
            nestedScrollEnabled
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            scrollEnabled={!mapExpanded}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            onLayout={(e) => {
              const layoutH = e.nativeEvent.layout.height;
              const m = lastScrollMetricsRef.current;
              reportScrollForPreviews(m.y, m.contentH, layoutH);
            }}
            onContentSizeChange={(_w, h) => {
              const m = lastScrollMetricsRef.current;
              reportScrollForPreviews(m.y, h, m.layoutH);
            }}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollBegin={handleMomentumScrollBegin}
            onMomentumScrollEnd={handleMomentumScrollEnd}
          >
            <View
              style={[
                styles.cardWrapper,
                { marginTop: -CARD_BORDER_RADIUS },
                loading && items.length === 0 && {
                  minHeight: INITIAL_LOADING_MIN_HEIGHT,
                },
              ]}
              onLayout={(e) => onCardHeightLayout(e.nativeEvent.layout.height)}
            >
              <View
                style={[
                  styles.cardWrap,
                  { backgroundColor: background },
                  mapExpanded && styles.cardWrapMapExpanded,
                ]}
                collapsable={false}
              >
                <RegionPreviewsToasts
                  regionId={regionId}
                  regionName={region.name}
                  errors={errors}
                  timeoutCountdown={timeoutCountdown}
                  onRetryRequest={reload}
                />
                <View
                  style={[
                    styles.cardInner,
                    {
                      paddingTop: 20,
                      paddingBottom: 16,
                    },
                  ]}
                >
                  <ConstantText
                    size={uiScale.regionScreen.text.title}
                    typography={textStyle.regionScreen.title}
                    style={[styles.title, { color: text.primary }]}
                  >
                    {region.name}
                  </ConstantText>
                  <RegionLinks
                    source={PageDataSource.Ropewiki}
                    regions={regions}
                  />
                  <ConstantText
                    size={uiScale.regionScreen.text.previewCount}
                    typography={textStyle.regionScreen.previewCount}
                    style={[styles.counts, { color: text.secondary }]}
                  >
                    {countsText}
                  </ConstantText>
                  {region.overview != null ? (
                    <BetaSection section={region.overview} pageTitle={region.name} />
                  ) : null}
                  {hasMiniMap && regionMiniMap != null ? (
                    <View
                      ref={miniMapGateRef}
                      collapsable={false}
                      style={[
                        styles.miniMapWrap,
                        !mapExpanded && styles.miniMapWrapClip,
                        mapExpanded && styles.miniMapWrapExpanded,
                      ]}
                      onLayout={() => {
                        requestAnimationFrame(() => {
                          checkMiniMapInView();
                        });
                      }}
                    >
                      <MiniMap
                        miniMap={regionMiniMap}
                        regionId={regionId}
                        source={PageDataSource.Ropewiki}
                        mountNativeMap={mountMiniMapNative}
                        expanded={mapExpanded}
                        expandAnchorRef={expandAnchorRef}
                        collapsedMeasureRef={miniMapGateRef}
                        onExpand={() => setMapModeAndNotify("expanded")}
                        onCollapse={() => setMapModeAndNotify("collapsed")}
                        onRoutesStateChange={onRoutesStateChange}
                      />
                    </View>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.previewsSection,
                    {
                      paddingBottom: insets.bottom + 16,
                      gap: previewMetrics.itemGap,
                    },
                  ]}
                >
                  {loading && items.length === 0 ? (
                    <View
                      style={[
                        styles.previewsLoading,
                        { minHeight: INITIAL_LOADING_MIN_HEIGHT - 120 },
                      ]}
                    >
                      <ActivityIndicator
                        size="small"
                        color={loadingIndicator}
                      />
                    </View>
                  ) : errors != null && items.length === 0 ? (
                    <OfflineLoadMoreBlockedFooter />
                  ) : (
                    <>
                      {items.map((item, index) =>
                        item.isPagePreview() ? (
                          <PagePreview
                            key={`page-${item.id}-${index}`}
                            preview={item as OnlinePagePreview}
                          />
                        ) : item.isRegionPreview() ? (
                          <RegionPreview
                            key={`region-${item.id}-${index}`}
                            preview={item}
                          />
                        ) : null
                      )}
                      {loadingNextPage ? (
                        <View style={styles.loadMoreIndicator}>
                          <PlaceholderPreview />
                        </View>
                      ) : ((!isOnline && morePages) || errors != null) &&
                        items.length > 0 &&
                        previewsListNearBottom ? (
                        <OfflineLoadMoreBlockedFooter />
                      ) : null}
                    </>
                  )}
                </View>
              </View>
            </View>
          </AnimatedScrollView>
          </>
        );
      }}
    </RopeGeoPagedDataLoader>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    /** Always above the absolute banner layer. */
    position: "relative",
    zIndex: 1000,
    ...Platform.select({
      android: { elevation: 3 },
      default: {},
    }),
  },
  scrollViewMapExpanded: {
    overflow: "visible",
  },
  cardWrapper: {
    position: "relative",
  },
  cardWrap: {
    position: "relative",
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderTopRightRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  cardWrapMapExpanded: {
    overflow: "visible",
  },
  cardInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    marginBottom: 6,
  },
  counts: {},
  miniMapWrap: {
    marginTop: 16,
    width: "100%",
    aspectRatio: 1,
  },
  miniMapWrapClip: {
    overflow: "hidden",
    borderRadius: MINI_MAP_BORDER_RADIUS,
  },
  miniMapWrapExpanded: {
    zIndex: MINI_MAP_EXPANDED_Z_INDEX,
    elevation: 1000,
  },
  previewsSection: {
    paddingHorizontal: 20,
  },
  previewsLoading: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreIndicator: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
