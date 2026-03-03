import { ExternalLinkButton } from "@/components/buttons/ExternalLinkButton";
import { RappelInfoRow } from "@/components/RappelInfoRow";
import { StarRating } from "@/components/StarRating";
import {
  Method,
  RopeGeoHttpRequest,
  Service,
} from "@/components/RopeGeoHttpRequest";
import { ElevationGains } from "./ElevationGains";
import { Lengths } from "./Lengths";
import { PageBadges } from "./PageBadges";
import { RopewikiPageBetaSection } from "./RopewikiPageBetaSection";
import { TimeEstimates } from "./TimeEstimates";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import type { RopewikiPageView } from "ropegeo-common";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STARTING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);
/** Max banner height at scroll 0; shrinks as user scrolls, never below BANNER_HEIGHT (keeps width ≥ screen). */
const BANNER_HEIGHT_MAX = SCREEN_HEIGHT;
/** Fallback when image dimensions are not yet available (e.g. no image or before load). */
const FALLBACK_BANNER_ASPECT_RATIO = SCREEN_WIDTH / STARTING_HEIGHT;
const CARD_BORDER_RADIUS = 24;
const BACK_BUTTON_SIZE = 44;

export type RopewikiPageScreenProps = {
  pageId: string;
  /** Route type for badge display (e.g. "Canyon", "Cave", "POI"). */
  routeType?: string | null;
};

