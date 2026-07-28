import type { RelevanceStrength } from "ropegeo-common/models";

import type { RelevanceStrengthBadgeColors } from "../../types";

const DEFAULT_ICON = "#ffffff";

const greenBackground = "#166534";
const yellowBackground = "#ca8a04";
const orangeBackground = "#b45309";

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
