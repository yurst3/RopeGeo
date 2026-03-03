import { Badge, BadgeBackgroundColor } from "@/components/badges/Badge";

export function UnknownBadge({ showLabel }: { showLabel?: boolean } = {}) {
  return (
    <Badge
      icon={require("@/assets/images/badgeIcons/unkown.png")}
      backgroundColor={BadgeBackgroundColor.Grey}
      label={showLabel ? "Unknown" : undefined}
    />
  );
}
