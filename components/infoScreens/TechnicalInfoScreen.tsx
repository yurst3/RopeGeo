import { NotTechnicalBadge } from "@/components/badges/difficulty/NotTechnicalBadge";
import { ScramblingBadge } from "@/components/badges/difficulty/ScramblingBadge";
import { TechnicalBadge } from "@/components/badges/difficulty/TechnicalBadge";
import { VeryTechnicalBadge } from "@/components/badges/difficulty/VeryTechnicalBadge";
import { DifficultyTechnical } from "ropegeo-common";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TECHNICAL_ORDER: DifficultyTechnical[] = Object.values(DifficultyTechnical);

const BADGE_COLUMN_WIDTH = 80;

const TECHNICAL_BADGES: Record<
  DifficultyTechnical,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [DifficultyTechnical.One]: NotTechnicalBadge,
  [DifficultyTechnical.Two]: ScramblingBadge,
  [DifficultyTechnical.Three]: TechnicalBadge,
  [DifficultyTechnical.Four]: VeryTechnicalBadge,
};

/** Descriptions aligned with ACA technical class. See ropewiki.com/ACA_rating, canyoneeringusa.com, dankat.com. */
const TECHNICAL_DESCRIPTIONS: Record<DifficultyTechnical, { body: string }> = {
  [DifficultyTechnical.One]: {
    body:
      "Canyon hiking. Non-technical; no rope required. A hike through a canyon with no special physical obstacles, " +
      "though navigation may be difficult. May involve easy scrambling with occasional use of hands for balance.",
  },
  [DifficultyTechnical.Two]: {
    body:
      "Basic canyoneering. Scrambling, easy climbing or downclimbing; a rope may be handy for handlines, belays, " +
      "lowering packs and emergency use. Exit or retreat possible upcanyon without fixed ropes. " +
      "Suitable for hikers with reasonable fitness.",
  },
  [DifficultyTechnical.Three]: {
    body:
      "Intermediate canyoneering. Rappels or technical climbing and/or downclimbing. Rope required for belays and " +
      "single-pitch rappels. Retreat upcanyon would require ascending fixed ropes. " +
      "Basic pothole escape techniques may be required.",
  },
  [DifficultyTechnical.Four]: {
    body:
      "Advanced canyoneering. May involve multi-pitch rappels, complex rope work (re-belays, tyrollean traverse, " +
      "guided rappels), difficult pothole escapes, serious squeezing, extensive high-risk downclimbing, or " +
      "difficult-to-establish natural anchors. Rappels longer than 200 feet often earn a Class 4 rating.",
  },
};

export type TechnicalInfoScreenProps = {
  highlightedTechnical?: DifficultyTechnical | null;
};

export function TechnicalInfoScreen({
  highlightedTechnical,
}: TechnicalInfoScreenProps) {
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
        The first number in an ACA rating denotes the degree of technical skill
        (especially rope work) required to complete the canyon successfully.
      </Text>
      {TECHNICAL_ORDER.map((technical) => {
        const BadgeComponent = TECHNICAL_BADGES[technical];
        const { body } = TECHNICAL_DESCRIPTIONS[technical];
        const isHighlighted = highlightedTechnical === technical;

        return (
          <View
            key={technical}
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
