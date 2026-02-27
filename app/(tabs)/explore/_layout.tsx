import { Stack } from "expo-router";

export default function ExploreLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="risk-info"
        options={{
          title: "Risk ratings",
          headerBackTitle: "Back",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="technical-info"
        options={{
          title: "Technical ratings",
          headerBackTitle: "Back",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="water-info"
        options={{
          title: "Water ratings",
          headerBackTitle: "Back",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="time-info"
        options={{
          title: "Time ratings",
          headerBackTitle: "Back",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
    </Stack>
  );
}
