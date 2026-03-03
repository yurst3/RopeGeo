import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function PoiBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/route/poi.png")}
      backgroundColor={BadgeBackgroundColor.Blue}
      label={showLabel ? "POI" : undefined}
    />
  );
}
