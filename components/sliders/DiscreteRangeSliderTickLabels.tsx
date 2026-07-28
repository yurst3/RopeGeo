import { ScalingText } from "@/components/text/ScalingText";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  tickLabelSlotBounds,
  TICK_LABEL_MAX_LINES,
} from "@/components/sliders/discreteRangeSliderLayout";
import { StyleSheet, View } from "react-native";

export type DiscreteRangeSliderTickLabelsProps = {
  labels: readonly string[];
  trackWidth: number;
  /** Indices covered by a thumb (label hidden). */
  coveredIndices: ReadonlySet<number>;
  color: string;
  height: number;
};

/**
 * Tick labels absolutely positioned like the original fixed-width slots
 * (`left = cx - width / 2`), with {@link tickLabelSlotBounds} supplying the
 * max centered width that fits between neighboring ticks.
 */
export function DiscreteRangeSliderTickLabels({
  labels,
  trackWidth,
  coveredIndices,
  color,
  height,
}: DiscreteRangeSliderTickLabelsProps) {
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const n = labels.length;

  if (n === 0 || trackWidth <= 0) return null;

  return (
    <View style={[styles.band, { height }]}>
      {labels.map((label, index) => {
        const { left, width } = tickLabelSlotBounds(index, trackWidth, n);
        return (
          <View
            key={`tick-lbl-${index}-${label}`}
            style={[
              styles.slot,
              {
                left,
                width,
                height,
                opacity: coveredIndices.has(index) ? 0 : 1,
              },
            ]}
          >
            <ScalingText
              size={uiScale.filter.text.multiSliderTickLabel}
              typography={textStyle.filter.note}
              numberOfLines={TICK_LABEL_MAX_LINES}
              ellipsizeMode="clip"
              avoidMidWordLineBreaks
              measure={{ type: "width", widthSafetyMargin: 2 }}
              containerStyle={[styles.measureWrap, { width }]}
              style={[styles.label, { color }]}
            >
              {label}
            </ScalingText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    width: "100%",
    position: "relative",
  },
  slot: {
    position: "absolute",
    top: 0,
    alignItems: "center",
  },
  measureWrap: {
    alignItems: "center",
  },
  label: {
    textAlign: "center",
  },
});
