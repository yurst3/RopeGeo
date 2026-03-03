import { UnknownBadge } from "@/components/badges/UnknownBadge";
import { ExtremeRiskBadge } from "@/components/badges/difficulty/ExtremeRiskBadge";
import { FlowingC1WaterBadge } from "@/components/badges/difficulty/FlowingC1WaterBadge";
import { FlowingC2WaterBadge } from "@/components/badges/difficulty/FlowingC2WaterBadge";
import { FlowingC3WaterBadge } from "@/components/badges/difficulty/FlowingC3WaterBadge";
import { FlowingC4WaterBadge } from "@/components/badges/difficulty/FlowingC4WaterBadge";
import { FlowingWaterBadge } from "@/components/badges/difficulty/FlowingWaterBadge";
import { FullDayBadge } from "@/components/badges/difficulty/FullDayBadge";
import { HalfDayBadge } from "@/components/badges/difficulty/HalfDayBadge";
import { HighRiskBadge } from "@/components/badges/difficulty/HighRiskBadge";
import { LongDayBadge } from "@/components/badges/difficulty/LongDayBadge";
import { MinimalRiskBadge } from "@/components/badges/difficulty/MinimalRiskBadge";
import { MinimalWaterBadge } from "@/components/badges/difficulty/MinimalWaterBadge";
import { ModerateRiskBadge } from "@/components/badges/difficulty/ModerateRiskBadge";
import { MultipleDaysBadge } from "@/components/badges/difficulty/MultipleDaysBadge";
import { NotTechnicalBadge } from "@/components/badges/difficulty/NotTechnicalBadge";
import { OvernightBadge } from "@/components/badges/difficulty/OvernightBadge";
import { ScramblingBadge } from "@/components/badges/difficulty/ScramblingBadge";
import { ShortBadge } from "@/components/badges/difficulty/ShortBadge";
import { SomeRiskBadge } from "@/components/badges/difficulty/SomeRiskBadge";
import { SwimmingWaterBadge } from "@/components/badges/difficulty/SwimmingWaterBadge";
import { TechnicalBadge } from "@/components/badges/difficulty/TechnicalBadge";
import { VeryHighRiskBadge } from "@/components/badges/difficulty/VeryHighRiskBadge";
import { VeryTechnicalBadge } from "@/components/badges/difficulty/VeryTechnicalBadge";
import { ClosedBadge } from "@/components/badges/permit/ClosedBadge";
import { NoPermitBadge } from "@/components/badges/permit/NoPermitBadge";
import { PermitRequiredBadge } from "@/components/badges/permit/PermitRequiredBadge";
import { RestrictedBadge } from "@/components/badges/permit/RestrictedBadge";
import { CanyonBadge } from "@/components/badges/routeType/CanyonBadge";
import { CaveBadge } from "@/components/badges/routeType/CaveBadge";
import { PoiBadge } from "@/components/badges/routeType/PoiBadge";
import { NoShuttleBadge } from "@/components/badges/shuttle/NoShuttleBadge";
import { ShuttleRequiredBadge } from "@/components/badges/shuttle/ShuttleRequiredBadge";
import { FourWDHighClearanceBadge } from "@/components/badges/vehicle/4WDHighClearanceBadge";
import { FourWDBadge } from "@/components/badges/vehicle/4WDBadge";
import { FourWDVeryHighClearanceBadge } from "@/components/badges/vehicle/4WDVeryHighClearanceBadge";
import { HighClearanceBadge } from "@/components/badges/vehicle/HighClearanceBadge";
import { PassengerBadge } from "@/components/badges/vehicle/PassengerBadge";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import {
  type Difficulty,
  DifficultyRisk,
  DifficultyTechnical,
  DifficultyTime,
  DifficultyWater,
  PermitStatus,
  type RopewikiPageView,
} from "ropegeo-common";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BADGES_GRID_MIN_HEIGHT = 320;
const CELL_WIDTH = SCREEN_WIDTH / 2;
/** Fixed width for badge type label so badge position is consistent; long labels wrap. */
const LABEL_WIDTH = 110;
/** Fixed width for badge (circle + label) so all badges align in the same position. */
const BADGE_BLOCK_WIDTH = 80;

