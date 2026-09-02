import { parseStrokeColor, parseStrokeWidth } from "@/utils/minimap/pageMiniMapSegments";
import { ScalingText } from "@/components/text/ScalingText";
import { useMapOverlayColors } from "@/hooks/map/useMapOverlayColors";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { FontAwesome5 } from "@expo/vector-icons";
import type { LegendItem } from "ropegeo-common/models";
import { LegendFeatureType, LineLegendItem, PolygonLegendItem } from "ropegeo-common/models";
import { useBundledImageSource } from "@/utils/assets/useBundledImageSource";
import type { ComponentRef } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const EXPAND_MS = 280;
const COLLAPSE_MS = 260;
/** After expand animation, row layouts inside the ScrollView are reliable. */
const SCROLL_AFTER_EXPAND_MS = EXPAND_MS + 48;
const EASE = Easing.out(Easing.cubic);

const POINT_MARKER_IMAGE = require("@/assets/images/icons/markers/marker.png");
const LEGEND_CHEVRON_SIZE = 14;
const LEGEND_MARKER_WIDTH = 18;
const LEGEND_MARKER_HEIGHT = 22;
const LEGEND_MARKER_ICON_SIZE = 18;
const LEGEND_SWATCH_COLUMN_WIDTH = 28;
const LEGEND_SWATCH_LINE_WIDTH = 20;
const LEGEND_SWATCH_POLYGON_WIDTH = 28;
const LEGEND_SWATCH_POLYGON_HEIGHT = 14;
/** Column grows at half the rate of global icon scaling so labels keep more width. */
const LEGEND_SWATCH_COLUMN_SCALE_STRENGTH = 0.5;

function legendSwatchColumnScale(iconScale: number): number {
  return 1 + (iconScale - 1) * LEGEND_SWATCH_COLUMN_SCALE_STRENGTH;
}

function legendSwatchMetrics(iconScale: number) {
  const swatchColumnWidth = Math.round(
    LEGEND_SWATCH_COLUMN_WIDTH * legendSwatchColumnScale(iconScale),
  );
  return {
    swatchColumnWidth,
    markerWidth: Math.round(LEGEND_MARKER_WIDTH * iconScale),
    markerHeight: Math.round(LEGEND_MARKER_HEIGHT * iconScale),
    markerIconSize: Math.round(LEGEND_MARKER_ICON_SIZE * iconScale),
    lineWidth: Math.round(LEGEND_SWATCH_LINE_WIDTH * iconScale),
    polygonWidth: Math.round(LEGEND_SWATCH_POLYGON_WIDTH * iconScale),
    polygonHeight: Math.round(LEGEND_SWATCH_POLYGON_HEIGHT * iconScale),
  };
}

export type MapLegendPanelProps = {
  /** Server-provided legend rows (parent only mounts when non-empty). */
  legend: Record<string, LegendItem>;
  expanded: boolean;
  selectedKey: string | null;
  /**
   * Parent increments this only when the user selects a line on the map (not when tapping the legend).
   * Used to trigger a one-time scroll so the selected row is visible.
   */
  scrollIntoViewEpoch?: number;
  maxHeight: number;
  /** Left edge of the legend panel (typically half the window width). */
  leftOffset: number;
  /** Distance from the physical bottom of the overlay to the legend (tab bar + scaled gap). */
  bottomOffset: number;
  /** Right edge inset already including the scaled overlay gap. */
  rightInset: number;
  onToggleExpanded: () => void;
  onSelectLegendId: (id: string) => void;
  /**
   * Reports the card's settled footprint height (header plus expanded body when
   * expanded) so the parent can frame the camera above the overlay row.
   */
  onExpandedFootprintChange?: (height: number) => void;
};

function PointMarkerSwatch({
  tintColor,
  imageSource,
  swatchColumnWidth,
  markerWidth,
  markerHeight,
  markerIconSize,
}: {
  tintColor: string;
  imageSource: ImageSourcePropType | undefined;
  swatchColumnWidth: number;
  markerWidth: number;
  markerHeight: number;
  markerIconSize: number;
}) {
  return (
    <View
      style={[styles.swatchWrap, { width: swatchColumnWidth }]}
      accessibilityIgnoresInvertColors
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={[
            styles.swatchPointMarker,
            { width: markerWidth, height: markerHeight, tintColor },
          ]}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <FontAwesome5
          name="map-marker-alt"
          size={markerIconSize}
          color={tintColor}
          style={styles.swatchPointMarkerIcon}
        />
      )}
    </View>
  );
}

