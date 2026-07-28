import { Badge } from "@/components/badges/Badge";
import { useColorTheme } from "@/context/theme/ColorThemeContext";

export function MaybeRelevantBadge({
  showLabel,
  size,
}: { showLabel?: boolean; size?: number } = {}) {
  const themeColors = useColorTheme();
  const { background, icon } = themeColors.badge.relevanceStrength["Maybe Relevant"];

  return (
    <Badge
      iconColor={icon}
      icon={require("@/assets/images/icons/badges/relevance/maybe.png")}
      backgroundColor={background}
      size={size}
      label={showLabel ? "Maybe relevant" : undefined}
    />
  );
}
