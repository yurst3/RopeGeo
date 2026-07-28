import type { ComponentType } from "react";
import { DefinitelyRelevantBadge } from "@/components/badges/relevance/DefinitelyRelevantBadge";
import { MaybeRelevantBadge } from "@/components/badges/relevance/MaybeRelevantBadge";
import { SomewhatRelevantBadge } from "@/components/badges/relevance/SomewhatRelevantBadge";
import type { BadgeThumbProps } from "@/components/sliders/DiscreteRangeSlider";
import type { RelevanceStrength } from "ropegeo-common/models";

export const RELEVANCE_STRENGTH_BADGES: Record<
  RelevanceStrength,
  ComponentType<BadgeThumbProps>
> = {
  "Maybe Relevant": MaybeRelevantBadge,
  "Somewhat Relevant": SomewhatRelevantBadge,
  "Definitely Relevant": DefinitelyRelevantBadge,
};

export const RELEVANCE_STRENGTH_THUMB_TITLES: Record<RelevanceStrength, string> =
  {
    "Maybe Relevant": "Maybe relevant",
    "Somewhat Relevant": "Somewhat relevant",
    "Definitely Relevant": "Definitely relevant",
  };

export const RELEVANCE_STRENGTH_TICK_LABELS: Record<RelevanceStrength, string> =
  {
    "Maybe Relevant": "Maybe relevant",
    "Somewhat Relevant": "Somewhat relevant",
    "Definitely Relevant": "Definitely relevant",
  };
