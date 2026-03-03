import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function FourWDBadge({
  showLabel,
}: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/vehicle/4WD.png")}
      backgroundColor={BadgeBackgroundColor.Yellow}
      label={showLabel ? "4WD" : undefined}
    />
  );
}
