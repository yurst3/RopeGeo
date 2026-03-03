import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { RopewikiPageView } from "ropegeo-common";

export type LengthsProps = Pick<
  RopewikiPageView,
  "overallLength" | "approachLength" | "descentLength" | "exitLength"
>;

function roundToTenth(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatMiles(value: number): string {
  return `${roundToTenth(value)}mi`;
}

function hasLength(value: number | null): boolean {
  return value != null && value > 0;
}

function shouldShowLengths(props: LengthsProps): boolean {
  const { overallLength, approachLength, descentLength, exitLength } = props;
  return (
    hasLength(overallLength) ||
    hasLength(approachLength) ||
    hasLength(descentLength) ||
    hasLength(exitLength)
  );
}

const LABELS: Record<keyof LengthsProps, string> = {
  overallLength: "Overall Dist.",
  approachLength: "Approach Dist.",
  descentLength: "Descent Dist.",
  exitLength: "Exit Dist.",
};

export function Lengths({
  overallLength,
  approachLength,
  descentLength,
  exitLength,
}: LengthsProps) {
  const items: { value: string; label: string }[] = [];
  if (hasLength(overallLength))
    items.push({ value: formatMiles(overallLength!), label: LABELS.overallLength });
  if (hasLength(approachLength))
    items.push({ value: formatMiles(approachLength!), label: LABELS.approachLength });
  if (hasLength(descentLength))
    items.push({ value: formatMiles(descentLength!), label: LABELS.descentLength });
  if (hasLength(exitLength))
    items.push({ value: formatMiles(exitLength!), label: LABELS.exitLength });

  if (!shouldShowLengths({ overallLength, approachLength, descentLength, exitLength })) {
    return null;
  }

  const columnCount = items.length;
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
      <View style={[rowStyle, styles.rowWrap]}>
        {items.map((item) => (
          <View key={item.label} style={columnStyle}>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
  },
  rowWrap: {
    flexWrap: "wrap",
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
