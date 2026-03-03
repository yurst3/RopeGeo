import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function HighClearanceBadge({
  showLabel,
}: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/vehicle/highClearance.png")}
      backgroundColor={BadgeBackgroundColor.Orange}
      label={showLabel ? "High Clearance" : undefined}
    />
  );
}
