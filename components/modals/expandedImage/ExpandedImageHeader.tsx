import { StyleSheet, View } from "react-native";
import { BackButton } from "@/components/buttons/standard/BackButton";
import { ExternalLinkButton } from "@/components/buttons/standard/ExternalLinkButton";
import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useHeaderChromeLayout } from "@/utils/layout/buttonChromeLayout";

export type ExpandedImageSectionImagePosition = {
  /** 1-based index for display, e.g. `1` in `(1/6)`. */
  current: number;
  total: number;
};

export type ExpandedImageHeaderProps = {
  /** Page or parent context name (bold, top line). */
  pageTitle: string;
  /** Beta section name; when set, shown slightly smaller below `pageTitle`. */
  sectionSubtitle?: string | null;
  /** When set with `sectionSubtitle`, appended as `Title (current/total)`. */
  sectionImagePosition?: ExpandedImageSectionImagePosition | null;
  onBack: () => void;
  /** Ropewiki URL for the current image; omit to hide the external link control. */
  externalLinkUrl?: string | null;
  /** Distance from the top of the screen (typically `insets.top + 8`). */
  top: number;
};

/**
 * Expanded image viewer header: back control + centered title on a subtle dark pill.
 */
export function ExpandedImageHeader({
  pageTitle,
  sectionSubtitle,
  sectionImagePosition,
  onBack,
  externalLinkUrl,
  top,
}: ExpandedImageHeaderProps) {
  const themeColors = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const headerChrome = useHeaderChromeLayout();
  const trimmedSubtitle = sectionSubtitle?.trim() ?? "";
  const showSubtitle = trimmedSubtitle.length > 0;
  const trimmedLink = externalLinkUrl?.trim() ?? "";
  const showExternalLink = trimmedLink.length > 0;
  const sectionLine =
    showSubtitle && sectionImagePosition != null
      ? `${trimmedSubtitle} (${sectionImagePosition.current}/${sectionImagePosition.total})`
      : trimmedSubtitle;

  return (
    <View style={[styles.row, { top }]} pointerEvents="box-none">
      <View
        style={[
          styles.sideSlot,
          styles.sideSlotStart,
          {
            width: headerChrome.sideSlotWidth,
            height: headerChrome.buttonWrapHeight,
          },
        ]}
      >
        <BackButton onPress={onBack} />
      </View>
      <View style={styles.titleSlot} pointerEvents="none">
        <View
          style={[
            styles.titlePill,
            { backgroundColor: themeColors.image.textBackground },
          ]}
        >
          <ConstantText
            size={uiScale.pageScreen.text.title}
            typography={textStyle.pageScreen.title}
            style={[styles.pageTitle, { color: themeColors.image.text }]}
            numberOfLines={showSubtitle ? 2 : 1}
          >
            {pageTitle}
          </ConstantText>
          {showSubtitle ? (
            <ConstantText
              size={uiScale.map.text.title}
              typography={textStyle.map.title}
              style={[styles.sectionSubtitle, { color: themeColors.image.text }]}
              numberOfLines={2}
            >
              {sectionLine}
            </ConstantText>
          ) : null}
        </View>
      </View>
      <View
        style={[
          styles.sideSlot,
          styles.sideSlotEnd,
          {
            width: headerChrome.sideSlotWidth,
            height: headerChrome.buttonWrapHeight,
          },
        ]}
      >
        {showExternalLink ? (
          <ExternalLinkButton
            icon={require("@/assets/images/icons/ropewiki.png")}
            link={trimmedLink}
            accessibilityLabel="Open on RopeWiki"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 3900,
    flexDirection: "row",
    alignItems: "center",
  },
  sideSlot: {
    justifyContent: "center",
  },
  sideSlotStart: {
    alignItems: "flex-start",
  },
  sideSlotEnd: {
    alignItems: "flex-end",
  },
  titleSlot: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  titlePill: {
    maxWidth: "100%",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  pageTitle: {
    textAlign: "center",
  },
  sectionSubtitle: {
    marginTop: 2,
    textAlign: "center",
  },
});
