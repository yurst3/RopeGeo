import { PermitInfoScreen } from "@/components/screens/info/PermitInfoScreen";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { PermitStatus } from "ropegeo-common";

const VALID_PERMIT: PermitStatus[] = Object.values(PermitStatus);

export default function PermitInfoRoute() {
  const params = useLocalSearchParams<{ highlightedPermit?: string }>();
  const raw = params.highlightedPermit;
  const highlightedPermit: PermitStatus | null =
    typeof raw === "string" && VALID_PERMIT.includes(raw as PermitStatus)
      ? (raw as PermitStatus)
      : null;

  return (
    <View style={{ flex: 1 }}>
      <PermitInfoScreen highlightedPermit={highlightedPermit} />
    </View>
  );
}
