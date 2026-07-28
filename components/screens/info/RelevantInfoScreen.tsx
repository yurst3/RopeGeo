import { DefinitelyRelevantBadge } from "@/components/badges/relevance/DefinitelyRelevantBadge";
import { MaybeRelevantBadge } from "@/components/badges/relevance/MaybeRelevantBadge";
import { SomewhatRelevantBadge } from "@/components/badges/relevance/SomewhatRelevantBadge";
import { InfoScreenLayout } from "@/components/screens/info/InfoScreenLayout";
import {
  InfoScreenBody,
  InfoScreenSubtitle,
} from "@/components/screens/info/InfoScreenText";
import {
  ROPEGEO_DISCORD_LINK_LABEL,
  ROPEGEO_DISCORD_URL,
} from "@/constants/ropegeoDiscord";
import { useInfoScreenStyles } from "@/utils/info/infoScreenTheme";
import {
  RELEVANCE_STRENGTHS,
  type RelevanceStrength,
} from "ropegeo-common/models";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const DISCORD_ICON = require("@/assets/images/icons/discord.jpg");
const DISCORD_ICON_SIZE = 48;

const RELEVANCE_BADGES: Record<
  RelevanceStrength,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  "Maybe Relevant": MaybeRelevantBadge,
  "Somewhat Relevant": SomewhatRelevantBadge,
  "Definitely Relevant": DefinitelyRelevantBadge,
};

const RELEVANCE_DESCRIPTIONS: Record<RelevanceStrength, { body: string }> = {
  "Maybe Relevant": {
    body:
      "The text or image might refer to this map feature, but the connection is uncertain. " +
      "The feature could be mentioned in passing, implied, or confusable with a nearby feature. " +
      "Treat this as a soft hint and confirm against the full beta before relying on it.",
  },
  "Somewhat Relevant": {
    body:
      "The text or image likely relates to this map feature, but the link is partial or indirect. " +
      "It may describe the surrounding area, share context with nearby features, or stop short of " +
      "naming this feature clearly. Useful for orientation, but not definitive on its own.",
  },
  "Definitely Relevant": {
    body:
      "The text or image clearly refers to this map feature. The relevant phrase or caption " +
      "identifies it directly enough that you can trust the connection when planning or navigating.",
  },
};

export type RelevantInfoScreenProps = {
  highlightedRelevance?: RelevanceStrength | null;
};

export function RelevantInfoScreen({
  highlightedRelevance,
}: RelevantInfoScreenProps) {
  const styles = useInfoScreenStyles();

  const openDiscord = useCallback(async () => {
    try {
      await WebBrowser.openBrowserAsync(ROPEGEO_DISCORD_URL);
    } catch {
      // Ignore cancel / open failures
    }
  }, []);

  return (
    <InfoScreenLayout title="Relevant Info">
      <InfoScreenSubtitle style={styles.subtitle}>
        Relevant Info is gathered from existing beta text, measurements,
        and images that relate to the selected map feature. Each item includes a relevance
        strength that shows how clearly it is tied to that feature:
      </InfoScreenSubtitle>
      {[...RELEVANCE_STRENGTHS].reverse().map((strength) => {
        const BadgeComponent = RELEVANCE_BADGES[strength];
        const { body } = RELEVANCE_DESCRIPTIONS[strength];
        const isHighlighted = highlightedRelevance === strength;

        return (
          <View
            key={strength}
            style={[styles.row, isHighlighted && styles.rowHighlighted]}
          >
            <View style={styles.badgeWrap}>
              <BadgeComponent showLabel />
            </View>
            <View style={styles.descriptionWrap}>
              <InfoScreenBody>{body}</InfoScreenBody>
            </View>
          </View>
        );
      })}
      <View style={localStyles.disclaimer}>
        <InfoScreenBody>
          Relevant Info uses AI to decide which existing beta text, measurements, and
          images relate to a map feature. No new information is
          generated, and existing content is not rewritten or paraphrased. The AI model
          is not perfect at judging what is relevant or how relevant it is. If
          something looks wrong, please share feedback in the RopeGeo Discord:
        </InfoScreenBody>
        <Pressable
          onPress={openDiscord}
          accessibilityRole="link"
          accessibilityLabel={`Open ${ROPEGEO_DISCORD_LINK_LABEL}`}
          style={({ pressed }) => [
            localStyles.discordButton,
            pressed && localStyles.discordPressed,
          ]}
        >
          <Image
            source={DISCORD_ICON}
            style={localStyles.discordIcon}
            contentFit="cover"
          />
        </Pressable>
      </View>
    </InfoScreenLayout>
  );
}

const localStyles = StyleSheet.create({
  disclaimer: {
    marginTop: 8,
    gap: 16,
  },
  discordButton: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  discordPressed: {
    opacity: 0.75,
  },
  discordIcon: {
    width: DISCORD_ICON_SIZE,
    height: DISCORD_ICON_SIZE,
    borderRadius: DISCORD_ICON_SIZE / 2,
  },
});