function ErrorEffect({ error }: { error: Error }) {
  const router = useRouter();
  useEffect(() => {
    router.back();
    Toast.show({
      type: "error",
      text1: "Error",
      text2: error.message,
      position: "top",
      visibilityTime: 5000,
    });
  }, [error, router]);
  return null;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

function formatLastUpdated(revisionDate: Date | string): string {
  const date =
    typeof revisionDate === "string" ? new Date(revisionDate) : revisionDate;
  if (Number.isNaN(date.getTime())) return "";
  const formatted = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let ago: string;
  if (diffDays >= 365) {
    const years = Math.floor(diffDays / 365);
    const days = diffDays % 365;
    const yearLabel = years === 1 ? "year" : "years";
    ago =
      days === 0
        ? `${years} ${yearLabel} ago`
        : `${years} ${yearLabel} and ${days} days ago`;
  } else {
    ago = diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  }
  return `Last updated on: ${formatted} (${ago})`;
}

function PageContent({
  data,
  routeType,
}: {
  data: RopewikiPageView;
  routeType?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [bannerAspectRatio, setBannerAspectRatio] = useState<number | null>(null);
  const [bannerImageLoading, setBannerImageLoading] = useState(true);
  const bannerUrl = data.bannerImage?.url ?? null;
  const regionNames = data.regions?.map((r) => r.name) ?? [];

  const scrollY = useSharedValue(0);
  const aspectRatioSv = useSharedValue(FALLBACK_BANNER_ASPECT_RATIO);
  const startHeightSv = useSharedValue(STARTING_HEIGHT);
  const [cardHeight, setCardHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!bannerUrl) {
      setBannerAspectRatio(null);
      setBannerImageLoading(false);
      return;
    }
    setBannerImageLoading(true);
    Image.getSize(
      bannerUrl,
      (width, height) => {
        const ratio = width / height;
        setBannerAspectRatio(ratio);
        aspectRatioSv.value = ratio;
      },
      () => setBannerAspectRatio(null)
    );
  }, [bannerUrl, aspectRatioSv]);

  const location = regionNames.join(" • ");
  const rating = data.quality ?? 0;
  const ratingCount = data.userVotes ?? 0;
  const technicalRating = data.difficulty?.technical ?? null;
  const rappelCount = data.rappelCount ?? null;
  const longestRappel = data.rappelLongest ?? null;
  const jumps = data.jumps ?? null;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const aspectRatio = bannerAspectRatio ?? FALLBACK_BANNER_ASPECT_RATIO;

  const bottomPadding = insets.bottom + 16;
  const paddingTop =
    cardHeight != null && cardHeight < SCREEN_HEIGHT / 2
      ? Math.max(0, SCREEN_HEIGHT - cardHeight - bottomPadding)
      : STARTING_HEIGHT;

  useEffect(() => {
    startHeightSv.value = paddingTop;
  }, [paddingTop, startHeightSv]);

  const bannerAnimatedStyle = useAnimatedStyle(() => {
    const height = Math.max(
      Math.round(SCREEN_WIDTH / aspectRatioSv.value),
      Math.min(BANNER_HEIGHT_MAX, startHeightSv.value - scrollY.value)
    );
    const width = height * aspectRatioSv.value;
    return {
      height,
      width,
      left: (SCREEN_WIDTH - width) / 2,
    };
  });

  return (
    <View style={styles.container}>
      {/* Parallax banner: height shrinks with scroll (Reanimated) */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.bannerWrap, bannerAnimatedStyle]}
      >
        {bannerUrl ? (
          <>
            <Image
              source={{ uri: bannerUrl }}
              style={styles.bannerImage}
              resizeMode="contain"
              onLoadStart={() => setBannerImageLoading(true)}
              onLoadEnd={() => setBannerImageLoading(false)}
            />
            {bannerImageLoading && (
              <View style={[StyleSheet.absoluteFill, styles.bannerLoadingOverlay]}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </>
        ) : (
          <View style={styles.bannerPlaceholder}>
            <FontAwesome5 name="image" size={48} color="#9ca3af" />
          </View>
        )}
      </Animated.View>

      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop,
          paddingBottom: 0,
          flexGrow: 1,
        }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        {/* Card wrapper: button floats above card, card overlaps banner */}
        <View
          style={[
            styles.cardWrapper,
            { marginTop: -CARD_BORDER_RADIUS },
          ]}
          onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
        >
          <View
            style={[
              styles.externalLinkWrap,
              { top: -64, left: 16 },
            ]}
          >
            <ExternalLinkButton
              icon={require("@/assets/images/ropewiki.png")}
              link={data.url}
              accessibilityLabel="Open on RopeWiki"
            />
          </View>
          <View style={styles.cardWrap}>
            <View
              style={[
                styles.cardInner,
                {
                  paddingTop: 20,
                  paddingBottom: insets.bottom + 16,
                },
              ]}
            >
              <Text style={styles.title}>{data.name}</Text>
            {location ? (
              <Text style={styles.regions} numberOfLines={2}>
                {location}
              </Text>
            ) : null}
            <StarRating
                rating={rating}
                count={ratingCount}
                style={styles.starRatingRow}
              />
            <RappelInfoRow
                rappelCount={rappelCount}
                longestRappel={longestRappel}
                jumps={jumps}
                technicalRating={
                  technicalRating != null ? Number(technicalRating) : null
                }
              />
            <PageBadges data={data} routeType={routeType} />
            <TimeEstimates
                overallTime={data.overallTime}
                approachTime={data.approachTime}
                descentTime={data.descentTime}
                exitTime={data.exitTime}
                shuttleTime={data.shuttleTime}
              />
            <Lengths
                overallLength={data.overallLength}
                approachLength={data.approachLength}
                descentLength={data.descentLength}
                exitLength={data.exitLength}
              />
            <ElevationGains
                approachElevGain={data.approachElevGain}
                descentElevGain={data.descentElevGain}
                exitElevGain={data.exitElevGain}
              />
            {(data.betaSections ?? [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <RopewikiPageBetaSection key={section.order} section={section} />
              ))}
            {data.latestRevisionDate != null ? (
              <Text style={styles.lastUpdated}>
                {formatLastUpdated(data.latestRevisionDate)}
              </Text>
            ) : null}
            </View>
          </View>
        </View>
      </AnimatedScrollView>

      <Pressable
        style={[styles.backButton, styles.backButtonFixed, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        accessibilityLabel="Go back"
      >
        <FontAwesome5 name="arrow-left" size={20} color="#000" />
      </Pressable>
    </View>
  );
}

export function RopewikiPageScreen({
  pageId,
  routeType,
}: RopewikiPageScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <RopeGeoHttpRequest<RopewikiPageView>
      service={Service.WEBSCRAPER}
      method={Method.GET}
      path="/ropewiki/page/:id"
      pathParams={{ id: pageId }}
    >
      {({ loading, data, errors }) => {
        if (errors != null) {
          return <ErrorEffect error={errors} />;
        }
        if (loading) {
          return (
            <View style={styles.container}>
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#666" />
              </View>
              <Pressable
                style={[styles.backButton, styles.backButtonFixed, { top: insets.top + 8 }]}
                onPress={() => router.back()}
                accessibilityLabel="Go back"
              >
                <FontAwesome5 name="arrow-left" size={20} color="#000" />
              </Pressable>
            </View>
          );
        }
        if (data == null) {
          return null;
        }
        return <PageContent data={data} routeType={routeType} />;
      }}
    </RopeGeoHttpRequest>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
  },
  scrollView: {
    flex: 1,
    zIndex: 1000,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  bannerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
    zIndex: 0,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  backButton: {
    left: 16,
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: BACK_BUTTON_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonFixed: {
    position: "absolute",
    zIndex: 1001,
  },
  externalLinkWrap: {
    position: "absolute",
  },
  /** Wrapper so external link can float above card without being clipped. */
  cardWrapper: {
    position: "relative",
  },
  cardWrap: {
    backgroundColor: "#fff",
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderTopRightRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
  },
  cardInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  regions: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 10,
  },
  starRatingRow: {
    alignSelf: "center",
  },
  lastUpdated: {
    marginTop: 24,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
  },
});
