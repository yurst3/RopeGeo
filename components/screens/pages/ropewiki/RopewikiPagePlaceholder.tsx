import { BackButton } from "@/components/buttons/standard/BackButton";
import { ExternalLinkButton } from "@/components/buttons/standard/ExternalLinkButton";
import { PlaceholderMiniMap } from "@/components/modals/minimap/PlaceholderMiniMap";
import { PlaceholderPageBadges } from "@/components/screens/pages/ropewiki/PlaceholderPageBadges";
import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from "react-native";
import { PageDataSource } from "ropegeo-common/models";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HALF_HEIGHT = SCREEN_HEIGHT / 2;
const CARD_BORDER_RADIUS = 24;
/** Matches {@link PageSeamButtons} seam positioning at scroll offset 0 with a 50% banner. */
const SEAM_FLOAT_OFFSET = 64;
const SEAM_FLOAT_HEIGHT = 48;

export type RopewikiPagePlaceholderProps = {
  backTop: number;
  source: PageDataSource;
  /** When set, banner shows `missingImage` and this text instead of a loading spinner. */
  errorMessage?: string;
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
 * Loading / offline / error shell for the Ropewiki page route: 50% banner, overlapping card filling the lower half,
 * skeleton content, and a non-pressable {@link ExternalLinkButton} at the same seam as {@link PageSeamButtons}.
 */
export function RopewikiPagePlaceholder({
  backTop,
  source,
  errorMessage,
}: RopewikiPagePlaceholderProps) {
  const { background, placeholder, image, text, loadingIndicator } =
    useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const router = useRouter();
  const isError = errorMessage != null && errorMessage !== "";
  const seamTop = HALF_HEIGHT - CARD_BORDER_RADIUS - SEAM_FLOAT_OFFSET;
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
        <View style={[styles.line, { width: "62%", backgroundColor: placeholder }]} />
        <View style={[styles.line, { width: "44%", backgroundColor: placeholder }]} />
        <PlaceholderPageBadges />
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
        style={[styles.seamRow, { top: seamTop }]}
      >
        <ExternalLinkButton
          icon={iconForSource(source)}
          link={linkUrl}
          disabled
          accessibilityLabel="Open on RopeWiki (unavailable while loading)"
        />
        <View style={styles.downloadSpacer} />
      </View>

      <BackButton onPress={() => router.back()} top={backTop} />
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
    width: "70%",
    borderRadius: 6,
  },
  line: {
    height: 12,
    borderRadius: 4,
  },
  miniMapWrap: {
    marginTop: 12,
    flex: 1,
    minHeight: 120,
  },
  seamRow: {
    position: "absolute",
    left: 16,
    right: 16,
    height: SEAM_FLOAT_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2001,
  },
  downloadSpacer: {
    width: 48,
    height: 48,
  },
});
