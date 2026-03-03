import { FullDayBadge } from "@/components/badges/difficulty/FullDayBadge";
import { HalfDayBadge } from "@/components/badges/difficulty/HalfDayBadge";
import { LongDayBadge } from "@/components/badges/difficulty/LongDayBadge";
import { MultipleDaysBadge } from "@/components/badges/difficulty/MultipleDaysBadge";
import { OvernightBadge } from "@/components/badges/difficulty/OvernightBadge";
import { ShortBadge } from "@/components/badges/difficulty/ShortBadge";
import { DifficultyTime } from "ropegeo-common";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TIME_ORDER: DifficultyTime[] = Object.values(DifficultyTime);

const BADGE_COLUMN_WIDTH = 80;

const TIME_BADGES: Record<
  DifficultyTime,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [DifficultyTime.I]: ShortBadge,
  [DifficultyTime.II]: HalfDayBadge,
  [DifficultyTime.III]: FullDayBadge,
  [DifficultyTime.IV]: LongDayBadge,
  [DifficultyTime.V]: OvernightBadge,
  [DifficultyTime.VI]: MultipleDaysBadge,
};

/** Descriptions aligned with ACA duration (time) rating. See ropewiki.com/ACA_rating, canyoneeringusa.com, dankat.com. */
const TIME_DESCRIPTIONS: Record<DifficultyTime, { body: string }> = {
  [DifficultyTime.I]: {
    body:
      "Short. A couple of hours (typically 1–3 hours). Estimates are for a small team of experienced, " +
      "fit adults at a good pace; allow more time if your group is less proficient.",
  },
  [DifficultyTime.II]: {
    body:
      "Half day. Normally requires about half a day (typically 4–6 hours).",
  },
  [DifficultyTime.III]: {
    body:
      "Full day. Normally requires most of a day (typically 7–12 hours).",
  },
  [DifficultyTime.IV]: {
    body:
      "Long day. Expected to take 13–18 hours. Get an early start, bring a headlamp. " +
      "Possible unintended bivy.",
  },
  [DifficultyTime.V]: {
    body:
      "Overnight. More than one day; normally done in two days (1–2 days).",
  },
  [DifficultyTime.VI]: {
    body:
      "Multi-day. Two full days or more. Plan accordingly for a multi-day canyon trip.",
  },
};

export type TimeInfoScreenProps = {
  highlightedTime?: DifficultyTime | null;
};

export function TimeInfoScreen({ highlightedTime }: TimeInfoScreenProps) {
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
        The Roman numerals in an ACA rating indicate approximately how long the
        entire canyon trip generally takes a typical group. Actual time can vary
        substantially; this is a guideline for distinguishing long canyons from
        short ones. Times assume a small (4–6 person) team of experienced, fit
        adults.
      </Text>
      {TIME_ORDER.map((time) => {
        const BadgeComponent = TIME_BADGES[time];
        const { body } = TIME_DESCRIPTIONS[time];
        const isHighlighted = highlightedTime === time;

        return (
          <View
            key={time}
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
