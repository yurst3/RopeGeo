import React, { useCallback, useEffect, useState } from "react";
import { type ImageLoadEventData } from "expo-image";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ExpandedImageZoomableImage } from "./ExpandedImageZoomableImage";
import type { ExpandedImageGalleryPage } from "@/utils/expandedImage/types";

export type ExpandedImageGallerySlideProps = {
  page: ExpandedImageGalleryPage;
  containerWidth: number;
  containerHeight: number;
  overlayShowsFullImage: boolean;
  /** When true, zoomable does not steal horizontal swipes (outer pager handles them). */
  disableEdgeNavigation: boolean;
  isActive: boolean;
  onToggleUi?: () => void;
  onZoomPanHideUi?: () => void;
  /** Only invoked when `isActive` — drives outer pager `scrollEnabled`. */
  onZoomedChange?: (zoomed: boolean) => void;
};

/**
 * One gallery page: zoomable full image + loading chrome.
 * Blurred banner is rendered once behind the pager (see `ExpandedImageBannerCrossfade`).
 */
export function ExpandedImageGallerySlide({
  page,
  containerWidth,
  containerHeight,
  overlayShowsFullImage,
  disableEdgeNavigation,
  isActive,
  onToggleUi,
  onZoomPanHideUi,
  onZoomedChange,
}: ExpandedImageGallerySlideProps) {
  const { loadingIndicator, image } = useColorTheme();
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [intrinsic, setIntrinsic] = useState({ width: 0, height: 0 });
  /** Drives pan activation: full pan when zoomed, restricted pan at 1× so the pager scrolls. */
  const [isZoomedForPan, setIsZoomedForPan] = useState(false);

  useEffect(() => {
    setFullImageLoaded(false);
    setIntrinsic({ width: 0, height: 0 });
    setIsZoomedForPan(false);
  }, [page.itemKey]);

  const handleZoomedChange = useCallback(
    (zoomed: boolean) => {
      setIsZoomedForPan(zoomed);
      if (isActive) {
        onZoomedChange?.(zoomed);
      }
    },
    [isActive, onZoomedChange]
  );

  const handleLoad = useCallback((ev: ImageLoadEventData) => {
    const { width: iw, height: ih } = ev.source;
    if (iw > 0 && ih > 0) {
      setIntrinsic({ width: iw, height: ih });
    }
  }, []);

  const handleLoadEnd = useCallback(() => {
    setFullImageLoaded(true);
  }, []);

  return (
    <View
      style={[
        styles.pageRoot,
        { width: containerWidth, height: containerHeight },
      ]}
    >
      <View style={styles.layers}>
        {overlayShowsFullImage ? (
          <ExpandedImageZoomableImage
            key={page.itemKey}
            source={page.fullUrl}
            imageOpacity={fullImageLoaded ? 1 : 0}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
            intrinsicWidth={intrinsic.width}
            intrinsicHeight={intrinsic.height}
            onToggleUi={onToggleUi}
            onZoomPanHideUi={onZoomPanHideUi}
            disableEdgeNavigation={disableEdgeNavigation}
            deferHorizontalPanToParent={disableEdgeNavigation}
            isZoomedForPan={isZoomedForPan}
            onZoomedChange={
              disableEdgeNavigation ? handleZoomedChange : undefined
            }
            onLoad={handleLoad}
            onLoadEnd={handleLoadEnd}
          />
        ) : null}
        {overlayShowsFullImage && !fullImageLoaded ? (
          <View
            style={[
              styles.placeholderOverlay,
              { backgroundColor: image.blurOverlay },
            ]}
            pointerEvents="none"
          >
            <ActivityIndicator size="large" color={loadingIndicator} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  layers: {
    flex: 1,
    backgroundColor: "transparent",
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
