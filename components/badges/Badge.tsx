import type { ImageSourcePropType } from "react-native";
import { Image, StyleSheet, Text, View } from "react-native";

export const BadgeBackgroundColor = {
  Green: "Green",
  Yellow: "Yellow",
  Orange: "Orange",
  LightOrange: "LightOrange",
  Red: "Red",
  Black: "Black",
  Brown: "Brown",
  Blue: "Blue",
  Grey: "Grey",
} as const;
export type BadgeBackgroundColorType =
  (typeof BadgeBackgroundColor)[keyof typeof BadgeBackgroundColor];

const BACKGROUND_COLORS: Record<BadgeBackgroundColorType, string> = {
  Green: "#22c55e",
  Yellow: "#eab308",
  Orange: "#f97316",
  LightOrange: "#fdba74",
  Red: "#ef4444",
  Black: "#171717",
  Brown: "#d4a574",
  Blue: "#93c5fd",
  Grey: "#d1d5db",
};

const SUB_RATIO = 2 / 5; // sub circle width : main circle width

const DEFAULT_SIZE = 56;

export type BadgeProps = {
  icon: ImageSourcePropType;
  backgroundColor: BadgeBackgroundColorType;
  /** When omitted, the sub badge is not rendered. */
  subIcon?: ImageSourcePropType;
  size?: number;
  /** Multiplier for the main icon size. Default 1. */
  iconScale?: number;
  /** Multiplier for the sub icon size. Default 1. */
  subIconScale?: number;
  /** Optional label shown below the badge. */
  label?: string;
  /** Tint color for the main icon only. Default black. */
  iconColor?: string;
};

const ICON_SCALE_FACTOR = 0.6 * 1.25;
const SUB_ICON_SCALE_FACTOR = 0.6 * 1.75;

export function Badge({
  icon,
  backgroundColor,
  subIcon,
  size = DEFAULT_SIZE,
  iconScale = 1,
  subIconScale = 1,
  label,
  iconColor = "#000",
}: BadgeProps) {
  const subSize = size * SUB_RATIO;
  const mainRadius = size / 2;
  const subRadius = subSize / 2;
  const iconSize = Math.round(size * ICON_SCALE_FACTOR * iconScale);
  const subIconSize =
    subIcon != null
      ? Math.round(subSize * SUB_ICON_SCALE_FACTOR * subIconScale)
      : 0;

  const circle = (
    <View
      style={[
        styles.mainCircle,
        {
          width: size,
          height: size,
          borderRadius: mainRadius,
          backgroundColor: BACKGROUND_COLORS[backgroundColor],
        },
      ]}
    >
      <Image
        source={icon}
        style={[styles.mainIcon, { width: iconSize, height: iconSize, tintColor: iconColor }]}
        resizeMode="contain"
      />
      {subIcon != null && (
        <View
          style={[
            styles.sub,
            {
              width: subSize,
              height: subSize,
              borderRadius: subRadius,
              right: -subSize / 7,
              bottom: -subSize / 7,
            },
          ]}
        >
          <Image
            source={subIcon}
            style={[styles.subIcon, { width: subIconSize, height: subIconSize }]}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );

  if (label != null && label !== "") {
    return (
      <View style={styles.withLabel}>
        {circle}
        <Text style={styles.label}>
          {label}
        </Text>
      </View>
    );
  }
  return circle;
}

const styles = StyleSheet.create({
  withLabel: {
    alignItems: "center",
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    maxWidth: DEFAULT_SIZE + 16,
  },
  mainCircle: {
    borderWidth: 1.5,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  mainIcon: {},
  sub: {
    position: "absolute",
    backgroundColor: "#9ca3af",
    borderWidth: 1.5,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  subIcon: {
    tintColor: "#000",
  },
});
