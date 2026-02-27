import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function FlowingC2WaterBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/difficulty/water/flowing.png")}
      subIcon={require("@/assets/images/badgeIcons/difficulty/water/c2.png")}
      subIconScale={1.2}
      backgroundColor={BadgeBackgroundColor.Orange}
      label={showLabel ? "High Current" : undefined}
    />
  );
}
