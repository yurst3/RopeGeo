import type { ViewStyle } from "react-native";

/** Shadow metrics shared by {@link Button} and elevated surfaces that match it. */
export const STANDARD_BUTTON_SHADOW = {
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 2,
} as const satisfies Pick<
  ViewStyle,
  "shadowOffset" | "shadowOpacity" | "shadowRadius" | "elevation"
>;

export function standardButtonShadowStyle(shadowColor: string): ViewStyle {
  return {
    ...STANDARD_BUTTON_SHADOW,
    shadowColor,
  };
}
