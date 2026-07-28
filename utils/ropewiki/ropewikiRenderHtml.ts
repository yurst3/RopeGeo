import type { ThemeColors } from "@/constants/colors/types";
import { EMBEDDED_FONT_POSTSCRIPT_NAMES } from "@/constants/text/font/fontAssets";
import { FontSizeStep } from "@/constants/uiScale/types";
import { RELEVANT_PHRASE_HTML_TAG } from "ropegeo-common/models";
import {
  HTMLContentModel,
  HTMLElementModel,
  type HTMLElementModelRecord,
  type CSSPropertyNameList,
  type MixedStyleRecord,
  defaultSystemFonts,
} from "react-native-render-html";
import type { TextStyle } from "react-native";

/** Inline styles from wiki HTML must not override themed typography. */
export const ROPEWIKI_HTML_IGNORED_STYLES: CSSPropertyNameList = [
  "color",
  "fontFamily",
];

/** Registered + system fonts RenderHtml may resolve via `fontFamily`. */
export const RENDER_HTML_SYSTEM_FONTS = [
  ...defaultSystemFonts,
  ...EMBEDDED_FONT_POSTSCRIPT_NAMES,
];

/** Token-driven HTML must not apply system font scaling on top of resolvers. */
export const ROPEWIKI_HTML_DEFAULT_TEXT_PROPS = {
  allowFontScaling: false,
} as const;

/**
 * Line-height / font-size ratio used by react-native-render-html list markers
 * (`14 * 1.3`). Keep body text on the same ratio so disc/circle/square markers
 * stay vertically aligned across uiScale sizes.
 */
export const ROPEWIKI_HTML_LINE_HEIGHT_RATIO = 1.3;

/** Pixel line height derived from a resolved HTML body/caption font size. */
export function deriveRopewikiHtmlLineHeight(fontSize: number): number {
  return Math.round(fontSize * ROPEWIKI_HTML_LINE_HEIGHT_RATIO);
}

/**
 * htmlparser2 lowercases tag names, so `<RelevantPhrase>` is matched as
 * `relevantphrase` in RenderHtml models / tagsStyles.
 */
export const RELEVANT_PHRASE_RENDER_TAG = RELEVANT_PHRASE_HTML_TAG.toLowerCase();

/** Legacy `<font color="…">` (common in Ropewiki beta HTML). */
function normalizeFontTagColor(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value)) {
    return `#${value}`;
  }
  return value;
}

export const ROPEWIKI_CUSTOM_HTML_ELEMENT_MODELS: HTMLElementModelRecord = {
  font: HTMLElementModel.fromCustomModel({
    tagName: "font",
    contentModel: HTMLContentModel.textual,
    getMixedUAStyles: ({ attributes }) => {
      const raw = attributes.color;
      if (typeof raw !== "string") return undefined;
      const color = normalizeFontTagColor(raw);
      return color != null ? { color } : undefined;
    },
  }),
  [RELEVANT_PHRASE_RENDER_TAG]: HTMLElementModel.fromCustomModel({
    tagName: RELEVANT_PHRASE_RENDER_TAG,
    contentModel: HTMLContentModel.textual,
  }),
};

/** Omit `fontWeight` when a custom `fontFamily` is set (breaks iOS font lookup). */
export function toRenderHtmlTypographyStyle(
  typography: TextStyle,
): Pick<TextStyle, "fontFamily" | "fontWeight" | "lineHeight" | "fontStyle"> {
  const style: Pick<TextStyle, "fontFamily" | "fontWeight" | "lineHeight" | "fontStyle"> = {
    lineHeight: typography.lineHeight,
    fontStyle: typography.fontStyle,
  };
  if (typography.fontFamily != null) {
    style.fontFamily = typography.fontFamily;
  } else if (typography.fontWeight != null) {
    style.fontWeight = typography.fontWeight;
  }
  return style;
}

function boldTagStyle(boldFontFamily?: string) {
  return boldFontFamily != null
    ? { fontFamily: boldFontFamily }
    : { fontWeight: "700" as const };
}

/** Lighter than {@link boldTagStyle} so RelevantPhrase can read as heavier emphasis. */
function secondaryEmphasisStyle(bodyFontFamily?: string) {
  return bodyFontFamily != null
    ? { fontFamily: bodyFontFamily }
    : { fontWeight: "600" as const };
}

