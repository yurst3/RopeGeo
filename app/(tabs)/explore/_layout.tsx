import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { Stack } from "expo-router";

function HeaderBackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingRight: 12,
        opacity: pressed ? 0.6 : 1,
      })}
      accessibilityLabel="Go back"
    >
      <FontAwesome5 name="chevron-left" size={20} color="#3b82f6" />
      <Text style={{ marginLeft: 4, fontSize: 17, color: "#3b82f6" }}>Back</Text>
    </Pressable>
  );
}

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
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
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
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
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
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
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
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="permit-info"
        options={{
          title: "Permit status",
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="shuttle-info"
        options={{
          title: "Shuttle",
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="vehicle-info"
        options={{
          title: "Vehicle type",
          headerBackVisible: false,
          headerLeft: () => <HeaderBackButton />,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="[id]/ropewiki-page"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
