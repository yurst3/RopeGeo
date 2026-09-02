import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Image, type ImageProps } from "expo-image";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ListRenderItemInfo,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  FlatList as GHFlatList,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExpandedImageBannerCrossfade } from "./ExpandedImageBannerCrossfade";
import { ExpandedImageCaption } from "./ExpandedImageCaption";
import { ExpandedImageGallerySlide } from "./ExpandedImageGallerySlide";
import {
  ExpandedImageHeader,
  type ExpandedImageSectionImagePosition,
} from "./ExpandedImageHeader";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useHeaderChromeLayout } from "@/utils/layout/buttonChromeLayout";
import type { ExpandedImageAnchorRect, ExpandedImageGalleryPage } from "@/utils/expandedImage/types";
import {
  anchorRectToExpandLayout,
  type ExpandedImageExpandLayout,
  useExpandedImageExpandAnimation,
} from "@/utils/expandedImage/useExpandedImageExpandAnimation";

const CHROME_FADE_MS = 220;

/** Visible only while swiping: each cell is `screen + gap` wide; image uses full screen width. */
const GALLERY_INTER_SLIDE_GAP = 12;

const ReanimatedGalleryFlatList =
  Animated.createAnimatedComponent(GHFlatList<ExpandedImageGalleryPage>);

function prefetchImageSource(source: NonNullable<ImageProps["source"]>): void {
  if (typeof source === "string") {
    void Image.prefetch(source);
    return;
  }
  if (
    source &&
    typeof source === "object" &&
    "uri" in source &&
    typeof (source as { uri: unknown }).uri === "string"
  ) {
    void Image.prefetch((source as { uri: string }).uri);
  }
}

export type ExpandedImageModalProps = {
  anchorRect: ExpandedImageAnchorRect;
  /** One or more fullscreen pages; horizontal paging when length > 1. */
  pages: ExpandedImageGalleryPage[];
  /** Starting page (clamped to `pages` length). */
  initialPageIndex: number;
  /** Sync parent state when the user changes page (e.g. beta thumbnails / collapse anchor). */
  onPageChange?: (pageIndex: number, itemKey: string) => void;
  /** Page name (bold, top line in header). */
  headerPageTitle: string;
  /** Beta section name; optional second line with `(current/total)` when set. */
  headerSectionSubtitle?: string | null;
  /** Called after collapse animation + teardown (~220ms). */
  onDismissed: () => void;
};

/**
 * Full-screen expanded image viewer (blur backdrop, zoom/pan, optional HTML caption).
 * Mount when opening; parent clears anchor state in `onDismissed`.
 */
