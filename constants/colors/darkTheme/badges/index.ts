import { DifficultyRatingSystem } from "ropegeo-common/models";

import type { BadgeColors } from "../../types";

import { acaDifficultyBadges } from "./acaDifficultyBadges";
import { permitBadges } from "./permitBadges";
import { relevanceStrengthBadges } from "./relevanceStrengthBadges";
import { routeTypeBadges } from "./routeTypeBadges";
import { shuttleBadges } from "./shuttleBadges";
import { vehicleBadges } from "./vehicleBadges";

export const darkThemeBadges: BadgeColors = {
  difficultyRating: {
    [DifficultyRatingSystem.ACA]: acaDifficultyBadges,
  },
  routeType: routeTypeBadges,
  permit: permitBadges,
  shuttle: shuttleBadges,
  vehicle: vehicleBadges,
  relevanceStrength: relevanceStrengthBadges,
  unknown: {
    background: "#6b7280",
    icon: "#ffffff",
  },
  placeholder: "#6b7280",
  subBadge: {
    background: "#4b5563",
    icon: "#ffffff",
  },
  border: "#ffffff",
};