const TECHNICAL_BADGES: Record<
  DifficultyTechnical,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [DifficultyTechnical.One]: NotTechnicalBadge,
  [DifficultyTechnical.Two]: ScramblingBadge,
  [DifficultyTechnical.Three]: TechnicalBadge,
  [DifficultyTechnical.Four]: VeryTechnicalBadge,
};
const WATER_BADGES: Record<
  DifficultyWater,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [DifficultyWater.A]: MinimalWaterBadge,
  [DifficultyWater.B]: SwimmingWaterBadge,
  [DifficultyWater.C]: FlowingWaterBadge,
  [DifficultyWater.C1]: FlowingC1WaterBadge,
  [DifficultyWater.C2]: FlowingC2WaterBadge,
  [DifficultyWater.C3]: FlowingC3WaterBadge,
  [DifficultyWater.C4]: FlowingC4WaterBadge,
};
const TIME_BADGES: Record<
  DifficultyTime,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [DifficultyTime.I]: ShortBadge,
  [DifficultyTime.II]: HalfDayBadge,
  [DifficultyTime.III]: FullDayBadge,
  [DifficultyTime.IV]: LongDayBadge,
  [DifficultyTime.V]: OvernightBadge,
  [DifficultyTime.VI]: MultipleDaysBadge,
};
const RISK_BADGES: Record<
  DifficultyRisk,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [DifficultyRisk.G]: MinimalRiskBadge,
  [DifficultyRisk.PG]: SomeRiskBadge,
  [DifficultyRisk.PG13]: ModerateRiskBadge,
  [DifficultyRisk.R]: HighRiskBadge,
  [DifficultyRisk.X]: VeryHighRiskBadge,
  [DifficultyRisk.XX]: ExtremeRiskBadge,
};
const PERMIT_BADGES: Record<
  PermitStatus,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [PermitStatus.No]: NoPermitBadge,
  [PermitStatus.Yes]: PermitRequiredBadge,
  [PermitStatus.Restricted]: RestrictedBadge,
  [PermitStatus.Closed]: ClosedBadge,
};

type BadgeTypeKey =
  | "technical"
  | "water"
  | "time"
  | "risk"
  | "permit"
  | "shuttle"
  | "vehicle"
  | "routeType";

const BADGE_TYPE_LABELS: Record<BadgeTypeKey, string> = {
  technical: "Technical Rating",
  water: "Water Rating",
  time: "Time Estimate",
  risk: "Risk Estimate",
  permit: "Permit",
  shuttle: "Shuttle",
  vehicle: "Vehicle",
  routeType: "Route Type",
};

/** Types that have an info screen; show info button and open on badge press. */
const INFO_BADGE_TYPES: BadgeTypeKey[] = [
  "technical",
  "water",
  "time",
  "risk",
  "permit",
  "shuttle",
  "vehicle",
];

/** RopeWiki vehicle type values. */
const VEHICLE_TYPES = [
  "Passenger",
  "High Clearance",
  "4WD",
  "4WD - High Clearance",
  "4WD - Very High Clearance",
] as const;

const VEHICLE_BADGES: Record<
  (typeof VEHICLE_TYPES)[number],
  React.ComponentType<{ showLabel?: boolean }>
> = {
  Passenger: PassengerBadge,
  "High Clearance": HighClearanceBadge,
  "4WD": FourWDBadge,
  "4WD - High Clearance": FourWDHighClearanceBadge,
  "4WD - Very High Clearance": FourWDVeryHighClearanceBadge,
};

export type PageBadgesProps = {
  data: RopewikiPageView;
  /** Route type for badge display (e.g. "Canyon", "Cave", "POI"). */
  routeType?: string | null;
};

const ROUTE_TYPE_VALUES = ["Canyon", "Cave", "POI"] as const;

const ROUTE_TYPE_BADGES: Record<
  (typeof ROUTE_TYPE_VALUES)[number],
  React.ComponentType<{ showLabel?: boolean }>
> = {
  Canyon: CanyonBadge,
  Cave: CaveBadge,
  POI: PoiBadge,
};

function openInfo(
  router: ReturnType<typeof useRouter>,
  type: BadgeTypeKey,
  value: string | number | null | undefined
) {
  const param = value != null ? String(value) : undefined;
  switch (type) {
    case "technical":
      router.push({
        pathname: "/explore/technical-info",
        params: param ? { highlightedTechnical: param } : {},
      });
      break;
    case "water":
      router.push({
        pathname: "/explore/water-info",
        params: param ? { highlightedWater: param } : {},
      });
      break;
    case "time":
      router.push({
        pathname: "/explore/time-info",
        params: param ? { highlightedTime: param } : {},
      });
      break;
    case "risk":
      router.push({
        pathname: "/explore/risk-info",
        params: param ? { highlightedRisk: param } : {},
      });
      break;
    case "permit":
      router.push({
        pathname: "/explore/permit-info",
        params: param ? { highlightedPermit: param } : {},
      });
      break;
    case "shuttle":
      router.push({
        pathname: "/explore/shuttle-info",
        params: param != null ? { highlightedShuttle: param } : {},
      });
      break;
    case "vehicle":
      router.push({
        pathname: "/explore/vehicle-info",
        params: param != null ? { highlightedVehicle: param } : {},
      });
      break;
    case "routeType":
      break;
    default:
      break;
  }
}

