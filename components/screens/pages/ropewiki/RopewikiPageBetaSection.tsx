import { FontAwesome5 } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";
import type {
  RopewikiBetaSectionView,
  RopewikiImageView,
} from "ropegeo-common";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING_HORIZONTAL = 20;
const CONTENT_WIDTH = SCREEN_WIDTH - CARD_PADDING_HORIZONTAL * 2;
const TEXT_MAX_HEIGHT = 150;
const IMAGE_HEIGHT = 220;
const IMAGE_INDICATOR_HEIGHT = 28;

const HTML_TAGS_STYLES = {
  a: {
    color: "#3b82f6",
    textDecorationLine: "underline" as const,
  },
  b: { fontWeight: "700" as const },
  strong: { fontWeight: "700" as const },
  i: { fontStyle: "italic" as const },
  em: { fontStyle: "italic" as const },
  caption: {
    textAlign: "center" as const,
    fontSize: 14,
    color: "#6b7280",
  },
};

export type RopewikiPageBetaSectionProps = {
  section: RopewikiBetaSectionView;
};

function BetaSectionImages({ images }: { images: RopewikiImageView[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  const onViewableItemsChanged = React.useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;
  const viewabilityConfig = React.useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  return (
    <View style={styles.imagesWrap}>
      <FlatList
        data={sortedImages}
        keyExtractor={(item) => item.url + item.order}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={styles.imageSlide}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.url }}
                style={styles.image}
                resizeMode="cover"
              />
              <Pressable
                style={styles.expandButton}
                onPress={() => {}}
                accessibilityLabel="Expand image"
              >
                <FontAwesome5 name="expand-alt" size={16} color="#374151" />
              </Pressable>
            </View>
            {item.caption ? (
              <View style={styles.captionWrap}>
                <RenderHtml
                  contentWidth={CONTENT_WIDTH}
                  source={{ html: item.caption }}
                  baseStyle={styles.caption}
                  tagsStyles={HTML_TAGS_STYLES}
                />
              </View>
            ) : null}
          </View>
        )}
      />
      {sortedImages.length > 1 && (
        <View style={styles.imageIndicator}>
          <Text style={styles.imageIndicatorText}>
            {currentIndex + 1}/{sortedImages.length}
          </Text>
        </View>
      )}
    </View>
  );
}

export function RopewikiPageBetaSection({ section }: RopewikiPageBetaSectionProps) {
  const [textExpanded, setTextExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const hasImages = section.images != null && section.images.length > 0;
  const sortedImages = hasImages
    ? [...section.images].sort((a, b) => a.order - b.order)
    : [];

  const htmlSource = { html: section.text || "" };

  const handleTextLayout = (e: { nativeEvent: { layout: { height: number } } }) => {
    if (textExpanded) return;
    const { height } = e.nativeEvent.layout;
    setShowExpandButton(height >= TEXT_MAX_HEIGHT);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{section.title}</Text>

      {section.text ? (
        <View style={styles.textBlock}>
          <View
            style={[
              styles.textContent,
              !textExpanded && styles.textContentCollapsed,
            ]}
            onLayout={handleTextLayout}
          >
            <RenderHtml
              contentWidth={CONTENT_WIDTH}
              source={htmlSource}
              baseStyle={styles.htmlBase}
              tagsStyles={HTML_TAGS_STYLES}
            />
          </View>
          {(showExpandButton || textExpanded) && (
            <Pressable
              onPress={() => setTextExpanded((e) => !e)}
              style={styles.showMoreButton}
              accessibilityLabel={textExpanded ? "Show less" : "Show more"}
            >
              <Text style={styles.showMoreText}>
                {textExpanded ? "Show less" : "Show more"}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {hasImages && sortedImages.length > 0 && (
        <BetaSectionImages images={sortedImages} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  textBlock: {
    marginBottom: 16,
  },
  textContent: {
    overflow: "hidden",
  },
  textContentCollapsed: {
    maxHeight: TEXT_MAX_HEIGHT,
  },
  htmlBase: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  showMoreButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  showMoreText: {
    fontSize: 15,
    color: "#3b82f6",
    fontWeight: "500",
  },
  imagesWrap: {
    position: "relative",
    marginLeft: -CARD_PADDING_HORIZONTAL,
    marginRight: -CARD_PADDING_HORIZONTAL,
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: CARD_PADDING_HORIZONTAL,
  },
  imageContainer: {
    width: CONTENT_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  expandButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  captionWrap: {
    marginTop: 8,
  },
  caption: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  imageIndicator: {
    position: "absolute",
    bottom: 44,
    left: 0,
    right: 0,
    height: IMAGE_INDICATOR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  imageIndicatorText: {
    fontSize: 13,
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
});
