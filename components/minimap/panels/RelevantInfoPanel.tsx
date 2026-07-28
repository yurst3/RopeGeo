import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import { ExpandedImageModal } from "@/components/expandedImage/ExpandedImageModal";
import { RelevanceStrengthPill } from "@/components/minimap/panels/RelevanceStrengthPill";
import { HiddenRelevantInfoPill } from "@/components/minimap/panels/HiddenRelevantInfoPill";
import { MeasurementContextPill } from "@/components/minimap/panels/MeasurementContextPill";
import { ROPEWIKI_ORIGIN } from "@/constants/ropewikiOrigin";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle, useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import type { ExpandedImageAnchorRect } from "@/utils/expandedImage/types";
import type {
  RelevantContextContent,
  RelevantImageRow,
} from "@/utils/minimap/relevantContextContent";
import { replaceEmbeddedImgTagsWithLinks } from "@/utils/ropewiki/replaceEmbeddedImgTagsWithLinks";
import {
  buildRopewikiHtmlTagsStyles,
  deriveRopewikiHtmlLineHeight,
  ROPEWIKI_CUSTOM_HTML_ELEMENT_MODELS,
  ROPEWIKI_HTML_DEFAULT_TEXT_PROPS,
  ROPEWIKI_HTML_IGNORED_STYLES,
  RENDER_HTML_SYSTEM_FONTS,
  toRenderHtmlTypographyStyle,
} from "@/utils/ropewiki/ropewikiRenderHtml";
import { colorWithAlpha } from "@/utils/color/colorWithAlpha";
import {
  useResolvedConstantSize,
  useResolvedIconSizeScale,
  useResolvedTypography,
} from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import RenderHtml from "react-native-render-html";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const EXPAND_MS = 280;
const COLLAPSE_MS = 260;
const EASE = Easing.out(Easing.cubic);

const CHEVRON_SIZE = 14;
const CARD_PADDING_HORIZONTAL = 12;
const IMAGE_HEIGHT = 110;
/** Always-visible custom scrollbar (native indicators hide when idle on iOS). */
const SCROLLBAR_WIDTH = 3;
const SCROLLBAR_MIN_THUMB = 24;
const SCROLLBAR_INSET = 3;

/**
 * Base opacity for surrounding excerpt context (before/after). A background
 * gradient overlay then fades the far edge into the card so context stays
 * secondary to the body without using MaskedView (Fabric-safe).
 */
const EXCERPT_CONTEXT_OPACITY = 0.5;

export type RelevantInfoPanelProps = {
  content: RelevantContextContent;
  /** Selected legend item name (fullscreen image subtitle). */
  legendItemName: string;
  /** Minimap title (fullscreen image header title). */
  miniMapTitle: string;
  expanded: boolean;
  maxHeight: number;
  leftOffset: number;
  /** Distance from the window's right edge (positions the card left of the map legend). */
  rightOffset: number;
  bottomOffset: number;
  onToggleExpanded: () => void;
  /**
   * Reports the card's settled footprint height (header plus expanded body when
   * expanded) so the parent can frame the camera above the overlay row.
   */
  onExpandedFootprintChange?: (height: number) => void;
};

function RelevantImageThumb({
  row,
  contentWidth,
  onOpenExpand,
  onLayoutRef,
}: {
  row: Extract<RelevantImageRow, { resolved: true }>;
  contentWidth: number;
  onOpenExpand: (imageId: string) => void;
  onLayoutRef: (imageId: string, el: View | null) => void;
}) {
  const themeColors = useColorTheme();
  const canExpand = row.fullSource != null;

  const setLayoutRef = useCallback(
    (el: View | null) => onLayoutRef(row.imageId, el),
    [row.imageId, onLayoutRef],
  );

  const onPress = useCallback(() => {
    onOpenExpand(row.imageId);
  }, [row.imageId, onOpenExpand]);

  return (
    <Pressable
      disabled={!canExpand}
      onPress={onPress}
      style={({ pressed }) => [
        styles.imageContainer,
        { backgroundColor: themeColors.image.background },
        canExpand && pressed && styles.imagePressed,
      ]}
      accessibilityRole={canExpand ? "imagebutton" : "image"}
    >
      <View
        ref={setLayoutRef}
        style={[styles.imageInner, { width: contentWidth }]}
        collapsable={false}
      >
        <Image
          source={row.previewSource ?? row.fullSource}
          style={styles.image}
          contentFit="cover"
        />
      </View>
    </Pressable>
  );
}

