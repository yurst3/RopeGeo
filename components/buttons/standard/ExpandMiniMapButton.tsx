import { Button } from "@/components/buttons/Button";
import { EXPAND_MINI_MAP_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useText } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";
import {
  EXPAND_BUTTON_SIZE,
  minimapStyles,
} from "@/components/modals/minimap/shared/minimapShared";


type ExpandMiniMapButtonProps = {
  onPress?: () => void;
};

/** Collapsed minimap control: expands the card to full-screen map. */
export function ExpandMiniMapButton({ onPress }: ExpandMiniMapButtonProps) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[EXPAND_MINI_MAP_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.map.buttons.expandMiniMap,
    EXPAND_BUTTON_SIZE,
  );
  return (
    <Button
      onPress={onPress ?? (() => {})}
      size={size}
      iconScale={iconScale}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={require("@/assets/images/icons/buttons/expand.png")}
      iconColor={buttonColors.icon}
      style={[minimapStyles.expandButton]}
      accessibilityLabel="Expand map"
    />
  );
}
