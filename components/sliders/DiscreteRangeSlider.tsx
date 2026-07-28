import { ConstantText } from "@/components/text/ConstantText";
import { DiscreteRangeSliderTickLabels } from "@/components/sliders/DiscreteRangeSliderTickLabels";
import { DiscreteRangeSliderThumbLabel } from "@/components/sliders/DiscreteRangeSliderThumbLabel";
import {
  computeMultiSliderCanvasLayout,
  mergedThumbLabelBounds,
  THUMB_HIT,
  THUMB_PAN_ACTIVE_OFFSET_X,
  THUMB_PAN_FAIL_OFFSET_Y,
  THUMB_TITLE_COL_W,
  THUMB_TITLE_MERGED_W,
  THUMB_TOP,
  TICK_RADIUS,
  TICK_SIZE,
  TRACK_HEIGHT,
  thumbCenterX,
  thumbDisplayCenters,
} from "@/components/sliders/discreteRangeSliderLayout";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  useResolvedMultiSliderThumbScale,
  useResolvedScalingBounds,
} from "@/utils/theme/resolvers";
import React, { type ComponentType } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

/** Props passed to badge components used as range-slider thumbs. */
export type BadgeThumbProps = { showLabel?: boolean };

export type DiscreteRangeSliderProps<T extends string> = {
  /** When omitted or empty, the section title above the track is not rendered. */
  label?: string;
  orderedValues: readonly T[];
  min: T;
  max: T;
  onChange: (min: T, max: T) => void;
  badges: Record<T, ComponentType<BadgeThumbProps>>;
  /** Descriptive titles under thumbs (same copy as badge `showLabel`). */
  thumbTitles: Record<T, string>;
  /** Short label under each tick (defaults to the enum/string value). */
  formatTickLabel?: (value: T) => string;
};

/**
 * Two-thumb discrete range slider: each stop can show a badge thumb for that value.
 * Used by filter sheets (e.g. ACA ratings) and settings (e.g. relevance strength).
 */
