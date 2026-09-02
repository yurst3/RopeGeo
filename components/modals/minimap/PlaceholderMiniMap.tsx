import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { minimapStyles } from "./shared/minimapShared";

export type PlaceholderMiniMapProps = {
  /** When set, shows missing-image + this message in red instead of the loading spinner. */
  errorMessage?: string;
};

/**
 * Same footprint as {@link minimapStyles.wrapper} (square `aspectRatio: 1`, shared minimap border radius)
 * used by {@link PageMiniMapView} and region scroll content — grey fill with spinner or error UI.
 */
export function PlaceholderMiniMap({ errorMessage }: PlaceholderMiniMapProps) {
  const { image, text, loadingIndicator } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const isError = errorMessage != null && errorMessage !== "";

  return (
    <View
      style={[
        minimapStyles.wrapper,
        styles.center,
        { backgroundColor: image.background },
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
            style={[styles.errorText, { color: text.error }]}
          >
            {errorMessage}
          </ConstantText>
        </>
      ) : (
        <ActivityIndicator size="small" color={loadingIndicator} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  missingImage: {
    width: 48,
    height: 48,
  },
  errorText: {
    textAlign: "center",
    paddingHorizontal: 12,
  },
});
