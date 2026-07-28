import { BetaSection } from "@/components/betaSection/BetaSection";
import { AttributionAuthorsText } from "@/components/attribution/AttributionAuthorsText";
import { RopewikiPageAttributionFooter } from "@/components/attribution/RopewikiPageAttributionFooter";
import { ConstantText } from "@/components/text/ConstantText";
import {
  ROPEWIKI_ATTRIBUTION_COURTESY_LINK_LABEL,
  ROPEWIKI_ATTRIBUTION_COURTESY_PREFIX,
  ROPEWIKI_ATTRIBUTION_COURTESY_SUFFIX,
} from "@/constants/ropewikiAttribution";
import { ROPEWIKI_ORIGIN } from "@/constants/ropewikiOrigin";
import * as WebBrowser from "expo-web-browser";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  useResolvedConstantSize,
} from "@/utils/theme/resolvers";
import { useFabulousTitle } from "@/utils/theme/useFabulousTitle";
import { MiniMap, type MiniMapProps } from "@/components/minimap/MiniMap";
import {
  isCenteredRegionMiniMapType,
  isPageMiniMapType,
  MINI_MAP_BORDER_RADIUS,
  MINI_MAP_EXPANDED_Z_INDEX,
} from "@/components/minimap/shared/minimapShared";
import { RegionLinks } from "@/components/screens/pages/ropewiki/RegionLinks";
import { RappelInfoRow } from "@/components/screens/pages/ropewiki/RappelInfoRow";
import { StarRating } from "@/components/starRating/StarRating";
import { PageBadges } from "./PageBadges";
import { PageStats } from "./PageStats";
import {
  PAGE_SEAM_FLOAT_HEIGHT,
  PAGE_SEAM_FLOAT_OFFSET,
  PageSeamButtons,
} from "./PageSeamButtons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import {
  AcaDifficultyRating,
  type OfflineRopewikiPageView,
  PageDataSource,
  type OnlineRopewikiPageView,
  RouteType,
} from "ropegeo-common/models";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const CARD_BORDER_RADIUS = 24;
/** Matches header row top inset on {@link RopewikiPageScreenBody}. */
const MINI_MAP_VIEWPORT_HEADER_TOP = 8;

function formatLastUpdated(revisionDate: Date | string): string {
  const date =
    typeof revisionDate === "string" ? new Date(revisionDate) : revisionDate;
  if (Number.isNaN(date.getTime())) return "";
  const formatted = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let ago: string;
  if (diffDays >= 365) {
    const years = Math.floor(diffDays / 365);
    const days = diffDays % 365;
    const yearLabel = years === 1 ? "year" : "years";
    ago =
      days === 0
        ? `${years} ${yearLabel} ago`
        : `${years} ${yearLabel} and ${days} days ago`;
  } else {
    ago = diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  }
  return `Last updated on: ${formatted} (${ago})`;
}

export type PageContentProps = {
  /** Current ropewiki page id (for region links return-to-saved behavior). */
  pageId: string;
  data: OnlineRopewikiPageView | OfflineRopewikiPageView;
  routeTypeResolved: RouteType;
  insets: { top: number; bottom: number };
  paddingTop: number;
  onScroll: NonNullable<React.ComponentProps<typeof AnimatedScrollView>["onScroll"]>;
  onScrollEndDrag?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onCardHeightLayout: (height: number) => void;
  onMapExpandedChange?: (expanded: boolean) => void;
  expandAnchorRef: React.RefObject<View | null>;
  isDownloaded: boolean;
  downloading: boolean;
  downloadDisplayStep: number;
  downloadDisplayTotal: number;
  downloadPhaseProgress: number;
  onDownloadPress: () => void;
  onRemoveDownloadPress: () => void;
};

/**
 * Scrollable card and body over the parallax banner — same role as `RegionContent`.
 */
