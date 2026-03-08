import { PageDataSource, type RegionPreview } from "ropegeo-common";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

const IMAGE_SIZE = 96;
const REGION_MAX = 3;
const REGION_ICON_SIZE = 28;
const NO_IMAGE_ICON_SIZE = 36;

function sourceIcon(source: PageDataSource): number | null {
  if (source === PageDataSource.Ropewiki) {
    return require("@/assets/images/ropewiki.png");
  }
  return null;
}

function formatCounts(pageCount: number, regionCount: number): string {
  if (regionCount === 0) {
    return `(${pageCount} ${pageCount === 1 ? "page" : "pages"})`;
  }
  const pages = `${pageCount} ${pageCount === 1 ? "page" : "pages"}`;
  const regions = `${regionCount} ${regionCount === 1 ? "region" : "regions"}`;
  return `(${pages} and ${regions})`;
}

type Props = {
  preview: RegionPreview;
};

export function SearchRegionPreview({ preview }: Props) {
  const [imageLoading, setImageLoading] = useState(!!preview.imageUrl);
  const regionLine =
    preview.parents?.length > 0
      ? preview.parents.slice(0, REGION_MAX).join(" • ")
      : "";
  const countsText = formatCounts(preview.pageCount, preview.regionCount);
  const icon = sourceIcon(preview.source);

  return (
    <View style={styles.card}>
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
        <View style={styles.regionIconOverlay}>
          <Image
            source={require("@/assets/images/region.png")}
            style={styles.regionIcon}
            resizeMode="contain"
          />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {preview.name}
        </Text>
        {regionLine ? (
          <Text style={styles.meta} numberOfLines={2}>
            {regionLine}
          </Text>
        ) : null}
        <Text style={styles.counts}>{countsText}</Text>
      </View>
      {icon != null ? (
        <Image source={icon} style={styles.sourceIcon} resizeMode="contain" />
      ) : null}
    </View>
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
  regionIconOverlay: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: REGION_ICON_SIZE,
    height: REGION_ICON_SIZE,
    borderRadius: REGION_ICON_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  regionIcon: {
    width: 18,
    height: 18,
  },
  body: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  counts: {
    fontSize: 12,
    color: "#6b7280",
  },
  sourceIcon: {
    width: 56,
    height: 32,
    marginLeft: 8,
  },
});
