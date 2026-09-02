import { MapBasemapPreview } from "@/components/modals/mapLayers/MapBasemapPreview";
import { ConstantText } from "@/components/text/ConstantText";
import { ScaledFilterSwitch } from "@/components/filters/ScaledFilterSwitch";
import { OptionChip } from "@/components/settings/OptionChip";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  MAP_BASEMAPS,
  MAP_LIGHT_PRESETS,
  type MapBasemap,
  type MapLightPreset,
} from "@/constants/settings/mapLayersTypes";
import { FILTER_SHEET_HORIZONTAL_INSET } from "@/utils/filters/filterSheetInsets";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type WithSpringConfig,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MapLayersDraft } from "@/utils/map/mapLayersSettings";

const SHEET_MAX_HEIGHT_RATIO = 0.88;
const SHEET_TOP_RESERVE = 84;
const SHEET_FOOTER_RESERVE_WITH_ACTIONS = 88;
const PREVIEW_ASPECT = 80 / 120;
const BASEMAP_PREVIEW_GAP = 12;

const SHEET_SPRING: WithSpringConfig = {
  damping: 32,
  stiffness: 320,
  overshootClamping: true,
};

const BASEMAP_LABELS: Record<MapBasemap, string> = {
  standard: "Standard",
  satellite: "Satellite",
};

const LIGHT_PRESET_LABELS: Record<MapLightPreset, string> = {
  dawn: "Dawn",
  day: "Day",
  dusk: "Dusk",
  night: "Night",
};

type MapLayersBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  draft: MapLayersDraft | null;
  onDraftChange: (draft: MapLayersDraft) => void;
  customized: boolean;
  onRevert: () => void;
};