export function ExpandedImageModal({
  anchorRect,
  pages,
  initialPageIndex,
  onPageChange,
  headerPageTitle,
  headerSectionSubtitle,
  onDismissed,
}: ExpandedImageModalProps) {
  const themeColors = useColorTheme();
  const insets = useSafeAreaInsets();
  const headerChrome = useHeaderChromeLayout();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const pageWidth = windowWidth;
  const slideStride = pageWidth + GALLERY_INTER_SLIDE_GAP;

  const safeInitial = Math.max(
    0,
    Math.min(initialPageIndex, Math.max(0, pages.length - 1))
  );

  const scrollX = useSharedValue(safeInitial * slideStride);
  /** Opening index only — never updated when parent `initialPageIndex` changes mid-session. */
  const initialScrollIndexRef = useRef(safeInitial);
  /** Last index reported to `onPageChange` (scroll end only). */
  const lastReportedPageIndexRef = useRef(safeInitial);

  const [expandLayout, setExpandLayout] = useState<ExpandedImageExpandLayout | null>(
    () =>
      anchorRect.width > 0 && anchorRect.height > 0
        ? anchorRectToExpandLayout(anchorRect, windowWidth, windowHeight)
        : null,
  );
  const [expanded, setExpanded] = useState(false);
  const [collapseGeneration, setCollapseGeneration] = useState(0);
  const collapseInFlightRef = useRef(false);
  const [overlayShowsFullImage, setOverlayShowsFullImage] = useState(true);
  const [showUi, setShowUi] = useState(true);
  /** Header/caption — updates at scroll majority threshold. */
  const [chromeIndex, setChromeIndex] = useState(safeInitial);
  /** Slide focus (zoom/prefetch) — updates when scroll settles. */
  const [activeIndex, setActiveIndex] = useState(safeInitial);
  const [pagerScrollEnabled, setPagerScrollEnabled] = useState(true);

  const chromeOpacity = useSharedValue(1);
  const galleryRef = useRef<GHFlatList<ExpandedImageGalleryPage> | null>(null);
  /** Ignore momentum events until initial `scrollToOffset` (if any) has been applied. */
  const galleryPositioningReadyRef = useRef(false);

  const pageIndexFromScrollOffset = useCallback(
    (x: number) =>
      Math.min(
        pages.length - 1,
        Math.max(0, Math.round(x / slideStride))
      ),
    [pages.length, slideStride]
  );

  const syncChromeIndexFromScrollOffset = useCallback(
    (x: number) => {
      if (!galleryPositioningReadyRef.current) {
        return;
      }
      const next = pageIndexFromScrollOffset(x);
      setChromeIndex((prev) => (prev === next ? prev : next));
    },
    [pageIndexFromScrollOffset]
  );

  const commitPageIndexFromScrollOffset = useCallback(
    (x: number) => {
      if (!galleryPositioningReadyRef.current) {
        return;
      }
      const next = pageIndexFromScrollOffset(x);
      setChromeIndex(next);
      setActiveIndex(next);
      if (lastReportedPageIndexRef.current !== next) {
        lastReportedPageIndexRef.current = next;
        const page = pages[next];
        if (page != null) {
          onPageChange?.(next, page.itemKey);
        }
      }
    },
    [onPageChange, pageIndexFromScrollOffset, pages]
  );

  const galleryScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
      runOnJS(syncChromeIndexFromScrollOffset)(e.contentOffset.x);
    },
  });

  const stageWidth = windowWidth;
  const stageHeight = expandLayout != null ? windowHeight : 0;

  const headerSectionImagePosition: ExpandedImageSectionImagePosition | null =
    headerSectionSubtitle != null && pages.length > 0
      ? { current: chromeIndex + 1, total: pages.length }
      : null;

  const toggleShowUi = useCallback(() => {
    setShowUi((v) => !v);
  }, []);

  const hideChrome = useCallback(() => {
    setShowUi(false);
  }, []);

  const finishCollapse = useCallback(() => {
    if (!collapseInFlightRef.current) return;
    collapseInFlightRef.current = false;
    galleryPositioningReadyRef.current = false;
    setExpanded(false);
    setExpandLayout(null);
    setOverlayShowsFullImage(true);
    setShowUi(true);
    onDismissed();
  }, [onDismissed]);

  const requestCollapse = useCallback(() => {
    if (!expanded || collapseInFlightRef.current) return;
    if (anchorRect.width <= 0 || anchorRect.height <= 0) {
      collapseInFlightRef.current = true;
      finishCollapse();
      return;
    }
    collapseInFlightRef.current = true;
    setExpandLayout(anchorRectToExpandLayout(anchorRect, windowWidth, windowHeight));
    setCollapseGeneration((g) => g + 1);
  }, [anchorRect, expanded, finishCollapse, windowHeight, windowWidth]);

  const collapseModal = useCallback(() => {
    requestCollapse();
  }, [requestCollapse]);

  const { cardStyle, expandProgress } = useExpandedImageExpandAnimation({
    expandLayout,
    expanded,
    collapseGeneration,
    onCollapseAnimationComplete: finishCollapse,
  });

  useEffect(() => {
    chromeOpacity.value = withTiming(showUi ? 1 : 0, {
      duration: CHROME_FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [showUi, chromeOpacity]);

  const chromeHeaderFadeStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value * chromeOpacity.value,
  }));
  const chromeCaptionFadeStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value * chromeOpacity.value,
  }));

  useEffect(() => {
    if (expandLayout != null) return;
    if (anchorRect.width <= 0 || anchorRect.height <= 0) return;
    setExpandLayout(anchorRectToExpandLayout(anchorRect, windowWidth, windowHeight));
  }, [anchorRect, expandLayout, windowHeight, windowWidth]);

  useEffect(() => {
    if (!expandLayout) return;
    const id = requestAnimationFrame(() => {
      setExpanded(true);
    });
    return () => cancelAnimationFrame(id);
  }, [expandLayout]);

  useEffect(() => {
    if (!expanded) return;
    collapseInFlightRef.current = false;
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      collapseModal();
      return true;
    });
    return () => sub.remove();
  }, [expanded, collapseModal]);

  /** Preload neighbors (and current) full-resolution images. */
  useEffect(() => {
    if (pages.length === 0) return;
    const indices = new Set<number>();
    for (const d of [-1, 0, 1]) {
      const i = activeIndex + d;
      if (i >= 0 && i < pages.length) {
        indices.add(i);
      }
    }
    indices.forEach((i) => {
      prefetchImageSource(pages[i].fullUrl);
      const b = pages[i].bannerUrl;
      if (b != null) {
        prefetchImageSource(b as NonNullable<ImageProps["source"]>);
      }
    });
  }, [activeIndex, pages]);

  const handleZoomedChange = useCallback((zoomed: boolean) => {
    setPagerScrollEnabled(!zoomed);
  }, []);

  const onGalleryScrollSettled = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!galleryPositioningReadyRef.current) {
        return;
      }
      const x = e.nativeEvent.contentOffset.x;
      scrollX.value = x;
      commitPageIndexFromScrollOffset(x);
      setShowUi(true);
      setPagerScrollEnabled(true);
    },
    [commitPageIndexFromScrollOffset, scrollX]
  );

  /** Slow drags with no momentum — `onMomentumScrollEnd` does not run. */
  const onGalleryScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const vx = e.nativeEvent.velocity?.x ?? 0;
      if (Math.abs(vx) > 0.1) {
        return;
      }
      onGalleryScrollSettled(e);
    },
    [onGalleryScrollSettled]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: slideStride,
      offset: slideStride * index,
      index,
    }),
    [slideStride]
  );

  const keyExtractor = useCallback(
    (item: ExpandedImageGalleryPage) => item.itemKey,
    []
  );

  const renderGalleryItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ExpandedImageGalleryPage>) => (
      <View
        style={{
          width: slideStride,
          height: stageHeight,
          flexDirection: "row",
        }}
      >
        <ExpandedImageGallerySlide
          page={item}
          containerWidth={pageWidth}
          containerHeight={stageHeight}
          overlayShowsFullImage={overlayShowsFullImage}
          disableEdgeNavigation={pages.length > 1}
          isActive={index === activeIndex}
          onToggleUi={toggleShowUi}
          onZoomPanHideUi={hideChrome}
          onZoomedChange={pages.length > 1 ? handleZoomedChange : undefined}
        />
        <View
          style={{
            width: GALLERY_INTER_SLIDE_GAP,
            height: stageHeight,
            backgroundColor: "transparent",
          }}
        />
      </View>
    ),
    [
      activeIndex,
      handleZoomedChange,
      hideChrome,
      overlayShowsFullImage,
      pageWidth,
      pages.length,
      slideStride,
      stageHeight,
      toggleShowUi,
    ]
  );

  const activePage = pages[chromeIndex];
  const activeCaptionHtml = activePage?.captionHtml ?? null;
  const activeAuthors = activePage?.authors ?? null;
  const activeExternalLinkUrl = activePage?.linkUrl ?? null;
  const showCaptionChrome =
    (activeCaptionHtml != null && activeCaptionHtml.length > 0) ||
    (activeAuthors != null && activeAuthors.length > 0);

  const captionBottomInset = Math.max(insets.bottom, 12);
  const captionMaxHeight = windowHeight * 0.45;

  useEffect(() => {
    if (!expanded || pages.length === 0) return;
    galleryPositioningReadyRef.current = false;
    let cancelled = false;
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        if (cancelled) return;
        const initial = initialScrollIndexRef.current;
        const offset = initial * slideStride;
        scrollX.value = offset;
        if (initial > 0) {
          galleryRef.current?.scrollToOffset({
            offset,
            animated: false,
          });
        }
        galleryPositioningReadyRef.current = true;
      });
      return id2;
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id1);
    };
  }, [expanded, pages.length, scrollX, slideStride]);

  if (pages.length === 0) {
    return null;
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={styles.modalRoot}>
        <View style={styles.modalInner} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.expandedCard,
              { backgroundColor: themeColors.background },
              cardStyle,
            ]}
          >
            <View style={styles.expandedImageStage}>
              <ExpandedImageBannerCrossfade
                scrollX={scrollX}
                slideStride={slideStride}
                pages={pages}
                overlayShowsFullImage={overlayShowsFullImage}
              />
              <View style={styles.galleryLayer} pointerEvents="box-none">
                {overlayShowsFullImage &&
                pages.some((p) => p.bannerUrl != null) ? (
                  <View
                    style={[
                      styles.expandedBlurDarken,
                      { backgroundColor: themeColors.image.blurOverlay },
                    ]}
                    pointerEvents="none"
                  />
                ) : null}
                {stageHeight > 0 ? (
                  <ReanimatedGalleryFlatList
                    style={styles.galleryFlatList}
                    ref={galleryRef}
                    data={pages}
                    keyExtractor={keyExtractor}
                    renderItem={renderGalleryItem}
                    horizontal
                    pagingEnabled={false}
                    snapToInterval={slideStride}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    scrollEnabled={pagerScrollEnabled && pages.length > 1}
                    showsHorizontalScrollIndicator={false}
                    bounces={pages.length > 1}
                    keyboardShouldPersistTaps="handled"
                    getItemLayout={getItemLayout}
                    initialNumToRender={Math.min(
                      pages.length,
                      Math.max(safeInitial + 2, 3)
                    )}
                    maxToRenderPerBatch={3}
                    windowSize={5}
                    onScroll={galleryScrollHandler}
                    scrollEventThrottle={1}
                    onMomentumScrollEnd={onGalleryScrollSettled}
                    onScrollEndDrag={onGalleryScrollEndDrag}
                    onScrollToIndexFailed={({ index }) => {
                      const off = index * slideStride;
                      scrollX.value = off;
                      galleryRef.current?.scrollToOffset({
                        offset: off,
                        animated: false,
                      });
                    }}
                  />
                ) : (
                  <View
                    style={[
                      styles.loadingOverlay,
                      { backgroundColor: themeColors.background },
                    ]}
                    pointerEvents="none"
                  >
                    <ActivityIndicator
                      size="large"
                      color={themeColors.loadingIndicator}
                    />
                  </View>
                )}
              </View>
              {showCaptionChrome && expandLayout != null ? (
                <Animated.View
                  style={[styles.chromeCaptionLayer, chromeCaptionFadeStyle]}
                  pointerEvents={showUi ? "box-none" : "none"}
                >
                  <ExpandedImageCaption
                    caption={activeCaptionHtml}
                    authors={activeAuthors}
                    stageWidth={stageWidth}
                    bottomInset={captionBottomInset}
                    maxHeight={captionMaxHeight}
                  />
                </Animated.View>
              ) : null}
            </View>
          </Animated.View>
          <Animated.View
            style={[styles.chromeHeaderLayer, chromeHeaderFadeStyle]}
            pointerEvents={showUi ? "box-none" : "none"}
          >
            <ExpandedImageHeader
              pageTitle={headerPageTitle}
              sectionSubtitle={headerSectionSubtitle}
              sectionImagePosition={headerSectionImagePosition ?? undefined}
              onBack={collapseModal}
              externalLinkUrl={activeExternalLinkUrl}
              top={insets.top + headerChrome.rowTopInset}
            />
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: "transparent",
  },
  modalInner: {
    flex: 1,
    backgroundColor: "transparent",
  },
  expandedCard: {
    zIndex: 1,
  },
  expandedImageStage: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  galleryLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  expandedBlurDarken: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  galleryFlatList: {
    flex: 1,
    zIndex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  chromeHeaderLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
  chromeCaptionLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
});
