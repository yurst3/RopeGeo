import { RelevanceStrengthBadge } from "@/components/badges/relevance/RelevanceStrengthBadge";
import { ScalingText } from "@/components/text/ScalingText";
import type { ScalingTextSizeSpec } from "@/constants/uiScale/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  useResolvedButtonIconScale,
  useResolvedTypography,
} from "@/utils/theme/resolvers";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RelevanceStrength } from "ropegeo-common/models";

const DESIGN_BADGE_SIZE = 26;
/** Separator between min/max values in a combined range pill. */
const VALUE_RANGE_SEPARATOR = " – ";

export type MeasurementContextPillProps = {
  label: string;
  /** One value, or min then max for a combined time-range context. */
  values: string[];
  strength: RelevanceStrength;
};

function relevanceInfoBasePath(pathname: string): "/explore" | "/saved" {
  return pathname === "/saved" || pathname.startsWith("/saved/")
    ? "/saved"
    : "/explore";
}

function formatMeasurementLine(label: string, values: string[]): string {
  return `${label}: ${values.join(VALUE_RANGE_SEPARATOR)}`;
}

/**
 * Full-width Relevant Info pill: measurement label + value(s) on the left, relevance
 * badge on the right. Matches {@link RelevanceStrengthPill} chrome (cardHighlight pill).
 * Presses open the relevance strength info screen.
 */
export function MeasurementContextPill({
  label,
  values,
  strength,
}: MeasurementContextPillProps) {
  const themeColors = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const router = useRouter();
  const pathname = usePathname();
  const buttonSpec = uiScale.map.buttons.measurementContextPill;
  const iconScale = useResolvedButtonIconScale(buttonSpec);
  const typographyStyle = useResolvedTypography(
    textStyle.map.measurementContextPill,
  );
  const valueTypographyStyle = useMemo(
    () => ({ ...typographyStyle, fontWeight: "700" as const }),
    [typographyStyle],
  );

  const badgeSize = useMemo(
    () => Math.round(DESIGN_BADGE_SIZE * iconScale),
    [iconScale],
  );

  const lineText = useMemo(
    () => formatMeasurementLine(label, values),
    [label, values],
  );

  const renderLabel = useCallback(
    (fontSize: number) => (
      <Text
        allowFontScaling={false}
        numberOfLines={2}
        ellipsizeMode="tail"
        style={[
          typographyStyle,
          {
            color: themeColors.text.primary,
            fontSize,
            textAlign: "left",
          },
        ]}
      >
        {`${label}: `}
        {values.map((value, index) => (
          <Text key={`${value}-${index}`}>
            {index > 0 ? VALUE_RANGE_SEPARATOR : null}
            <Text style={valueTypographyStyle}>{value}</Text>
          </Text>
        ))}
      </Text>
    ),
    [label, themeColors.text.primary, typographyStyle, valueTypographyStyle, values],
  );

  return (
    <Pressable
      style={styles.pressable}
      onPress={() => {
        const basePath = relevanceInfoBasePath(pathname ?? "");
        router.push({
          pathname: `${basePath}/relevance-info`,
          params: { highlightedRelevance: strength },
        });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${lineText}, ${strength}. Learn more about relevance strength.`}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.pill,
            { backgroundColor: themeColors.cardHighlight },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.labelWrap}>
            <ScalingText
              size={buttonSpec.text as ScalingTextSizeSpec}
              typography={textStyle.map.measurementContextPill}
              numberOfLines={2}
              ellipsizeMode="tail"
              avoidMidWordLineBreaks
              measure={{ type: "lineCount", maxLinesAtMaxSize: 2 }}
              measureTextStyle={valueTypographyStyle}
              containerStyle={styles.labelContainer}
              style={{ color: themeColors.text.primary, textAlign: "left" }}
              renderLabel={renderLabel}
            >
              {lineText}
            </ScalingText>
          </View>
          <RelevanceStrengthBadge strength={strength} size={badgeSize} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: "stretch",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignSelf: "stretch",
  },
  pressed: {
    opacity: 0.88,
  },
  labelWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  labelContainer: {
    alignSelf: "stretch",
  },
});
