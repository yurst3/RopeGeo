import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type RappelCountValue = { min: number; max: number } | number | null;

export type RappelInfoRowProps = {
  /** Number of rappels (single number, min–max range, or null shown as 0) */
  rappelCount: RappelCountValue;
  /** Longest rappel (e.g. "65 ft"); omit column if null */
  longestRappel: string | number | null;
  /** Jumps count; omit column if null */
  jumps: number | null;
  /** Technical rating 1–4; used for visibility. Show row if 3 or 4, or if any value present when 1/2/null */
  technicalRating: number | null;
};

function hasRappelsValue(rappelCount: RappelCountValue): boolean {
  if (rappelCount == null) return false;
  if (typeof rappelCount === "number") return rappelCount > 0;
  return rappelCount.min > 0 || rappelCount.max > 0;
}

function formatRappelCount(rappelCount: RappelCountValue): string {
  if (rappelCount == null) return "0";
  if (typeof rappelCount === "number") return String(rappelCount);
  return `${rappelCount.min}-${rappelCount.max}`;
}

function shouldShowRow(props: RappelInfoRowProps): boolean {
  const { rappelCount, longestRappel, jumps, technicalRating } = props;
  const technical = technicalRating ?? 0;
  if (technical === 3 || technical === 4) return true;
  const hasLongest = longestRappel != null && String(longestRappel).trim() !== "";
  const hasJumps = jumps != null && jumps > 0;
  return hasRappelsValue(rappelCount) || hasLongest || hasJumps;
}

function formatLongestRappel(value: string | number | null): string {
  if (value == null) return "";
  if (typeof value === "number") return `${Math.round(value)} ft`;
  return String(value).trim();
}

export function RappelInfoRow({
  rappelCount,
  longestRappel,
  jumps,
  technicalRating,
}: RappelInfoRowProps) {
  if (!shouldShowRow({ rappelCount, longestRappel, jumps, technicalRating })) {
    return null;
  }

  const showLongest = longestRappel != null && formatLongestRappel(longestRappel) !== "";
  const showJumps = jumps != null;
  const columnCount = 1 + (showLongest ? 1 : 0) + (showJumps ? 1 : 0);

  const rowStyle = [
    styles.row,
    columnCount === 1 && styles.rowCentered,
  ];
  const columnStyle = [
    styles.column,
    columnCount === 1 ? undefined : styles.columnFlex,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.separator} />
      <View style={rowStyle}>
        <View style={columnStyle}>
          <Text style={styles.value}>{formatRappelCount(rappelCount)}</Text>
          <Text style={styles.label}>Number of Rappels</Text>
        </View>
        {showLongest && (
          <View style={columnStyle}>
            <Text style={styles.value}>{formatLongestRappel(longestRappel)}</Text>
            <Text style={styles.label}>Longest Rappel</Text>
          </View>
        )}
        {showJumps && (
          <View style={columnStyle}>
            <Text style={styles.value}>{jumps}</Text>
            <Text style={styles.label}>Jumps</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
  },
  rowCentered: {
    justifyContent: "center",
  },
  column: {
    alignItems: "center",
    minWidth: 80,
  },
  columnFlex: {
    flex: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 2,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
});
