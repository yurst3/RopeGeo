import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { RopewikiPageView } from "ropegeo-common";

export type ElevationGainsProps = Pick<
  RopewikiPageView,
  "approachElevGain" | "descentElevGain" | "exitElevGain"
>;

function formatFeet(value: number): string {
  return `${Math.round(value)}ft`;
}

function hasGain(value: number | null): boolean {
  return value != null && value !== 0;
}

function shouldShowElevationGains(props: ElevationGainsProps): boolean {
  const { approachElevGain, descentElevGain, exitElevGain } = props;
  return (
    hasGain(approachElevGain) ||
    hasGain(descentElevGain) ||
    hasGain(exitElevGain)
  );
}

const LABELS: Record<keyof ElevationGainsProps, string> = {
  approachElevGain: "Approach Gain",
  descentElevGain: "Descent Gain",
  exitElevGain: "Exit Gain",
};

export function ElevationGains({
  approachElevGain,
  descentElevGain,
  exitElevGain,
}: ElevationGainsProps) {
  const items: { value: string; label: string }[] = [];
  if (hasGain(approachElevGain))
    items.push({ value: formatFeet(approachElevGain!), label: LABELS.approachElevGain });
  if (hasGain(descentElevGain))
    items.push({ value: formatFeet(descentElevGain!), label: LABELS.descentElevGain });
  if (hasGain(exitElevGain))
    items.push({ value: formatFeet(exitElevGain!), label: LABELS.exitElevGain });

  if (
    !shouldShowElevationGains({
      approachElevGain,
      descentElevGain,
      exitElevGain,
    })
  ) {
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
