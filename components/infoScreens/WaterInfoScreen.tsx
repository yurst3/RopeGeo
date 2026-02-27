import { FlowingC1WaterBadge } from "@/components/badges/difficulty/FlowingC1WaterBadge";
import { FlowingC2WaterBadge } from "@/components/badges/difficulty/FlowingC2WaterBadge";
import { FlowingC3WaterBadge } from "@/components/badges/difficulty/FlowingC3WaterBadge";
import { FlowingC4WaterBadge } from "@/components/badges/difficulty/FlowingC4WaterBadge";
import { FlowingWaterBadge } from "@/components/badges/difficulty/FlowingWaterBadge";
import { MinimalWaterBadge } from "@/components/badges/difficulty/MinimalWaterBadge";
import { SwimmingWaterBadge } from "@/components/badges/difficulty/SwimmingWaterBadge";
import { DifficultyWater } from "ropegeo-common";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WATER_ORDER: DifficultyWater[] = Object.values(DifficultyWater);

const BADGE_COLUMN_WIDTH = 80;

const WATER_BADGES: Record<
  DifficultyWater,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [DifficultyWater.A]: MinimalWaterBadge,
  [DifficultyWater.B]: SwimmingWaterBadge,
  [DifficultyWater.C]: FlowingWaterBadge,
  [DifficultyWater.C1]: FlowingC1WaterBadge,
  [DifficultyWater.C2]: FlowingC2WaterBadge,
  [DifficultyWater.C3]: FlowingC3WaterBadge,
  [DifficultyWater.C4]: FlowingC4WaterBadge,
};

/** Descriptions aligned with ACA water class. See ropewiki.com/ACA_rating, canyoneeringusa.com, dankat.com. */
const WATER_DESCRIPTIONS: Record<DifficultyWater, { body: string }> = {
  [DifficultyWater.A]: {
    body:
      "Normally dry or very little water. Wading to waist deep at most. No water of consequence; " +
      "water if present can be avoided or is very shallow. Shoes may get wet; no wetsuit required.",
  },
  [DifficultyWater.B]: {
    body:
      "Water with no current or light current. Still pools. Falls normally dry or running at a trickle. " +
      "Expect deep wading and/or swimming. Wetsuit or drysuit may be required depending on water and air temperatures.",
  },
  [DifficultyWater.C]: {
    body:
      "Water with strong current. Waterfalls. Expect deep wading and/or swimming in current. " +
      "Wet canyon rope techniques required. Wetsuit or drysuit may be required.",
  },
  [DifficultyWater.C1]: {
    body:
      "Normally has water with light to moderate current. Easy water hazards. " +
      "Rating higher than C1 suggests at least some swiftwater skill or ability to recognize hydraulic hazards.",
  },
  [DifficultyWater.C2]: {
    body:
      "Normally has water with strong current. Water hazards like hydraulics and siphons require " +
      "advanced skills and special care.",
  },
  [DifficultyWater.C3]: {
    body:
      "Normally has water with very strong current. Dangerous water hazards. Experts only.",
  },
  [DifficultyWater.C4]: {
    body:
      "Extreme problems and hazards will be difficult to overcome, even for experienced experts " +
      "with strong swimming skills.",
  },
};

export type WaterInfoScreenProps = {
  highlightedWater?: DifficultyWater | null;
};

export function WaterInfoScreen({ highlightedWater }: WaterInfoScreenProps) {
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
        The letter in an ACA rating denotes the type of challenge presented by
        water in the canyon. Water level can fluctuate greatly; if you find
        more water or current than indicated, reevaluate your decision to
        attempt the descent.
      </Text>
      {WATER_ORDER.map((water) => {
        const BadgeComponent = WATER_BADGES[water];
        const { body } = WATER_DESCRIPTIONS[water];
        const isHighlighted = highlightedWater === water;

        return (
          <React.Fragment key={water}>
            {water === DifficultyWater.C1 && (
              <View style={styles.cClassNote}>
                <Text style={styles.cClassNoteText}>
                  Class C canyons can be described more precisely with the C1
                  through C4 ratings. Water flow rates change throughout the
                  year, and a canyon's actual flow may be higher or lower than
                  what's described by the rating.
                </Text>
              </View>
            )}
            <View
              style={[styles.row, isHighlighted && styles.rowHighlighted]}
            >
              <View style={styles.badgeWrap}>
                <BadgeComponent showLabel />
              </View>
              <View style={styles.descriptionWrap}>
                <Text style={styles.body}>{body}</Text>
              </View>
            </View>
          </React.Fragment>
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
  cClassNote: {
    marginBottom: 20,
  },
  cClassNoteText: {
    fontSize: 15,
    color: "#666",
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
