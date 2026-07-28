import { DifficultyRatingSystem } from "ropegeo-common/models";

import type { BadgeColors } from "../../types";

import { acaDifficultyBadges } from "./acaDifficultyBadges";
import { permitBadges } from "./permitBadges";
import { relevanceStrengthBadges } from "./relevanceStrengthBadges";
import { routeTypeBadges } from "./routeTypeBadges";
import { shuttleBadges } from "./shuttleBadges";
import { vehicleBadges } from "./vehicleBadges";

export const lightThemeBadges: BadgeColors = {
  difficultyRating: {
    [DifficultyRatingSystem.ACA]: acaDifficultyBadges,
  },
  routeType: routeTypeBadges,
  permit: permitBadges,
  shuttle: shuttleBadges,
  vehicle: vehicleBadges,
  relevanceStrength: relevanceStrengthBadges,
  unknown: {
    background: "#d1d5db",
    icon: "#000000",
  },
  placeholder: "#d1d5db",
  subBadge: {
    background: "#9ca3af",
    icon: "#000000",
  },
  border: "#000000",
};
