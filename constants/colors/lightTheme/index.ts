import type { ThemeColors } from "../types";

import { lightThemeBadges } from "./badges";
import { lightThemeButtons } from "./buttons";

export const lightTheme: ThemeColors = {
  background: "#ffffff",
  cardHighlight: "#d1d5db",
  placeholder: "#d1d5db",
  separator: "#e5e7eb",
  starRating: "#dc732b",
  loadingIndicator: "#000000",
  button: lightThemeButtons,
  badge: lightThemeBadges,
  text: {
    primary: "#000000",
    secondary: "#4b5563",
    tertiary: "#9ca3af",
    link: "#dc732b",
    error: "#dc2626",
  },
  image: {
    textBackground: "rgba(255,255,255,0.75)",
    text: "#000000",
    missingIcon: "#000000",
    missingText: "#000000",
    background: "#d1d5db",
    blurOverlay: "rgba(255,255,255,0.38)",
  },
  preview: {
    page: {
      sourceIconBackground: "#ffffff",
    },
    region: {
      regionIconBackground: "#ffffff",
      regionIcon: "#dc732b",
      shadowColor: "#000000",
      sourceIconBackground: "#ffffff",
    },
  },
  filter: {
    checkbox: {
      uncheckedOutline: "#9ca3af",
      checkedOutline: "#dc732b",
      checkedFill: "rgba(220, 115, 43, 0.28)",
    },
    radioButton: {
      uncheckedOutline: "#9ca3af",
      checkedFill: "#dc732b",
    },
    switch: {
      onBackground: "#dc732b",
      offBackground: "#e5e7eb",
      thumb: "#ffffff",
    },
    slider: {
      filledBar: "#dc732b",
      unfilledBar: "#e5e7eb",
      thumb: "#b85c1a",
    },
    dropdown: {
      outline: "#d1d5db",
      modalBackground: "#ffffff",
    },
    badgeSlider: {
      filledBar: "#dc732b",
      unfilledBar: "#e5e7eb",
      tick: "#6b7280",
    },
    disableSection: "#e5e7eb",
    noteText: "#dc2626",
    revertText: "#dc732b",
  },
  tabBar: {
    background: "#ffffff",
    iconUnfocused: "#9ca3af",
    iconFocused: "#dc732b",
    iconHighlight: "#4ade80",
  },
  map: {
    minimap: {
      title: {
        background: "#ffffff",
        shadow: "#000000",
      },
      legend: {
        bodyBackground: "#ffffff",
        headerBackground: "#ffffff",
        shadow: "#000000",
        collapseIcon: "#000000",
        markerIcon: "#000000",
      },
    },
  },
  searchBar: {
    background: "#ffffff",
    shadow: "#000000",
    icon: "#000000",
  },
  toast: {
    success: {
      background: "rgba(0, 90, 55, 0.88)",
      text: "#86efac",
      filledTrack: "#86efac",
      unfilledTrack: "rgba(255,255,255,0.25)",
      icon: "#86efac",
    },
    warning: {
      background: "rgba(55, 48, 0, 0.9)",
      text: "#fde047",
      filledTrack: "#fde047",
      unfilledTrack: "rgba(255,255,255,0.25)",
      icon: "#fde047",
    },
    error: {
      background: "rgba(80, 0, 0, 0.88)",
      text: "#fca5a5",
      filledTrack: "#fca5a5",
      unfilledTrack: "rgba(255,255,255,0.25)",
      icon: "#fca5a5",
    },
    info: {
      background: "rgba(30, 41, 59, 0.9)",
      text: "#e2e8f0",
      filledTrack: "#e2e8f0",
      unfilledTrack: "rgba(255,255,255,0.25)",
      icon: "#e2e8f0",
    },
  },
};
