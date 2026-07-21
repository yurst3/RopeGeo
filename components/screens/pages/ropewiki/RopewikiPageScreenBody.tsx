import { BackButton } from "@/components/buttons/standard/BackButton";
import { SaveButton } from "@/components/buttons/standard/SaveButton";
import { ShareButton } from "@/components/buttons/standard/ShareButton";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useDownloadJobQueue } from "@/context/data/DownloadJobQueueContext";
import { useSavedTabHighlight } from "@/context/ui/SavedTabHighlightContext";
import { useSavedPages } from "@/context/data/SavedPagesContext";
import { useShareSheetDimmer } from "@/context/ui/ShareSheetDimmerContext";
import { ExpandedImageModal } from "@/components/expandedImage/ExpandedImageModal";
import type { ExpandedImageAnchorRect } from "@/utils/expandedImage/types";
import { PageBanner } from "./PageBanner";
import { PageContent as PageScrollContent } from "./PageContent";
import { PAGE_SEAM_FLOAT_OFFSET } from "./PageSeamButtons";
import { useHeaderChromeLayout, useToastChromeLayout } from "@/utils/layout/buttonChromeLayout";
import {
  TOAST_KEY_DOWNLOAD_CANCELLED,
  TOAST_KEY_PAGE_SAVED,
} from "@/constants/toasts/toastArchetypes";
import { getToastArchetypeForKey } from "@/constants/toasts/helpers";
import {
  pageDownloadUiFromJobSnapshot,
  useDownloadProgressToasts,
} from "@/utils/toast/useDownloadProgressToasts";
import { ToastKeyCollisionError, useToast } from "@/context/ui/ToastContext";
import { usePathname } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PanResponder,
  Platform,
  Share,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  PageDataSource,
  RopewikiPageView,
  OfflineRopewikiPageView,
  type OnlineRopewikiPageView,
} from "ropegeo-common/models";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STARTING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);
/** Max banner height at scroll 0; shrinks as user scrolls, never below BANNER_HEIGHT (keeps width ≥ screen). */
const BANNER_HEIGHT_MAX = SCREEN_HEIGHT;
/** Fallback when image dimensions are not yet available (e.g. no image or before load). */
const FALLBACK_BANNER_ASPECT_RATIO = SCREEN_WIDTH / STARTING_HEIGHT;
const CARD_BORDER_RADIUS = 24;

function ropewikiPageShareUrl(pageId: string, source: PageDataSource): string {
  return `https://mobile.ropegeo.com/explore/${encodeURIComponent(pageId)}/page?source=${encodeURIComponent(source)}`;
}
/** Same tap thresholds as `RopewikiRegionScreen` hero layer (pans disabled for single-image page). */
const TAP_MAX_DISPLACEMENT = 10;
const TAP_MAX_DURATION_MS = 300;

/** Visualize the hero hit strip; set `true` while debugging layout. */
const DEBUG_BANNER_EXPAND_HIT_OUTLINE = false;

export type RopewikiPageScreenBodyProps = {
  pageId: string;
  data: RopewikiPageView | OfflineRopewikiPageView;
};

