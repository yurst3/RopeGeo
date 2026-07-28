import { ConstantText } from "@/components/text/ConstantText";
import { FontSettingsSection } from "@/components/screens/settings/FontSettingsSection";
import { RelevantInfoSettingsSection } from "@/components/screens/settings/RelevantInfoSettingsSection";
import { ThemeSettingsSection } from "@/components/screens/settings/ThemeSettingsSection";
import { UiScaleSettingsSection } from "@/components/screens/settings/UiScaleSettingsSection";
import { UnitsSettingsSection } from "@/components/screens/settings/UnitsSettingsSection";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useSettings } from "@/context/app/SettingsContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function SettingsScreen() {
  const { background, text } = useColorTheme();
  const { sectionLabel } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const insets = useSafeAreaInsets();
  const {
    settings,
    setTheme,
    setFont,
    setUiScale,
    setUnits,
    setShowRelevantContext,
    setShowRelevantContextStrengths,
  } = useSettings();

  return (
    <View style={[styles.screen, { backgroundColor: background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
            paddingLeft: 16 + insets.left,
            paddingRight: 16 + insets.right,
          },
        ]}
      >
        <ConstantText
          size={uiScale.pageScreen.text.title}
          typography={textStyle.pageScreen.title}
          style={[styles.screenTitle, { color: text.primary }]}
        >
          Settings
        </ConstantText>

        <ConstantText
          size={uiScale.filter.text.sectionTitle}
          typography={textStyle.filter.sectionTitle}
          style={[styles.sectionLabel, sectionLabel]}
        >
          Theme
        </ConstantText>
        <ThemeSettingsSection value={settings.theme} onChange={setTheme} />

        <ConstantText
          size={uiScale.filter.text.sectionTitle}
          typography={textStyle.filter.sectionTitle}
          style={[styles.sectionLabel, sectionLabel]}
        >
          Font
        </ConstantText>
        <FontSettingsSection value={settings.font} onChange={setFont} />

        <ConstantText
          size={uiScale.filter.text.sectionTitle}
          typography={textStyle.filter.sectionTitle}
          style={[styles.sectionLabel, sectionLabel]}
        >
          UI Scale
        </ConstantText>
        <UiScaleSettingsSection value={settings.uiScale} onChange={setUiScale} />

        <ConstantText
          size={uiScale.filter.text.sectionTitle}
          typography={textStyle.filter.sectionTitle}
          style={[styles.sectionLabel, sectionLabel]}
        >
          Units
        </ConstantText>
        <UnitsSettingsSection
          value={settings.lengthMeasurementSystem}
          onChange={setUnits}
        />

        <RelevantInfoSettingsSection
          showRelevantContext={settings.showRelevantContext}
          strengthMin={settings.showRelevantContextStrengths.min}
          strengthMax={settings.showRelevantContextStrengths.max}
          onShowRelevantContextChange={setShowRelevantContext}
          onStrengthsChange={setShowRelevantContextStrengths}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  screenTitle: {
    marginBottom: 24,
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
  },
});
