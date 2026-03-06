import {
  Method,
  RopeGeoHttpRequest,
  Service,
} from "@/components/RopeGeoHttpRequest";
import { useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ExternalLinkButton } from "@/components/buttons/ExternalLinkButton";
import { StarRating } from "@/components/StarRating";
import {
  type Difficulty,
  type DifficultyWater,
  type PagePreview,
  RouteType,
} from "ropegeo-common";
import { BadgeRow } from "./BadgeRow";

/** PagePreview with optional routeType (when provided by caller, e.g. from map route). */
type PagePreviewWithRouteType = PagePreview & {
  routeType?: RouteType | null;
};

const CARD_BORDER_RADIUS = 12;
const CARD_PADDING = 12;
const IMAGE_ASPECT = 3 / 4;
const NO_IMAGE_ICON_SIZE = 36;
const EXTERNAL_LINK_BUTTON_GAP = 8;
/** Minimum height so loading and loaded preview cards stay the same size. */
const PREVIEW_CARD_MIN_HEIGHT = 140;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN_H = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN_H * 2;

function hasDifficultyInfo(difficulty: Difficulty): boolean {
  return (
    difficulty.technical != null ||
    difficulty.water != null ||
    difficulty.time != null ||
    difficulty.risk != null
  );
}

function showBadges(preview: PagePreviewWithRouteType): boolean {
  return (
    preview.permit != null ||
    preview.routeType === RouteType.Cave ||
    preview.routeType === RouteType.POI ||
    hasDifficultyInfo(preview.difficulty)
  );
}

function SinglePreviewCard({
  preview,
  badgeScale = 0.65,
  onPress,
}: {
  preview: PagePreviewWithRouteType;
  badgeScale?: number;
  onPress?: (preview: PagePreviewWithRouteType) => void;
}) {
  const [imageLoading, setImageLoading] = useState(!!preview.imageUrl);
  const rating = preview.rating ?? 0;
  const ratingCount = preview.ratingCount ?? 0;
  const location = preview.regions?.length
    ? preview.regions.slice(0, 3).join(" • ")
    : "";
  const hasBadges = showBadges(preview);

  const topContent = (
    <>
      <StarRating
        rating={rating}
        count={ratingCount}
        size={14}
        emptyStarColor="#999"
        style={styles.starRatingRow}
        textStyle={styles.starRatingText}
      />
      <Text style={styles.title} numberOfLines={2}>
        {preview.title}
      </Text>
      {location ? (
        <Text style={styles.regions} numberOfLines={2}>
          {location}
        </Text>
      ) : null}
    </>
  );

  const cardContent = (
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
            <View style={styles.noImageWrap}>
              <Image
                source={require("@/assets/images/noImage.png")}
                style={[styles.noImageIcon, { width: NO_IMAGE_ICON_SIZE, height: NO_IMAGE_ICON_SIZE }]}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
        <View style={[styles.info, !hasBadges && styles.infoCentered]}>
          {hasBadges ? (
            <>
              {topContent}
              <BadgeRow
                difficulty={preview.difficulty}
                permit={preview.permit}
                routeType={preview.routeType}
                scale={badgeScale}
              />
            </>
          ) : (
            <View style={styles.infoCenterWrap}>{topContent}</View>
          )}
        </View>
      </View>
    </View>
  );

  if (onPress != null) {
    return (
      <Pressable onPress={() => onPress(preview)} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        {cardContent}
      </Pressable>
    );
  }
  return cardContent;
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
  /** Route type from map/list (e.g. Cave, POI) so the preview can show the correct badge. */
  routeType?: RouteType | null;
  /** Called when the currently viewed preview page changes (initial load or swipe). Use to sync mapData for TrailsLayer. */
  onCurrentPreviewChange?: (preview: PagePreview | null) => void;
  /** Called when the user presses the preview card. Receives the tapped preview. */
  onPreviewPress?: (preview: PagePreviewWithRouteType) => void;
  /** Scale factor for difficulty badges (e.g. 0.65 for 65%). Default 0.65. */
  badgeScale?: number;
};

export function RoutePreview({ routeId, routeType = null, onCurrentPreviewChange, onPreviewPress, badgeScale = 0.65 }: RoutePreviewProps) {
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
        const currentPreview =
          data && data.length > 0
            ? data.length === 1
              ? data[0]
              : data[Math.min(currentIndex, data.length - 1)] ?? data[0]
            : null;
        const showExternalLink =
          currentPreview?.source === "ropewiki" &&
          currentPreview?.externalLink != null;

        return (
          <View style={styles.previewWrapper}>
            <CurrentPreviewNotifier
              loading={!!loading}
              data={data ?? null}
              currentIndex={currentIndex}
              onCurrentPreviewChange={onCurrentPreviewChange}
            />
            {showExternalLink && currentPreview.externalLink != null && (
              <View style={styles.externalLinkButtonWrap}>
                <ExternalLinkButton
                  icon={require("@/assets/images/ropewiki.png")}
                  link={currentPreview.externalLink}
                  accessibilityLabel="Open on RopeWiki"
                />
              </View>
            )}
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
              <SinglePreviewCard
                preview={{ ...data[0], routeType: routeType ?? undefined }}
                badgeScale={badgeScale}
                onPress={onPreviewPress != null ? (p) => onPreviewPress(p) : undefined}
              />
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
                    <SinglePreviewCard
                      preview={{ ...preview, routeType: routeType ?? undefined }}
                      badgeScale={badgeScale}
                      onPress={onPreviewPress != null ? (p) => onPreviewPress(p) : undefined}
                    />
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
          </View>
        );
      }}
    </RopeGeoHttpRequest>
  );
}

const styles = StyleSheet.create({
  previewWrapper: {
    position: "relative",
  },
  externalLinkButtonWrap: {
    position: "absolute",
    top: -(48 + EXTERNAL_LINK_BUTTON_GAP),
    right: CARD_MARGIN_H,
    zIndex: 1,
  },
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
    minHeight: PREVIEW_CARD_MIN_HEIGHT,
    backgroundColor: "#fff",
    borderRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  placeholderCard: {
    justifyContent: "center",
    alignItems: "center",
    padding: CARD_PADDING,
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
    alignSelf: "stretch",
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderBottomLeftRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  noImageWrap: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageIcon: {},
  info: {
    flex: 1,
    minHeight: PREVIEW_CARD_MIN_HEIGHT,
    padding: CARD_PADDING,
    justifyContent: "flex-start",
  },
  infoCentered: {
    justifyContent: "center",
  },
  infoCenterWrap: {
    flex: 1,
    justifyContent: "center",
  },
  starRatingRow: {
    marginBottom: 4,
    gap: 2,
  },
  starRatingText: {
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
