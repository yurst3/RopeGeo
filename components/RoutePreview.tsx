import {
  Method,
  RopeGeoHttpRequest,
  Service,
} from "@/components/RopeGeoHttpRequest";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  useRef,
  useState,
  useEffect,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * Route preview from GET /route/:routeId/preview.
 * @see https://api.webscraper.ropegeo.com/docs/index.html#tag/routes/operation/getRoutePreview
 */
export type PagePreview = {
  id: string;
  source: string;
  imageUrl: string | null;
  rating: number | null;
  ratingCount: number | null;
  title: string;
  regions: string[];
  difficulty: string | null;
  /** Trail feature IDs to show on the map for this page. When present, TrailsLayer shows only these. */
  mapData?: string[];
};

const CARD_BORDER_RADIUS = 12;
const CARD_PADDING = 12;
const IMAGE_ASPECT = 3 / 4;
const STAR_SIZE = 14;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN_H = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN_H * 2;

function StarRating({
  rating,
  count,
}: {
  rating: number;
  count: number;
}) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <View style={styles.starRow}>
      {Array.from({ length: full }, (_, i) => (
        <FontAwesome5 key={`f-${i}`} name="star" size={STAR_SIZE} color="#333" solid />
      ))}
      {half > 0 && (
        <FontAwesome5 name="star-half-alt" size={STAR_SIZE} color="#333" solid />
      )}
      {Array.from({ length: empty }, (_, i) => (
        <FontAwesome5 key={`e-${i}`} name="star" size={STAR_SIZE} color="#999" />
      ))}
      <Text style={styles.ratingText}>
        {rating.toFixed(1)} ({count})
      </Text>
    </View>
  );
}

function SinglePreviewCard({ preview }: { preview: PagePreview }) {
  const [imageLoading, setImageLoading] = useState(!!preview.imageUrl);
  const rating = preview.rating ?? 0;
  const ratingCount = preview.ratingCount ?? 0;
  const location = preview.regions?.length
    ? preview.regions.join(" • ")
    : "";

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {preview.imageUrl ? (
            <>
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color="#666" />
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
            <View style={styles.placeholderImage}>
              <FontAwesome5 name="route" size={40} color="#999" />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <StarRating rating={rating} count={ratingCount} />
          <Text style={styles.title} numberOfLines={2}>
            {preview.title}
          </Text>
          {location ? (
            <Text style={styles.regions} numberOfLines={2}>
              {location}
            </Text>
          ) : null}
          {preview.difficulty != null && preview.difficulty !== "" ? (
            <Text style={styles.difficulty}>
              Difficulty: {preview.difficulty}
            </Text>
          ) : null}
          {preview.source === "ropewiki" && (
            <View style={styles.sourceLogo}>
              <Image
                source={require("@/assets/images/ropewiki.png")}
                style={styles.ropewikiImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function CurrentPreviewNotifier({
  loading,
  data,
  currentIndex,
  onCurrentPreviewChange,
}: {
  loading: boolean;
  data: PagePreview[] | null;
  currentIndex: number;
  onCurrentPreviewChange?: (preview: PagePreview | null) => void;
}) {
  useEffect(() => {
    if (!onCurrentPreviewChange) return;
    if (loading || !data || data.length === 0) {
      onCurrentPreviewChange(null);
    } else {
      const preview = data[currentIndex] ?? data[0];
      onCurrentPreviewChange(preview);
    }
  }, [loading, data, currentIndex, onCurrentPreviewChange]);
  return null;
}

type RoutePreviewProps = {
  routeId: string;
  /** Called when the currently viewed preview page changes (initial load or swipe). Use to sync mapData for TrailsLayer. */
  onCurrentPreviewChange?: (preview: PagePreview | null) => void;
};

export function RoutePreview({ routeId, onCurrentPreviewChange }: RoutePreviewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <RopeGeoHttpRequest<PagePreview[]>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      path="/route/:routeId/preview"
      pathParams={{ routeId }}
    >
      {({ loading, data, errors }) => {
        return (
          <>
            <CurrentPreviewNotifier
              loading={!!loading}
              data={data ?? null}
              currentIndex={currentIndex}
              onCurrentPreviewChange={onCurrentPreviewChange}
            />
            {loading ? (
            <View style={styles.outer}>
              <View style={[styles.card, styles.placeholderCard]}>
                <ActivityIndicator size="large" color="#666" />
                <Text style={[styles.placeholderText, styles.loadingText]}>
                  Loading preview…
                </Text>
              </View>
            </View>
          ) : errors ? (
            <View style={styles.outer}>
              <View style={[styles.card, styles.placeholderCard]}>
                <Text style={styles.errorText}>{errors.message}</Text>
              </View>
            </View>
          ) : !data || data.length === 0 ? (
            <View style={styles.outer}>
              <View style={[styles.card, styles.placeholderCard]}>
                <Text style={styles.placeholderText}>No preview available</Text>
              </View>
            </View>
          ) : data.length === 1 ? (
            <View style={styles.outer}>
              <SinglePreviewCard preview={data[0]} />
            </View>
          ) : (
            <View style={styles.outer}>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const i = Math.round(
                    e.nativeEvent.contentOffset.x / CARD_WIDTH
                  );
                  setCurrentIndex(Math.min(i, data.length - 1));
                }}
                contentContainerStyle={styles.scrollContent}
              >
                {data.map((preview) => (
                  <View key={preview.id} style={styles.page}>
                    <SinglePreviewCard preview={preview} />
                  </View>
                ))}
              </ScrollView>
              <View style={styles.dots}>
                {data.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === currentIndex ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
          </>
        );
      }}
    </RopeGeoHttpRequest>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: CARD_MARGIN_H,
    marginBottom: 8,
  },
  scrollContent: {
    paddingRight: 0,
  },
  page: {
    width: CARD_WIDTH,
    marginRight: 0,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
    padding: CARD_PADDING,
  },
  placeholderCard: {
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#666",
    fontSize: 14,
  },
  loadingText: {
    marginTop: 8,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  errorText: {
    color: "#c00",
    fontSize: 14,
  },
  cardContent: {
    flexDirection: "row",
  },
  imageContainer: {
    width: CARD_WIDTH * 0.35,
    aspectRatio: 1 / IMAGE_ASPECT,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginLeft: CARD_PADDING,
    justifyContent: "flex-start",
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 2,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#333",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  regions: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  difficulty: {
    fontSize: 12,
    color: "#444",
  },
  sourceLogo: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  ropewikiImage: {
    width: 72,
    height: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#333",
  },
  dotInactive: {
    backgroundColor: "#ccc",
  },
});
