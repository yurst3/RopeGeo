import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ConstantText } from "@/components/text/ConstantText";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
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
import {
  RouteFilter,
  SavedPagesFilter,
  SearchFilter,
  type SearchParamsPosition,
} from "ropegeo-common/models";
import { DifficultyFilterOptions } from "@/components/filters/DifficultyFilterOptions";
import { RoutesFilterOptions } from "@/components/filters/RoutesFilterOptions";
import {
  SavedPagesFilterOptions,
} from "@/components/filters/SavedPagesFilterOptions";
import { SearchFilterOptions } from "@/components/filters/SearchFilterOptions";
import { FILTER_SHEET_HORIZONTAL_INSET } from "@/utils/filters/filterSheetInsets";

const SHEET_MAX_HEIGHT_RATIO = 0.88;
/** Grab pill + title; used so ScrollView gets a real height (flex:1 inside maxHeight-only parents collapses). */
const SHEET_TOP_RESERVE = 84;
/** Footer area when Revert/Reset row is shown (no Apply button). */
const SHEET_FOOTER_RESERVE_WITH_ACTIONS = 88;
/** Minimal reserve when the footer has no buttons. */
const SHEET_FOOTER_RESERVE_EMPTY = 28;

/** Spring for sheet translateY — no overshoot/bounce at the rest position. */
const SHEET_SPRING: WithSpringConfig = {
  damping: 32,
  stiffness: 320,
  overshootClamping: true,
};

export type FilterSheetMode =
  | {
      kind: "explore-route";
      draft: RouteFilter;
      onDraftChange: (f: RouteFilter) => void;
      persisted: boolean;
      onRevert: () => void;
    }
  | {
      kind: "search";
      draft: SearchFilter;
      onDraftChange: (f: SearchFilter) => void;
      persisted: boolean;
      /** Live GPS fix for distance order (not persisted on the filter). */
      livePosition: SearchParamsPosition | null;
      onRevert: () => void;
    }
  | {
      kind: "saved-pages";
      draft: SavedPagesFilter;
      onDraftChange: (f: SavedPagesFilter) => void;
      persisted: boolean;
      onRevert: () => void;
    }
  | {
      kind: "region-route";
      draft: RouteFilter;
      onDraftChange: (f: RouteFilter) => void;
      onReset: () => void;
    };

type FilterBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  mode: FilterSheetMode | null;
};

function titleForMode(m: FilterSheetMode): string {
  switch (m.kind) {
    case "explore-route":
    case "region-route":
      return "Route Filter";
    case "search":
      return "Search Filter";
    case "saved-pages":
      return "Saved Pages Filter";
  }
}

