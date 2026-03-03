import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { RopewikiPageView } from "ropegeo-common";

export type TimeEstimatesProps = Pick<
  RopewikiPageView,
  "overallTime" | "approachTime" | "descentTime" | "exitTime" | "shuttleTime"
>;

type TimeRangeOrNumber = { min: number; max: number } | number | null;

function roundToTenth(n: number): number {
  return Math.round(n * 10) / 10;
}

type HourUnit = "m" | "h" | "d";

/** Get unit and display number for a value in hours (for range same-unit formatting). */
function getHourValueParts(hours: number): { unit: HourUnit; num: number } {
  if (hours < 1) {
    return { unit: "m", num: Math.round(hours * 60) };
  }
  if (hours >= 24) {
    return { unit: "d", num: roundToTenth(hours / 24) };
  }
  return { unit: "h", num: roundToTenth(hours) };
}

/** Format a single value in hours: <1 h → minutes, >=24 h → days, else hours. No spaces. */
function formatHourValue(hours: number): string {
  const { unit, num } = getHourValueParts(hours);
  return `${num}${unit}`;
}

/** Format Overall/Approach/Descent/Exit (always in hours). Same unit → "1-2h", different → "15m-1h". */
function formatHoursTime(value: TimeRangeOrNumber): string | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return value > 0 ? formatHourValue(value) : null;
  }
  const { min, max } = value;
  if (min <= 0 && max <= 0) return null;
  if (min === max) return formatHourValue(min);
  const minParts = getHourValueParts(min);
  const maxParts = getHourValueParts(max);
  if (minParts.unit === maxParts.unit) {
    return `${minParts.num}-${maxParts.num}${minParts.unit}`;
  }
  return `${formatHourValue(min)}-${formatHourValue(max)}`;
}

function formatOverallTime(overallTime: TimeRangeOrNumber): string | null {
  return formatHoursTime(overallTime);
}

function formatShuttleMinutes(minutes: number): string {
  return `${Math.round(minutes)}m`;
}

function hasOverall(overallTime: TimeRangeOrNumber): boolean {
  if (overallTime == null) return false;
  if (typeof overallTime === "number") return true;
  return true;
}

function hasTimeValue(value: TimeRangeOrNumber): boolean {
  if (value == null) return false;
  if (typeof value === "number") return value > 0;
  return value.min > 0 || value.max > 0;
}

function shouldShowTimeEstimates(props: TimeEstimatesProps): boolean {
  const { overallTime, approachTime, descentTime, exitTime, shuttleTime } = props;
  const hasShuttle = shuttleTime != null && shuttleTime > 0 && shuttleTime !== 1;
  return (
    hasOverall(overallTime) ||
    hasTimeValue(approachTime) ||
    hasTimeValue(descentTime) ||
    hasTimeValue(exitTime) ||
    hasShuttle
  );
}

export function TimeEstimates({
  overallTime,
  approachTime,
  descentTime,
  exitTime,
  shuttleTime,
}: TimeEstimatesProps) {
  const overallStr = formatOverallTime(overallTime);
  const showOverall = overallStr != null;
  const approachStr = formatHoursTime(approachTime);
  const showApproach = approachStr != null;
  const descentStr = formatHoursTime(descentTime);
  const showDescent = descentStr != null;
  const exitStr = formatHoursTime(exitTime);
  const showExit = exitStr != null;
  const showShuttle = shuttleTime != null && shuttleTime > 0 && shuttleTime !== 1;

  if (
    !shouldShowTimeEstimates({
      overallTime,
      approachTime,
      descentTime,
      exitTime,
      shuttleTime,
    })
  ) {
    return null;
  }

  const items: { value: string; label: string }[] = [];
  if (showOverall && overallStr) items.push({ value: overallStr, label: "Overall Est." });
  if (showApproach && approachStr) items.push({ value: approachStr, label: "Approach Est." });
  if (showDescent && descentStr) items.push({ value: descentStr, label: "Descent Est." });
  if (showExit && exitStr) items.push({ value: exitStr, label: "Exit Est." });
  if (showShuttle && shuttleTime != null)
    items.push({ value: formatShuttleMinutes(shuttleTime), label: "Shuttle Est." });

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
