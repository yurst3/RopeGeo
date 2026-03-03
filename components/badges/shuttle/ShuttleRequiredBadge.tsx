import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function ShuttleRequiredBadge({
  showLabel,
}: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/shuttle/shuttle.png")}
      backgroundColor={BadgeBackgroundColor.Yellow}
      label={showLabel ? "Shuttle Required" : undefined}
    />
  );
}
