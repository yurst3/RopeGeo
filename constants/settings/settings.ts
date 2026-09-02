import type { FontProfileKey } from "@/constants/text/font/types";
import type { UiScaleProfileKey } from "@/constants/uiScale/types";
import type {
  LengthMeasurementSystem,
  RelevanceStrength,
  TimeMeasurementSystem,
} from "ropegeo-common/models";
import {
  isRelevanceStrength,
  RELEVANCE_STRENGTHS,
} from "ropegeo-common/models";
import {
  LENGTH_MEASUREMENT_SYSTEMS,
  SETTINGS_FONT_KEYS,
  SETTINGS_UI_SCALE_KEYS,
  THEME_PREFERENCES,
  TIME_MEASUREMENT_SYSTEMS,
  type ThemePreference,
  type UnitsPreference,
} from "./types";
import {
  DEFAULT_MAP_BASEMAP,
  DEFAULT_MAP_LIGHT_PRESET,
  DEFAULT_SHOW_SATELLITE_CONTOURS,
  isMapBasemap,
  isMapLightPreset,
  type MapBasemap,
  type MapLightPreset,
} from "./mapLayersTypes";

export type ShowRelevantContextStrengths = {
  min: RelevanceStrength;
  max: RelevanceStrength;
};

const DEFAULT_SHOW_RELEVANT_CONTEXT = true;
const DEFAULT_SHOW_RELEVANT_CONTEXT_STRENGTHS: ShowRelevantContextStrengths = {
  min: "Maybe Relevant",
  max: "Definitely Relevant",
};

export class Settings {
  theme: ThemePreference;
  font: FontProfileKey;
  uiScale: UiScaleProfileKey;
  lengthMeasurementSystem: LengthMeasurementSystem;
  timeMeasurementSystem: TimeMeasurementSystem;
  showRelevantContext: boolean;
  showRelevantContextStrengths: ShowRelevantContextStrengths;
  mapBasemap: MapBasemap;
  mapLightPreset: MapLightPreset;
  showSatelliteContours: boolean;

  constructor(
    theme: ThemePreference = "Auto",
    font: FontProfileKey = "Auto",
    uiScale: UiScaleProfileKey = "Auto",
    lengthMeasurementSystem: LengthMeasurementSystem = "Imperial",
    timeMeasurementSystem: TimeMeasurementSystem = "Standard",
    showRelevantContext: boolean = DEFAULT_SHOW_RELEVANT_CONTEXT,
    showRelevantContextStrengths: ShowRelevantContextStrengths = {
      ...DEFAULT_SHOW_RELEVANT_CONTEXT_STRENGTHS,
    },
    mapBasemap: MapBasemap = DEFAULT_MAP_BASEMAP,
    mapLightPreset: MapLightPreset = DEFAULT_MAP_LIGHT_PRESET,
    showSatelliteContours: boolean = DEFAULT_SHOW_SATELLITE_CONTOURS,
  ) {
    this.theme = theme;
    this.font = font;
    this.uiScale = uiScale;
    this.lengthMeasurementSystem = lengthMeasurementSystem;
    this.timeMeasurementSystem = timeMeasurementSystem;
    this.showRelevantContext = showRelevantContext;
    this.showRelevantContextStrengths = showRelevantContextStrengths;
    this.mapBasemap = mapBasemap;
    this.mapLightPreset = mapLightPreset;
    this.showSatelliteContours = showSatelliteContours;
  }

  setTheme(v: ThemePreference): void {
    this.theme = v;
  }

  setFont(v: FontProfileKey): void {
    this.font = v;
  }

  setUiScale(v: UiScaleProfileKey): void {
    this.uiScale = v;
  }

  /**
   * Applies a "Units" selection: the length system matches the choice, and the
   * time system is Freedom only when Freedom units are selected (otherwise Standard).
   */
  setUnits(units: UnitsPreference): void {
    this.lengthMeasurementSystem = units;
    this.timeMeasurementSystem = units === "Freedom" ? "Freedom" : "Standard";
  }

  setShowRelevantContext(v: boolean): void {
    this.showRelevantContext = v;
  }

  setShowRelevantContextStrengths(
    min: RelevanceStrength,
    max: RelevanceStrength,
  ): void {
    this.showRelevantContextStrengths = Settings.assertStrengthRange(min, max);
  }

  setMapBasemap(v: MapBasemap): void {
    this.mapBasemap = v;
  }

  setMapLightPreset(v: MapLightPreset): void {
    this.mapLightPreset = v;
  }

  setShowSatelliteContours(v: boolean): void {
    this.showSatelliteContours = v;
  }

  resetMapLayers(): void {
    this.mapBasemap = DEFAULT_MAP_BASEMAP;
    this.mapLightPreset = DEFAULT_MAP_LIGHT_PRESET;
    this.showSatelliteContours = DEFAULT_SHOW_SATELLITE_CONTOURS;
  }

  applyMapLayersDraft(draft: {
    mapBasemap: MapBasemap;
    mapLightPreset: MapLightPreset;
    showSatelliteContours: boolean;
  }): void {
    this.mapBasemap = draft.mapBasemap;
    this.mapLightPreset = draft.mapLightPreset;
    this.showSatelliteContours = draft.showSatelliteContours;
  }

