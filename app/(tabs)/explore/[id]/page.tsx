import { RopewikiPageScreen } from "@/components/screens/pages/ropewiki/RopewikiPageScreen";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { PageDataSource, RouteType } from "ropegeo-common";

const VALID_SOURCES = new Set<string>(Object.values(PageDataSource));
const VALID_ROUTE_TYPES = new Set<string>(Object.values(RouteType));

function isPageDataSource(value: unknown): value is PageDataSource {
  return typeof value === "string" && VALID_SOURCES.has(value);
}

function isRouteType(value: unknown): value is RouteType {
  return typeof value === "string" && VALID_ROUTE_TYPES.has(value);
}

export default function PageRoute() {
  const params = useLocalSearchParams<{
    id: string;
    source: string;
    routeType: string;
  }>();
  const pageId = typeof params.id === "string" ? params.id : "";
  const source =
    typeof params.source === "string"
      ? params.source
      : Array.isArray(params.source)
        ? params.source[0]
        : undefined;
  const routeType =
    typeof params.routeType === "string"
      ? params.routeType
      : Array.isArray(params.routeType)
        ? params.routeType[0]
        : undefined;

  if (!isPageDataSource(source)) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>
          {source == null || source === ""
            ? "Missing source."
            : `Invalid source: ${source}`}
        </Text>
      </View>
    );
  }

  if (!isRouteType(routeType)) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>
          {routeType == null || routeType === ""
            ? "Missing routeType."
            : `Invalid routeType: ${routeType}`}
        </Text>
      </View>
    );
  }

  switch (source) {
    case PageDataSource.Ropewiki:
      return (
        <View style={{ flex: 1 }}>
          <RopewikiPageScreen pageId={pageId} routeType={routeType} />
        </View>
      );
  }
}

const styles = {
  error: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center" as const,
  },
};