function LegendItemSwatch({
  item,
  pointMarkerTint,
  pointMarkerImageSource,
  defaultLineStroke,
  iconScale,
}: {
  item: LegendItem;
  pointMarkerTint: string;
  pointMarkerImageSource: ImageSourcePropType | undefined;
  defaultLineStroke: string;
  iconScale: number;
}) {
  const swatchMetrics = legendSwatchMetrics(iconScale);

  if (item.featureType === LegendFeatureType.Point) {
    return (
      <PointMarkerSwatch
        tintColor={pointMarkerTint}
        imageSource={pointMarkerImageSource}
        swatchColumnWidth={swatchMetrics.swatchColumnWidth}
        markerWidth={swatchMetrics.markerWidth}
        markerHeight={swatchMetrics.markerHeight}
        markerIconSize={swatchMetrics.markerIconSize}
      />
    );
  }
  if (item.featureType === LegendFeatureType.Polygon) {
    const G = item as PolygonLegendItem;
    const stroke = parseStrokeColor(
      G.borderColor ?? G.fillColor,
      defaultLineStroke,
    );
    const fillColor =
      G.fillColor !== undefined && String(G.fillColor).trim() !== ""
        ? parseStrokeColor(G.fillColor, defaultLineStroke)
        : undefined;
    return (
      <View
        style={[
          styles.swatchWrap,
          { width: swatchMetrics.swatchColumnWidth },
        ]}
        accessibilityIgnoresInvertColors
      >
        <View
          style={[
            styles.swatchPolygon,
            {
              width: swatchMetrics.polygonWidth,
              height: swatchMetrics.polygonHeight,
              borderColor: stroke,
              backgroundColor: fillColor ?? "rgba(0,0,0,0.06)",
            },
          ]}
        />
      </View>
    );
  }
  const L = item as LineLegendItem;
  const stroke = parseStrokeColor(L.strokeColor, defaultLineStroke);
  const strokeWidth = parseStrokeWidth(L.strokeWidth);
  return (
    <View
      style={[
        styles.swatchWrap,
        { width: swatchMetrics.swatchColumnWidth },
      ]}
      accessibilityIgnoresInvertColors
    >
      <View
        style={[
          styles.swatchLine,
          {
            width: swatchMetrics.lineWidth,
            backgroundColor: stroke,
            height: Math.min(10, Math.max(3, strokeWidth)),
          },
        ]}
      />
    </View>
  );
}

