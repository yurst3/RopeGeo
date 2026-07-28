import { stackScreenOptions } from "@/utils/navigation/stackScreenOptions";
import { Stack } from "expo-router";

export default function SettingsStackLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="relevance-info" options={{ headerShown: false }} />
    </Stack>
  );
}
