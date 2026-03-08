import { StarRating } from "@/components/StarRating";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  type Difficulty,
  PageDataSource,
  type PagePreview,
  RouteType,
} from "ropegeo-common";

const IMAGE_SIZE = 96;
const NO_IMAGE_ICON_SIZE = 36;
const REGION_MAX = 3;

function formatPageDifficulty(d: Difficulty): string {
  const main = [d.technical, d.water]
    .filter((x): x is NonNullable<typeof x> => x != null)
    .map((x) => String(x))
    .join("");
  const time = d.time != null ? ` ${String(d.time)}` : "";
  return main + time;
}

function sourceIcon(source: PageDataSource): number | null {
  if (source === PageDataSource.Ropewiki) {
    return require("@/assets/images/ropewiki.png");
  }
  return null;
}

type Props = {
  preview: PagePreview;
};

export function SearchPagePreview({ preview }: Props) {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(!!preview.imageUrl);
  const difficultyText = formatPageDifficulty(preview.difficulty);
  const regionLine =
    preview.regions?.length > 0
      ? preview.regions.slice(0, REGION_MAX).join(" • ")
      : "";
  const rating = preview.rating ?? 0;
  const ratingCount = preview.ratingCount ?? 0;
  const icon = sourceIcon(preview.source);

  const onPress = () => {
    if (preview.source === PageDataSource.Ropewiki) {
      router.push({
        pathname: "/explore/[id]/page",
        params: {
          id: preview.id,
          source: PageDataSource.Ropewiki,
          routeType: RouteType.Unknown,
        },
      } as unknown as Parameters<typeof router.push>[0]);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.imageWrap}>
        {preview.imageUrl ? (
          <>
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#6b7280" />
              </View>
            )}
            <Image
              source={{ uri: preview.imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
          </>
        ) : (
          <View style={styles.noImageWrap}>
            <Image
              source={require("@/assets/images/noImage.png")}
              style={[styles.noImageIcon, { width: NO_IMAGE_ICON_SIZE, height: NO_IMAGE_ICON_SIZE }]}
              resizeMode="contain"
            />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {preview.title}
          </Text>
          {difficultyText ? (
            <Text style={styles.difficulty} numberOfLines={1}>
              {difficultyText}
            </Text>
          ) : null}
        </View>
        {preview.aka?.length > 0 ? (
          <Text style={[styles.meta, styles.akaLine]} numberOfLines={1}>
            <Text style={styles.meta}>AKA: </Text>
            <Text style={styles.akaNamesBold}>{preview.aka.join(", ")}</Text>
          </Text>
        ) : null}
        {regionLine ? (
          <Text style={styles.meta} numberOfLines={2}>
            {regionLine}
          </Text>
        ) : null}
        <StarRating
          rating={rating}
          count={ratingCount}
          size={14}
          emptyStarColor="#d1d5db"
          style={styles.stars}
          textStyle={styles.starText}
        />
      </View>
      {icon != null ? (
        <Image source={icon} style={styles.sourceIcon} resizeMode="contain" />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 3,
    marginBottom: 6,
  },
  cardPressed: {
    opacity: 0.9,
  },
  imageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  noImageWrap: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageIcon: {},
  body: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  difficulty: {
    fontSize: 16,
    color: "#374151",
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  akaLine: {
    marginLeft: 12,
  },
  akaNamesBold: {
    fontWeight: "700",
  },
  stars: {
    marginTop: 2,
  },
  starText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#6b7280",
  },
  sourceIcon: {
    width: 56,
    height: 32,
    marginLeft: 8,
  },
});
