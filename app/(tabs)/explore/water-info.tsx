import { WaterInfoScreen } from "@/components/infoScreens/WaterInfoScreen";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { DifficultyWater } from "ropegeo-common";

const VALID_WATER: DifficultyWater[] = Object.values(DifficultyWater);

export default function WaterInfoRoute() {
  const params = useLocalSearchParams<{ highlightedWater?: string }>();
  const raw = params.highlightedWater;
  const highlightedWater: DifficultyWater | null =
    typeof raw === "string" && VALID_WATER.includes(raw as DifficultyWater)
      ? (raw as DifficultyWater)
      : null;

  return (
    <View style={{ flex: 1 }}>
      <WaterInfoScreen highlightedWater={highlightedWater} />
    </View>
  );
}
