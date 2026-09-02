import { NetworkStateDebugToasts } from "@/components/toast/NetworkStateDebugToasts";
import { ToastStackAnchor } from "@/components/toast/ToastStackAnchor";
import { ColorThemeProvider } from "@/context/theme/ColorThemeContext";
import { TextProvider } from "@/context/typography/TextContext";
import { UIScaleProvider } from "@/context/typography/UIScaleContext";
import {
  SettingsAppGate,
  SettingsProvider,
} from "@/context/app/SettingsContext";
import { NetworkStatusProvider, SHOW_NETWORK_STATE } from "@/context/app/NetworkStatusContext";
import { ToastProvider } from "@/context/ui/ToastContext";
import { ShareSheetDimmerProvider } from "@/context/ui/ShareSheetDimmerContext";
import { SavedPagesProvider } from "@/context/data/SavedPagesContext";
import { SavedFiltersProvider } from "@/context/data/SavedFiltersContext";
import { DownloadJobQueueProvider } from "@/context/data/DownloadJobQueueContext";
import { MapLayersSheetProvider } from "@/context/ui/MapLayersSheetContext";
import { stackScreenOptions } from "@/utils/navigation/stackScreenOptions";
import { installMapboxLoggerFilters } from "@/utils/mapbox/mapboxLogger";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

installMapboxLoggerFilters();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SettingsProvider>
        <SettingsAppGate>
          <ColorThemeProvider>
            <UIScaleProvider>
              <TextProvider>
                <NetworkStatusProvider>
                  <ToastProvider>
                    <ToastStackAnchor />
                    {SHOW_NETWORK_STATE ? <NetworkStateDebugToasts /> : null}
                    <ShareSheetDimmerProvider>
                      <SavedPagesProvider>
                        <SavedFiltersProvider>
                          <DownloadJobQueueProvider>
                            <MapLayersSheetProvider>
                            <Stack screenOptions={stackScreenOptions}>
                              <Stack.Screen
                                name="(tabs)"
                                options={{
                                  headerShown: false,
                                }}
                              />
                              <Stack.Screen
                                name="index"
                                options={{
                                  headerShown: false,
                                }}
                              />
                            </Stack>
                            </MapLayersSheetProvider>
                          </DownloadJobQueueProvider>
                        </SavedFiltersProvider>
                      </SavedPagesProvider>
                    </ShareSheetDimmerProvider>
                  </ToastProvider>
                </NetworkStatusProvider>
              </TextProvider>
            </UIScaleProvider>
          </ColorThemeProvider>
        </SettingsAppGate>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
