import { ClosedBadge } from "@/components/badges/permit/ClosedBadge";
import { NoPermitBadge } from "@/components/badges/permit/NoPermitBadge";
import { PermitRequiredBadge } from "@/components/badges/permit/PermitRequiredBadge";
import { RestrictedBadge } from "@/components/badges/permit/RestrictedBadge";
import { PermitStatus } from "ropegeo-common";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PERMIT_ORDER: PermitStatus[] = [
  PermitStatus.No,
  PermitStatus.Yes,
  PermitStatus.Restricted,
  PermitStatus.Closed,
];

const BADGE_COLUMN_WIDTH = 80;

const PERMIT_BADGES: Record<
  PermitStatus,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [PermitStatus.No]: NoPermitBadge,
  [PermitStatus.Yes]: PermitRequiredBadge,
  [PermitStatus.Restricted]: RestrictedBadge,
  [PermitStatus.Closed]: ClosedBadge,
};

/** Descriptions from RopeWiki Property:Requires_permits (https://ropewiki.com/Property:Requires_permits). */
const PERMIT_DESCRIPTIONS: Record<PermitStatus, { body: string }> = {
  [PermitStatus.No]: {
    body:
      "No permit is required to access the canyon. Always verify current regulations with local land managers before your trip.",
  },
  [PermitStatus.Yes]: {
    body:
      "A permit is required to access the canyon. Obtain permits through the managing agency or designated permit system before your trip.",
  },
  [PermitStatus.Restricted]: {
    body:
      "Access restricted due to commercial, environmental or archaeological reasons. Permits may be available only for special projects. " +
      "The canyon may only be accessed with a guide or on a guided tour, or with a special key (such as a cave gate). " +
      "It might be closed in spring due to nesting or breeding. Check with land managers for current access and permit options.",
  },
  [PermitStatus.Closed]: {
    body:
      "The canyon is closed to access. Do not attempt to enter. Closures may be temporary (e.g. seasonal, fire) or permanent; check for updates.",
  },
};

export type PermitInfoScreenProps = {
  highlightedPermit?: PermitStatus | null;
};

export function PermitInfoScreen({
  highlightedPermit,
}: PermitInfoScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: 12,
          paddingLeft: 16 + insets.left,
          paddingRight: 16 + insets.right,
        },
      ]}
    >
      <Text style={styles.subtitle}>
        Permit status indicates whether access to the canyon requires a permit or
        is restricted. Requirements can change; always confirm with the
        managing agency before your trip.
      </Text>
      {PERMIT_ORDER.map((permit) => {
        const BadgeComponent = PERMIT_BADGES[permit];
        const { body } = PERMIT_DESCRIPTIONS[permit];
        const isHighlighted = highlightedPermit === permit;

        return (
          <View
            key={permit}
            style={[styles.row, isHighlighted && styles.rowHighlighted]}
          >
            <View style={styles.badgeWrap}>
              <BadgeComponent showLabel />
            </View>
            <View style={styles.descriptionWrap}>
              <Text style={styles.body}>{body}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  rowHighlighted: {
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  badgeWrap: {
    width: BADGE_COLUMN_WIDTH,
    flexShrink: 0,
    alignItems: "center",
  },
  descriptionWrap: { flex: 1, minWidth: 0 },
  body: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
});
