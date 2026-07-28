import { DiscreteRangeSlider } from "@/components/sliders/DiscreteRangeSlider";
import { ScaledFilterSwitch } from "@/components/filters/ScaledFilterSwitch";
import {
  RELEVANCE_STRENGTH_BADGES,
  RELEVANCE_STRENGTH_THUMB_TITLES,
  RELEVANCE_STRENGTH_TICK_LABELS,
} from "@/constants/sliders";
import { ConstantText } from "@/components/text/ConstantText";
import { BADGE_BUTTON_KEY } from "@/constants/buttons";
import type { BadgeButtonColors } from "@/constants/colors/types";
import type { ConstantTextSizeSpec } from "@/constants/uiScale/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  RELEVANCE_STRENGTHS,
  type RelevanceStrength,
} from "ropegeo-common/models";

const INFO_ICON = require("@/assets/images/icons/buttons/info.png");

const DESIGN_INFO_ICON_WRAP_SIZE = 18;
const DESIGN_INFO_ICON_IMAGE_SIZE = 12;
const DISABLED_SLIDER_OPACITY = 0.28;

export type RelevantInfoSettingsSectionProps = {
  showRelevantContext: boolean;
  strengthMin: RelevanceStrength;
  strengthMax: RelevanceStrength;
  onShowRelevantContextChange: (show: boolean) => void;
  onStrengthsChange: (min: RelevanceStrength, max: RelevanceStrength) => void;
};

export function RelevantInfoSettingsSection({
  showRelevantContext,
  strengthMin,
  strengthMax,
  onShowRelevantContextChange,
  onStrengthsChange,
}: RelevantInfoSettingsSectionProps) {
  const themeColors = useColorTheme();
  const { switchLabel, switchTrackColors, switchThumbColor } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const router = useRouter();
  const iconSizeScale = useResolvedIconSizeScale();
  const { infoIconBackground, infoIcon } =
    themeColors.button.nonstandard[BADGE_BUTTON_KEY] as BadgeButtonColors;

  const infoIconSizes = useMemo(
    () => ({
      wrap: Math.round(DESIGN_INFO_ICON_WRAP_SIZE * iconSizeScale),
      image: Math.round(DESIGN_INFO_ICON_IMAGE_SIZE * iconSizeScale),
    }),
    [iconSizeScale],
  );

  const openRelevanceInfo = () => {
    router.push("/settings/relevance-info");
  };

  return (
    <View style={styles.section}>
      <View style={styles.switchRow}>
        <Pressable
          onPress={openRelevanceInfo}
          style={styles.labelPressable}
          accessibilityRole="button"
          accessibilityLabel="Show Relevant Info. Learn more about relevance strength."
        >
          <ConstantText
            size={uiScale.filter.buttons.switch.text as ConstantTextSizeSpec}
            typography={textStyle.filter.optionLabel}
            style={[switchLabel, styles.labelText]}
          >
            Show Relevant Info
          </ConstantText>
          <View
            style={[
              styles.infoIconWrap,
              {
                backgroundColor: infoIconBackground,
                width: infoIconSizes.wrap,
                height: infoIconSizes.wrap,
                borderRadius: infoIconSizes.wrap / 2,
              },
            ]}
          >
            <Image
              source={INFO_ICON}
              style={{
                width: infoIconSizes.image,
                height: infoIconSizes.image,
                tintColor: infoIcon,
              }}
              contentFit="contain"
            />
          </View>
        </Pressable>
        <ScaledFilterSwitch
          value={showRelevantContext}
          onValueChange={onShowRelevantContextChange}
          trackColor={switchTrackColors}
          thumbColor={switchThumbColor}
          ios_backgroundColor={switchTrackColors.false}
        />
      </View>
      <View
        style={!showRelevantContext ? styles.sliderDisabled : null}
        pointerEvents={showRelevantContext ? "auto" : "none"}
      >
        <DiscreteRangeSlider
          orderedValues={RELEVANCE_STRENGTHS}
          min={strengthMin}
          max={strengthMax}
          badges={RELEVANCE_STRENGTH_BADGES}
          thumbTitles={RELEVANCE_STRENGTH_THUMB_TITLES}
          formatTickLabel={(value) => RELEVANCE_STRENGTH_TICK_LABELS[value]}
          onChange={onStrengthsChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  labelPressable: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  labelText: {
    flex: 0,
    marginRight: 0,
  },
  infoIconWrap: {
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  sliderDisabled: {
    opacity: DISABLED_SLIDER_OPACITY,
  },
});
