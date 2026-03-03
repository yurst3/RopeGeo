import { ShuttleInfoScreen } from "@/components/screens/info/ShuttleInfoScreen";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

export default function ShuttleInfoRoute() {
  const params = useLocalSearchParams<{ highlightedShuttle?: string }>();
  const highlightedShuttle =
    typeof params.highlightedShuttle === "string"
      ? params.highlightedShuttle
      : null;

  return (
    <View style={{ flex: 1 }}>
      <ShuttleInfoScreen highlightedShuttle={highlightedShuttle} />
    </View>
  );
}
