import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function FlowingC3WaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/water/flowing.png")}
      subIcon={require("@/assets/images/badgeIcons/difficulty/water/c3.png")}
      subIconScale={1.2}
      backgroundColor={BadgeBackgroundColor.Red}
      label={showLabel ? "Very High Current" : undefined}
    />
  );
}
