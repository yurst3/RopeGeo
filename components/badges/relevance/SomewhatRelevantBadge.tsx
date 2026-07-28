import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function SomewhatRelevantBadge({
  showLabel,
  size,
}: { showLabel?: boolean; size?: number } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } =
    themeColors.badge.relevanceStrength["Somewhat Relevant"];

  return (
    <Badge
      iconColor={icon}
      icon={require("@/assets/images/icons/badges/relevance/somewhat.png")}
      backgroundColor={background}
      size={size}
      label={showLabel ? "Somewhat relevant" : undefined}
    />
  );
}
