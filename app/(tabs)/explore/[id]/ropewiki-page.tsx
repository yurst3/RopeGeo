import { RopewikiPageScreen } from "@/components/screens/pages/ropewiki";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

export default function RopewikiPageRoute() {
  const params = useLocalSearchParams<{
    id: string;
    routeType?: string;
  }>();
  const pageId = typeof params.id === "string" ? params.id : "";
  const routeType =
    typeof params.routeType === "string" ? params.routeType : undefined;

  return (
    <View style={{ flex: 1 }}>
      <RopewikiPageScreen pageId={pageId} routeType={routeType} />
    </View>
  );
}