export function RelevantInfoPanel({
  content,
  legendItemName,
  miniMapTitle,
  expanded,
  maxHeight,
  leftOffset,
  rightOffset,
  bottomOffset,
  onToggleExpanded,
  onExpandedFootprintChange,
}: RelevantInfoPanelProps) {
  const themeColors = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const { font } = useText();
  const iconScale = useResolvedIconSizeScale();
  const chevronSize = Math.round(CHEVRON_SIZE * iconScale);
  const { minimap } = themeColors.map;
  const { text } = themeColors;
  const { bodyBackground, headerBackground, shadow } = minimap.legend;

  const bodyFontSize = useResolvedConstantSize(uiScale.map.text.relevantInfoBody);
  const bodyLineHeight = useMemo(
    () => deriveRopewikiHtmlLineHeight(bodyFontSize),
    [bodyFontSize],
  );
  const bodyTypography = useResolvedTypography(textStyle.map.relevantInfoBody);
  const captionFontSize = useResolvedConstantSize(uiScale.map.text.relevantInfoCaption);
  const captionLineHeight = useMemo(
    () => deriveRopewikiHtmlLineHeight(captionFontSize),
    [captionFontSize],
  );
  const captionTypography = useResolvedTypography(textStyle.map.relevantInfoCaption);
  const bodyTagsStyles = useMemo(
    () =>
      buildRopewikiHtmlTagsStyles({
        link: themeColors.text.link,
        secondary: themeColors.text.secondary,
        captionFontSize,
        captionTextAlign: "left",
        bodyFontSize,
        bodyLineHeight,
        bodyFontFamily: bodyTypography.fontFamily,
        bodyBoldFontFamily: font.display.fontFamily,
        relevantPhraseColor: themeColors.tabBar.iconFocused,
      }),
    [
      themeColors.text.link,
      themeColors.text.secondary,
      themeColors.tabBar.iconFocused,
      captionFontSize,
      bodyFontSize,
      bodyLineHeight,
      bodyTypography.fontFamily,
      font.display.fontFamily,
    ],
  );
  const captionTagsStyles = useMemo(
    () =>
      buildRopewikiHtmlTagsStyles({
        link: themeColors.text.link,
        secondary: themeColors.text.secondary,
        captionFontSize,
        captionTextAlign: "left",
        bodyFontSize: captionFontSize,
        bodyLineHeight: captionLineHeight,
        bodyFontFamily: captionTypography.fontFamily,
        bodyBoldFontFamily: font.display.fontFamily,
        relevantPhraseColor: themeColors.tabBar.iconFocused,
      }),
    [
      themeColors.text.link,
      themeColors.text.secondary,
      themeColors.tabBar.iconFocused,
      captionFontSize,
      captionLineHeight,
      captionTypography.fontFamily,
      font.display.fontFamily,
    ],
  );
  const bodyListRenderersProps = useMemo(
    () => ({
      ul: {
        markerTextStyle: {
          fontSize: bodyFontSize,
          lineHeight: bodyLineHeight,
          color: text.primary,
        },
      },
      ol: {
        markerTextStyle: {
          fontSize: bodyFontSize,
          lineHeight: bodyLineHeight,
          color: text.primary,
        },
      },
    }),
    [bodyFontSize, bodyLineHeight, text.primary],
  );

  const [cardWidth, setCardWidth] = useState(0);
  const contentWidth = Math.max(0, cardWidth - CARD_PADDING_HORIZONTAL * 2);

  const renderExcerptHtml = useCallback(
    (html: string) => (
      <RenderHtml
        contentWidth={contentWidth}
        source={{
          html: replaceEmbeddedImgTagsWithLinks(html),
          baseUrl: ROPEWIKI_ORIGIN,
        }}
        systemFonts={RENDER_HTML_SYSTEM_FONTS}
        baseStyle={{
          ...toRenderHtmlTypographyStyle(bodyTypography),
          fontSize: bodyFontSize,
          lineHeight: bodyLineHeight,
          color: text.primary,
        }}
        tagsStyles={bodyTagsStyles}
        renderersProps={bodyListRenderersProps}
        customHTMLElementModels={ROPEWIKI_CUSTOM_HTML_ELEMENT_MODELS}
        ignoredStyles={ROPEWIKI_HTML_IGNORED_STYLES}
        enableUserAgentStyles={false}
        defaultTextProps={ROPEWIKI_HTML_DEFAULT_TEXT_PROPS}
      />
    ),
    [
      contentWidth,
      bodyTypography,
      bodyFontSize,
      bodyLineHeight,
      text.primary,
      bodyTagsStyles,
      bodyListRenderersProps,
    ],
  );

  /**
   * Renders a context region (`before`/`after`) de-emphasized vs the body.
   * Uses a card-background LinearGradient overlay (not MaskedView) so the far
   * edge fades out — avoids Fabric view-recycling crashes on remount.
   */
  const renderExcerptContext = useCallback(
    (html: string, region: "before" | "after") => {
      // Fade to same RGB at alpha 0 — "transparent" is black@0 and greys out light backgrounds.
      const fadeOut = colorWithAlpha(bodyBackground, 0);
      const fadeColors: [string, string] =
        region === "before"
          ? [bodyBackground, fadeOut]
          : [fadeOut, bodyBackground];
      return (
        <View style={{ width: contentWidth }}>
          <View style={{ opacity: EXCERPT_CONTEXT_OPACITY }}>
            {renderExcerptHtml(html)}
          </View>
          <LinearGradient
            colors={fadeColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>
      );
    },
    [bodyBackground, contentWidth, renderExcerptHtml],
  );

  const [headerHeight, setHeaderHeight] = useState(0);
  const [bodyContentHeight, setBodyContentHeight] = useState(0);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const [scrollOffsetY, setScrollOffsetY] = useState(0);
  const bodyTargetHeight = Math.min(
    maxHeight,
    bodyContentHeight > 0 ? bodyContentHeight : maxHeight,
  );

  const showPersistentScrollbar =
    scrollViewportHeight > 0 && bodyContentHeight > scrollViewportHeight + 1;
  const scrollbarThumbHeight = showPersistentScrollbar
    ? Math.max(
        SCROLLBAR_MIN_THUMB,
        (scrollViewportHeight / bodyContentHeight) * scrollViewportHeight,
      )
    : 0;
  const scrollbarMaxTravel = Math.max(
    0,
    scrollViewportHeight - scrollbarThumbHeight - SCROLLBAR_INSET * 2,
  );
  const scrollbarMaxScroll = Math.max(1, bodyContentHeight - scrollViewportHeight);
  const scrollbarThumbTop =
    SCROLLBAR_INSET + (scrollOffsetY / scrollbarMaxScroll) * scrollbarMaxTravel;

  const onScrollBody = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollOffsetY(e.nativeEvent.contentOffset.y);
    },
    [],
  );
  const onScrollViewportLayout = useCallback((e: LayoutChangeEvent) => {
    setScrollViewportHeight(e.nativeEvent.layout.height);
  }, []);

  useEffect(() => {
    setScrollOffsetY(0);
  }, [content]);

  const bodyHeight = useSharedValue(0);
  const bodyOpacity = useSharedValue(0);

  useEffect(() => {
    if (expanded) {
      bodyOpacity.value = withTiming(1, { duration: Math.min(220, EXPAND_MS), easing: EASE });
      bodyHeight.value = withTiming(bodyTargetHeight, { duration: EXPAND_MS, easing: EASE });
    } else {
      bodyOpacity.value = withTiming(0, { duration: COLLAPSE_MS * 0.45, easing: EASE });
      bodyHeight.value = withTiming(0, { duration: COLLAPSE_MS, easing: EASE });
    }
  }, [expanded, bodyTargetHeight]);

  useEffect(() => {
    if (onExpandedFootprintChange == null || headerHeight === 0) return;
    onExpandedFootprintChange(headerHeight + (expanded ? bodyTargetHeight : 0));
  }, [onExpandedFootprintChange, headerHeight, expanded, bodyTargetHeight]);

  const animatedBodyStyle = useAnimatedStyle(() => ({
    height: bodyHeight.value,
    opacity: bodyOpacity.value,
    overflow: "hidden",
  }));

  const [modalVisible, setModalVisible] = useState(false);
  const [anchorRect, setAnchorRect] = useState<ExpandedImageAnchorRect | null>(null);
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, View>>(new Map());

  const handleLayoutRef = useCallback((imageId: string, el: View | null) => {
    if (el) {
      itemRefs.current.set(imageId, el);
    } else {
      itemRefs.current.delete(imageId);
    }
  }, []);

  const handleOpenExpand = useCallback(
    (imageId: string) => {
      const node = itemRefs.current.get(imageId);
      if (node == null) return;
      node.measureInWindow((x, y, width, height) => {
        setExpandedImageId(imageId);
        setAnchorRect({ x, y, width, height });
        setModalVisible(true);
      });
    },
    [],
  );

  const expandedGalleryIndex = useMemo(() => {
    if (expandedImageId == null) return 0;
    const i = content.galleryPages.findIndex((p) => p.itemKey === expandedImageId);
    return i >= 0 ? i : 0;
  }, [expandedImageId, content.galleryPages]);

  /** Keep the collapse animation anchored to the thumbnail of the page currently shown. */
  const handleGalleryPageChange = useCallback(
    (_pageIndex: number, itemKey: string) => {
      setExpandedImageId(itemKey);
      const node = itemRefs.current.get(itemKey);
      if (node == null) return;
      node.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          setAnchorRect({ x, y, width, height });
        }
      });
    },
    [],
  );

  const handleExpandedDismissed = useCallback(() => {
    setModalVisible(false);
    setExpandedImageId(null);
    setAnchorRect(null);
  }, []);

  const cardStyle = useMemo(
    () => [styles.card, { shadowColor: shadow }],
    [shadow],
  );
  const headerStyle = useMemo(
    () => [styles.header, { backgroundColor: headerBackground }],
    [headerBackground],
  );
  const listBodyStyle = useMemo(
    () => ({ backgroundColor: bodyBackground }),
    [bodyBackground],
  );
  const headerTitleStyle = useMemo(() => ({ color: text.primary }), [text.primary]);

  return (
    <View
      style={[
        styles.anchor,
        { bottom: bottomOffset, left: leftOffset, right: rightOffset },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={cardStyle}
        onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
      >
        <Pressable
          onPress={onToggleExpanded}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          style={({ pressed }) => [headerStyle, pressed && styles.headerPressed]}
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? "Collapse relevant info" : "Expand relevant info"
          }
        >
          <ScalingText
            size={uiScale.map.text.relevantInfoTitle}
            typography={textStyle.map.relevantInfoTitle}
            numberOfLines={1}
            measure={{ type: "width" }}
            containerStyle={styles.headerTitleWrap}
            style={headerTitleStyle}
          >
            Relevant Info
          </ScalingText>
          <View
            style={[styles.chevronSlot, { width: chevronSize }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <FontAwesome5
              name={expanded ? "chevron-down" : "chevron-up"}
              size={chevronSize}
              color={minimap.legend.collapseIcon}
            />
          </View>
        </Pressable>
        <Animated.View
          style={[animatedBodyStyle, listBodyStyle]}
          pointerEvents={expanded ? "auto" : "none"}
        >
          <View style={[{ maxHeight }, listBodyStyle, styles.scrollShell]}>
            <ScrollView
              style={styles.scrollView}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={onScrollBody}
              onLayout={onScrollViewportLayout}
              onContentSizeChange={(_, h) => {
                if (h > 0) setBodyContentHeight(h);
              }}
            >
              <View style={styles.body}>
                {content.measurements.length > 0 ? (
                  <View style={styles.measurementsColumn}>
                    {content.measurements.map((m, i) => (
                      <MeasurementContextPill
                        key={`${m.label}-${i}`}
                        label={m.label}
                        values={m.values}
                        strength={m.relevanceStrength}
                      />
                    ))}
                  </View>
                ) : null}
                {content.groups.map((group) => (
                  <View key={group.sectionKey || "page-level"} style={styles.group}>
                    {group.title != null ? (
                      <ScalingText
                        size={uiScale.map.text.relevantInfoSectionTitle}
                        typography={textStyle.map.relevantInfoSectionTitle}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        measure={{ type: "lineCount", maxLinesAtMaxSize: 2 }}
                        style={{ color: text.primary }}
                      >
                        {group.title}
                      </ScalingText>
                    ) : null}
                    {contentWidth > 0
                      ? group.excerpts.map((excerpt, i) => (
                          <View
                            key={`${group.sectionKey}-excerpt-${i}`}
                            style={styles.excerpt}
                          >
                            {excerpt.html.before != null
                              ? renderExcerptContext(excerpt.html.before, "before")
                              : null}
                            {renderExcerptHtml(excerpt.html.body)}
                            {excerpt.html.after != null
                              ? renderExcerptContext(excerpt.html.after, "after")
                              : null}
                            <RelevanceStrengthPill
                              strength={excerpt.relevanceStrength}
                            />
                          </View>
                        ))
                      : null}
                    {group.images.map((row) =>
                      row.resolved ? (
                        <View key={row.imageId} style={styles.imageBlock}>
                          <RelevantImageThumb
                            row={row}
                            contentWidth={contentWidth}
                            onOpenExpand={handleOpenExpand}
                            onLayoutRef={handleLayoutRef}
                          />
                          {row.captionHtml != null && contentWidth > 0 ? (
                            <RenderHtml
                              contentWidth={contentWidth}
                              source={{
                                html: replaceEmbeddedImgTagsWithLinks(row.captionHtml),
                                baseUrl: ROPEWIKI_ORIGIN,
                              }}
                              systemFonts={RENDER_HTML_SYSTEM_FONTS}
                              baseStyle={{
                                ...toRenderHtmlTypographyStyle(captionTypography),
                                fontSize: captionFontSize,
                                lineHeight: captionLineHeight,
                                color: text.secondary,
                                textAlign: "left",
                              }}
                              tagsStyles={captionTagsStyles}
                              customHTMLElementModels={ROPEWIKI_CUSTOM_HTML_ELEMENT_MODELS}
                              ignoredStyles={ROPEWIKI_HTML_IGNORED_STYLES}
                              enableUserAgentStyles={false}
                              defaultTextProps={{
                                ...ROPEWIKI_HTML_DEFAULT_TEXT_PROPS,
                                numberOfLines: 3,
                                ellipsizeMode: "clip",
                              }}
                            />
                          ) : null}
                          <RelevanceStrengthPill strength={row.relevanceStrength} />
                        </View>
                      ) : (
                        <View
                          key={`unresolved-${row.imageId}`}
                          style={[
                            styles.imageBlock,
                            styles.imageErrorWrap,
                            { backgroundColor: themeColors.image.background },
                          ]}
                        >
                          <ConstantText
                            size={uiScale.map.text.relevantInfoError}
                            typography={textStyle.map.relevantInfoError}
                            style={{ color: text.error }}
                          >
                            Error loading relevant image
                          </ConstantText>
                          <RelevanceStrengthPill strength={row.relevanceStrength} />
                        </View>
                      ),
                    )}
                  </View>
                ))}
                {content.hiddenByStrength.length > 0 ? (
                  <View style={styles.hiddenPillsRow}>
                    {content.hiddenByStrength.map(({ strength, count }) => (
                      <HiddenRelevantInfoPill
                        key={strength}
                        strength={strength}
                        count={count}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            </ScrollView>
            {showPersistentScrollbar ? (
              <View
                style={[styles.scrollbarTrack, { height: scrollViewportHeight }]}
                pointerEvents="none"
              >
                <View
                  style={[
                    styles.scrollbarThumb,
                    {
                      height: scrollbarThumbHeight,
                      backgroundColor: text.secondary,
                      transform: [{ translateY: scrollbarThumbTop }],
                    },
                  ]}
                />
              </View>
            ) : null}
          </View>
        </Animated.View>
      </View>
      {modalVisible && anchorRect != null && content.galleryPages.length > 0 ? (
        <ExpandedImageModal
          anchorRect={anchorRect}
          pages={content.galleryPages}
          initialPageIndex={expandedGalleryIndex}
          onPageChange={handleGalleryPageChange}
          headerPageTitle={miniMapTitle}
          headerSectionSubtitle={legendItemName}
          onDismissed={handleExpandedDismissed}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    zIndex: 50,
  },
  card: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerPressed: {
    opacity: 0.85,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  chevronSlot: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: CARD_PADDING_HORIZONTAL,
    paddingVertical: 10,
    gap: 10,
  },
  scrollShell: {
    position: "relative",
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollbarTrack: {
    position: "absolute",
    top: 0,
    right: SCROLLBAR_INSET,
    width: SCROLLBAR_WIDTH,
  },
  scrollbarThumb: {
    width: SCROLLBAR_WIDTH,
    borderRadius: SCROLLBAR_WIDTH / 2,
    opacity: 0.55,
  },
  measurementsColumn: {
    gap: 6,
    alignSelf: "stretch",
  },
  group: {
    gap: 6,
  },
  excerpt: {
    gap: 10,
  },
  imageBlock: {
    gap: 10,
  },
  hiddenPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 6,
  },
  imageErrorWrap: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  imagePressed: {
    opacity: 0.92,
  },
  imageInner: {
    height: IMAGE_HEIGHT,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
