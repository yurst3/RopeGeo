import { ScalingText } from "@/components/text/ScalingText";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { THUMB_LABEL_MAX_LINES } from "@/components/sliders/discreteRangeSliderLayout";
import { StyleSheet } from "react-native";

export type DiscreteRangeSliderThumbLabelProps = {
  children: string;
  width: number;
  height: number;
  color: string;
};

export function DiscreteRangeSliderThumbLabel({
  children,
  width,
  height,
  color,
}: DiscreteRangeSliderThumbLabelProps) {
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  return (
    <ScalingText
      size={uiScale.filter.text.multiSliderThumbLabel}
      typography={textStyle.filter.sectionTitle}
      numberOfLines={THUMB_LABEL_MAX_LINES}
      ellipsizeMode="tail"
      measure={{ type: "lineCount", maxLinesAtMaxSize: THUMB_LABEL_MAX_LINES }}
      containerStyle={{ width, height }}
      style={[styles.text, { color }]}
    >
      {children}
    </ScalingText>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: "center",
  },
});