export function PageBadges({ data, routeType }: PageBadgesProps) {
  const router = useRouter();
  const difficulty: Difficulty = data.difficulty ?? {};
  const permit = data.permit ?? null;
  const technical = difficulty.technical ?? null;
  const water = difficulty.water ?? null;
  const time = difficulty.time ?? null;
  const risk = difficulty.risk ?? null;

  const showInfoButton = (type: BadgeTypeKey) =>
    INFO_BADGE_TYPES.includes(type);

  const renderBadge = (
    type: BadgeTypeKey
  ): { node: React.ReactNode; value: string | number | null } => {
    switch (type) {
      case "technical": {
        if (technical == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const TC = TECHNICAL_BADGES[technical];
        return {
          node: TC ? <TC showLabel /> : <UnknownBadge showLabel />,
          value: technical,
        };
      }
      case "water": {
        if (water == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const WC = WATER_BADGES[water];
        return {
          node: WC ? <WC showLabel /> : <UnknownBadge showLabel />,
          value: water,
        };
      }
      case "time": {
        if (time == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const TimeC = TIME_BADGES[time];
        return {
          node: TimeC ? <TimeC showLabel /> : <UnknownBadge showLabel />,
          value: time,
        };
      }
      case "risk": {
        if (risk == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const RC = RISK_BADGES[risk];
        return {
          node: RC ? <RC showLabel /> : <UnknownBadge showLabel />,
          value: risk,
        };
      }
      case "permit": {
        if (permit == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const PC = PERMIT_BADGES[permit];
        return {
          node: PC ? <PC showLabel /> : <UnknownBadge showLabel />,
          value: permit,
        };
      }
      case "shuttle": {
        const shuttleVal = data.shuttleTime ?? null;
        if (shuttleVal == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        if (shuttleVal === 0) {
          return { node: <NoShuttleBadge showLabel />, value: 0 };
        }
        return {
          node: <ShuttleRequiredBadge showLabel />,
          value: shuttleVal,
        };
      }
      case "vehicle": {
        const vehicleVal = data.vehicle ?? null;
        if (vehicleVal == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const VC =
          VEHICLE_TYPES.includes(vehicleVal as (typeof VEHICLE_TYPES)[number])
            ? VEHICLE_BADGES[vehicleVal as (typeof VEHICLE_TYPES)[number]]
            : null;
        return {
          node: VC ? <VC showLabel /> : <UnknownBadge showLabel />,
          value: vehicleVal,
        };
      }
      case "routeType": {
        const routeTypeVal = routeType ?? null;
        if (routeTypeVal == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const RC =
          ROUTE_TYPE_VALUES.includes(routeTypeVal as (typeof ROUTE_TYPE_VALUES)[number])
            ? ROUTE_TYPE_BADGES[routeTypeVal as (typeof ROUTE_TYPE_VALUES)[number]]
            : null;
        return {
          node: RC ? <RC showLabel /> : <UnknownBadge showLabel />,
          value: routeTypeVal,
        };
      }
      default:
        return { node: <UnknownBadge showLabel />, value: null };
    }
  };

  const BadgeItem = ({
    type,
  }: {
    type: BadgeTypeKey;
  }) => {
    const label = BADGE_TYPE_LABELS[type];
    const { node, value } = renderBadge(type);
    const hasInfo = showInfoButton(type);
    const onPress = hasInfo
      ? () => openInfo(router, type, value)
      : undefined;

    return (
      <View style={styles.badgeItem}>
        <View style={[styles.labelRow, { width: LABEL_WIDTH }]}>
          {hasInfo ? (
            <Pressable
              onPress={onPress}
              style={styles.infoButton}
              hitSlop={8}
              accessibilityLabel={`${label} info`}
            >
              <FontAwesome5 name="info-circle" size={18} color="#3b82f6" />
            </Pressable>
          ) : (
            <View style={[styles.infoButton, { opacity: 0 }]} pointerEvents="none">
              <FontAwesome5 name="info-circle" size={18} color="#3b82f6" />
            </View>
          )}
          <View style={styles.labelTextWrap}>
            <Text style={styles.typeLabel}>{label}</Text>
          </View>
        </View>
        <View style={[styles.badgeRight, { width: BADGE_BLOCK_WIDTH }]}>
          {onPress ? (
            <Pressable onPress={onPress} style={styles.badgePressable}>
              {node}
            </Pressable>
          ) : (
            <View style={styles.badgeWrap}>{node}</View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { minHeight: BADGES_GRID_MIN_HEIGHT }]}>
      <View style={styles.row}>
        <View style={styles.cell}>
          <BadgeItem type="technical" />
        </View>
        <View style={styles.cell}>
          <BadgeItem type="risk" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <BadgeItem type="water" />
        </View>
        <View style={styles.cell}>
          <BadgeItem type="permit" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <BadgeItem type="time" />
        </View>
        <View style={styles.cell}>
          <BadgeItem type="shuttle" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <BadgeItem type="routeType" />
        </View>
        <View style={styles.cell}>
          <BadgeItem type="vehicle" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    marginTop: 16,
    width: SCREEN_WIDTH,
    marginLeft: -20,
  },
  row: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    minHeight: BADGES_GRID_MIN_HEIGHT / 3,
  },
  cell: {
    width: CELL_WIDTH,
    paddingHorizontal: 8,
    alignItems: "flex-start",
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "stretch",
    flex: 1,
    minHeight: 0,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  labelTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  infoButton: {
    padding: 2,
  },
  typeLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  badgeRight: {
    flexShrink: 0,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
  },
  badgePressable: {
    maxWidth: "100%",
  },
  badgeWrap: {
    maxWidth: "100%",
  },
});
