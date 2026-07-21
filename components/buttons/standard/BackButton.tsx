import { FontAwesome5 } from "@expo/vector-icons";
import { BACK_BUTTON_KEY } from "@/constants/buttons";
import { useEffect } from "react";
import { BackHandler } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";

import {
  Button,
  STANDARD_BUTTON_SIZE,
} from "@/components/buttons/Button";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useBackWithFallback } from "@/utils/navigation/useBackWithFallback";
import {
  useResolvedButtonBackgroundScale,
  useResolvedButtonIconScale,
} from "@/utils/theme/resolvers";

const BASE_ICON_SIZE = 20;


/**
 * When `top` is provided the button positions itself absolutely (screen-level usage).
 * Without `top` it renders inline (e.g. inside a header row).
 *
 * `onPress` is optional: when omitted, the button pops the stack and falls back to
 * the relevant tab root on cold-start deep links (see `useBackWithFallback`).
 * Set `handleHardwareBack` to also drive the Android hardware back button.
 */
export function BackButton({
  onPress,
  top,
  size = STANDARD_BUTTON_SIZE,
  style,
  handleHardwareBack = false,
}: {
  onPress?: () => void;
  top?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  handleHardwareBack?: boolean;
}) {
  const backWithFallback = useBackWithFallback();
  const handlePress = onPress ?? backWithFallback;

  useEffect(() => {
    if (!handleHardwareBack) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handlePress();
      return true;
    });
    return () => sub.remove();
  }, [handleHardwareBack, handlePress]);

  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[BACK_BUTTON_KEY];
  const uiScale = useUiScale();
  const buttonSpec = uiScale.common.buttons.back;
  const backgroundScale = useResolvedButtonBackgroundScale(buttonSpec);
  const profileIconScale = useResolvedButtonIconScale(buttonSpec);
  const buttonSize = Math.round(size * backgroundScale);
  const iconSize = Math.round(BASE_ICON_SIZE * profileIconScale);
  return (
    <Button
      onPress={handlePress}
      size={buttonSize}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      iconColor={buttonColors.icon}
      style={[
        top != null && styles.fixed,
        top != null && { top },
        style,
      ]}
      accessibilityLabel="Go back"
    >
      <FontAwesome5
        name="arrow-left"
        size={iconSize}
        color={buttonColors.icon}
      />
    </Button>
  );
}

const styles = StyleSheet.create({
  fixed: {
    position: "absolute",
    left: 16,
    zIndex: 3600,
  },
});
