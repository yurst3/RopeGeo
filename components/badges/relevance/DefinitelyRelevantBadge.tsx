import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function DefinitelyRelevantBadge({
  showLabel,
  size,
}: { showLabel?: boolean; size?: number } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } =
    themeColors.badge.relevanceStrength["Definitely Relevant"];

  return (
    <Badge
      iconColor={icon}
      icon={require("@/assets/images/icons/badges/relevance/definitely.png")}
      backgroundColor={background}
      size={size}
      label={showLabel ? "Definitely relevant" : undefined}
    />
  );
}
