import { RelevantInfoScreen } from "@/components/screens/info/RelevantInfoScreen";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { isRelevanceStrength, type RelevanceStrength } from "ropegeo-common/models";

export default function RelevantInfoRoute() {
  const params = useLocalSearchParams<{ highlightedRelevance?: string }>();
  const raw = params.highlightedRelevance;
  const highlightedRelevance: RelevanceStrength | null =
    typeof raw === "string" && isRelevanceStrength(raw) ? raw : null;

  return (
    <View style={{ flex: 1 }}>
      <RelevantInfoScreen highlightedRelevance={highlightedRelevance} />
    </View>
  );
}
