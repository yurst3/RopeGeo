import { RelevanceStrengthBadge } from "@/components/badges/relevance/RelevanceStrengthBadge";
import { ScalingText } from "@/components/text/ScalingText";
import { BADGE_BUTTON_KEY } from "@/constants/buttons";
import type { BadgeButtonColors } from "@/constants/colors/types";
import type { ScalingTextSizeSpec } from "@/constants/uiScale/types";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonIconScale } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { RelevanceStrength } from "ropegeo-common/models";

const INFO_ICON = require("@/assets/images/icons/buttons/info.png");

/** Smaller than BadgeButton's 18/12 so the pill info mark sits below the badge. */
const DESIGN_INFO_ICON_WRAP_SIZE = 12;
const DESIGN_INFO_ICON_IMAGE_SIZE = 8;
const DESIGN_BADGE_SIZE = 26;

export type RelevanceStrengthPillProps = {
  strength: RelevanceStrength;
};

function relevanceInfoBasePath(pathname: string): "/explore" | "/saved" {
  return pathname === "/saved" || pathname.startsWith("/saved/")
    ? "/saved"
    : "/explore";
}

/**
 * Full-width pill showing relevance strength label, info affordance, and the
 * matching relevance badge. Presses open the relevance strength info screen.
 */
export function RelevanceStrengthPill({ strength }: RelevanceStrengthPillProps) {
  const themeColors = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const router = useRouter();
  const pathname = usePathname();
  const buttonSpec = uiScale.map.buttons.relevantInfoStrengthLabel;
  const iconScale = useResolvedButtonIconScale(buttonSpec);
  const { infoIconBackground, infoIcon } =
    themeColors.button.nonstandard[BADGE_BUTTON_KEY] as BadgeButtonColors;

  const sizes = useMemo(
    () => ({
      infoWrap: Math.round(DESIGN_INFO_ICON_WRAP_SIZE * iconScale),
      infoImage: Math.round(DESIGN_INFO_ICON_IMAGE_SIZE * iconScale),
      badge: Math.round(DESIGN_BADGE_SIZE * iconScale),
    }),
    [iconScale],
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
      accessibilityLabel={`${strength}. Learn more about relevance strength.`}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.pill,
            { backgroundColor: themeColors.cardHighlight },
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.infoIconWrap,
              {
                backgroundColor: infoIconBackground,
                width: sizes.infoWrap,
                height: sizes.infoWrap,
                borderRadius: sizes.infoWrap / 2,
              },
            ]}
          >
            <Image
              source={INFO_ICON}
              style={{
                width: sizes.infoImage,
                height: sizes.infoImage,
                tintColor: infoIcon,
              }}
              contentFit="contain"
            />
          </View>
          <View style={styles.labelWrap}>
            <ScalingText
              size={buttonSpec.text as ScalingTextSizeSpec}
              typography={textStyle.map.relevantInfoStrengthLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
              avoidMidWordLineBreaks
              measure={{ type: "width", widthSafetyMargin: 2 }}
              containerStyle={styles.labelContainer}
              style={{ color: themeColors.text.secondary, textAlign: "center" }}
            >
              {strength}
            </ScalingText>
          </View>
          <RelevanceStrengthBadge strength={strength} size={sizes.badge} />
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
  infoIconWrap: {
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  labelWrap: {
    flex: 1,
    minWidth: 0,
  },
  labelContainer: {
    alignSelf: "stretch",
  },
});
