import { ExtremeRiskBadge } from "@/components/badges/difficulty/ExtremeRiskBadge";
import { HighRiskBadge } from "@/components/badges/difficulty/HighRiskBadge";
import { ModerateRiskBadge } from "@/components/badges/difficulty/ModerateRiskBadge";
import { MinimalRiskBadge } from "@/components/badges/difficulty/MinimalRiskBadge";
import { SomeRiskBadge } from "@/components/badges/difficulty/SomeRiskBadge";
import { VeryHighRiskBadge } from "@/components/badges/difficulty/VeryHighRiskBadge";
import { DifficultyRisk } from "ropegeo-common";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RISK_ORDER: DifficultyRisk[] = Object.values(DifficultyRisk);

/** Fixed width for the badge column so badges center and descriptions align. */
const BADGE_COLUMN_WIDTH = 80;

const RISK_BADGES: Record<DifficultyRisk, React.ComponentType<{ showLabel?: boolean }>> = {
  [DifficultyRisk.G]: MinimalRiskBadge,
  [DifficultyRisk.PG]: SomeRiskBadge,
  [DifficultyRisk.PG13]: ModerateRiskBadge,
  [DifficultyRisk.R]: HighRiskBadge,
  [DifficultyRisk.X]: VeryHighRiskBadge,
  [DifficultyRisk.XX]: ExtremeRiskBadge,
};

/** Descriptions aligned with ACA canyon risk ratings. See canyoneeringusa.com, ropewiki.com/ACA_rating, dankat.com. */
const RISK_DESCRIPTIONS: Record<
  DifficultyRisk,
  { minimumFor?: string; body: string }
> = {
  [DifficultyRisk.G]: {
    minimumFor: "Class 1",
    body:
      "Minimal risk. Normal risk factors are present. Non-technical canyon hiking; no rope required. " +
      "May involve easy scrambling with occasional use of hands for balance. Appropriate for beginners.",
  },
  [DifficultyRisk.PG]: {
    minimumFor: "Class 2",
    body:
      "Some additional considerations. Scrambling, easy climbing or downclimbing; a rope may be handy for handlines, " +
      "belays, lowering packs and emergency use. Exit or retreat possible upcanyon without fixed ropes. " +
      "Suitable for hikers with reasonable fitness.",
  },
  [DifficultyRisk.PG13]: {
    minimumFor: "Class 3 and Class 4",
    body:
      "Every class 3 and class 4 canyon is at least PG13 because rappels and technical terrain introduce significant risk. " +
      "Rope required for belays and single-pitch rappels (Class 3) or complex rope work such as multi-pitch rappels, " +
      "re-belays, or guided rappels (Class 4). Not appropriate for beginners; solid technical skills and sound judgment required.",
  },
  [DifficultyRisk.R]: {
    body:
      "Risky. One or more extraordinary risk factors exist that complicate the descent. " +
      "Solid technical skills and sound judgment critical. Not appropriate for beginners, even with competent leadership. " +
      "May include difficult rappels, exposed climbing or traversing, difficult anchors, loose or dangerous rock, " +
      "committing route finding, or prolonged water immersion. See the route description for specific factors.",
  },
  [DifficultyRisk.X]: {
    body:
      "Very high. Multiple risk factors exist that will complicate the descent. " +
      "Errors in technique or judgment will likely result in serious injury or death. " +
      "Descent should be attempted by expert canyoneers only.",
  },
  [DifficultyRisk.XX]: {
    body:
      "Extreme. The most serious rating. Multiple severe risk factors; only for highly experienced canyoneers. " +
      "Consequences of error are severe. Use varies among beta providers; read the route description carefully.",
  },
};

export type RiskInfoScreenProps = {
  highlightedRisk?: DifficultyRisk | null;
};

export function RiskInfoScreen({ highlightedRisk }: RiskInfoScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: 12,
          paddingBottom: insets.bottom + 24,
          paddingLeft: 16 + insets.left,
          paddingRight: 16 + insets.right,
        },
      ]}
    >
      <Text style={styles.subtitle}>
        ACA-style additional risk (beyond technical, water, and time). Higher ratings indicate greater seriousness.
      </Text>
      {RISK_ORDER.map((risk) => {
        const BadgeComponent = RISK_BADGES[risk];
        const { minimumFor, body } = RISK_DESCRIPTIONS[risk];
        const isHighlighted = highlightedRisk === risk;

        return (
          <View
            key={risk}
            style={[styles.row, isHighlighted && styles.rowHighlighted]}
          >
            <View style={styles.badgeWrap}>
              <BadgeComponent showLabel />
            </View>
            <View style={styles.descriptionWrap}>
              {minimumFor != null && (
                <Text style={styles.minimumFor}>
                  Minimum for {minimumFor}.
                </Text>
              )}
              <Text style={styles.body}>{body}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
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
  descriptionWrap: {
    flex: 1,
    minWidth: 0,
  },
  minimumFor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  body: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
});
