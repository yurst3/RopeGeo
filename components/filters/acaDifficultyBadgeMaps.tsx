import type { ComponentType } from "react";
import { ExtremeRiskBadge } from "@/components/badges/difficulty/ExtremeRiskBadge";
import { FlowingC1WaterBadge } from "@/components/badges/difficulty/FlowingC1WaterBadge";
import { FlowingC2WaterBadge } from "@/components/badges/difficulty/FlowingC2WaterBadge";
import { FlowingC3WaterBadge } from "@/components/badges/difficulty/FlowingC3WaterBadge";
import { FlowingC4WaterBadge } from "@/components/badges/difficulty/FlowingC4WaterBadge";
import { FlowingWaterBadge } from "@/components/badges/difficulty/FlowingWaterBadge";
import { FullDayBadge } from "@/components/badges/difficulty/FullDayBadge";
import { HalfDayBadge } from "@/components/badges/difficulty/HalfDayBadge";
import { HighRiskBadge } from "@/components/badges/difficulty/HighRiskBadge";
import { LongDayBadge } from "@/components/badges/difficulty/LongDayBadge";
import { MinimalRiskBadge } from "@/components/badges/difficulty/MinimalRiskBadge";
import { MinimalWaterBadge } from "@/components/badges/difficulty/MinimalWaterBadge";
import { ModerateRiskBadge } from "@/components/badges/difficulty/ModerateRiskBadge";
import { MultipleDaysBadge } from "@/components/badges/difficulty/MultipleDaysBadge";
import { NotTechnicalBadge } from "@/components/badges/difficulty/NotTechnicalBadge";
import { OvernightBadge } from "@/components/badges/difficulty/OvernightBadge";
import { ScramblingBadge } from "@/components/badges/difficulty/ScramblingBadge";
import { ShortBadge } from "@/components/badges/difficulty/ShortBadge";
import { SomeRiskBadge } from "@/components/badges/difficulty/SomeRiskBadge";
import { SwimmingWaterBadge } from "@/components/badges/difficulty/SwimmingWaterBadge";
import { TechnicalBadge } from "@/components/badges/difficulty/TechnicalBadge";
import { VeryHighRiskBadge } from "@/components/badges/difficulty/VeryHighRiskBadge";
import { VeryTechnicalBadge } from "@/components/badges/difficulty/VeryTechnicalBadge";
import type { BadgeThumbProps } from "@/components/sliders/DiscreteRangeSlider";
import {
  AcaRiskSubRating,
  AcaTechnicalSubRating,
  AcaTimeSubRating,
  AcaWaterSubRating,
} from "ropegeo-common/models";

export type { BadgeThumbProps };

export const ACA_TECHNICAL_BADGES: Record<
  AcaTechnicalSubRating,
  ComponentType<BadgeThumbProps>
> = {
  [AcaTechnicalSubRating.One]: NotTechnicalBadge,
  [AcaTechnicalSubRating.Two]: ScramblingBadge,
  [AcaTechnicalSubRating.Three]: TechnicalBadge,
  [AcaTechnicalSubRating.Four]: VeryTechnicalBadge,
};

/** Matches {@link NotTechnicalBadge} / badge `showLabel` copy for filter slider titles. */
export const ACA_TECHNICAL_THUMB_TITLES: Record<AcaTechnicalSubRating, string> = {
  [AcaTechnicalSubRating.One]: "Not Technical",
  [AcaTechnicalSubRating.Two]: "Scrambling",
  [AcaTechnicalSubRating.Three]: "Technical",
  [AcaTechnicalSubRating.Four]: "Very Technical",
};

export const ACA_WATER_BADGES: Record<
  AcaWaterSubRating,
  ComponentType<BadgeThumbProps>
> = {
  [AcaWaterSubRating.A]: MinimalWaterBadge,
  [AcaWaterSubRating.B]: SwimmingWaterBadge,
  [AcaWaterSubRating.C]: FlowingWaterBadge,
  [AcaWaterSubRating.C1]: FlowingC1WaterBadge,
  [AcaWaterSubRating.C2]: FlowingC2WaterBadge,
  [AcaWaterSubRating.C3]: FlowingC3WaterBadge,
  [AcaWaterSubRating.C4]: FlowingC4WaterBadge,
};

export const ACA_WATER_THUMB_TITLES: Record<AcaWaterSubRating, string> = {
  [AcaWaterSubRating.A]: "Minimal Water",
  [AcaWaterSubRating.B]: "Swimming Water",
  [AcaWaterSubRating.C]: "Flowing Water",
  [AcaWaterSubRating.C1]: "Moderate Current",
  [AcaWaterSubRating.C2]: "High Current",
  [AcaWaterSubRating.C3]: "Very High Current",
  [AcaWaterSubRating.C4]: "Extreme Current",
};

export const ACA_TIME_BADGES: Record<
  AcaTimeSubRating,
  ComponentType<BadgeThumbProps>
> = {
  [AcaTimeSubRating.I]: ShortBadge,
  [AcaTimeSubRating.II]: HalfDayBadge,
  [AcaTimeSubRating.III]: FullDayBadge,
  [AcaTimeSubRating.IV]: LongDayBadge,
  [AcaTimeSubRating.V]: OvernightBadge,
  [AcaTimeSubRating.VI]: MultipleDaysBadge,
};

export const ACA_TIME_THUMB_TITLES: Record<AcaTimeSubRating, string> = {
  [AcaTimeSubRating.I]: "Short",
  [AcaTimeSubRating.II]: "Half Day",
  [AcaTimeSubRating.III]: "Full Day",
  [AcaTimeSubRating.IV]: "Long Day",
  [AcaTimeSubRating.V]: "Overnight",
  [AcaTimeSubRating.VI]: "Multiple Days",
};

export const ACA_RISK_BADGES: Record<
  AcaRiskSubRating,
  ComponentType<BadgeThumbProps>
> = {
  [AcaRiskSubRating.G]: MinimalRiskBadge,
  [AcaRiskSubRating.PG]: SomeRiskBadge,
  [AcaRiskSubRating.PG13]: ModerateRiskBadge,
  [AcaRiskSubRating.R]: HighRiskBadge,
  [AcaRiskSubRating.X]: VeryHighRiskBadge,
  [AcaRiskSubRating.XX]: ExtremeRiskBadge,
};

export const ACA_RISK_THUMB_TITLES: Record<AcaRiskSubRating, string> = {
  [AcaRiskSubRating.G]: "Minimal Risk",
  [AcaRiskSubRating.PG]: "Some Risk",
  [AcaRiskSubRating.PG13]: "Moderate Risk",
  [AcaRiskSubRating.R]: "High Risk",
  [AcaRiskSubRating.X]: "Very High Risk",
  [AcaRiskSubRating.XX]: "Extreme Risk",
};
