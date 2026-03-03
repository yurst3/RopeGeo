import { TimeInfoScreen } from "@/components/screens/info/TimeInfoScreen";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { DifficultyTime } from "ropegeo-common";

const VALID_TIME: DifficultyTime[] = Object.values(DifficultyTime);

export default function TimeInfoRoute() {
  const params = useLocalSearchParams<{ highlightedTime?: string }>();
  const raw = params.highlightedTime;
  const highlightedTime: DifficultyTime | null =
    typeof raw === "string" && VALID_TIME.includes(raw as DifficultyTime)
      ? (raw as DifficultyTime)
      : null;

  return (
    <View style={{ flex: 1 }}>
      <TimeInfoScreen highlightedTime={highlightedTime} />
    </View>
  );
}
