import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type StarRatingProps = {
  rating: number;
  count: number;
  /** Star size in px. Default 16. */
  size?: number;
  /** Color for empty star. Default "#d1d5db". */
  emptyStarColor?: string;
  /** Color for filled portion. Default "#333". */
  filledStarColor?: string;
  style?: React.ComponentProps<typeof View>["style"];
  textStyle?: React.ComponentProps<typeof Text>["style"];
};

const DEFAULT_SIZE = 16;
const DEFAULT_EMPTY_COLOR = "#d1d5db";
const DEFAULT_FILLED_COLOR = "#333";

export function StarRating({
  rating,
  count,
  size = DEFAULT_SIZE,
  emptyStarColor = DEFAULT_EMPTY_COLOR,
  filledStarColor = DEFAULT_FILLED_COLOR,
  style,
  textStyle,
}: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = Math.min(1, Math.max(0, rating - i));
    return (
      <View key={i} style={[styles.starCell, { width: size, height: size }]}>
        <FontAwesome5 name="star" size={size} color={emptyStarColor} />
        <View
          style={[
            styles.starFillClip,
            { width: `${fill * 100}%`, height: size },
          ]}
          pointerEvents="none"
        >
          <FontAwesome5
            name="star"
            size={size}
            color={filledStarColor}
            solid
          />
        </View>
      </View>
    );
  });
  return (
    <View style={[styles.starRow, style]}>
      {stars}
      <Text style={[styles.ratingText, textStyle]}>
        {rating.toFixed(1)} ({count})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  starRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  starCell: {
    overflow: "hidden",
  },
  starFillClip: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "hidden",
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#6b7280",
  },
});