export function PageContent({
  pageId,
  data,
  routeTypeResolved,
  insets,
  paddingTop,
  onScroll,
  onScrollEndDrag,
  onMomentumScrollEnd,
  onCardHeightLayout,
  onMapExpandedChange,
  expandAnchorRef,
  isDownloaded,
  downloading,
  downloadDisplayStep,
  downloadDisplayTotal,
  downloadPhaseProgress,
  onDownloadPress,
  onRemoveDownloadPress,
}: PageContentProps) {
  const { background, text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const starRatingFontSize = useResolvedConstantSize(uiScale.pageScreen.text.starRating);
  const displayTitle = useFabulousTitle(data.name);
  const miniMapGateRef = useRef<View>(null);
  const miniMapUnlockedRef = useRef(false);
  const [mountMiniMapNative, setMountMiniMapNative] = useState(false);
  const [mapMode, setMapMode] = useState<"collapsed" | "expanded">("collapsed");
  const mapExpanded = mapMode === "expanded";

  const minimapForUi = data.miniMap;
  const hasMiniMap = minimapForUi != null;
  const pageMiniMapAuthors =
    minimapForUi != null && isPageMiniMapType(minimapForUi.miniMapType)
      ? ("authors" in minimapForUi ? minimapForUi.authors : null)
      : null;
  const betaSectionLookup = useMemo(() => data.toBetaSectionLookup(), [data]);
  const imageLookup = useMemo(() => data.toImageLookup(), [data]);
  const measurementsLookup = useMemo(() => data.toMeasurementsLookup(), [data]);
  const directionsFromPageCoords =
    data.coordinates != null
      ? { lat: data.coordinates.lat, lon: data.coordinates.lon }
      : null;
  const mapDirections =
    directionsFromPageCoords != null &&
    minimapForUi != null &&
    isPageMiniMapType(minimapForUi.miniMapType)
      ? directionsFromPageCoords
      : null;
  const centeredMiniMapDirections =
    directionsFromPageCoords != null &&
    minimapForUi != null &&
    isCenteredRegionMiniMapType(minimapForUi.miniMapType)
      ? directionsFromPageCoords
      : null;

  const setMapModeAndNotify = useCallback(
    (mode: "collapsed" | "expanded") => {
      setMapMode(mode);
      onMapExpandedChange?.(mode === "expanded");
    },
    [onMapExpandedChange],
  );

  const onMapExpandedChangeRef = useRef(onMapExpandedChange);
  onMapExpandedChangeRef.current = onMapExpandedChange;

  useEffect(() => {
    miniMapUnlockedRef.current = false;
    setMountMiniMapNative(false);
    setMapMode("collapsed");
    onMapExpandedChangeRef.current?.(false);
  }, [pageId]);

  const checkMiniMapInView = useCallback(() => {
    if (!hasMiniMap) return;
    const node = miniMapGateRef.current;
    if (node == null) return;
    node.measureInWindow((_x, y, _width, h) => {
      const winH = Dimensions.get("window").height;
      const visTop = insets.top + MINI_MAP_VIEWPORT_HEADER_TOP;
      const visBottom = winH - insets.bottom - 72;
      const intersects = y + h > visTop && y < visBottom;
      if (intersects && !miniMapUnlockedRef.current) {
        miniMapUnlockedRef.current = true;
        setMountMiniMapNative(true);
      }
    });
  }, [hasMiniMap, insets.bottom, insets.top]);

  useEffect(() => {
    if (!hasMiniMap) return;
    const t = setTimeout(() => checkMiniMapInView(), 0);
    return () => clearTimeout(t);
  }, [hasMiniMap, checkMiniMapInView]);

  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      checkMiniMapInView();
      onScrollEndDrag?.(e);
    },
    [checkMiniMapInView, onScrollEndDrag],
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      checkMiniMapInView();
      onMomentumScrollEnd?.(e);
    },
    [checkMiniMapInView, onMomentumScrollEnd],
  );

  const openRopewikiHome = useCallback(async () => {
    try {
      await WebBrowser.openBrowserAsync(ROPEWIKI_ORIGIN);
    } catch {
      // Ignore cancel / open failures
    }
  }, []);

  const displayRegions =
    (data.regions?.length ?? 0) > 0 ? (data.regions ?? []).slice(0, -1) : [];
  const rating = data.quality ?? 0;
  const ratingCount = data.userVotes ?? 0;
  const technicalRating =
    data.difficultyRating instanceof AcaDifficultyRating ? data.difficultyRating.technical : null;
  const rappelCount = data.rappelCount ?? null;
  const longestRappel = data.rappelLongest ?? null;
  const jumps = data.jumps ?? null;

  return (
    <>
    <AnimatedScrollView
      style={[styles.scrollView, mapExpanded && styles.scrollViewMapExpanded]}
      contentContainerStyle={{
        paddingTop,
        paddingBottom: 0,
        flexGrow: 1,
      }}
      pointerEvents="auto"
      onScroll={onScroll}
      scrollEventThrottle={16}
      scrollEnabled={!mapExpanded}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      onScrollEndDrag={handleScrollEndDrag}
      onMomentumScrollEnd={handleMomentumScrollEnd}
    >
      <View
        style={[styles.cardWrapper, { marginTop: -CARD_BORDER_RADIUS }]}
        onLayout={(e) => onCardHeightLayout(e.nativeEvent.layout.height)}
      >
        {!mapExpanded ? (
          <View pointerEvents="box-none" style={styles.seamHost}>
            <PageSeamButtons
              url={data.url}
              mapExpanded={mapExpanded}
              isDownloaded={isDownloaded}
              downloading={downloading}
              downloadDisplayStep={downloadDisplayStep}
              downloadDisplayTotal={downloadDisplayTotal}
              downloadPhaseProgress={downloadPhaseProgress}
              onDownloadPress={onDownloadPress}
              onRemoveDownloadPress={onRemoveDownloadPress}
            />
          </View>
        ) : null}
        <View
          style={[
            styles.cardWrap,
            { backgroundColor: background },
            mapExpanded && styles.cardWrapMapExpanded,
          ]}
          collapsable={false}
        >
          <View
            style={[
              styles.cardInner,
              {
                paddingTop: 20,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            {data.bannerImage != null ? (
              <AttributionAuthorsText
                authors={data.bannerImage.authors}
                kind="banner"
                textAlign="right"
                style={styles.bannerAuthors}
              />
            ) : null}
            <ConstantText
              size={uiScale.pageScreen.text.title}
              typography={textStyle.pageScreen.title}
              style={[styles.title, { color: text.primary }]}
            >
              {displayTitle}
            </ConstantText>
            {data.aka != null && data.aka.length > 0 ? (
              <ConstantText
                size={uiScale.pageScreen.text.akaNames}
                typography={textStyle.pageScreen.akaNames}
                style={[styles.aka, { color: text.secondary }]}
              >
                <ConstantText
                  size={uiScale.pageScreen.text.akaNames}
                  typography={textStyle.pageScreen.akaNames}
                  style={{ fontWeight: "700" }}
                >
                  AKA:{" "}
                </ConstantText>
                {data.aka.join(", ")}
              </ConstantText>
            ) : null}
            <RegionLinks
              source={PageDataSource.Ropewiki}
              regions={displayRegions}
              pageId={pageId}
              containerStyle={data.aka?.length ? styles.regionsAfterAka : undefined}
              numberOfLines={2}
            />
            <StarRating
              rating={rating}
              count={ratingCount}
              labelTypography={textStyle.pageScreen.starRating}
              labelFontSize={starRatingFontSize}
              style={styles.starRatingRow}
              allowFontScaling={false}
              textStyle={[
                styles.starRatingText,
                { color: text.secondary },
              ]}
            />
            <ConstantText
              size={uiScale.pageScreen.text.metaData}
              typography={textStyle.pageScreen.metaData}
              style={[styles.courtesy, { color: text.secondary }]}
            >
              {ROPEWIKI_ATTRIBUTION_COURTESY_PREFIX}
              <ConstantText
                size={uiScale.pageScreen.text.metaData}
                typography={textStyle.pageScreen.metaData}
                style={[styles.courtesyLink, { color: text.link }]}
                onPress={openRopewikiHome}
              >
                {ROPEWIKI_ATTRIBUTION_COURTESY_LINK_LABEL}
              </ConstantText>
              {ROPEWIKI_ATTRIBUTION_COURTESY_SUFFIX}
            </ConstantText>
            <RappelInfoRow
              rappelCount={rappelCount}
              longestRappel={longestRappel}
              jumps={jumps}
              technicalRating={
                technicalRating != null ? Number(technicalRating) : null
              }
            />
            <PageBadges data={data} routeType={routeTypeResolved} />
            <PageStats
              overallTime={data.overallTime}
              approachTime={data.approachTime}
              descentTime={data.descentTime}
              exitTime={data.exitTime}
              shuttleTime={data.shuttleTime}
              overallLength={data.overallLength}
              approachLength={data.approachLength}
              descentLength={data.descentLength}
              exitLength={data.exitLength}
              approachElevGain={data.approachElevGain}
              descentElevGain={data.descentElevGain}
              exitElevGain={data.exitElevGain}
            />
            {hasMiniMap ? (
              <View
                ref={miniMapGateRef}
                collapsable={false}
                style={[
                  styles.miniMapWrap,
                  !mapExpanded && styles.miniMapWrapClip,
                  mapExpanded && styles.miniMapWrapExpanded,
                ]}
                onLayout={() => {
                  requestAnimationFrame(() => {
                    checkMiniMapInView();
                  });
                }}
              >
                <MiniMap
                  {...({
                    miniMap: minimapForUi,
                    mountNativeMap: mountMiniMapNative,
                    expanded: mapExpanded,
                    expandAnchorRef,
                    collapsedMeasureRef: miniMapGateRef,
                    onExpand: () => setMapModeAndNotify("expanded"),
                    onCollapse: () => setMapModeAndNotify("collapsed"),
                    mapDirections: isPageMiniMapType(minimapForUi.miniMapType)
                      ? mapDirections
                      : centeredMiniMapDirections,
                    ...(isPageMiniMapType(minimapForUi.miniMapType)
                      ? { betaSectionLookup, imageLookup, measurementsLookup }
                      : {}),
                  } as MiniMapProps)}
                />
              </View>
            ) : null}
            {!mapExpanded &&
            minimapForUi != null &&
            isPageMiniMapType(minimapForUi.miniMapType) ? (
              <AttributionAuthorsText
                authors={pageMiniMapAuthors}
                kind="map"
                textAlign="right"
                style={styles.mapAuthors}
              />
            ) : null}
            {(data.betaSections ?? [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <BetaSection
                  key={section.order}
                  section={section}
                  pageTitle={data.name}
                />
              ))}
            {data.latestRevisionDate != null ? (
              <ConstantText
                size={uiScale.pageScreen.text.metaData}
                typography={textStyle.pageScreen.metaData}
                style={[styles.lastUpdated, { color: text.secondary }]}
              >
                {formatLastUpdated(data.latestRevisionDate)}
              </ConstantText>
            ) : null}
            <RopewikiPageAttributionFooter authors={data.authors} />
          </View>
        </View>
      </View>
    </AnimatedScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    position: "relative",
    zIndex: 1000,
    ...Platform.select({
      android: { elevation: 3 },
      default: {},
    }),
  },
  scrollViewMapExpanded: {
    overflow: "visible",
  },
  cardWrapper: {
    position: "relative",
    overflow: "visible",
  },
  /** In-flow seam slot so ScrollView does not clip negative absolute offsets. */
  seamHost: {
    height: PAGE_SEAM_FLOAT_HEIGHT,
    marginTop: -PAGE_SEAM_FLOAT_OFFSET,
    marginBottom: PAGE_SEAM_FLOAT_OFFSET - PAGE_SEAM_FLOAT_HEIGHT,
    zIndex: 2001,
    elevation: 2001,
  },
  cardWrap: {
    position: "relative",
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderTopRightRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  cardWrapMapExpanded: {
    overflow: "visible",
  },
  cardInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bannerAuthors: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 6,
  },
  aka: {
    marginBottom: 4,
    marginLeft: 8,
  },
  regionsAfterAka: {
    marginTop: 4,
  },
  starRatingRow: {
    alignSelf: "center",
  },
  starRatingText: {
    marginLeft: 6,
  },
  courtesy: {
    marginTop: 20,
    marginBottom: 12,
    textAlign: "justify",
    width: "100%",
  },
  courtesyLink: {
    textDecorationLine: "underline",
  },
  miniMapWrap: {
    marginTop: 16,
    width: "100%",
    aspectRatio: 1,
  },
  miniMapWrapClip: {
    overflow: "hidden",
    borderRadius: MINI_MAP_BORDER_RADIUS,
  },
  miniMapWrapExpanded: {
    zIndex: MINI_MAP_EXPANDED_Z_INDEX,
    elevation: 1000,
  },
  lastUpdated: {
    marginTop: 24,
    textAlign: "right",
  },
  mapAuthors: {
    marginTop: 8,
  },
});
