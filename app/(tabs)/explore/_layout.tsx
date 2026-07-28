import { stackScreenOptions } from "@/utils/navigation/stackScreenOptions";
import { Stack } from "expo-router";

/** Anchor the stack so `index` is always beneath deep-linked routes (back works on cold-start links). */
export const unstable_settings = {
  initialRouteName: "index",
};

export default function ExploreLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="risk-info" options={{ headerShown: false }} />
      <Stack.Screen name="technical-info" options={{ headerShown: false }} />
      <Stack.Screen name="water-info" options={{ headerShown: false }} />
      <Stack.Screen name="time-info" options={{ headerShown: false }} />
      <Stack.Screen name="permit-info" options={{ headerShown: false }} />
      <Stack.Screen name="shuttle-info" options={{ headerShown: false }} />
      <Stack.Screen name="vehicle-info" options={{ headerShown: false }} />
      <Stack.Screen name="relevance-info" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]/page"
        options={{
          headerShown: false,
          animation: "slide_from_right",
          animationTypeForReplace: "pop",
        }}
      />
      <Stack.Screen
        name="[id]/region"
        options={{
          headerShown: false,
          animation: "slide_from_right",
          animationTypeForReplace: "pop",
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
    </Stack>
  );
}