export function DiscreteRangeSlider<T extends string>({
  label,
  orderedValues,
  min,
  max,
  badges,
  onChange,
  thumbTitles,
  formatTickLabel = (v: T) => String(v),
}: DiscreteRangeSliderProps<T>) {
  const { filter, sectionLabel, text } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const { badgeSlider } = filter;
  const multiSliderThumbScale = useResolvedMultiSliderThumbScale();
  const { maxFontSize: thumbLabelMaxPx } = useResolvedScalingBounds(
    uiScale.filter.text.multiSliderThumbLabel,
  );
  const { maxFontSize: tickLabelMaxPx } = useResolvedScalingBounds(
    uiScale.filter.text.multiSliderTickLabel,
  );
  const n = orderedValues.length;
  const minIndex = Math.max(0, orderedValues.indexOf(min));
  const maxIndexRaw = orderedValues.indexOf(max);
  const maxIndex =
    maxIndexRaw >= 0 ? maxIndexRaw : Math.max(0, n - 1);

  const [lowIdx, setLowIdx] = useState(() =>
    Math.min(minIndex, Math.max(0, n - 1)),
  );
  const [highIdx, setHighIdx] = useState(() =>
    Math.min(Math.max(maxIndex, minIndex), Math.max(0, n - 1)),
  );

  const lowIdxRef = useRef(lowIdx);
  const highIdxRef = useRef(highIdx);
  lowIdxRef.current = lowIdx;
  highIdxRef.current = highIdx;

  const trackWRef = useRef(0);
  const [trackW, setTrackW] = useState(0);

  const startLowIdx = useRef(0);
  const startHighIdx = useRef(0);

  const clampLow = useCallback(
    (idx: number) =>
      Math.max(0, Math.min(highIdxRef.current, Math.round(idx))),
    [],
  );
  const clampHigh = useCallback(
    (idx: number) =>
      Math.max(lowIdxRef.current, Math.min(n - 1, Math.round(idx))),
    [n],
  );

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const emit = useCallback(
    (lo: number, hi: number) => {
      const a = orderedValues[lo];
      const b = orderedValues[hi];
      if (a !== undefined && b !== undefined) {
        onChangeRef.current(a, b);
      }
    },
    [orderedValues],
  );

  useEffect(() => {
    const lo = Math.min(minIndex, Math.max(0, n - 1));
    const hi = Math.min(Math.max(maxIndex, lo), Math.max(0, n - 1));
    setLowIdx(lo);
    setHighIdx(hi);
  }, [min, max, minIndex, maxIndex, n]);

  const onLowPanStart = useCallback(() => {
    startLowIdx.current = lowIdxRef.current;
  }, []);

  const onLowPanUpdate = useCallback(
    (translationX: number) => {
      const w = trackWRef.current;
      if (w <= 0 || n <= 1) return;
      const step = Math.max(0, w - THUMB_HIT) / (n - 1);
      if (step <= 0) return;
      const delta = Math.round(translationX / step);
      const next = clampLow(startLowIdx.current + delta);
      if (next !== lowIdxRef.current) {
        setLowIdx(next);
        emit(next, highIdxRef.current);
      }
    },
    [n, clampLow, emit],
  );

  const onHighPanStart = useCallback(() => {
    startHighIdx.current = highIdxRef.current;
  }, []);

  const onHighPanUpdate = useCallback(
    (translationX: number) => {
      const w = trackWRef.current;
      if (w <= 0 || n <= 1) return;
      const step = Math.max(0, w - THUMB_HIT) / (n - 1);
      if (step <= 0) return;
      const delta = Math.round(translationX / step);
      const next = clampHigh(startHighIdx.current + delta);
      if (next !== highIdxRef.current) {
        setHighIdx(next);
        emit(lowIdxRef.current, next);
      }
    },
    [n, clampHigh, emit],
  );

  const panLowGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(n > 0)
        .activeOffsetX([
          -THUMB_PAN_ACTIVE_OFFSET_X,
          THUMB_PAN_ACTIVE_OFFSET_X,
        ])
        .failOffsetY([-THUMB_PAN_FAIL_OFFSET_Y, THUMB_PAN_FAIL_OFFSET_Y])
        .onStart(() => {
          runOnJS(onLowPanStart)();
        })
        .onUpdate((e) => {
          runOnJS(onLowPanUpdate)(e.translationX);
        }),
    [n, onLowPanStart, onLowPanUpdate],
  );

  const panHighGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(n > 0)
        .activeOffsetX([
          -THUMB_PAN_ACTIVE_OFFSET_X,
          THUMB_PAN_ACTIVE_OFFSET_X,
        ])
        .failOffsetY([-THUMB_PAN_FAIL_OFFSET_Y, THUMB_PAN_FAIL_OFFSET_Y])
        .onStart(() => {
          runOnJS(onHighPanStart)();
        })
        .onUpdate((e) => {
          runOnJS(onHighPanUpdate)(e.translationX);
        }),
    [n, onHighPanStart, onHighPanUpdate],
  );

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWRef.current = w;
    setTrackW(w);
  }, []);

  const lowVal = orderedValues[lowIdx];
  const highVal = orderedValues[highIdx];
  const LowBadge = lowVal != null ? badges[lowVal] : null;
  const HighBadge = highVal != null ? badges[highVal] : null;

  const tw = trackW || 0;
  const { xLow, xHigh } = thumbDisplayCenters(lowIdx, highIdx, tw, n);
  const fillLeft = Math.min(xLow, xHigh);
  const fillWidth = Math.abs(xHigh - xLow);

  const sameThumbValue = lowIdx === highIdx;
  const lowTitle = lowVal != null ? thumbTitles[lowVal] : "";
  const highTitle = highVal != null ? thumbTitles[highVal] : "";
  const mergedTitle =
    sameThumbValue && lowVal != null ? thumbTitles[lowVal] : null;
  const mergedThumbBounds =
    trackW > 0 && mergedTitle != null
      ? mergedThumbLabelBounds((xLow + xHigh) / 2, tw)
      : { left: 0, width: THUMB_TITLE_MERGED_W };
  const showTickLabelsBand = n > 2;
  const tickLabels = useMemo(
    () => orderedValues.map((value) => formatTickLabel(value)),
    [orderedValues, formatTickLabel],
  );
  const coveredTickIndices = useMemo(
    () => new Set<number>([lowIdx, highIdx]),
    [lowIdx, highIdx],
  );
  const canvasLayout = useMemo(
    () =>
      computeMultiSliderCanvasLayout(
        multiSliderThumbScale,
        thumbLabelMaxPx,
        tickLabelMaxPx,
        showTickLabelsBand,
      ),
    [
      multiSliderThumbScale,
      thumbLabelMaxPx,
      tickLabelMaxPx,
      showTickLabelsBand,
    ],
  );

  return (
    <View style={styles.block}>
      {label != null && label !== "" ? (
        <ConstantText
          size={uiScale.filter.text.sectionTitle}
          typography={textStyle.filter.sectionTitle}
          style={[styles.label, sectionLabel]}
        >
          {label}
        </ConstantText>
      ) : null}
      <View
        style={[styles.sliderCanvas, { height: canvasLayout.canvasHeight }]}
        onLayout={onTrackLayout}
      >
        <View style={styles.trackBand}>
          <View style={styles.trackInner}>
            <View
              style={[styles.trackBg, { backgroundColor: badgeSlider.unfilledBar }]}
            />
            {trackW > 0 && n > 0 ? (
              <View
                style={[
                  styles.trackFill,
                  {
                    left: fillLeft,
                    width: Math.max(fillWidth, TRACK_HEIGHT),
                    backgroundColor: badgeSlider.filledBar,
                  },
                ]}
              />
            ) : null}
            {trackW > 0 && n > 0 ? (
              <View style={styles.tickLayer} pointerEvents="none">
                {Array.from({ length: n }, (_, i) => {
                  const cx = thumbCenterX(i, tw, n);
                  return (
                    <View
                      key={i}
                      style={[
                        styles.tick,
                        {
                          left: cx - TICK_RADIUS,
                          backgroundColor: badgeSlider.tick,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            ) : null}
          </View>
          {trackW > 0 && LowBadge != null ? (
            <GestureDetector gesture={panLowGesture}>
              <View
                style={[
                  styles.thumbWrap,
                  {
                    left: xLow - THUMB_HIT / 2,
                    top: THUMB_TOP,
                    zIndex: 2,
                  },
                ]}
              >
                <View
                  style={[
                    styles.thumbScale,
                    { transform: [{ scale: multiSliderThumbScale }] },
                  ]}
                >
                  {React.createElement(LowBadge, {})}
                </View>
              </View>
            </GestureDetector>
          ) : null}
          {trackW > 0 && HighBadge != null ? (
            <GestureDetector gesture={panHighGesture}>
              <View
                style={[
                  styles.thumbWrap,
                  {
                    left: xHigh - THUMB_HIT / 2,
                    top: THUMB_TOP,
                    zIndex: 2,
                  },
                ]}
              >
                <View
                  style={[
                    styles.thumbScale,
                    { transform: [{ scale: multiSliderThumbScale }] },
                  ]}
                >
                  {React.createElement(HighBadge, {})}
                </View>
              </View>
            </GestureDetector>
          ) : null}
        </View>

        {showTickLabelsBand ? (
          <View
            style={[
              styles.tickLabelsLayer,
              {
                top: canvasLayout.tickLabelsTop,
                height: canvasLayout.tickRowH,
              },
            ]}
            pointerEvents="none"
          >
            {trackW > 0 ? (
              <DiscreteRangeSliderTickLabels
                labels={tickLabels}
                trackWidth={trackW}
                coveredIndices={coveredTickIndices}
                color={text.tertiary}
                height={canvasLayout.tickRowH}
              />
            ) : null}
          </View>
        ) : null}

        <View
          style={[
            styles.thumbTitlesLayer,
            {
              top: canvasLayout.thumbTitlesTop,
              height: canvasLayout.thumbRowH,
            },
          ]}
          pointerEvents="none"
        >
          {trackW > 0 && mergedTitle != null ? (
            <View
              style={[
                styles.thumbTitleMergedWrap,
                {
                  left: mergedThumbBounds.left,
                  width: mergedThumbBounds.width,
                  height: canvasLayout.thumbRowH,
                },
              ]}
            >
              <DiscreteRangeSliderThumbLabel
                width={mergedThumbBounds.width}
                height={canvasLayout.thumbRowH}
                color={text.secondary}
              >
                {mergedTitle}
              </DiscreteRangeSliderThumbLabel>
            </View>
          ) : null}
          {trackW > 0 && !sameThumbValue && lowVal != null ? (
            <View
              style={[
                styles.thumbTitleCol,
                {
                  left: xLow - THUMB_TITLE_COL_W / 2,
                  height: canvasLayout.thumbRowH,
                },
              ]}
            >
              <DiscreteRangeSliderThumbLabel
                width={THUMB_TITLE_COL_W}
                height={canvasLayout.thumbRowH}
                color={text.secondary}
              >
                {lowTitle}
              </DiscreteRangeSliderThumbLabel>
            </View>
          ) : null}
          {trackW > 0 && !sameThumbValue && highVal != null ? (
            <View
              style={[
                styles.thumbTitleCol,
                {
                  left: xHigh - THUMB_TITLE_COL_W / 2,
                  height: canvasLayout.thumbRowH,
                },
              ]}
            >
              <DiscreteRangeSliderThumbLabel
                width={THUMB_TITLE_COL_W}
                height={canvasLayout.thumbRowH}
                color={text.secondary}
              >
                {highTitle}
              </DiscreteRangeSliderThumbLabel>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 6,
  },
  sliderCanvas: {
    position: "relative",
    width: "100%",
    overflow: "visible",
  },
  trackBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: THUMB_HIT,
  },
  trackInner: {
    width: "100%",
    height: THUMB_HIT,
    justifyContent: "center",
  },
  trackBg: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  tickLayer: {
    ...StyleSheet.absoluteFillObject,
    height: THUMB_HIT,
    width: "100%",
  },
  tick: {
    position: "absolute",
    width: TICK_SIZE,
    height: TICK_SIZE,
    borderRadius: TICK_RADIUS,
    top: (THUMB_HIT - TICK_SIZE) / 2,
  },
  trackFill: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    top: (THUMB_HIT - TRACK_HEIGHT) / 2,
  },
  thumbWrap: {
    position: "absolute",
    width: THUMB_HIT,
    height: THUMB_HIT,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbScale: {},
  tickLabelsLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1,
  },
  thumbTitlesLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2,
  },
  thumbTitleCol: {
    position: "absolute",
    top: 0,
    width: THUMB_TITLE_COL_W,
    alignItems: "center",
  },
  thumbTitleMergedWrap: {
    position: "absolute",
    top: 0,
    alignItems: "center",
  },
});
