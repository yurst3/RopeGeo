import { RiskInfoScreen } from "@/components/screens/info/RiskInfoScreen";
import { DifficultyRisk } from "ropegeo-common";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

const VALID_RISKS: DifficultyRisk[] = Object.values(DifficultyRisk);

export default function RiskInfoRoute() {
  const params = useLocalSearchParams<{ highlightedRisk?: string }>();
  const raw = params.highlightedRisk;
  const highlightedRisk: DifficultyRisk | null =
    typeof raw === "string" && VALID_RISKS.includes(raw as DifficultyRisk)
      ? (raw as DifficultyRisk)
      : null;

  return (
    <View style={{ flex: 1 }}>
      <RiskInfoScreen highlightedRisk={highlightedRisk} />
    </View>
  );
}
