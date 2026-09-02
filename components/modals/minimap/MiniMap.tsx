import type { RoutesState } from "@/components/screens/explore/RouteMarkersLayer";
import { CenteredRegionMiniMapView } from "@/components/modals/minimap/CenteredRegionMiniMapView";
import {
  PageMiniMapView,
  type PageMiniMapTileProps,
} from "@/components/modals/minimap/PageMiniMapView";
import {
  MiniMapAnimatedCard,
} from "@/components/modals/minimap/miniMapAnimatedCard";
import { PlaceholderMiniMap } from "@/components/modals/minimap/PlaceholderMiniMap";
import { RegionMiniMapView } from "@/components/modals/minimap/RegionMiniMapView";
import { minimapStyles } from "@/components/modals/minimap/shared/minimapShared";
import { forwardRef, useImperativeHandle, useRef, type RefObject } from "react";
import type { MiniMapHandle, MiniMapReloadRegisterRef } from "@/utils/minimap/miniMapHandle";
import { View } from "react-native";
import {
  MiniMapType,
  PageDataSource,
  type OfflineBetaSectionLookup,
  type OfflineCenteredRegionMiniMap,
  type OfflineImageLookup,
  type MeasurementsLookup,
  type OnlineBetaSectionLookup,
  type OnlineCenteredRegionMiniMap,
  type OnlineImageLookup,
  type OnlineRegionMiniMap,
} from "ropegeo-common/models";

type MiniMapShellProps = {
  mountNativeMap: boolean;
  expanded: boolean;
  expandAnchorRef: RefObject<View | null>;
  collapsedMeasureRef: RefObject<View | null>;
  onExpand: () => void;
  onCollapse: () => void;
};

export type MiniMapProps = MiniMapShellProps &
  (
    | {
        miniMap: PageMiniMapTileProps;
        mapDirections?: { lat: number; lon: number } | null;
        /** Relevant-context lookups from the owning page view (page minimaps only). */
        betaSectionLookup?: OnlineBetaSectionLookup | OfflineBetaSectionLookup | null;
        imageLookup?: OnlineImageLookup | OfflineImageLookup | null;
        measurementsLookup?: MeasurementsLookup | null;
      }
    | {
        miniMap: OnlineRegionMiniMap;
        regionId: string;
        source: PageDataSource;
        onRoutesStateChange?: (state: RoutesState) => void;
      }
    | {
        miniMap: OnlineCenteredRegionMiniMap | OfflineCenteredRegionMiniMap;
        mapDirections?: { lat: number; lon: number } | null;
      }
  );

export type { MiniMapHandle, MiniMapReloadRegisterRef } from "@/utils/minimap/miniMapHandle";

/**
 * Dispatches to the correct minimap implementation from {@link MiniMapType} and forwards shell props.
 */
export const MiniMap = forwardRef<MiniMapHandle, MiniMapProps>(function MiniMap(props, ref) {
  const {
    miniMap,
    mountNativeMap,
    expanded,
    expandAnchorRef,
    collapsedMeasureRef,
    onExpand,
    onCollapse,
  } = props;

  const reloadRegisterRef: MiniMapReloadRegisterRef = useRef<(() => void) | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      reload: () => {
        reloadRegisterRef.current?.();
      },
    }),
    [],
  );

  const cardProps = {
    mountNativeMap,
    expanded,
    expandAnchorRef,
    collapsedMeasureRef,
    onExpand,
    onCollapse,
  };

  switch (miniMap.miniMapType) {
    case MiniMapType.Region: {
      const p = props as Extract<MiniMapProps, { miniMap: OnlineRegionMiniMap }>;
      return (
        <MiniMapAnimatedCard {...cardProps}>
          <RegionMiniMapView
            regionMiniMap={p.miniMap}
            regionId={p.regionId}
            source={p.source}
            onRoutesStateChange={p.onRoutesStateChange}
            reloadRegisterRef={reloadRegisterRef}
          />
        </MiniMapAnimatedCard>
      );
    }
    case MiniMapType.CenteredRegion: {
      const p = props as Extract<
        MiniMapProps,
        { miniMap: OnlineCenteredRegionMiniMap | OfflineCenteredRegionMiniMap }
      >;
      return (
        <MiniMapAnimatedCard {...cardProps} mapDirections={p.mapDirections}>
          <CenteredRegionMiniMapView
            miniMap={p.miniMap}
            reloadRegisterRef={reloadRegisterRef}
          />
        </MiniMapAnimatedCard>
      );
    }
    case MiniMapType.Page: {
      const p = props as Extract<MiniMapProps, { miniMap: PageMiniMapTileProps }>;
      return (
        <MiniMapAnimatedCard {...cardProps} mapDirections={p.mapDirections}>
          <PageMiniMapView
            miniMap={p.miniMap}
            betaSectionLookup={p.betaSectionLookup}
            imageLookup={p.imageLookup}
            measurementsLookup={p.measurementsLookup}
            reloadRegisterRef={reloadRegisterRef}
          />
        </MiniMapAnimatedCard>
      );
    }
    default: {
      return (
        <View style={minimapStyles.wrapper}>
          <PlaceholderMiniMap errorMessage="Unsupported miniMapType value" />
        </View>
      );
    }
  }
});
