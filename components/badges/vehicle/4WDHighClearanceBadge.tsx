import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function FourWDHighClearanceBadge({
  showLabel,
}: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/vehicle/4WDHighClearance.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      iconScale={0.9}
      label={showLabel ? "4WD High Clearance" : undefined}
    />
  );
}
