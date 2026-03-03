/** Descriptions from RopeWiki Property:Has_vehicle_type (https://ropewiki.com/Property:Has_vehicle_type). */
import { FourWDHighClearanceBadge } from "@/components/badges/vehicle/4WDHighClearanceBadge";
import { FourWDBadge } from "@/components/badges/vehicle/4WDBadge";
import { FourWDVeryHighClearanceBadge } from "@/components/badges/vehicle/4WDVeryHighClearanceBadge";
import { HighClearanceBadge } from "@/components/badges/vehicle/HighClearanceBadge";
import { PassengerBadge } from "@/components/badges/vehicle/PassengerBadge";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** API/RopeWiki vehicle type values. */
export type VehicleType =
  | "Passenger"
  | "High Clearance"
  | "4WD"
  | "4WD - High Clearance"
  | "4WD - Very High Clearance";

const VEHICLE_ORDER: VehicleType[] = [
  "Passenger",
  "4WD",
  "High Clearance",
  "4WD - High Clearance",
  "4WD - Very High Clearance",
];

const BADGE_COLUMN_WIDTH = 80;

const VEHICLE_BADGES: Record<
  VehicleType,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  Passenger: PassengerBadge,
  "High Clearance": HighClearanceBadge,
  "4WD": FourWDBadge,
  "4WD - High Clearance": FourWDHighClearanceBadge,
  "4WD - Very High Clearance": FourWDVeryHighClearanceBadge,
};

const VEHICLE_DESCRIPTIONS: Record<VehicleType, { body: string }> = {
  Passenger: {
    body: "Any vehicle you want. Standard passenger cars are suitable for accessing the start or exit.",
  },
  "High Clearance": {
    body: "A vehicle with at least 8 inches of clearance. Required for rougher or higher-clearance roads.",
  },
  "4WD": {
    body: "A vehicle with 4x4 traction. Required for roads where four-wheel drive is needed.",
  },
  "4WD - High Clearance": {
    body: "A vehicle with 4x4 traction and at least 8 inches of clearance. Required for more demanding access roads.",
  },
  "4WD - Very High Clearance": {
    body: "A 4WD pickup, Hummer, or similar vehicle with very high clearance. Required for the most difficult access roads.",
  },
};

export type VehicleInfoScreenProps = {
  highlightedVehicle?: string | null;
};

export function VehicleInfoScreen({
  highlightedVehicle,
}: VehicleInfoScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: 12,
          paddingLeft: 16 + insets.left,
          paddingRight: 16 + insets.right,
        },
      ]}
    >
      <Text style={styles.subtitle}>
        Vehicle type indicates the kind of vehicle required to access the start
        or exit of the canyon. Definitions follow RopeWiki and NPS guidelines.
      </Text>
      {VEHICLE_ORDER.map((vehicleType) => {
        const BadgeComponent = VEHICLE_BADGES[vehicleType];
        const { body } = VEHICLE_DESCRIPTIONS[vehicleType];
        const isHighlighted =
          highlightedVehicle != null &&
          highlightedVehicle === vehicleType;

        return (
          <View
            key={vehicleType}
            style={[styles.row, isHighlighted && styles.rowHighlighted]}
          >
            <View style={styles.badgeWrap}>
              <BadgeComponent showLabel />
            </View>
            <View style={styles.descriptionWrap}>
              <Text style={styles.body}>{body}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  rowHighlighted: {
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  badgeWrap: {
    width: BADGE_COLUMN_WIDTH,
    flexShrink: 0,
    alignItems: "center",
  },
  descriptionWrap: { flex: 1, minWidth: 0 },
  body: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
});
