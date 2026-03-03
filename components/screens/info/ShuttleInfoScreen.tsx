import { NoShuttleBadge } from "@/components/badges/shuttle/NoShuttleBadge";
import { ShuttleRequiredBadge } from "@/components/badges/shuttle/ShuttleRequiredBadge";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ShuttleStatus = "0" | "1";

const SHUTTLE_ORDER: ShuttleStatus[] = ["0", "1"];

const BADGE_COLUMN_WIDTH = 80;

const SHUTTLE_BADGES: Record<
  ShuttleStatus,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  "0": NoShuttleBadge,
  "1": ShuttleRequiredBadge,
};

const SHUTTLE_DESCRIPTIONS: Record<ShuttleStatus, { body: string }> = {
  "0": {
    body:
      "No shuttle is needed. The exit of the canyon puts you back where you started, so you can leave a single vehicle at the trailhead.",
  },
  "1": {
    body:
      "A shuttle is required. The exit does not put you back where you started, so you need to arrange a shuttle from the exit back to the start (e.g. a second vehicle, or a pick-up).",
  },
};

export type ShuttleInfoScreenProps = {
  /** "0" = No Shuttle, "1" (or any non-zero) = Shuttle Required */
  highlightedShuttle?: string | null;
};

export function ShuttleInfoScreen({
  highlightedShuttle,
}: ShuttleInfoScreenProps) {
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
        Shuttle status indicates whether the canyon exit returns you to the
        start. Plan your vehicles or shuttle accordingly before your trip.
      </Text>
      {SHUTTLE_ORDER.map((status) => {
        const BadgeComponent = SHUTTLE_BADGES[status];
        const { body } = SHUTTLE_DESCRIPTIONS[status];
        const isHighlighted =
          status === "0"
            ? highlightedShuttle === "0"
            : highlightedShuttle != null && highlightedShuttle !== "0";

        return (
          <View
            key={status}
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
