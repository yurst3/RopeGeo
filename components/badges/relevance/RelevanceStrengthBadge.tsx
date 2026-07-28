import { DefinitelyRelevantBadge } from "@/components/badges/relevance/DefinitelyRelevantBadge";
import { MaybeRelevantBadge } from "@/components/badges/relevance/MaybeRelevantBadge";
import { SomewhatRelevantBadge } from "@/components/badges/relevance/SomewhatRelevantBadge";
import type { RelevanceStrength } from "ropegeo-common/models";

export function RelevanceStrengthBadge({
  strength,
  size,
}: {
  strength: RelevanceStrength;
  size?: number;
}) {
  switch (strength) {
    case "Maybe Relevant":
      return <MaybeRelevantBadge size={size} />;
    case "Somewhat Relevant":
      return <SomewhatRelevantBadge size={size} />;
    case "Definitely Relevant":
      return <DefinitelyRelevantBadge size={size} />;
  }
}
