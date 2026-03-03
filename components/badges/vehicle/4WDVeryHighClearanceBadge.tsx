import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function FourWDVeryHighClearanceBadge({
  showLabel,
}: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/vehicle/4WDVeryHighClearance.png")}
      backgroundColor={BadgeBackgroundColor.Red}
      label={showLabel ? "4WD Very High Clearance" : undefined}
    />
  );
}
