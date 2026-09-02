import { Button, STANDARD_BUTTON_SIZE } from "@/components/buttons/Button";
import { MAP_LAYERS_BUTTON_KEY } from "@/constants/buttons";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedButtonDimensions } from "@/utils/theme/resolvers";

const MAP_LAYERS_ICON_DESIGN_SCALE = 1.2;

export function MapLayersButton({
  onPress,
  customized = false,
  stacked = false,
}: {
  onPress: () => void;
  /** Solid asset + highlight tint when map layers differ from defaults. */
  customized?: boolean;
  stacked?: boolean;
}) {
  const themeColors = useColorTheme();
  const buttonColors = themeColors.button.standard[MAP_LAYERS_BUTTON_KEY];
  const uiScale = useUiScale();
  const { size, iconScale } = useResolvedButtonDimensions(
    uiScale.common.buttons.filter,
    STANDARD_BUTTON_SIZE,
    MAP_LAYERS_ICON_DESIGN_SCALE,
  );
  return (
    <Button
      onPress={onPress}
      size={size}
      backgroundColor={buttonColors.background}
      shadowColor={themeColors.button.shadowColor}
      icon={
        customized
          ? require("@/assets/images/icons/buttons/mapLayers-solid.png")
          : require("@/assets/images/icons/buttons/mapLayers.png")
      }
      iconColor={buttonColors.icon}
      iconColorHighlight={buttonColors.iconHighlight}
      highlighted={customized}
      iconScale={iconScale}
      accessibilityLabel="Map layers"
    />
  );
}