export function MapLayersBottomSheet({
  visible,
  onClose,
  draft,
  onDraftChange,
  customized,
  onRevert,
}: MapLayersBottomSheetProps) {
  const { background, text, placeholder, filter, separator } = useColorTheme();
  const { sectionLabel } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get("window").height;
  const windowWidth = Dimensions.get("window").width;
  const dismissOffset = windowHeight;
  const translateY = useSharedValue(dismissOffset);
  const overlayOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);
  /** How many basemap previews may mount MapView (sequential to avoid multi-MapView crashes). */
  const [mountPreviewCount, setMountPreviewCount] = useState(0);

  const dismissSheet = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    overlayOpacity.value = withTiming(0, { duration: 180 });
    translateY.value = withSpring(dismissOffset, SHEET_SPRING, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [dismissOffset, onClose, overlayOpacity, translateY]);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setMountPreviewCount(1);
      translateY.value = dismissOffset;
      overlayOpacity.value = 0;
      overlayOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, SHEET_SPRING);
    } else {
      setMountPreviewCount(0);
      translateY.value = dismissOffset;
      overlayOpacity.value = 0;
    }
  }, [dismissOffset, overlayOpacity, translateY, visible]);

  /** If a preview never fires onMapReady, still unlock the next after a short wait. */
  useEffect(() => {
    if (!visible || mountPreviewCount <= 0 || mountPreviewCount >= MAP_BASEMAPS.length) {
      return;
    }
    const t = setTimeout(() => {
      setMountPreviewCount((n) => Math.min(n + 1, MAP_BASEMAPS.length));
    }, 2500);
    return () => clearTimeout(t);
  }, [visible, mountPreviewCount]);

  const advancePreviewMount = useCallback(() => {
    setMountPreviewCount((n) => Math.min(n + 1, MAP_BASEMAPS.length));
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          if (e.translationY > 0) {
            translateY.value = e.translationY;
            overlayOpacity.value = Math.max(0, 1 - e.translationY / 200);
          }
        })
        .onEnd((e) => {
          if (e.translationY > 80 || e.velocityY > 800) {
            runOnJS(dismissSheet)();
          } else {
            overlayOpacity.value = withTiming(1, { duration: 150 });
            translateY.value = withSpring(0, SHEET_SPRING);
          }
        }),
    [dismissSheet, overlayOpacity, translateY],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const sheetContentWidth = windowWidth - FILTER_SHEET_HORIZONTAL_INSET * 2;
  const basemapPreviewWidth =
    (sheetContentWidth - BASEMAP_PREVIEW_GAP) / MAP_BASEMAPS.length;
  const basemapPreviewHeight = Math.round(basemapPreviewWidth * PREVIEW_ASPECT);
  const maxSheetHeight = windowHeight * SHEET_MAX_HEIGHT_RATIO;
  const scrollAreaMaxHeight =
    maxSheetHeight -
    SHEET_TOP_RESERVE -
    insets.bottom -
    (customized ? SHEET_FOOTER_RESERVE_WITH_ACTIONS : 28);

  if (draft == null) {
    return null;
  }

  const patch = (partial: Partial<MapLayersDraft>) => {
    onDraftChange({ ...draft, ...partial });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismissSheet}>
      <View style={styles.overlayContainer}>
        <Animated.View style={[styles.overlay, overlayStyle]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissSheet} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: background,
              paddingBottom: Math.max(insets.bottom, 12),
              maxHeight: maxSheetHeight,
            },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.grabArea}>
              <View style={[styles.grabPill, { backgroundColor: placeholder }]} />
              <ConstantText
                size={uiScale.filter.text.title}
                typography={textStyle.filter.title}
                style={[styles.sheetTitle, { color: text.primary }]}
              >
                Map Layers
              </ConstantText>
            </View>
          </GestureDetector>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollPad}
            style={{ maxHeight: scrollAreaMaxHeight }}
            showsVerticalScrollIndicator
          >
            <ConstantText
              size={uiScale.filter.text.sectionTitle}
              typography={textStyle.filter.sectionTitle}
              style={[styles.sectionLabel, sectionLabel]}
            >
              Basemap
            </ConstantText>
            <View style={styles.basemapRow}>
              {MAP_BASEMAPS.map((basemap, index) => (
                <BasemapOption
                  key={basemap}
                  basemap={basemap}
                  selected={draft.mapBasemap === basemap}
                  draft={draft}
                  previewWidth={basemapPreviewWidth}
                  previewHeight={basemapPreviewHeight}
                  allowMount={index < mountPreviewCount}
                  onPreviewReady={advancePreviewMount}
                  onSelect={() => patch({ mapBasemap: basemap })}
                />
              ))}
            </View>
            <ConstantText
              size={uiScale.filter.text.sectionTitle}
              typography={textStyle.filter.sectionTitle}
              style={[styles.sectionLabel, sectionLabel, { marginTop: 16 }]}
            >
              Time of Day
            </ConstantText>
            <View style={styles.lightRow}>
              {MAP_LIGHT_PRESETS.map((preset) => (
                <OptionChip
                  key={preset}
                  label={LIGHT_PRESET_LABELS[preset]}
                  selected={draft.mapLightPreset === preset}
                  onPress={() => patch({ mapLightPreset: preset })}
                />
              ))}
            </View>
            <View style={[styles.contourRow, { borderTopColor: separator }]}>
              <ConstantText
                size={uiScale.filter.buttons.checkbox.text!}
                typography={textStyle.filter.optionLabel}
                style={{ color: text.primary, flex: 1 }}
              >
                Show elevation contours
              </ConstantText>
              <ScaledFilterSwitch
                value={draft.showSatelliteContours}
                onValueChange={(showSatelliteContours) =>
                  patch({ showSatelliteContours })
                }
              />
            </View>
          </ScrollView>
          {customized ? (
            <View style={[styles.footer, { borderTopColor: separator }]}>
              <Pressable style={styles.secondaryBtn} onPress={onRevert}>
                <ConstantText
                  size={uiScale.filter.buttons.revert.text!}
                  typography={textStyle.filter.revertButton}
                  style={{ color: filter.revertText }}
                >
                  Revert to defaults
                </ConstantText>
              </Pressable>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

function BasemapOption({
  basemap,
  selected,
  draft,
  previewWidth,
  previewHeight,
  allowMount,
  onPreviewReady,
  onSelect,
}: {
  basemap: MapBasemap;
  selected: boolean;
  draft: MapLayersDraft;
  previewWidth: number;
  previewHeight: number;
  allowMount: boolean;
  onPreviewReady: () => void;
  onSelect: () => void;
}) {
  const { text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  return (
    <Pressable
      onPress={onSelect}
      style={styles.basemapOption}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={BASEMAP_LABELS[basemap]}
    >
      <MapBasemapPreview
        basemap={basemap}
        lightPreset={draft.mapLightPreset}
        showSatelliteContours={draft.showSatelliteContours}
        selected={selected}
        width={previewWidth}
        height={previewHeight}
        allowMount={allowMount}
        onMapReady={onPreviewReady}
      />
      <ConstantText
        size={uiScale.filter.buttons.checkbox.text!}
        typography={textStyle.filter.optionLabel}
        style={[
          styles.basemapLabel,
          {
            color: selected ? text.link : text.primary,
            fontWeight: selected ? "600" : "400",
          },
        ]}
      >
        {BASEMAP_LABELS[basemap]}
      </ConstantText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  grabArea: {
    alignItems: "center",
    paddingBottom: 8,
  },
  grabPill: {
    width: 36,
    height: 5,
    borderRadius: 3,
    marginBottom: 12,
  },
  sheetTitle: {
    alignSelf: "flex-start",
    paddingHorizontal: FILTER_SHEET_HORIZONTAL_INSET,
  },
  scrollPad: {
    paddingBottom: 16,
    paddingHorizontal: FILTER_SHEET_HORIZONTAL_INSET,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  basemapRow: {
    flexDirection: "row",
    gap: BASEMAP_PREVIEW_GAP,
  },
  basemapOption: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  basemapLabel: {
    textAlign: "center",
  },
  lightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  contourRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    gap: 10,
    paddingTop: 8,
    paddingHorizontal: FILTER_SHEET_HORIZONTAL_INSET,
    borderTopWidth: 1,
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
});
