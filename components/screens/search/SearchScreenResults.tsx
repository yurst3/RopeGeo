import { FilterBottomSheet, type FilterSheetMode } from "@/components/modals/FilterBottomSheet";
import { useNetworkRequestToasts } from "@/utils/toast/useNetworkRequestToasts";
import { useSearchChromeStackedLayout, useToastChromeLayout } from "@/utils/layout/buttonChromeLayout";
import {
  TOAST_KEY_SEARCH_ERROR,
  TOAST_KEY_SEARCH_NO_RESULTS,
} from "@/constants/toasts/toastArchetypes";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useToast } from "@/context/ui/ToastContext";
import { OfflineLoadMoreBlockedFooter } from "@/components/lists/OfflineLoadMoreBlockedFooter";
import { PlaceholderPreview } from "@/components/previews/PlaceholderPreview";
import { PagePreview } from "@/components/previews/PagePreview";
import { RegionPreview } from "@/components/previews/RegionPreview";
import { ConstantText } from "@/components/text/ConstantText";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { usePreviewTextMetrics } from "@/utils/layout/previewLayout";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { NO_NETWORK_MESSAGE } from "@/utils/network/messages";
import { type OnlinePagePreview, Preview } from "ropegeo-common/models";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOAD_MORE_BOTTOM_THRESHOLD = 100;
const SEARCH_HTTP_PLACEHOLDER_COUNT = 8;

type SearchScreenResultsProps = {
  filterSheetOpen: boolean;
  onCloseFilterSheet: () => void;
  filterSheetMode: FilterSheetMode | null;
  awaitingDistanceGps: boolean;
  isOnline: boolean;
  queryKey: string;
  loadingNextPage: boolean;
  data: Preview[] | null;
  errors: Error | null;
  loadNextPage: () => void;
  morePages: boolean;
  timeoutCountdown: number | null;
  onRetryRequest: () => void;
  onDismissKeyboard: () => void;
};

