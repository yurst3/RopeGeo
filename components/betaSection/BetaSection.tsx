import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import RenderHtml from "react-native-render-html";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type {
  OfflineBetaSection,
  OnlineBetaSection,
} from "ropegeo-common/models";
import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import { ROPEWIKI_ORIGIN } from "@/constants/ropewikiOrigin";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle, useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { colorWithAlpha } from "@/utils/color/colorWithAlpha";
import { useFabulousTitle } from "@/utils/theme/useFabulousTitle";
import { replaceEmbeddedImgTagsWithLinks } from "@/utils/ropewiki/replaceEmbeddedImgTagsWithLinks";
import {
  buildRopewikiHtmlTagsStyles,
  ROPEWIKI_CUSTOM_HTML_ELEMENT_MODELS,
  ROPEWIKI_HTML_DEFAULT_TEXT_PROPS,
  ROPEWIKI_HTML_IGNORED_STYLES,
  RENDER_HTML_SYSTEM_FONTS,
  toRenderHtmlTypographyStyle,
} from "@/utils/ropewiki/ropewikiRenderHtml";
import {
  useResolvedConstantSize,
  useResolvedIconSizeScale,
  useResolvedTypography,
} from "@/utils/theme/resolvers";
import { BetaSectionImages } from "./BetaSectionImages";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING_HORIZONTAL = 20;
const CONTENT_WIDTH = SCREEN_WIDTH - CARD_PADDING_HORIZONTAL * 2;
const TEXT_MAX_HEIGHT = 150;
const EXPAND_COLLAPSE_MS = 280;
/** Bottom fade height when collapsed; softens the hard clip above "Show more". */
const COLLAPSE_FADE_HEIGHT = 48;
/** Matches MapLegendPanel chevron base size. */
const SHOW_MORE_CHEVRON_SIZE = 14;

type HtmlSource = { html: string; baseUrl: string };

