import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function NoShuttleBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/shuttle/noShuttle.png")}
      backgroundColor={BadgeBackgroundColor.Green}
      label={showLabel ? "No Shuttle" : undefined}
    />
  );
}
