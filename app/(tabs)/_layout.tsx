import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="explore"
        options={{
          title: "explore",
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <FontAwesome name={focused ? "map" : "map-o"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
