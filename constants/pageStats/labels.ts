/**
 * Display labels for ropewiki page stats and relevant-info measurement keys.
 * Keep PageStats and the Relevant Info panel in sync via this map.
 */
export const PAGE_STAT_LABELS = {
  overallTime: "Overall Est.",
  approachTime: "Approach Est.",
  descentTime: "Descent Est.",
  exitTime: "Exit Est.",
  shuttleTime: "Shuttle Est.",
  overallLength: "Overall Dist.",
  approachLength: "Approach Dist.",
  descentLength: "Descent Dist.",
  exitLength: "Exit Dist.",
  approachElevGain: "Approach Gain",
  descentElevGain: "Descent Gain",
  exitElevGain: "Exit Gain",
  /** Relevant-context keys for the min/max halves of page time ranges. */
  minApproachTime: "Approach Est.",
  maxApproachTime: "Approach Est.",
  minDescentTime: "Descent Est.",
  maxDescentTime: "Descent Est.",
  minExitTime: "Exit Est.",
  maxExitTime: "Exit Est.",
} as const;

export type PageStatLabelKey = keyof typeof PAGE_STAT_LABELS;

/** Resolves a measurement / page-stat key to its display label; falls back to the raw key. */
export function pageStatLabel(key: string): string {
  if (Object.prototype.hasOwnProperty.call(PAGE_STAT_LABELS, key)) {
    return PAGE_STAT_LABELS[key as PageStatLabelKey];
  }
  return key;
}
