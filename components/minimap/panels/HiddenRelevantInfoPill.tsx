import { RelevanceStrengthBadge } from "@/components/badges/relevance/RelevanceStrengthBadge";
import { ConstantText } from "@/components/text/ConstantText";
import type { ConstantTextSizeSpec } from "@/constants/uiScale/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonIconScale } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { RelevanceStrength } from "ropegeo-common/models";

const HIDDEN_ICON = require("@/assets/images/icons/hidden.png");

const DESIGN_HIDDEN_ICON_SIZE = 14;
const DESIGN_BADGE_SIZE = 26;

export type HiddenRelevantInfoPillProps = {
  strength: RelevanceStrength;
  /** Number of relevant contexts of this strength hidden by the strength filter. */
  count: number;
};

/**
 * Compact pill showing how many contexts of a given relevance strength are
 * hidden by the Relevant Info strength settings.
 */
export function HiddenRelevantInfoPill({
  strength,
  count,
}: HiddenRelevantInfoPillProps) {
  const themeColors = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const buttonSpec = uiScale.map.buttons.relevantInfoHiddenPill;
  const iconScale = useResolvedButtonIconScale(buttonSpec);

  const sizes = useMemo(
    () => ({
      icon: Math.round(DESIGN_HIDDEN_ICON_SIZE * iconScale),
      badge: Math.round(DESIGN_BADGE_SIZE * iconScale),
    }),
    [iconScale],
  );

  return (
    <View
      style={[styles.pill, { backgroundColor: themeColors.cardHighlight }]}
      accessibilityLabel={`${count} hidden ${strength}`}
    >
      <Image
        source={HIDDEN_ICON}
        style={{
          width: sizes.icon,
          height: sizes.icon,
          tintColor: themeColors.text.secondary,
        }}
        contentFit="contain"
      />
      <ConstantText
        size={buttonSpec.text as ConstantTextSizeSpec}
        typography={textStyle.map.relevantInfoHiddenPill}
        style={{ color: themeColors.text.secondary }}
      >
        {`+${count}`}
      </ConstantText>
      <RelevanceStrengthBadge strength={strength} size={sizes.badge} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
});
