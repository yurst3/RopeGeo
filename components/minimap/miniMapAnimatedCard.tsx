import { ExpandMiniMapButton } from "@/components/buttons/standard/ExpandMiniMapButton";
import {
  MiniMapDirectionsButtons,
  minimapStyles,
} from "@/components/minimap/shared/minimapShared";
import {
  type MiniMapExpandLayout,
  useMiniMapAnimation,
} from "@/utils/minimap/useMiniMapAnimation";
import { PlaceholderMiniMap } from "@/components/minimap/PlaceholderMiniMap";
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
import { BackHandler, Dimensions, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";

/** Frames of post-layout remeasurement after uiScale/window changes while expanded. */
const EXPAND_LAYOUT_STABILIZE_FRAMES = 12;

export type MiniMapShellApi = {
  mountNativeMap: boolean;
  expanded: boolean;
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
  setLoadingOverlayVisible: (visible: boolean) => void;
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
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(229, 231, 235, 0.92)",
    borderRadius: minimapStyles.map.borderRadius,
  },
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
  children: ReactNode;
};

/** Measures expand/collapse rects in gate (collapsedMeasureRef) coordinates for absolute animation. */
function measureExpandLayout(
  expandAnchorRef: RefObject<View | null>,
  collapsedMeasureRef: RefObject<View | null>,
): Promise<MiniMapExpandLayout | null> {
  return new Promise((resolve) => {
    const anchor = expandAnchorRef.current;
    const collapsedNode = collapsedMeasureRef.current;
    if (anchor == null || collapsedNode == null) {
      resolve(null);
      return;
    }
    anchor.measureInWindow((ax, ay) => {
      collapsedNode.measureInWindow((cx, cy, cw, ch) => {
        const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
        const layout = {
          collapsed: {
            x: 0,
            y: 0,
            width: cw,
            height: ch,
          },
          expanded: {
            x: ax - cx,
            y: ay - cy,
            width: windowWidth,
            height: windowHeight,
          },
        };
        resolve(layout);
      });
    });
  });
}

/**
 * Shared minimap chrome: overlay host layout, expand/collapse animation, placeholder + loading overlays,
 * and collapsed expand/directions controls. Variants sync blocking/loading via {@link useMiniMapShell}.
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
      children,
    },
    ref,
  ) {
    const [blockingErrorMessage, setBlockingErrorMessage] = useState<string | null>(null);
    const [loadingOverlayVisible, setLoadingOverlayVisible] = useState(false);
    const [layoutReady, setLayoutReady] = useState(false);
    const [expandLayout, setExpandLayout] = useState<MiniMapExpandLayout | null>(null);
    const [collapseGeneration, setCollapseGeneration] = useState(0);
    const collapseCleanupRef = useRef<(() => void) | null>(null);
    const pendingExpandRef = useRef(false);
    const collapseInFlightRef = useRef(false);

    const registerCollapseCleanup = useCallback((fn: (() => void) | null) => {
      collapseCleanupRef.current = fn;
    }, []);

    const finishCollapse = useCallback(() => {
      if (!collapseInFlightRef.current) return;
      collapseInFlightRef.current = false;
      onCollapse();
      collapseCleanupRef.current?.();
    }, [onCollapse]);

    const remeasureLayout = useCallback(() => {
      void measureExpandLayout(expandAnchorRef, collapsedMeasureRef).then((layout) => {
        if (layout != null) {
          setExpandLayout(layout);
        }
      });
    }, [collapsedMeasureRef, expandAnchorRef]);

    useImperativeHandle(ref, () => ({ remeasureLayout }), [remeasureLayout]);

    const settleCollapsedLayout = useCallback(() => {
      setExpandLayout(null);
    }, []);

    const requestCollapse = useCallback(() => {
      if (!expanded || collapseInFlightRef.current) return;
      collapseInFlightRef.current = true;
      void measureExpandLayout(expandAnchorRef, collapsedMeasureRef).then((layout) => {
        if (layout == null) {
          finishCollapse();
          return;
        }
        setExpandLayout(layout);
        setCollapseGeneration((g) => g + 1);
      });
    }, [
      collapsedMeasureRef,
      expandAnchorRef,
      expanded,
      finishCollapse,
    ]);

    const uiScaleProfileKey = useUiScaleProfileKey();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const { cardStyle, expandedChromeStyle, expandedPadding, insets } = useMiniMapAnimation({
      expandLayout,
      expanded,
      collapseGeneration,
      onCollapseAnimationComplete: finishCollapse,
    });

    const mapBodyVisible = mountNativeMap && blockingErrorMessage == null;
    const showPlaceholder = !mapBodyVisible;

    useEffect(() => {
      if (!expanded) return;
      collapseInFlightRef.current = false;
    }, [expanded]);

    useEffect(() => {
      if (!mountNativeMap) {
        setBlockingErrorMessage(null);
        setLoadingOverlayVisible(false);
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

    /**
     * Gate window Y can move after uiScale reflow (siblings above the map change height)
     * without the gate receiving onLayout. Remeasure across several animation frames so
     * expand rects stay pinned once layout settles.
     */
    useLayoutEffect(() => {
      if (!expandedRef.current || !mountNativeMapRef.current) return;
      let cancelled = false;
      let frame = 0;
      const tick = () => {
        if (cancelled) return;
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
    }, [uiScaleProfileKey, windowWidth, windowHeight, remeasureLayout]);

    const handleExpandPress = useCallback(() => {
      void measureExpandLayout(expandAnchorRef, collapsedMeasureRef).then((layout) => {
        if (layout != null) {
          setExpandLayout(layout);
          pendingExpandRef.current = true;
        }
      });
    }, [collapsedMeasureRef, expandAnchorRef]);

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
        requestCollapse,
        settleCollapsedLayout,
        layoutReady,
        mapBodyVisible,
        expandedChromeStyle,
        expandedPadding,
        insets,
        setBlockingErrorMessage,
        setLoadingOverlayVisible,
        registerCollapseCleanup,
      }),
      [
        mountNativeMap,
        expanded,
        requestCollapse,
        settleCollapsedLayout,
        layoutReady,
        mapBodyVisible,
        expandedChromeStyle,
        expandedPadding,
        insets,
        registerCollapseCleanup,
      ],
    );

    return (
      <MiniMapShellContext.Provider value={shellApi}>
        <Animated.View
          style={[styles.mapCard, cardStyle, expanded && styles.expandedCard]}
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
                  minimapStyles.mapPlaceholder,
                ]}
                pointerEvents="auto"
              >
                <View style={[minimapStyles.map, minimapStyles.mapPlaceholder]} pointerEvents="none">
                  <PlaceholderMiniMap
                    errorMessage={
                      mountNativeMap && blockingErrorMessage != null
                        ? blockingErrorMessage
                        : undefined
                    }
                  />
                </View>
              </View>
            ) : null}
            {!showPlaceholder && loadingOverlayVisible ? (
              <View
                style={[StyleSheet.absoluteFill, mapLoadingOverlayStyles.overlay]}
                pointerEvents="none"
              >
                <PlaceholderMiniMap />
              </View>
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
    backgroundColor: "#e5e7eb",
  },
  expandedCard: {
    elevation: 8,
  },
});
