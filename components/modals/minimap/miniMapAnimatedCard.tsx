import { ExpandMiniMapButton } from "@/components/buttons/standard/ExpandMiniMapButton";
import {
  MiniMapDirectionsButtons,
  minimapStyles,
} from "@/components/modals/minimap/shared/minimapShared";
import {
  measureInlineExpandLayout,
  measurePortalExpandLayout,
} from "@/utils/minimap/measureMiniMapExpandLayout";
import {
  type MiniMapExpandLayout,
  useMiniMapAnimation,
} from "@/utils/minimap/useMiniMapAnimation";
import { MiniMapMountLoadingOverlay } from "@/components/modals/minimap/MiniMapMountLoadingOverlay";
import { PlaceholderMiniMap } from "@/components/modals/minimap/PlaceholderMiniMap";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useUiScaleProfileKey } from "@/context/typography/UIScaleContext";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  type ReactNode,
  type RefObject,
} from "react";
import { BackHandler, Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";

/** Frames of post-layout remeasurement after uiScale/window changes while expanded. */
const EXPAND_LAYOUT_STABILIZE_FRAMES = 12;

/** Android only: expand/collapse hands MapView out of ScrollView for reliable gestures. */
const EXPAND_PORTAL_HANDOFF = Platform.OS === "android";

export type MiniMapShellApi = {
  mountNativeMap: boolean;
  expanded: boolean;
  /**
   * `portal` hosts sit in the tab screen above the tab bar; bottom chrome must not
   * add another tab-bar offset. `inline` expanded maps use full-window bounds and do.
   */
  layoutHost: "inline" | "portal";
  /** Starts collapse animation. */
  requestCollapse: () => void;
  /** Clears measured expand/collapse layout after collapsed camera is applied. */
  settleCollapsedLayout: () => void;
  layoutReady: boolean;
  /** True when native map is on and no blocking error (interior may render MapView). */
  mapBodyVisible: boolean;
  expandedChromeStyle: ReturnType<typeof useMiniMapAnimation>["expandedChromeStyle"];
  expandedPadding: ReturnType<typeof useMiniMapAnimation>["expandedPadding"];
  insets: EdgeInsets;
  setBlockingErrorMessage: (message: string | null) => void;
  /**
   * Children report when the native MapView has finished mounting/loading.
   * Until then the shell keeps {@link MiniMapMountLoadingOverlay} up.
   */
  setMapContentReady: (ready: boolean) => void;
  /** True after MapView finished loading; drives overlay dismissal and chrome interactivity. */
  mapContentReady: boolean;
  /** False until MapView content is ready — chrome stays visible but inert (except back). */
  mapChromeInteractive: boolean;
  registerCollapseCleanup: (fn: (() => void) | null) => void;
};

const MiniMapShellContext = createContext<MiniMapShellApi | null>(null);

export function useMiniMapShell(): MiniMapShellApi {
  const v = useContext(MiniMapShellContext);
  if (v == null) {
    throw new Error("useMiniMapShell must be used within MiniMapAnimatedCard");
  }
  return v;
}

const mapLoadingOverlayStyles = StyleSheet.create({
  placeholderCover: {
    zIndex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  mapSlot: {
    flex: 1,
  },
});

export type MiniMapAnimatedCardHandle = {
  remeasureLayout: () => void;
};

type MiniMapAnimatedCardProps = {
  mountNativeMap: boolean;
  expanded: boolean;
  expandAnchorRef: RefObject<View | null>;
  collapsedMeasureRef: RefObject<View | null>;
  onExpand: () => void;
  onCollapse: () => void;
  mapDirections?: { lat: number; lon: number } | null;
  /**
   * Android only: host currently rendering this card.
   * `inline` = inside ScrollView; `portal` = absolute overlay outside ScrollView.
   */
  androidHost?: "inline" | "portal";
  /** Screen/portal root used to measure portal frames before the portal mounts. */
  portalMeasureRef?: RefObject<View | null>;
  /** Seeded layout when mounting into a host mid expand/collapse handoff. */
  seedExpandLayout?: MiniMapExpandLayout | null;
  /** After seeding as expanded (inline), immediately play collapse (Android handoff). */
  collapseAfterSeed?: boolean;
  /** Android: parent should mount the portal host with this layout and set expanded. */
  onAndroidExpandToPortal?: (layout: MiniMapExpandLayout) => void;
  /** Android: parent should remount inline with this layout and run collapse. */
  onAndroidCollapseToInline?: (layout: MiniMapExpandLayout) => void;
  children: ReactNode;
};

/**
 * Shared minimap chrome: overlay host layout, expand/collapse animation, placeholder + loading overlays,
 * and collapsed expand/directions controls. Variants sync blocking/loading via {@link useMiniMapShell}.
 *
 * On Android, expand/collapse can hand off between an in-ScrollView instance and a portal instance
 * so gestures are not nested under ScrollView while fullscreen.
 */
export const MiniMapAnimatedCard = forwardRef<MiniMapAnimatedCardHandle, MiniMapAnimatedCardProps>(
  function MiniMapAnimatedCard(
    {
      mountNativeMap,
      expanded,
      expandAnchorRef,
      collapsedMeasureRef,
      onExpand,
      onCollapse,
      mapDirections,
      androidHost = "inline",
      portalMeasureRef,
      seedExpandLayout = null,
      collapseAfterSeed = false,
      onAndroidExpandToPortal,
      onAndroidCollapseToInline,
      children,
    },
    ref,
  ) {
    const [blockingErrorMessage, setBlockingErrorMessage] = useState<string | null>(null);
    // Fresh instances (incl. portal/inline handoff) start covered until children report ready.
    const [mapContentReady, setMapContentReadyState] = useState(false);
    /** Covers the still-mounted host from expand/collapse press until handoff remounts. */
    const [forceMountCover, setForceMountCover] = useState(false);
    const [layoutReady, setLayoutReady] = useState(false);
    const [expandLayout, setExpandLayout] = useState<MiniMapExpandLayout | null>(
      seedExpandLayout,
    );
    const [collapseGeneration, setCollapseGeneration] = useState(
      collapseAfterSeed && seedExpandLayout != null ? 1 : 0,
    );
    const collapseCleanupRef = useRef<(() => void) | null>(null);
    const pendingExpandRef = useRef(false);
    const collapseInFlightRef = useRef(collapseAfterSeed);
    const collapseAfterSeedStartedRef = useRef(
      collapseAfterSeed && seedExpandLayout != null,
    );
    const playExpandOnMount =
      EXPAND_PORTAL_HANDOFF &&
      androidHost === "portal" &&
      seedExpandLayout != null &&
      expanded &&
      !collapseAfterSeed;

    const setMapContentReady = useCallback((ready: boolean) => {
      setMapContentReadyState(ready);
      if (ready) {
        setForceMountCover(false);
      }
    }, []);

    const registerCollapseCleanup = useCallback((fn: (() => void) | null) => {
      collapseCleanupRef.current = fn;
    }, []);

    const finishCollapse = useCallback(() => {
      if (!collapseInFlightRef.current) return;
      collapseInFlightRef.current = false;
      onCollapse();
      collapseCleanupRef.current?.();
    }, [onCollapse]);

    const measureForCurrentHost = useCallback(() => {
      if (androidHost === "portal" && portalMeasureRef != null) {
        return measurePortalExpandLayout(portalMeasureRef, collapsedMeasureRef);
      }
      return measureInlineExpandLayout(expandAnchorRef, collapsedMeasureRef);
    }, [androidHost, collapsedMeasureRef, expandAnchorRef, portalMeasureRef]);

    const remeasureLayout = useCallback(() => {
      void measureForCurrentHost().then((layout) => {
        if (layout != null) {
          setExpandLayout(layout);
        }
      });
    }, [measureForCurrentHost]);

    useImperativeHandle(ref, () => ({ remeasureLayout }), [remeasureLayout]);

    const settleCollapsedLayout = useCallback(() => {
      setExpandLayout(null);
    }, []);

    const requestCollapse = useCallback(() => {
      if (!expanded || collapseInFlightRef.current) return;

      if (
        EXPAND_PORTAL_HANDOFF &&
        androidHost === "portal" &&
        onAndroidCollapseToInline != null
      ) {
        // Cover the still-mounted portal while measuring; inline remount starts covered.
        setForceMountCover(true);
        collapseInFlightRef.current = true;
        void measureInlineExpandLayout(expandAnchorRef, collapsedMeasureRef).then((layout) => {
          if (layout == null) {
            setForceMountCover(false);
            finishCollapse();
            return;
          }
          onAndroidCollapseToInline(layout);
        });
        return;
      }

      collapseInFlightRef.current = true;
      void measureForCurrentHost().then((layout) => {
        if (layout == null) {
          finishCollapse();
          return;
        }
        setExpandLayout(layout);
        setCollapseGeneration((g) => g + 1);
      });
    }, [
      androidHost,
      collapsedMeasureRef,
      expandAnchorRef,
      expanded,
      finishCollapse,
      measureForCurrentHost,
      onAndroidCollapseToInline,
    ]);

    const uiScaleProfileKey = useUiScaleProfileKey();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const { map } = useColorTheme();

    const { cardStyle, expandedChromeStyle, expandedPadding, insets } = useMiniMapAnimation({
      expandLayout,
      expanded,
      collapseGeneration,
      onCollapseAnimationComplete: finishCollapse,
      playExpandOnMount,
    });

    const mapBodyVisible = mountNativeMap && blockingErrorMessage == null;
    const showPlaceholder = !mapBodyVisible;
    const showMountLoadingOverlay =
      mapBodyVisible && (!mapContentReady || forceMountCover);

    useEffect(() => {
      if (!expanded) return;
      // Portal→inline handoff keeps collapseInFlight true across remount.
      if (collapseAfterSeed) return;
      collapseInFlightRef.current = false;
    }, [expanded, collapseAfterSeed]);

    useEffect(() => {
      if (!collapseAfterSeed || collapseAfterSeedStartedRef.current) return;
      if (expandLayout == null) return;
      collapseAfterSeedStartedRef.current = true;
      collapseInFlightRef.current = true;
      setCollapseGeneration((g) => g + 1);
    }, [collapseAfterSeed, expandLayout]);

    useEffect(() => {
      if (!mountNativeMap) {
        setBlockingErrorMessage(null);
        setMapContentReadyState(false);
        setForceMountCover(false);
      }
    }, [mountNativeMap]);

    useEffect(() => {
      if (!expanded) {
        pendingExpandRef.current = false;
      }
    }, [expanded]);

    useEffect(() => {
      if (!pendingExpandRef.current || expandLayout == null) return;
      pendingExpandRef.current = false;
      onExpand();
    }, [expandLayout, onExpand]);

    useEffect(() => {
      if (!expanded || !mountNativeMap || expandLayout != null) return;
      remeasureLayout();
    }, [expanded, mountNativeMap, expandLayout, remeasureLayout]);

    const expandedRef = useRef(expanded);
    expandedRef.current = expanded;
    const mountNativeMapRef = useRef(mountNativeMap);
    mountNativeMapRef.current = mountNativeMap;

    useLayoutEffect(() => {
      if (!expandedRef.current || !mountNativeMapRef.current) return;
      // Portal→inline collapse handoff: don't remount layout and fight the collapse timeline.
      if (collapseAfterSeed || collapseInFlightRef.current) return;
      let cancelled = false;
      let frame = 0;
      const tick = () => {
        if (cancelled) return;
        if (collapseInFlightRef.current) return;
        remeasureLayout();
        frame += 1;
        if (frame < EXPAND_LAYOUT_STABILIZE_FRAMES) {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
      return () => {
        cancelled = true;
      };
    }, [uiScaleProfileKey, windowWidth, windowHeight, remeasureLayout, collapseAfterSeed]);

    const handleExpandPress = useCallback(() => {
      if (
        EXPAND_PORTAL_HANDOFF &&
        androidHost === "inline" &&
        onAndroidExpandToPortal != null &&
        portalMeasureRef != null
      ) {
        // Cover inline while measuring; portal remount starts covered.
        setForceMountCover(true);
        void measurePortalExpandLayout(portalMeasureRef, collapsedMeasureRef).then((layout) => {
          if (layout != null) {
            onAndroidExpandToPortal(layout);
          } else {
            setForceMountCover(false);
          }
        });
        return;
      }

      void measureForCurrentHost().then((layout) => {
        if (layout != null) {
          setExpandLayout(layout);
          pendingExpandRef.current = true;
        }
      });
    }, [
      androidHost,
      collapsedMeasureRef,
      measureForCurrentHost,
      onAndroidExpandToPortal,
      portalMeasureRef,
    ]);

    useEffect(() => {
      if (!expanded) return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        requestCollapse();
        return true;
      });
      return () => sub.remove();
    }, [expanded, requestCollapse]);

    const shellApi = useMemo(
      (): MiniMapShellApi => ({
        mountNativeMap,
        expanded,
        layoutHost: androidHost,
        requestCollapse,
        settleCollapsedLayout,
        layoutReady,
        mapBodyVisible,
        expandedChromeStyle,
        expandedPadding,
        insets,
        setBlockingErrorMessage,
        setMapContentReady,
        mapContentReady,
        mapChromeInteractive: mapContentReady && !forceMountCover,
        registerCollapseCleanup,
      }),
      [
        mountNativeMap,
        expanded,
        androidHost,
        requestCollapse,
        settleCollapsedLayout,
        layoutReady,
        mapBodyVisible,
        expandedChromeStyle,
        expandedPadding,
        insets,
        mapContentReady,
        forceMountCover,
        setMapContentReady,
        registerCollapseCleanup,
      ],
    );

    return (
      <MiniMapShellContext.Provider value={shellApi}>
        <Animated.View
          style={[
            styles.mapCard,
            { backgroundColor: map.minimap.background },
            cardStyle,
            expanded && styles.expandedCard,
          ]}
          pointerEvents={expanded ? "auto" : "box-none"}
          collapsable={false}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setLayoutReady(width > 0 && height > 0);
          }}
        >
          <View style={mapLoadingOverlayStyles.mapSlot}>
            {children}
            {showPlaceholder ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  mapLoadingOverlayStyles.placeholderCover,
                ]}
                pointerEvents="auto"
              >
                {mountNativeMap && blockingErrorMessage != null ? (
                  <View style={[minimapStyles.map, minimapStyles.mapPlaceholder]} pointerEvents="none">
                    <PlaceholderMiniMap errorMessage={blockingErrorMessage} />
                  </View>
                ) : (
                  <MiniMapMountLoadingOverlay />
                )}
              </View>
            ) : null}
            {!showPlaceholder && showMountLoadingOverlay ? (
              <MiniMapMountLoadingOverlay />
            ) : null}
          </View>
          {!expanded && layoutReady && mapDirections != null ? (
            <MiniMapDirectionsButtons lat={mapDirections.lat} lon={mapDirections.lon} />
          ) : null}
          {!expanded && layoutReady ? (
            <ExpandMiniMapButton onPress={handleExpandPress} />
          ) : null}
        </Animated.View>
      </MiniMapShellContext.Provider>
    );
  },
);

const styles = StyleSheet.create({
  mapCard: {
    overflow: "hidden",
  },
  expandedCard: {
    elevation: 8,
  },
});