export function RopewikiPageScreenBody({
  pageId,
  data,
}: RopewikiPageScreenBodyProps) {
  const { background } = useColorTheme();
  const insets = useSafeAreaInsets();
  const headerChrome = useHeaderChromeLayout();
  const toastChrome = useToastChromeLayout();
  const { showPill, dismiss, upsertPill } = useToast();
  const { abortJob, enqueuePageDownload, getJobUISnapshot, takeInvalidStoredDownloadPageId } =
    useDownloadJobQueue();
  const pathname = usePathname();
  const { setHighlightSavedTab } = useSavedTabHighlight();
  const {
    isSaved,
    removeSaved,
    toggleSaveFromRopewikiPage,
    removeDownloadBundle,
    savedEntries,
  } = useSavedPages();
  const { showShareDimmer, hideShareDimmer } = useShareSheetDimmer();
  const saved = isSaved(pageId);
  const savedEntry = savedEntries.find((e) => e.preview.id === pageId) ?? null;
  const isDownloaded = savedEntry?.downloadedPageViewPath != null;
  const routeTypeResolved = data.routeType;
  const downloadJob = getJobUISnapshot(pageId);
  const downloading =
    downloadJob?.state === "queued" || downloadJob?.state === "running";
  const downloadUi = useMemo(
    () => pageDownloadUiFromJobSnapshot(downloadJob),
    [downloadJob],
  );

  useEffect(() => {
    if (!pathname.includes("/saved/")) {
      return;
    }
    if (!takeInvalidStoredDownloadPageId(pageId)) {
      return;
    }
    const invalidKey = `error-download-invalid-${pageId}`;
    const savedPageRoute = `/saved/${pageId}/page`;
    const durationMs = getToastArchetypeForKey(invalidKey)?.durationMs ?? 5000;
    try {
      showPill({
        key: invalidKey,
        message: "Error downloading page",
        subtitle: "Invalid stored download job",
        durationMs,
        allowedRoutes: [savedPageRoute],
        horizontalInset: toastChrome.horizontalInset,
      });
    } catch (error) {
      if (!(error instanceof ToastKeyCollisionError)) {
        throw error;
      }
      upsertPill({
        key: invalidKey,
        message: "Error downloading page",
        subtitle: "Invalid stored download job",
        durationMs,
        allowedRoutes: [savedPageRoute],
        horizontalInset: toastChrome.horizontalInset,
      });
    }
  }, [pageId, pathname, showPill, takeInvalidStoredDownloadPageId, upsertPill]);

  const onRemoveDownloadPress = useCallback(async () => {
    if (!isDownloaded) return;
    await removeDownloadBundle(pageId);
  }, [isDownloaded, pageId, removeDownloadBundle]);

  const dismissSavedToastImmediate = useCallback(() => {
    dismiss(TOAST_KEY_PAGE_SAVED);
    setHighlightSavedTab(false);
  }, [dismiss, setHighlightSavedTab]);

  const showSavedToast = useCallback(() => {
    const savedToastDurationMs =
      getToastArchetypeForKey(TOAST_KEY_PAGE_SAVED)?.durationMs ?? null;
    const pageAllowedRoutes = [`/explore/${pageId}/page`, `/saved/${pageId}/page`];
    dismiss(TOAST_KEY_PAGE_SAVED);
    setHighlightSavedTab(true);
    try {
      showPill({
        key: TOAST_KEY_PAGE_SAVED,
        message: "Page saved",
        durationMs: savedToastDurationMs,
        allowedRoutes: pageAllowedRoutes,
        horizontalInset: toastChrome.horizontalInset,
        onDismissed: () => {
          setHighlightSavedTab(false);
        },
      });
    } catch (error) {
      if (!(error instanceof ToastKeyCollisionError)) {
        throw error;
      }
      upsertPill({
        key: TOAST_KEY_PAGE_SAVED,
        message: "Page saved",
        durationMs: savedToastDurationMs,
        allowedRoutes: pageAllowedRoutes,
        horizontalInset: toastChrome.horizontalInset,
        onDismissed: () => {
          setHighlightSavedTab(false);
        },
      });
    }
  }, [dismiss, pageId, setHighlightSavedTab, showPill, upsertPill]);

  const onSavePress = () => {
    if (saved) {
      dismissSavedToastImmediate();
      if (downloading) {
        abortJob(pageId);
        const cancelKey = `${TOAST_KEY_DOWNLOAD_CANCELLED}-${pageId}`;
        const pageAllowedRoutes = [`/explore/${pageId}/page`, `/saved/${pageId}/page`];
        const cancelDurationMs =
          getToastArchetypeForKey(cancelKey)?.durationMs ?? 5000;
        try {
          showPill({
            key: cancelKey,
            message: "Download cancelled",
            durationMs: cancelDurationMs,
            allowedRoutes: pageAllowedRoutes,
            horizontalInset: toastChrome.horizontalInset,
          });
        } catch (error) {
          if (!(error instanceof ToastKeyCollisionError)) {
            throw error;
          }
          upsertPill({
            key: cancelKey,
            message: "Download cancelled",
            durationMs: cancelDurationMs,
            allowedRoutes: pageAllowedRoutes,
            horizontalInset: toastChrome.horizontalInset,
          });
        }
      }
      removeSaved(pageId);
      return;
    }
    if (data.fetchType === "online") {
      toggleSaveFromRopewikiPage(data);
    }
    showSavedToast();
  };
  /** True until `Share.share` settles; keeps page non-interactive even if the dimmer was dismissed. */
  const [shareInteractionLocked, setShareInteractionLocked] = useState(false);
  const onSharePress = useCallback(async () => {
    const url = ropewikiPageShareUrl(pageId, PageDataSource.Ropewiki);
    setShareInteractionLocked(true);
    showShareDimmer();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    try {
      await Share.share(Platform.OS === "ios" ? { url } : { message: url });
    } catch {
      // Share can reject when unavailable or cancelled on some platforms.
    } finally {
      setShareInteractionLocked(false);
      hideShareDimmer();
    }
  }, [pageId, showShareDimmer, hideShareDimmer]);
  const onDownloadPress = useCallback(() => {
    if (downloading || isDownloaded || data.fetchType !== "online") return;
    const onlineData = data as OnlineRopewikiPageView;
    if (!saved) {
      showSavedToast();
    }
    enqueuePageDownload({
      pageId,
      data: onlineData,
    });
  }, [
    data,
    downloading,
    enqueuePageDownload,
    isDownloaded,
    pageId,
    saved,
    showSavedToast,
  ]);
  const [bannerAspectRatio, setBannerAspectRatio] = useState<number | null>(null);
  const [bannerImageLoading, setBannerImageLoading] = useState(true);
  const bannerUrl =
    data.bannerImage == null
      ? null
      : data.bannerImage.fetchType === "online"
        ? data.bannerImage.bannerUrl
        : data.bannerImage.downloadedBannerPath;
  const hasBannerImageObject = data.bannerImage != null;

  const scrollY = useSharedValue(0);
  /** JS copy of scroll offset (throttled) so we can clip the banner hit rect above the overlapping card. */
  const [contentScrollY, setContentScrollY] = useState(0);
  const lastBannerHitScrollRef = useRef(0);
  const [mapExpanded, setMapExpanded] = useState(false);
  const aspectRatioSv = useSharedValue(FALLBACK_BANNER_ASPECT_RATIO);
  const startHeightSv = useSharedValue(STARTING_HEIGHT);
  const onBannerImageLoad = useCallback((width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    const ratio = width / height;
    setBannerAspectRatio(ratio);
    aspectRatioSv.value = ratio;
  }, [aspectRatioSv, pageId]);
  const [cardHeight, setCardHeight] = useState<number | null>(null);

  useDownloadProgressToasts({
    downloadUi,
    resetKey: pageId,
    toastVisible: !mapExpanded,
    horizontalInset: toastChrome.horizontalInset,
  });

  /** Full banner bounds for expand animation (`measureInWindow`). Hit testing uses a clipped overlay. */
  const expandAnchorRef = useRef<View>(null);
  const bannerFullRectRef = useRef<View>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const [heroPressed, setHeroPressed] = useState(false);
  const heroResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderRelease: () => {},
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [bannerExpandAnchor, setBannerExpandAnchor] =
    useState<ExpandedImageAnchorRect | null>(null);
  const bannerFullUrl =
    data.bannerImage == null
      ? null
      : data.bannerImage.fetchType === "online"
        ? data.bannerImage.fullUrl
        : data.bannerImage.downloadedFullPath;
  /** Prefer full-res URL; fall back to banner so expand works when API omits `fullUrl`. */
  const bannerExpandSourceUrl = bannerFullUrl ?? bannerUrl;

  useEffect(() => {
    setMapExpanded(false);
    setBannerExpanded(false);
    setBannerExpandAnchor(null);
    setContentScrollY(0);
    lastBannerHitScrollRef.current = 0;
    dismissSavedToastImmediate();
  }, [pageId, dismissSavedToastImmediate]);

  useEffect(() => {
    if (mapExpanded) {
      dismiss(TOAST_KEY_PAGE_SAVED);
    }
  }, [mapExpanded, dismiss]);

  const flushBannerHitScrollFromEvent = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      lastBannerHitScrollRef.current = Math.round(y * 2) / 2;
      setContentScrollY(y);
    },
    []
  );

  const openBannerExpanded = useCallback(() => {
    if (bannerExpandSourceUrl == null) return;
    const node = bannerFullRectRef.current;
    if (node == null) return;
    node.measureInWindow((x, y, width, height) => {
      setBannerExpandAnchor({ x, y, width, height });
      setBannerExpanded(true);
    });
  }, [bannerExpandSourceUrl]);

  const onBannerExpandedDismissed = useCallback(() => {
    setBannerExpanded(false);
    setBannerExpandAnchor(null);
  }, []);

  const onScrollOffsetForBannerHit = useCallback((y: number) => {
    const q = Math.round(y * 2) / 2;
    if (Math.abs(q - lastBannerHitScrollRef.current) < 2) {
      return;
    }
    lastBannerHitScrollRef.current = q;
    setContentScrollY(q);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      scrollY.value = y;
      runOnJS(onScrollOffsetForBannerHit)(y);
    },
  });

  useEffect(() => {
    if (!bannerUrl) {
      setBannerAspectRatio(null);
      setBannerImageLoading(false);
      return;
    }
    setBannerImageLoading(true);
    Image.loadAsync(bannerUrl)
      .then((ref) => {
        const ratio = ref.width / ref.height;
        setBannerAspectRatio(ratio);
        aspectRatioSv.value = ratio;
      })
      .catch(() => setBannerAspectRatio(null));
  }, [bannerUrl, aspectRatioSv]);

  const bottomPadding = insets.bottom + 16;
  const paddingTop =
    cardHeight != null && cardHeight < SCREEN_HEIGHT / 2
      ? Math.max(0, SCREEN_HEIGHT - cardHeight - bottomPadding)
      : STARTING_HEIGHT;

  useEffect(() => {
    startHeightSv.value = paddingTop;
  }, [paddingTop, startHeightSv]);

  const bannerAnimatedStyle = useAnimatedStyle(() => {
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

  /** Match `bannerAnimatedStyle` height logic in JS (see useAnimatedStyle above). */
  const bannerHeightJs = (() => {
    const ratio =
      bannerAspectRatio != null && bannerAspectRatio > 0
        ? bannerAspectRatio
        : FALLBACK_BANNER_ASPECT_RATIO;
    const minFromImage = Math.round(SCREEN_WIDTH / ratio);
    const parallax = Math.min(BANNER_HEIGHT_MAX, paddingTop - contentScrollY);
    return Math.max(minFromImage, parallax);
  })();

  /**
   * Hero hit target: full window width × `bannerTapHeight` (same horizontal span as
   * `RopewikiRegionScreen` hero layer). Seam controls may need a higher z-index if taps are stolen.
   */
  const bannerExpandHitRect =
    bannerUrl != null && bannerExpandSourceUrl != null
      ? { left: 0, width: SCREEN_WIDTH }
      : null;

  /** Top edge of the overlapping card in window Y; only the banner above this should capture taps. */
  const cardTopWindowY = paddingTop - CARD_BORDER_RADIUS - contentScrollY;
  const bannerTapHeight = Math.max(
    0,
    Math.min(bannerHeightJs, cardTopWindowY - PAGE_SEAM_FLOAT_OFFSET),
  );
  const bannerHitActive =
    bannerTapHeight >= 12 && !bannerImageLoading && !mapExpanded;

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View
        ref={expandAnchorRef}
        style={styles.shareBlockableLayer}
        pointerEvents={shareInteractionLocked ? "none" : "auto"}
        collapsable={false}
      >
      <PageBanner
        imageFrameStyle={bannerAnimatedStyle}
        bannerUrl={bannerUrl}
        hasBannerImageObject={hasBannerImageObject}
        bannerImageLoading={bannerImageLoading}
        bannerFullRectRef={bannerFullRectRef}
        onBannerImageLoad={onBannerImageLoad}
        onBannerImageLoadEnd={() => setBannerImageLoading(false)}
      />

      {bannerExpandHitRect != null && !mapExpanded ? (
        <Animated.View
          {...heroResponder.panHandlers}
          pointerEvents={bannerHitActive ? "box-only" : "none"}
          onTouchStart={(e) => {
            if (!bannerHitActive) return;
            setHeroPressed(true);
            touchStartRef.current = {
              x: e.nativeEvent.pageX,
              y: e.nativeEvent.pageY,
              time: Date.now(),
            };
          }}
          onTouchEnd={(e) => {
            setHeroPressed(false);
            const start = touchStartRef.current;
            touchStartRef.current = null;
            if (start == null || !bannerHitActive) return;
            const dx = Math.abs(e.nativeEvent.pageX - start.x);
            const dy = Math.abs(e.nativeEvent.pageY - start.y);
            const dt = Date.now() - start.time;
            if (
              dx < TAP_MAX_DISPLACEMENT &&
              dy < TAP_MAX_DISPLACEMENT &&
              dt < TAP_MAX_DURATION_MS
            ) {
              openBannerExpanded();
            }
          }}
          style={[
            styles.heroBannerLayer,
            {
              top: 0,
              height: bannerTapHeight,
              left: bannerExpandHitRect.left,
              width: bannerExpandHitRect.width,
              opacity: heroPressed && bannerHitActive ? 0.94 : 1,
              ...(DEBUG_BANNER_EXPAND_HIT_OUTLINE
                ? { borderWidth: 2, borderColor: "red" }
                : {}),
            },
          ]}
        />
      ) : null}

      <PageScrollContent
        pageId={pageId}
        data={data}
        routeTypeResolved={routeTypeResolved}
        insets={insets}
        paddingTop={paddingTop}
        onScroll={scrollHandler}
        onScrollEndDrag={flushBannerHitScrollFromEvent}
        onMomentumScrollEnd={flushBannerHitScrollFromEvent}
        onCardHeightLayout={setCardHeight}
        onMapExpandedChange={setMapExpanded}
        expandAnchorRef={expandAnchorRef}
        isDownloaded={isDownloaded}
        downloading={downloading}
        downloadDisplayStep={
          downloadUi.kind === "progress" ? downloadUi.displayStep : 0
        }
        downloadDisplayTotal={
          downloadUi.kind === "progress" ? downloadUi.displayTotal : 0
        }
        downloadPhaseProgress={
          downloadUi.kind === "progress" ? downloadUi.phaseProgress : 0
        }
        onDownloadPress={onDownloadPress}
        onRemoveDownloadPress={onRemoveDownloadPress}
      />

      {!mapExpanded && (
        <>
          <BackButton
            handleHardwareBack
            top={insets.top + headerChrome.rowTopInset}
          />
          <SaveButton
            saved={saved}
            onPress={onSavePress}
            top={insets.top + headerChrome.rowTopInset}
          />
          <ShareButton
            onPress={onSharePress}
            top={
              insets.top +
              headerChrome.rowTopInset +
              headerChrome.buttonSize +
              headerChrome.gap
            }
          />
        </>
      )}
      {bannerExpanded &&
      bannerExpandAnchor != null &&
      bannerExpandSourceUrl != null ? (
        <ExpandedImageModal
          anchorRect={bannerExpandAnchor}
          pages={[
            {
              itemKey: "page-banner",
              fullUrl: bannerExpandSourceUrl,
              bannerUrl,
              linkUrl: data.bannerImage?.linkUrl ?? null,
              captionHtml: data.bannerImage?.caption ?? null,
              authors: data.bannerImage?.authors ?? null,
            },
          ]}
          initialPageIndex={0}
          headerPageTitle={data.name}
          onDismissed={onBannerExpandedDismissed}
        />
      ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroBannerLayer: {
    position: "absolute",
    zIndex: 2000,
  },
  shareBlockableLayer: {
    flex: 1,
  },
});