function relevantPhraseTagStyle(color: string, boldFontFamily?: string) {
  return boldFontFamily != null
    ? { color, fontFamily: boldFontFamily }
    : { color, fontWeight: "900" as const };
}

export type RopewikiHtmlTagsStyleColors = Pick<ThemeColors["text"], "link" | "secondary"> & {
  /** Defaults to {@link ThemeColors.text.secondary}. */
  captionColor?: string;
  /**
   * Resolved via {@link useResolvedConstantTextSize} on `uiScale.betaSection.text.caption`.
   * Defaults to {@link FontSizeStep.MEDIUM} when omitted.
   */
  captionFontSize?: number;
  /** Defaults to `center` (expanded image overlay). */
  captionTextAlign?: "left" | "center" | "right";
  /** Resolved body copy size; normalizes block/heading tags to the body token. */
  bodyFontSize?: number;
  /**
   * Derived via {@link deriveRopewikiHtmlLineHeight} from `bodyFontSize`.
   * Applied to block tags so list markers share the same line box as content.
   */
  bodyLineHeight?: number;
  /** Body face for block tags when using embedded fonts. */
  bodyFontFamily?: string;
  /** Bold face for `b`/`strong`/headings when using embedded fonts. */
  bodyBoldFontFamily?: string;
  /**
   * When set, styles `<RelevantPhrase>` with this color and a heavier weight than
   * `b`/`strong` (which are softened so the phrase stands out).
   */
  relevantPhraseColor?: string;
};

export function buildRopewikiHtmlTagsStyles({
  link,
  secondary,
  captionColor,
  captionFontSize = FontSizeStep.MEDIUM,
  captionTextAlign = "center",
  bodyFontSize,
  bodyLineHeight,
  bodyFontFamily,
  bodyBoldFontFamily,
  relevantPhraseColor,
}: RopewikiHtmlTagsStyleColors): MixedStyleRecord {
  const boldStyle = boldTagStyle(bodyBoldFontFamily);
  const emphasisStyle =
    relevantPhraseColor != null
      ? secondaryEmphasisStyle(bodyFontFamily)
      : boldStyle;
  const headingStyle =
    bodyFontSize != null
      ? {
          fontSize: bodyFontSize,
          ...(bodyLineHeight != null ? { lineHeight: bodyLineHeight } : {}),
          ...boldStyle,
        }
      : boldStyle;
  const bodyTagStyle =
    bodyFontSize != null || bodyFontFamily != null || bodyLineHeight != null
      ? {
          ...(bodyFontSize != null ? { fontSize: bodyFontSize } : {}),
          ...(bodyLineHeight != null ? { lineHeight: bodyLineHeight } : {}),
          ...(bodyFontFamily != null ? { fontFamily: bodyFontFamily } : {}),
        }
      : null;

  return {
    a: {
      color: link,
      textDecorationLine: "underline" as const,
      ...(bodyFontFamily != null ? { fontFamily: bodyFontFamily } : {}),
    },
    b: emphasisStyle,
    strong: emphasisStyle,
    i: { fontStyle: "italic" as const },
    em: { fontStyle: "italic" as const },
    ...(relevantPhraseColor != null
      ? {
          [RELEVANT_PHRASE_RENDER_TAG]: relevantPhraseTagStyle(
            relevantPhraseColor,
            bodyBoldFontFamily,
          ),
        }
      : {}),
    ...(bodyTagStyle != null
      ? {
          p: bodyTagStyle,
          div: bodyTagStyle,
          li: bodyTagStyle,
          ul: bodyTagStyle,
          ol: bodyTagStyle,
          span: bodyTagStyle,
          h1: headingStyle,
          h2: headingStyle,
          h3: headingStyle,
          h4: headingStyle,
          h5: headingStyle,
          h6: headingStyle,
        }
      : {}),
    caption: {
      textAlign: captionTextAlign,
      fontSize: captionFontSize,
      color: captionColor ?? secondary,
      ...(bodyFontFamily != null ? { fontFamily: bodyFontFamily } : {}),
    },
  } as MixedStyleRecord;
}