export function SearchScreenResults({
  filterSheetOpen,
  onCloseFilterSheet,
  filterSheetMode,
  awaitingDistanceGps,
  isOnline,
  queryKey,
  loadingNextPage,
  data,
  errors,
  loadNextPage,
  morePages,
  timeoutCountdown,
  onRetryRequest,
  onDismissKeyboard,
}: SearchScreenResultsProps) {
  const themeColors = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const previewMetrics = usePreviewTextMetrics();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { upsertPill, dismiss } = useToast();
  const searchChrome = useSearchChromeStackedLayout();
  const toastChrome = useToastChromeLayout();
  const scrollYRef = useRef(0);
  const layoutHRef = useRef(0);
  const contentHRef = useRef(0);
  const [listNearBottom, setListNearBottom] = useState(false);

  useNetworkRequestToasts({
    errors: null,
    timeoutCountdown: null,
    resetKey: "search-connectivity",
    offlineSurfaceActive: isFocused,
  });

  useNetworkRequestToasts({
    errors,
    timeoutCountdown,
    resetKey: queryKey,
    watchOffline: false,
    errorToastKey: TOAST_KEY_SEARCH_ERROR,
    errorToastTitle: "Error getting search results",
    incrementErrorMultipleOnCollision: true,
    onRetryRequest,
  });

  const updateNearBottomFromMetrics = useCallback(
    (contentOffsetY: number, contentHeight: number, layoutHeight: number) => {
      const canScroll = contentHeight > layoutHeight;
      const isNearBottom =
        contentOffsetY + layoutHeight >= contentHeight - LOAD_MORE_BOTTOM_THRESHOLD;
      const atBottom = !canScroll || isNearBottom;
      setListNearBottom(atBottom);
      if (isOnline && canScroll && isNearBottom && morePages && !loadingNextPage) {
        loadNextPage();
      }
    },
    [isOnline, morePages, loadingNextPage, loadNextPage],
  );

  const wrappedOnScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      scrollYRef.current = contentOffset.y;
      layoutHRef.current = layoutMeasurement.height;
      contentHRef.current = contentSize.height;
      updateNearBottomFromMetrics(
        contentOffset.y,
        contentSize.height,
        layoutMeasurement.height,
      );
    },
    [updateNearBottomFromMetrics],
  );

  const recheckScrollBottom = useCallback(() => {
    updateNearBottomFromMetrics(
      scrollYRef.current,
      contentHRef.current,
      layoutHRef.current,
    );
  }, [updateNearBottomFromMetrics]);

  useEffect(() => {
    if (isOnline) {
      setListNearBottom(false);
    }
  }, [isOnline]);

  const items = data ?? [];
  const isNoNetworkSoft = errors?.message === NO_NETWORK_MESSAGE;
  const loading = data === null && errors === null;
  const showLoadingSkeletons = loading;
  const showErrorSkeletons = !loading && items.length === 0 && errors != null;
  const showNoResultsOnly =
    !loading && data !== null && errors == null && items.length === 0;
  const showResultsList = items.length > 0;
  const showScroll = showLoadingSkeletons || showErrorSkeletons || showResultsList;

  const showOfflineLoadMoreBlocked =
    !isOnline && morePages && items.length > 0 && listNearBottom;
  const showErroredLoadMoreBlocked =
    errors != null && items.length > 0 && listNearBottom;

  useEffect(() => {
    if (!showErrorSkeletons) {
      dismiss(TOAST_KEY_SEARCH_ERROR);
      return;
    }
    if (isOnline) {
      return;
    }
    const message = isNoNetworkSoft ? NO_NETWORK_MESSAGE : (errors?.message ?? "Error");
    upsertPill({
      key: TOAST_KEY_SEARCH_ERROR,
      message,
      durationMs: null,
      horizontalInset: toastChrome.horizontalInset,
    });
  }, [showErrorSkeletons, isOnline, isNoNetworkSoft, errors, dismiss, upsertPill]);

  useEffect(() => {
    if (!showNoResultsOnly) {
      dismiss(TOAST_KEY_SEARCH_NO_RESULTS);
      return;
    }
    upsertPill({
      key: TOAST_KEY_SEARCH_NO_RESULTS,
      message: "No results. Try another term or change filters.",
      durationMs: null,
      horizontalInset: toastChrome.horizontalInset,
    });
  }, [showNoResultsOnly, dismiss, upsertPill]);

  const contentTopPadding = insets.top + searchChrome.stackedAnchorOffset;

  return (
    <>
      <Pressable style={styles.content} onPress={onDismissKeyboard}>
        {awaitingDistanceGps ? (
          <View style={[styles.centered, { paddingTop: contentTopPadding }]}>
            <ActivityIndicator
              size="large"
              color={themeColors.loadingIndicator}
            />
            <ConstantText
              size={uiScale.toast.text.message}
              typography={textStyle.toast.message}
              style={[styles.locationWaitText, { color: themeColors.text.secondary }]}
            >
              Getting your location…
            </ConstantText>
          </View>
        ) : (
          <>
            {showScroll ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingTop: contentTopPadding,
                    gap: previewMetrics.itemGap,
                  },
                ]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScroll={wrappedOnScroll}
                scrollEventThrottle={16}
                onLayout={(e) => {
                  layoutHRef.current = e.nativeEvent.layout.height;
                  recheckScrollBottom();
                }}
                onContentSizeChange={(_w, h) => {
                  contentHRef.current = h;
                  recheckScrollBottom();
                }}
              >
                {showLoadingSkeletons
                  ? Array.from({ length: SEARCH_HTTP_PLACEHOLDER_COUNT }).map((_, i) => (
                      <PlaceholderPreview
                        key={`sk-${i}`}
                        showAkaLine={i % 2 === 0}
                      />
                    ))
                  : null}
                {showErrorSkeletons
                  ? Array.from({ length: SEARCH_HTTP_PLACEHOLDER_COUNT }).map((_, i) => (
                      <PlaceholderPreview
                        key={`err-${i}`}
                        error
                        showAkaLine={i % 2 === 0}
                      />
                    ))
                  : null}
                {showResultsList
                  ? items.map((item, index) =>
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
                      ) : null,
                    )
                  : null}
                {loadingNextPage ? (
                  <PlaceholderPreview
                    key="load-more-footer"
                    showAkaLine={items.length % 2 === 0}
                  />
                ) : null}
                {showOfflineLoadMoreBlocked || showErroredLoadMoreBlocked ? (
                  <OfflineLoadMoreBlockedFooter />
                ) : null}
              </ScrollView>
            ) : null}
            {showNoResultsOnly ? (
              <View style={[styles.noResultsFill, { paddingTop: contentTopPadding }]} />
            ) : null}
          </>
        )}
      </Pressable>
      <FilterBottomSheet
        visible={filterSheetOpen}
        onClose={onCloseFilterSheet}
        mode={filterSheetMode}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  noResultsFill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  locationWaitText: {
    marginTop: 12,
    textAlign: "center",
  },
});