  toJSON(): Record<string, unknown> {
    return {
      theme: this.theme,
      font: this.font,
      uiScale: this.uiScale,
      lengthMeasurementSystem: this.lengthMeasurementSystem,
      timeMeasurementSystem: this.timeMeasurementSystem,
      showRelevantContext: this.showRelevantContext,
      showRelevantContextStrengths: this.showRelevantContextStrengths,
      mapBasemap: this.mapBasemap,
      mapLightPreset: this.mapLightPreset,
      showSatelliteContours: this.showSatelliteContours,
    };
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  static fromJsonString(json: string): Settings {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      throw new Error(
        `Settings.fromJsonString: invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    return Settings.fromJSON(parsed);
  }

  static fromJSON(parsed: unknown): Settings {
    if (parsed == null || typeof parsed !== "object") {
      throw new Error("Settings must be a JSON object");
    }
    const o = parsed as Record<string, unknown>;
    return new Settings(
      Settings.parseTheme(o.theme),
      Settings.parseFont(o.font),
      Settings.parseUiScale(o.uiScale),
      Settings.parseLengthMeasurementSystem(o.lengthMeasurementSystem),
      Settings.parseTimeMeasurementSystem(o.timeMeasurementSystem),
      Settings.parseShowRelevantContext(o.showRelevantContext),
      Settings.parseShowRelevantContextStrengths(o.showRelevantContextStrengths),
      Settings.parseMapBasemap(o.mapBasemap),
      Settings.parseMapLightPreset(o.mapLightPreset),
      Settings.parseShowSatelliteContours(o.showSatelliteContours),
    );
  }

  private static parseTheme(v: unknown): ThemePreference {
    if (v === undefined) return "Auto";
    if (THEME_PREFERENCES.includes(v as ThemePreference)) {
      return v as ThemePreference;
    }
    throw new Error(`Invalid Settings.theme: ${JSON.stringify(v)}`);
  }

  private static parseFont(v: unknown): FontProfileKey {
    if (v === undefined) return "Auto";
    if (SETTINGS_FONT_KEYS.includes(v as FontProfileKey)) {
      return v as FontProfileKey;
    }
    throw new Error(`Invalid Settings.font: ${JSON.stringify(v)}`);
  }

  private static parseUiScale(v: unknown): UiScaleProfileKey {
    if (v === undefined) return "Auto";
    if (SETTINGS_UI_SCALE_KEYS.includes(v as UiScaleProfileKey)) {
      return v as UiScaleProfileKey;
    }
    throw new Error(`Invalid Settings.uiScale: ${JSON.stringify(v)}`);
  }

  private static parseLengthMeasurementSystem(
    v: unknown,
  ): LengthMeasurementSystem {
    if (v === undefined) return "Imperial";
    if (LENGTH_MEASUREMENT_SYSTEMS.includes(v as LengthMeasurementSystem)) {
      return v as LengthMeasurementSystem;
    }
    throw new Error(`Invalid Settings.lengthMeasurementSystem: ${JSON.stringify(v)}`);
  }

  private static parseTimeMeasurementSystem(v: unknown): TimeMeasurementSystem {
    if (v === undefined) return "Standard";
    if (TIME_MEASUREMENT_SYSTEMS.includes(v as TimeMeasurementSystem)) {
      return v as TimeMeasurementSystem;
    }
    throw new Error(`Invalid Settings.timeMeasurementSystem: ${JSON.stringify(v)}`);
  }

  private static parseShowRelevantContext(v: unknown): boolean {
    if (v === undefined) return DEFAULT_SHOW_RELEVANT_CONTEXT;
    if (typeof v === "boolean") return v;
    throw new Error(`Invalid Settings.showRelevantContext: ${JSON.stringify(v)}`);
  }

  private static parseShowRelevantContextStrengths(
    v: unknown,
  ): ShowRelevantContextStrengths {
    if (v === undefined) {
      return { ...DEFAULT_SHOW_RELEVANT_CONTEXT_STRENGTHS };
    }
    if (v == null || typeof v !== "object") {
      throw new Error(
        `Invalid Settings.showRelevantContextStrengths: ${JSON.stringify(v)}`,
      );
    }
    const o = v as Record<string, unknown>;
    if (!isRelevanceStrength(o.min) || !isRelevanceStrength(o.max)) {
      throw new Error(
        `Invalid Settings.showRelevantContextStrengths: ${JSON.stringify(v)}`,
      );
    }
    return Settings.assertStrengthRange(o.min, o.max);
  }

  private static parseShowSatelliteContours(v: unknown): boolean {
    if (v === undefined) return DEFAULT_SHOW_SATELLITE_CONTOURS;
    if (typeof v === "boolean") return v;
    throw new Error(`Invalid Settings.showSatelliteContours: ${JSON.stringify(v)}`);
  }

  private static parseMapBasemap(v: unknown): MapBasemap {
    if (v === undefined) return DEFAULT_MAP_BASEMAP;
    if (isMapBasemap(v)) return v;
    throw new Error(`Invalid Settings.mapBasemap: ${JSON.stringify(v)}`);
  }

  private static parseMapLightPreset(v: unknown): MapLightPreset {
    if (v === undefined) return DEFAULT_MAP_LIGHT_PRESET;
    if (isMapLightPreset(v)) return v;
    throw new Error(`Invalid Settings.mapLightPreset: ${JSON.stringify(v)}`);
  }

  private static assertStrengthRange(
    min: RelevanceStrength,
    max: RelevanceStrength,
  ): ShowRelevantContextStrengths {
    const minIndex = RELEVANCE_STRENGTHS.indexOf(min);
    const maxIndex = RELEVANCE_STRENGTHS.indexOf(max);
    if (minIndex < 0 || maxIndex < 0 || minIndex > maxIndex) {
      throw new Error(
        `Invalid relevance strength range: min=${JSON.stringify(min)}, max=${JSON.stringify(max)}`,
      );
    }
    return { min, max };
  }
}
