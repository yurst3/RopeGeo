import { VehicleInfoScreen } from "@/components/screens/info/VehicleInfoScreen";
import { useLocalSearchParams } from "expo-router";

export default function VehicleInfoPage() {
  const { highlightedVehicle } = useLocalSearchParams<{
    highlightedVehicle?: string;
  }>();
  return (
    <VehicleInfoScreen highlightedVehicle={highlightedVehicle ?? null} />
  );
}
