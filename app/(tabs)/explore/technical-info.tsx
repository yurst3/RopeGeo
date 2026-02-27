import { TechnicalInfoScreen } from "@/components/infoScreens/TechnicalInfoScreen";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { DifficultyTechnical } from "ropegeo-common";

const VALID_TECHNICAL: DifficultyTechnical[] = Object.values(DifficultyTechnical);

export default function TechnicalInfoRoute() {
  const params = useLocalSearchParams<{ highlightedTechnical?: string }>();
  const raw = params.highlightedTechnical;
  const highlightedTechnical: DifficultyTechnical | null =
    typeof raw === "string" && VALID_TECHNICAL.includes(raw as DifficultyTechnical)
      ? (raw as DifficultyTechnical)
      : null;

  return (
    <View style={{ flex: 1 }}>
      <TechnicalInfoScreen highlightedTechnical={highlightedTechnical} />
    </View>
  );
}