/** Owns expand + measure state so a `key` on this block resets cleanly when `section.text` changes. */
function CollapsibleHtmlBlock({ htmlSource }: { htmlSource: HtmlSource }) {
  const themeColors = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const { font } = useText();
  const iconScale = useResolvedIconSizeScale();
  const chevronSize = Math.round(SHOW_MORE_CHEVRON_SIZE * iconScale);
  const bodyFontSize = useResolvedConstantSize(uiScale.betaSection.text.body);
  const bodyTypography = useResolvedTypography(textStyle.betaSection.body);
  const captionFontSize = useResolvedConstantSize(uiScale.betaSection.text.caption);
  const bodyBoldFontFamily = font.display.fontFamily;
  const bodyFontFamily = bodyTypography.fontFamily;
  const htmlTagsStyles = useMemo(
    () =>
      buildRopewikiHtmlTagsStyles({
        link: themeColors.text.link,
        secondary: themeColors.text.secondary,
        captionFontSize,
        bodyFontSize,
        bodyFontFamily,
        bodyBoldFontFamily,
      }),
    [
      themeColors.text.link,
      themeColors.text.secondary,
      captionFontSize,
      bodyFontSize,
      bodyFontFamily,
      bodyBoldFontFamily,
    ],
  );
  const [textExpanded, setTextExpanded] = useState(false);
  const [fullContentHeight, setFullContentHeight] = useState(0);
  const maxHeight = useSharedValue(TEXT_MAX_HEIGHT);
  const firstMeasureRef = useRef(true);

  useEffect(() => {
    if (fullContentHeight === 0) return;
    const needsClamp = fullContentHeight >= TEXT_MAX_HEIGHT;
    const target =
      !needsClamp || textExpanded ? fullContentHeight : TEXT_MAX_HEIGHT;
    if (firstMeasureRef.current) {
      maxHeight.value = target;
      firstMeasureRef.current = false;
      return;
    }
    maxHeight.value = withTiming(target, {
      duration: EXPAND_COLLAPSE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [textExpanded, fullContentHeight]);

  const animatedTextClipStyle = useAnimatedStyle(() => ({
    maxHeight: maxHeight.value,
    overflow: "hidden" as const,
  }));

  const showExpandButton = fullContentHeight >= TEXT_MAX_HEIGHT;
  const showCollapseFade = showExpandButton && !textExpanded;
  // Same RGB at alpha 0 — "transparent" is black@0 and greys out light backgrounds.
  const collapseFadeColors = useMemo(
    (): [string, string] => [
      colorWithAlpha(themeColors.background, 0),
      themeColors.background,
    ],
    [themeColors.background],
  );

  return (
    <View style={styles.textBlock}>
      <Animated.View style={[styles.textContent, animatedTextClipStyle]}>
        <ScrollView
          scrollEnabled={false}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.htmlMeasureScrollContent}
          onContentSizeChange={(_, h) => {
            if (h > 0) setFullContentHeight(h);
          }}
        >
          <RenderHtml
            contentWidth={CONTENT_WIDTH}
            source={htmlSource}
            systemFonts={RENDER_HTML_SYSTEM_FONTS}
            baseStyle={{
              ...toRenderHtmlTypographyStyle(bodyTypography),
              fontSize: bodyFontSize,
              color: themeColors.text.primary,
            }}
            tagsStyles={htmlTagsStyles}
            customHTMLElementModels={ROPEWIKI_CUSTOM_HTML_ELEMENT_MODELS}
            ignoredStyles={ROPEWIKI_HTML_IGNORED_STYLES}
            enableUserAgentStyles={false}
            defaultTextProps={ROPEWIKI_HTML_DEFAULT_TEXT_PROPS}
          />
        </ScrollView>
        {showCollapseFade ? (
          <LinearGradient
            colors={collapseFadeColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.collapseFade}
            pointerEvents="none"
          />
        ) : null}
      </Animated.View>
      {(showExpandButton || textExpanded) && (
        <Pressable
          onPress={() => setTextExpanded((e) => !e)}
          style={styles.showMoreButton}
          accessibilityLabel={textExpanded ? "Show less" : "Show more"}
        >
          <ConstantText
            size={uiScale.betaSection.buttons.showMore.text!}
            typography={textStyle.betaSection.showMore}
            style={{
              color: themeColors.text.link,
              textDecorationLine: "underline",
            }}
          >
            {textExpanded ? "Show less" : "Show more"}
          </ConstantText>
          <View
            style={[styles.chevronSlot, { width: chevronSize }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <FontAwesome5
              name={textExpanded ? "chevron-up" : "chevron-down"}
              size={chevronSize}
              color={themeColors.text.link}
            />
          </View>
        </Pressable>
      )}
    </View>
  );
}

export type BetaSectionProps = {
  section: OnlineBetaSection | OfflineBetaSection;
  /** Page or region name for expanded image header (bold top line). */
  pageTitle: string;
};

export function BetaSection({ section, pageTitle }: BetaSectionProps) {
  const themeColors = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const displayTitle = useFabulousTitle(section.title);
  const hasImages = section.images.length > 0;
  const sortedImages = hasImages
    ? [...section.images].sort((a, b) => a.order - b.order)
    : [];

  const htmlSource = useMemo(
    () => ({
      html: replaceEmbeddedImgTagsWithLinks(section.text || ""),
      baseUrl: ROPEWIKI_ORIGIN,
    }),
    [section.text],
  );

  return (
    <View style={styles.container}>
      <ScalingText
        size={uiScale.betaSection.text.title}
        typography={textStyle.betaSection.title}
        numberOfLines={2}
        ellipsizeMode="tail"
        measure={{ type: "lineCount", maxLinesAtMaxSize: 2 }}
        style={[styles.title, { color: themeColors.text.primary }]}
      >
        {displayTitle}
      </ScalingText>

      {section.text ? (
        <CollapsibleHtmlBlock key={section.text} htmlSource={htmlSource} />
      ) : null}

      {hasImages && sortedImages.length > 0 && (
        <BetaSectionImages
          images={sortedImages}
          pageTitle={pageTitle}
          sectionTitle={section.title}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    marginBottom: 12,
  },
  textBlock: {
    marginBottom: 16,
  },
  textContent: {},
  collapseFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: COLLAPSE_FADE_HEIGHT,
  },
  htmlMeasureScrollContent: {
    width: CONTENT_WIDTH,
  },
  showMoreButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chevronSlot: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