export function MapLegendPanel({
  legend,
  expanded,
  selectedKey,
  scrollIntoViewEpoch = 0,
  maxHeight,
  leftOffset,
  bottomOffset,
  rightInset,
  onToggleExpanded,
  onSelectLegendId,
  onExpandedFootprintChange,
}: MapLegendPanelProps) {
  const themeColors = useColorTheme();
  const overlayColors = useMapOverlayColors();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const iconScale = useResolvedIconSizeScale();
  const chevronSize = Math.round(LEGEND_CHEVRON_SIZE * iconScale);
  const { minimap } = themeColors.map;
  const { focusedLineSegment } = overlayColors;
  const { text, cardHighlight } = themeColors;
  const { bodyBackground, headerBackground, shadow } = minimap.legend;
  const pointMarkerImageSource = useBundledImageSource(POINT_MARKER_IMAGE);

  const cardStyle = useMemo(
    () => [
      styles.card,
      {
        shadowColor: shadow,
      },
    ],
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

  const headerTitleStyle = useMemo(
    () => ({ color: text.primary }),
    [text.primary],
  );

  const rowStyle = useMemo(
    () => [styles.row, { borderTopColor: themeColors.separator }],
    [themeColors.separator],
  );

  const rowLabelColorStyle = useMemo(
    () => ({ color: text.primary }),
    [text.primary],
  );

  const rowSelectedStyle = useMemo(
    () => ({ backgroundColor: cardHighlight }),
    [cardHighlight],
  );

  const bodyHeight = useSharedValue(0);
  const bodyOpacity = useSharedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const rowYRef = useRef<Record<string, number>>({});
  const prevExpandedRef = useRef(false);
  const selectedKeyRef = useRef<string | null>(null);
  selectedKeyRef.current = selectedKey;

  const sortedLegendItems = useMemo(
    () => Object.values(legend).sort((a, b) => a.name.localeCompare(b.name)),
    [legend],
  );

  const rowCount = sortedLegendItems.length;

  useEffect(() => {
    if (onExpandedFootprintChange == null || headerHeight === 0 || rowCount === 0) {
      return;
    }
    onExpandedFootprintChange(headerHeight + (expanded ? maxHeight : 0));
  }, [onExpandedFootprintChange, headerHeight, expanded, maxHeight, rowCount]);

  useEffect(() => {
    if (rowCount === 0) {
      bodyHeight.value = 0;
      bodyOpacity.value = 0;
      return;
    }
    if (expanded) {
      bodyOpacity.value = withTiming(1, { duration: Math.min(220, EXPAND_MS), easing: EASE });
      bodyHeight.value = withTiming(maxHeight, { duration: EXPAND_MS, easing: EASE });
    } else {
      bodyOpacity.value = withTiming(0, { duration: COLLAPSE_MS * 0.45, easing: EASE });
      bodyHeight.value = withTiming(0, { duration: COLLAPSE_MS, easing: EASE });
    }
  }, [expanded, maxHeight, rowCount]);

  const animatedBodyStyle = useAnimatedStyle(() => ({
    height: bodyHeight.value,
    opacity: bodyOpacity.value,
    overflow: "hidden",
  }));

  useEffect(() => {
    if (scrollIntoViewEpoch === 0 || !expanded) {
      prevExpandedRef.current = expanded;
      return;
    }
    const id = selectedKeyRef.current;
    if (id == null || id === "") {
      prevExpandedRef.current = expanded;
      return;
    }
    const legendJustOpened = expanded && !prevExpandedRef.current;
    prevExpandedRef.current = expanded;
    const delay = legendJustOpened ? SCROLL_AFTER_EXPAND_MS : 80;
    const t = setTimeout(() => {
      const y = rowYRef.current[id];
      if (y == null || scrollRef.current == null) return;
      scrollRef.current.scrollTo({
        y: Math.max(0, y - 10),
        animated: true,
      });
    }, delay);
    return () => clearTimeout(t);
  }, [scrollIntoViewEpoch, expanded, rowCount]);

  if (rowCount === 0) return null;

  return (
    <View
      style={[
        styles.anchor,
        { bottom: bottomOffset, left: leftOffset, right: rightInset },
      ]}
      pointerEvents="box-none"
    >
      <View style={cardStyle}>
        <Pressable
          onPress={onToggleExpanded}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          style={({ pressed }) => [
            headerStyle,
            pressed && styles.headerPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Collapse map legend" : "Expand map legend"}
        >
          <ScalingText
            size={uiScale.map.text.legendTitle}
            typography={textStyle.map.legendTitle}
            numberOfLines={1}
            measure={{ type: "width" }}
            containerStyle={styles.headerTitleWrap}
            style={headerTitleStyle}
          >
            Map Legend
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
          <ScrollView
            ref={scrollRef}
            style={[{ maxHeight }, listBodyStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {sortedLegendItems.map((item) => {
              const selected = selectedKey === item.id;
              return (
                <Pressable
                  key={item.id}
                  onLayout={(e) => {
                    rowYRef.current[item.id] = e.nativeEvent.layout.y;
                  }}
                  onPress={() => onSelectLegendId(item.id)}
                  style={[rowStyle, selected && rowSelectedStyle]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <LegendItemSwatch
                    item={item}
                    pointMarkerTint={minimap.legend.markerIcon}
                    pointMarkerImageSource={pointMarkerImageSource}
                    defaultLineStroke={focusedLineSegment}
                    iconScale={iconScale}
                  />
                  <ScalingText
                    size={uiScale.map.text.legendItem}
                    typography={textStyle.map.legendItem}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                    measure={{ type: "lineCount", maxLinesAtMaxSize: 3 }}
                    containerStyle={styles.rowLabelWrap}
                    style={[
                      rowLabelColorStyle,
                      selected && { fontWeight: "600" as const },
                    ]}
                  >
                    {item.name}
                  </ScalingText>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  swatchWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  swatchLine: {
    borderRadius: 2,
  },
  swatchPointMarker: {
    resizeMode: "contain",
  },
  swatchPointMarkerIcon: {
    marginTop: 1,
  },
  swatchPolygon: {
    borderRadius: 3,
    borderWidth: 2,
  },
  rowLabelWrap: {
    flex: 1,
    minWidth: 0,
  },
});
