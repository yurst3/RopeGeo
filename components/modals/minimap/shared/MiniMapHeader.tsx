import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { BackButton } from "@/components/buttons/standard/BackButton";
import { ScalingText } from "@/components/text/ScalingText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useHeaderChromeLayout } from "@/utils/layout/buttonChromeLayout";

/** Wraps one control in the expanded minimap header row (mirrors the back-button slot). */
export function MiniMapHeaderSideSlot({ children }: { children: ReactNode }) {
  const headerChrome = useHeaderChromeLayout();
  return (
    <View
      style={[
        styles.headerButtonWrap,
        styles.headerSideSlot,
        {
          width: headerChrome.sideSlotWidth,
          height: headerChrome.buttonWrapHeight,
        },
      ]}
    >
      {children}
    </View>
  );
}

/** Groups multiple header-side controls (e.g. fit-bounds + filter). */
export function MiniMapHeaderSideSlots({ children }: { children: ReactNode }) {
  const headerChrome = useHeaderChromeLayout();
  return (
    <View style={[styles.headerSideSlotsRow, { gap: headerChrome.gap }]}>
      {children}
    </View>
  );
}

export function MiniMapHeader({
  title,
  onBack,
  rightSlot,
  top,
  onHeaderHeightChange,
}: {
  title: string;
  onBack: () => void;
  rightSlot?: ReactNode;
  top: number;
  /** Reports the header row height (row bottom = `top` + height) for camera framing. */
  onHeaderHeightChange?: (height: number) => void;
}) {
  const themeColors = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const headerChrome = useHeaderChromeLayout();
  const { minimap } = themeColors.map;
  const { text } = themeColors;

  const titleBarStyle = useMemo(
    () => [
      styles.titleBar,
      {
        backgroundColor: minimap.title.background,
        shadowColor: minimap.title.shadow,
        minHeight: headerChrome.buttonWrapHeight,
        paddingVertical: headerChrome.titleBarPaddingVertical,
        paddingHorizontal: headerChrome.titleBarPaddingHorizontal,
      },
    ],
    [
      minimap.title.background,
      minimap.title.shadow,
      headerChrome.buttonWrapHeight,
      headerChrome.titleBarPaddingVertical,
      headerChrome.titleBarPaddingHorizontal,
    ],
  );

  const titleTextStyle = useMemo(
    () => [{ color: text.primary, textAlign: "center" as const }],
    [text.primary],
  );

  return (
    <View
      style={[
        styles.headerRow,
        {
          top,
          left: headerChrome.edgeInset,
          right: headerChrome.edgeInset,
        },
      ]}
      pointerEvents="box-none"
      onLayout={
        onHeaderHeightChange != null
          ? (e) => onHeaderHeightChange(e.nativeEvent.layout.height)
          : undefined
      }
    >
      <View
        style={[
          styles.headerButtonWrap,
          {
            width: headerChrome.sideSlotWidth,
            height: headerChrome.buttonWrapHeight,
          },
        ]}
      >
        <BackButton onPress={onBack} />
      </View>
      <View style={titleBarStyle}>
        <ScalingText
          size={uiScale.map.text.title}
          typography={textStyle.map.title}
          numberOfLines={1}
          measure={{ type: "width" }}
          style={titleTextStyle}
        >
          {title}
        </ScalingText>
      </View>
      {rightSlot ?? (
        <View style={{ width: headerChrome.sideSlotWidth }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    position: "absolute",
    zIndex: 3900,
    flexDirection: "row",
    // Top-align side slots with the title pill so a taller title (UI scale / a11y)
    // does not vertically recenter the back button away from the map ButtonStack.
    alignItems: "flex-start",
  },
  headerButtonWrap: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerSideSlot: {
    alignItems: "flex-end",
  },
  headerSideSlotsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleBar: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
    borderRadius: 12,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
