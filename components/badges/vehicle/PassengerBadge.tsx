import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function PassengerBadge({
  showLabel,
}: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/vehicle/passenger.png")}
      backgroundColor={BadgeBackgroundColor.Green}
      label={showLabel ? "Passenger" : undefined}
    />
  );
}
