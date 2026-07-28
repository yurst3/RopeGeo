import { useHeaderChromeLayout, useMapButtonChromeLayout } from "@/utils/layout/buttonChromeLayout";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const FADE_MS = 150;
const LAYOUT_MS = 220;

export type ButtonStackSlotProps = {
  id: string;
  visible: boolean;
  /**
   * When false, this row does not use Reanimated layout transitions. Use for slots that stay
   * mounted so sibling changes do not animate this row’s frame (avoids jitter when the stack
   * width or sibling list changes).
   */
  animateLayout?: boolean;
  children?: ReactNode;
};

/**
 * Declares one row in a {@link ButtonStack}. Renders its children only as part of the parent stack
 * (the parent reads `id`, `visible`, and `children` from each Slot).
 */
export function ButtonStackSlot({ children }: ButtonStackSlotProps) {
  return <>{children}</>;
}

ButtonStackSlot.displayName = "ButtonStack.Slot";

function isButtonStackSlot(
  child: ReactNode,
): child is ReactElement<ButtonStackSlotProps> {
  return isValidElement(child) && child.type === ButtonStackSlot;
}

const slotLayoutTransition = LinearTransition.duration(LAYOUT_MS);

function ButtonStackSlotRow({
  visible,
  animateLayout,
  children,
}: {
  visible: boolean;
  animateLayout: boolean;
  children: ReactNode;
}) {
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  const [mounted, setMounted] = useState(visible);
  const opacity = useSharedValue(visible ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  /** Must be a stable function for {@link runOnJS} — inline lambdas crash the worklet runtime. */
  const finalizeHideIfStillHidden = useCallback(() => {
    if (!visibleRef.current) {
      setMounted(false);
    }
  }, []);

  useLayoutEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: FADE_MS });
      return;
    }
    if (!mounted) {
      return;
    }
    opacity.value = withTiming(0, { duration: FADE_MS }, (finished) => {
      "worklet";
      if (finished) {
        runOnJS(finalizeHideIfStillHidden)();
      }
    });
  }, [visible, mounted, finalizeHideIfStillHidden]);

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      layout={animateLayout ? slotLayoutTransition : undefined}
      style={animatedStyle}
      pointerEvents={visible ? "auto" : "none"}
    >
      {children}
    </Animated.View>
  );
}

type ButtonStackBaseProps = {
  /** Distance from the top of the screen to the top of the first slot. */
  top: number;
  /** Distance from the right edge of the screen. Defaults to scaled header edge inset. */
  right?: number;
  /** Vertical gap between slots. */
  gap?: number;
  children?: ReactNode;
};

function ButtonStackBase({
  top,
  right,
  gap: gapProp,
  children,
}: ButtonStackBaseProps) {
  const mapChrome = useMapButtonChromeLayout();
  const headerChrome = useHeaderChromeLayout();
  const gap = gapProp ?? mapChrome.gap;
  const resolvedRight = right ?? headerChrome.edgeInset;
  const slots = Children.toArray(children).filter(isButtonStackSlot);

  return (
    <View
      style={[
        styles.host,
        { top, right: resolvedRight, gap, minWidth: mapChrome.stackMinWidth },
      ]}
      pointerEvents="box-none"
    >
      {slots.map((el) => (
        <ButtonStackSlotRow
          key={el.props.id}
          visible={el.props.visible}
          animateLayout={el.props.animateLayout !== false}
        >
          {el.props.children}
        </ButtonStackSlotRow>
      ))}
    </View>
  );
}

export type ButtonStackComponent = typeof ButtonStackBase & {
  Slot: typeof ButtonStackSlot;
};

/**
 * Vertical stack of map chrome buttons (top-right). Use only `ButtonStack.Slot` children;
 * each slot fades in/out independently; when a slot hides, remaining slots slide to their new
 * positions (layout transition) after the hidden row unmounts.
 */
export const ButtonStack: ButtonStackComponent = Object.assign(ButtonStackBase, {
  Slot: ButtonStackSlot,
});

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    zIndex: 4,
    flexDirection: "column",
    alignItems: "flex-end",
  },
});
