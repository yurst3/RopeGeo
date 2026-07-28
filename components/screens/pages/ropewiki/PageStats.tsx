import { useSettings } from "@/context/app/SettingsContext";
import { PAGE_STAT_LABELS } from "@/constants/pageStats";
import { StyleSheet } from "react-native";
import { MinMax } from "ropegeo-common/models";
import type {
  LengthMeasurement,
  LengthMeasurementSystem,
  RopewikiPageView,
  TimeMeasurementSystem,
} from "ropegeo-common/models";
import { StatFlowSection, type StatItem } from "./StatFlow";

export type PageStatsProps = Pick<
  RopewikiPageView,
  | "overallTime"
  | "approachTime"
  | "descentTime"
  | "exitTime"
  | "shuttleTime"
  | "overallLength"
  | "approachLength"
  | "descentLength"
  | "exitLength"
  | "approachElevGain"
  | "descentElevGain"
  | "exitElevGain"
>;

type TimeValue = PageStatsProps["overallTime"];

function hasLength(value: LengthMeasurement | null): boolean {
  return value != null && value.value > 0;
}

function hasGain(value: LengthMeasurement | null): boolean {
  return value != null && value.value !== 0;
}

function hasTime(value: TimeValue): boolean {
  if (value == null) return false;
  if (value instanceof MinMax) return value.min.value > 0 || value.max.value > 0;
  return value.value > 0;
}

/** Shuttle time uses a sentinel of 1 (minute) to mean "unset", so it is hidden. */
function hasShuttleTime(shuttleTime: PageStatsProps["shuttleTime"]): boolean {
  return shuttleTime != null && shuttleTime.value > 0 && shuttleTime.value !== 1;
}

/** Converts to the display system, then formats via the measurement's own `.toString()`. */
function formatTime(value: TimeValue, system: TimeMeasurementSystem): string | null {
  if (value == null || !hasTime(value)) return null;
  if (value instanceof MinMax) return value.toMeasurementSystem(system).toString();
  return value.toMeasurementSystem(system).toString();
}

function formatLength(
  value: LengthMeasurement | null,
  system: LengthMeasurementSystem,
): string {
  return value!.toMeasurementSystem(system).toString();
}

export function PageStats(props: PageStatsProps) {
  const { settings } = useSettings();
  const lengthSystem = settings.lengthMeasurementSystem;
  const timeSystem = settings.timeMeasurementSystem;

  const timeItems: StatItem[] = [];
  const overallTimeStr = formatTime(props.overallTime, timeSystem);
  if (overallTimeStr)
    timeItems.push({
      key: "overallTime",
      value: overallTimeStr,
      label: PAGE_STAT_LABELS.overallTime,
    });
  const approachTimeStr = formatTime(props.approachTime, timeSystem);
  if (approachTimeStr)
    timeItems.push({
      key: "approachTime",
      value: approachTimeStr,
      label: PAGE_STAT_LABELS.approachTime,
    });
  const descentTimeStr = formatTime(props.descentTime, timeSystem);
  if (descentTimeStr)
    timeItems.push({
      key: "descentTime",
      value: descentTimeStr,
      label: PAGE_STAT_LABELS.descentTime,
    });
  const exitTimeStr = formatTime(props.exitTime, timeSystem);
  if (exitTimeStr)
    timeItems.push({
      key: "exitTime",
      value: exitTimeStr,
      label: PAGE_STAT_LABELS.exitTime,
    });
  if (hasShuttleTime(props.shuttleTime) && props.shuttleTime != null)
    timeItems.push({
      key: "shuttleTime",
      value: props.shuttleTime.toMeasurementSystem(timeSystem).toString(),
      label: PAGE_STAT_LABELS.shuttleTime,
    });

  const lengthItems: StatItem[] = [];
  if (hasLength(props.overallLength))
    lengthItems.push({
      key: "overallLength",
      value: formatLength(props.overallLength, lengthSystem),
      label: PAGE_STAT_LABELS.overallLength,
    });
  if (hasLength(props.approachLength))
    lengthItems.push({
      key: "approachLength",
      value: formatLength(props.approachLength, lengthSystem),
      label: PAGE_STAT_LABELS.approachLength,
    });
  if (hasLength(props.descentLength))
    lengthItems.push({
      key: "descentLength",
      value: formatLength(props.descentLength, lengthSystem),
      label: PAGE_STAT_LABELS.descentLength,
    });
  if (hasLength(props.exitLength))
    lengthItems.push({
      key: "exitLength",
      value: formatLength(props.exitLength, lengthSystem),
      label: PAGE_STAT_LABELS.exitLength,
    });

  const elevItems: StatItem[] = [];
  if (hasGain(props.approachElevGain))
    elevItems.push({
      key: "approachElevGain",
      value: formatLength(props.approachElevGain, lengthSystem),
      label: PAGE_STAT_LABELS.approachElevGain,
    });
  if (hasGain(props.descentElevGain))
    elevItems.push({
      key: "descentElevGain",
      value: formatLength(props.descentElevGain, lengthSystem),
      label: PAGE_STAT_LABELS.descentElevGain,
    });
  if (hasGain(props.exitElevGain))
    elevItems.push({
      key: "exitElevGain",
      value: formatLength(props.exitElevGain, lengthSystem),
      label: PAGE_STAT_LABELS.exitElevGain,
    });

  if (timeItems.length === 0 && lengthItems.length === 0 && elevItems.length === 0) {
    return null;
  }

  return (
    <>
      {timeItems.length > 0 ? (
        <StatFlowSection items={timeItems} resetKey={timeSystem} style={styles.section} />
      ) : null}
      {lengthItems.length > 0 ? (
        <StatFlowSection
          items={lengthItems}
          resetKey={lengthSystem}
          style={styles.section}
        />
      ) : null}
      {elevItems.length > 0 ? (
        <StatFlowSection
          items={elevItems}
          resetKey={lengthSystem}
          style={styles.section}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
  },
});