export function FilterBottomSheet({
  visible,
  onClose,
  mode,
}: FilterBottomSheetProps) {
  const { background, text, placeholder, filter, separator } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get("window").height;
  const dismissOffset = windowHeight;
  const translateY = useSharedValue(dismissOffset);
  const overlayOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);

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
      translateY.value = dismissOffset;
      overlayOpacity.value = 0;
      overlayOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, SHEET_SPRING);
    } else {
      translateY.value = dismissOffset;
      overlayOpacity.value = 0;
    }
  }, [dismissOffset, overlayOpacity, translateY, visible]);

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

  const maxH = useMemo(
    () => Math.round(windowHeight * SHEET_MAX_HEIGHT_RATIO),
    [windowHeight],
  );

  if (mode == null) return null;

  const showRevert =
    (mode.kind === "explore-route" ||
      mode.kind === "search" ||
      mode.kind === "saved-pages") &&
    mode.persisted;

  const showFooter =
    mode.kind === "region-route" || showRevert;

  const scrollAreaMaxHeight = Math.max(
    220,
    maxH -
      SHEET_TOP_RESERVE -
      (showFooter ? SHEET_FOOTER_RESERVE_WITH_ACTIONS : SHEET_FOOTER_RESERVE_EMPTY),
  );

  const handleRevert = () => {
    if (mode.kind === "region-route") return;
    mode.onRevert();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissSheet}
    >
      <View style={styles.overlayContainer}>
        <Animated.View style={[styles.overlay, overlayStyle]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissSheet} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: background,
              paddingBottom: Math.max(insets.bottom, 12),
              maxHeight: maxH,
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
                {titleForMode(mode)}
              </ConstantText>
            </View>
          </GestureDetector>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ maxHeight: scrollAreaMaxHeight }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollPad}
              style={{ maxHeight: scrollAreaMaxHeight }}
              showsVerticalScrollIndicator
            >
              {mode.kind === "explore-route" || mode.kind === "region-route" ? (
                <RouteFilterForm
                  filter={mode.draft}
                  onChange={mode.onDraftChange}
                />
              ) : null}
              {mode.kind === "search" ? (
                <SearchFilterForm
                  filter={mode.draft}
                  livePosition={mode.livePosition}
                  onChange={mode.onDraftChange}
                />
              ) : null}
              {mode.kind === "saved-pages" ? (
                <SavedPagesFilterForm
                  filter={mode.draft}
                  onChange={mode.onDraftChange}
                />
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
          {showFooter ? (
            <View
              style={[
                styles.footer,
                { borderTopColor: separator },
              ]}
            >
              {mode.kind === "region-route" ? (
                <Pressable style={styles.secondaryBtn} onPress={mode.onReset}>
                  <ConstantText
                    size={uiScale.filter.buttons.revert.text!}
                    typography={textStyle.filter.revertButton}
                    style={{ color: filter.revertText }}
                  >
                    Reset
                  </ConstantText>
                </Pressable>
              ) : null}
              {showRevert ? (
                <Pressable style={styles.secondaryBtn} onPress={handleRevert}>
                  <ConstantText
                    size={uiScale.filter.buttons.revert.text!}
                    typography={textStyle.filter.revertButton}
                    style={{ color: filter.revertText }}
                  >
                    Revert to defaults
                  </ConstantText>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

function RouteFilterForm({
  filter,
  onChange,
}: {
  filter: RouteFilter;
  onChange: (f: RouteFilter) => void;
}) {
  const patch = (fn: (r: RouteFilter) => void) => {
    const r = RouteFilter.fromJsonString(filter.toString());
    fn(r);
    onChange(r);
  };

  return (
    <>
      <RoutesFilterOptions filter={filter} onChange={onChange} />
      <DifficultyFilterOptions
        options={filter.difficultyOptions}
        onChange={(o) =>
          patch((r) => {
            r.difficultyOptions = o;
          })
        }
      />
    </>
  );
}

function SearchFilterForm({
  filter,
  livePosition,
  onChange,
}: {
  filter: SearchFilter;
  livePosition: SearchParamsPosition | null;
  onChange: (f: SearchFilter) => void;
}) {
  const patch = (fn: (s: SearchFilter) => void) => {
    const s = SearchFilter.fromJsonString(filter.toString());
    fn(s);
    onChange(s);
  };

  return (
    <>
      <SearchFilterOptions
        filter={filter}
        onChange={onChange}
        livePosition={livePosition}
      />
      <DifficultyFilterOptions
        options={filter.difficultyOptions}
        onChange={(o) => patch((s) => s.setDifficultyOptions(o))}
      />
    </>
  );
}

function SavedPagesFilterForm({
  filter,
  onChange,
}: {
  filter: SavedPagesFilter;
  onChange: (f: SavedPagesFilter) => void;
}) {
  const patch = (fn: (s: SavedPagesFilter) => void) => {
    const s = SavedPagesFilter.fromJsonString(filter.toString());
    fn(s);
    onChange(s);
  };

  return (
    <>
      <SavedPagesFilterOptions filter={filter} onChange={onChange} />
      <DifficultyFilterOptions
        options={filter.difficultyOptions}
        onChange={(o) => patch((s) => s.setDifficultyOptions(o))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  grabArea: {
    alignItems: "center",
    paddingBottom: 8,
    paddingHorizontal: FILTER_SHEET_HORIZONTAL_INSET,
  },
  grabPill: {
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 12,
  },
  sheetTitle: {
    alignSelf: "flex-start",
  },
  scrollPad: {
    paddingBottom: 16,
    paddingHorizontal: FILTER_SHEET_HORIZONTAL_INSET,
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
