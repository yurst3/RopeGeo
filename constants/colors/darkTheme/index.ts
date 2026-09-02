import type { ThemeColors } from "../types";

import { darkThemeBadges } from "./badges";
import { darkThemeButtons } from "./buttons";

export const darkTheme: ThemeColors = {
  background: "#111111",
  cardHighlight: "#333333",
  placeholder: "#262626",
  separator: "#404040",
  starRating: "#dc732b",
  loadingIndicator: "#ffffff",
  button: darkThemeButtons,
  badge: darkThemeBadges,
  text: {
    primary: "#ffffff",
    secondary: "#d1d5db",
    tertiary: "#9ca3af",
    link: "#dc732b",
    error: "#dc2626",
  },
  image: {
    textBackground: "rgba(0,0,0,0.55)",
    text: "#ffffff",
    missingIcon: "#ffffff",
    missingText: "#ffffff",
    background: "#262626",
    blurOverlay: "rgba(0,0,0,0.38)",
  },
  preview: {
    page: {
      sourceIconBackground: "#ffffff",
    },
    region: {
      regionIconBackground: "#000000",
      regionIcon: "#dc732b",
      shadowColor: "#ffffff",
      sourceIconBackground: "#ffffff",
    },
  },
  filter: {
    checkbox: {
      uncheckedOutline: "#6b7280",
      checkedOutline: "#dc732b",
      checkedFill: "rgba(220, 115, 43, 0.28)",
    },
    radioButton: {
      uncheckedOutline: "#6b7280",
      checkedFill: "#dc732b",
    },
    switch: {
      onBackground: "#dc732b",
      offBackground: "#404040",
      thumb: "#ffffff",
    },
    slider: {
      filledBar: "#dc732b",
      unfilledBar: "#404040",
      thumb: "#b85c1a",
    },
    dropdown: {
      outline: "#4b5563",
      modalBackground: "#222222",
    },
    badgeSlider: {
      filledBar: "#dc732b",
      unfilledBar: "#6b7280",
      tick: "#000000",
    },
    disableSection: "#262626",
    noteText: "#fca5a5",
    revertText: "#dc732b",
  },
  tabBar: {
    background: "#000000",
    iconUnfocused: "#ffffff",
    iconFocused: "#dc732b",
    iconHighlight: "#4ade80",
  },
  map: {
    minimap: {
      title: {
        background: "#000000",
        shadow: "#ffffff",
      },
      legend: {
        bodyBackground: "#111111",
        headerBackground: "#000000",
        shadow: "#ffffff",
        collapseIcon: "#ffffff",
        markerIcon: "#ffffff",
      },
    },
  },
  searchBar: {
    background: "#000000",
    shadow: "#ffffff",
    icon: "#ffffff",
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
