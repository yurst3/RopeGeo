import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function CaveBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/route/cave.png")}
      backgroundColor={BadgeBackgroundColor.Brown}
      label={showLabel ? "Cave" : undefined}
    />
  );
}
