import type { RelevanceStrength } from "ropegeo-common/models";

import type { RelevanceStrengthBadgeColors } from "../../types";

const DEFAULT_ICON = "#000000";

const greenBackground = "#22c55e";
const yellowBackground = "#eab308";
const orangeBackground = "#f97316";

export const relevanceStrengthBadges: Record<
  RelevanceStrength,
  RelevanceStrengthBadgeColors
> = {
  "Definitely Relevant": {
    background: greenBackground,
    icon: DEFAULT_ICON,
  },
  "Somewhat Relevant": {
    background: yellowBackground,
    icon: DEFAULT_ICON,
  },
  "Maybe Relevant": {
    background: orangeBackground,
    icon: DEFAULT_ICON,
  },
};
