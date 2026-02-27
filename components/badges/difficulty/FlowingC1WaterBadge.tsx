import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function FlowingC1WaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/water/flowing.png")}
      subIcon={require("@/assets/images/badgeIcons/difficulty/water/c1.png")}
      subIconScale={1.2}
      backgroundColor={BadgeBackgroundColor.Yellow}
      label={showLabel ? "Moderate Current" : undefined}
    />
  );
}
