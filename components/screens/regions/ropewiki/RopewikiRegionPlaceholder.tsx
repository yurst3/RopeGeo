import { BackButton } from "@/components/buttons/standard/BackButton";
import { ExternalLinkButton } from "@/components/buttons/standard/ExternalLinkButton";
import { PlaceholderMiniMap } from "@/components/modals/minimap/PlaceholderMiniMap";
import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from "react-native";
import { PageDataSource } from "ropegeo-common/models";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HALF_HEIGHT = SCREEN_HEIGHT / 2;
const CARD_BORDER_RADIUS = 24;
/** Matches {@link RegionSeamButtons} seam positioning. */
const SEAM_FLOAT_OFFSET = 64;
const SEAM_FLOAT_HEIGHT = 48;

export type RopewikiRegionPlaceholderProps = {
  backTop: number;
  source: PageDataSource;
  /** When set, banner shows `missingImage` and this text instead of loading spinners. */
  errorMessage?: string;
  /** Back button + Android hardware back; defaults to `router.back()`. */
  onBackPress?: () => void;
};

function iconForSource(source: PageDataSource): ImageSourcePropType {
  switch (source) {
    case PageDataSource.Ropewiki:
      return require("@/assets/images/icons/ropewiki.png");
    default:
      return require("@/assets/images/icons/ropewiki.png");
  }
}

function externalLinkForSource(source: PageDataSource): string {
  switch (source) {
    case PageDataSource.Ropewiki:
      return "https://ropewiki.com";
    default:
      return "https://ropewiki.com";
  }
}

/**
 * Loading / offline / error shell matching loaded region layout: ~50% banner, overlapping card.
 * Non-interactive {@link ExternalLinkButton} at the same seam position as {@link RegionSeamButtons}.
 */
export function RopewikiRegionPlaceholder({
  backTop,
  source,
  errorMessage,
  onBackPress,
}: RopewikiRegionPlaceholderProps) {
  const { background, placeholder, image, text, loadingIndicator } =
    useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const router = useRouter();
  const isError = errorMessage != null && errorMessage !== "";
  const handleBack = useCallback(() => {
    if (onBackPress != null) {
      onBackPress();
    } else {
      router.back();
    }
  }, [onBackPress, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);
  const paddingTop = HALF_HEIGHT;
  const seamTop =
    paddingTop - CARD_BORDER_RADIUS - SEAM_FLOAT_OFFSET;
  const linkUrl = externalLinkForSource(source);

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View
        style={[
          styles.banner,
          { height: HALF_HEIGHT, backgroundColor: image.background },
        ]}
      >
        {isError ? (
          <>
            <Image
              source={require("@/assets/images/icons/missingImage.png")}
              style={[styles.missingImage, { tintColor: image.missingIcon }]}
              contentFit="contain"
            />
            <ConstantText
              size={uiScale.toast.text.message}
              typography={textStyle.toast.message}
              style={[styles.errorTitle, { color: text.error }]}
            >
              {errorMessage}
            </ConstantText>
          </>
        ) : (
          <ActivityIndicator size="large" color={loadingIndicator} />
        )}
      </View>

      <View
        style={[
          styles.card,
          { marginTop: -CARD_BORDER_RADIUS, backgroundColor: background },
        ]}
      >
        <View style={[styles.titleBar, { backgroundColor: placeholder }]} />
        <View style={[styles.line, { width: "55%", backgroundColor: placeholder }]} />
        <View style={[styles.line, { width: "40%", backgroundColor: placeholder }]} />
        <View style={styles.miniMapWrap}>
          <PlaceholderMiniMap
            errorMessage={
              isError ? "Could not load map data" : undefined
            }
          />
        </View>
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.seamLinkWrap, { top: seamTop }]}
      >
        <ExternalLinkButton
          icon={iconForSource(source)}
          link={linkUrl}
          disabled
          accessibilityLabel="Open on RopeWiki (unavailable while loading)"
        />
      </View>

      <BackButton onPress={handleBack} top={backTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    width: SCREEN_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  missingImage: {
    width: 56,
    height: 56,
  },
  errorTitle: {
    textAlign: "center",
    paddingHorizontal: 24,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderTopRightRadius: CARD_BORDER_RADIUS,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  titleBar: {
    height: 22,
    width: "72%",
    borderRadius: 6,
  },
  line: {
    height: 12,
    borderRadius: 4,
  },
  miniMapWrap: {
    marginTop: 16,
  },
  seamLinkWrap: {
    position: "absolute",
    left: 16,
    height: SEAM_FLOAT_HEIGHT,
    justifyContent: "center",
    zIndex: 2001,
  },
});
