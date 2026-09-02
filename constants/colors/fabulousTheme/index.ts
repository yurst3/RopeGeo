import type { ThemeColors } from "../types";

import { fabulousThemeBadges } from "./badges";
import { fabulousThemeButtons } from "./buttons";

export const fabulousTheme: ThemeColors = {
  background: "#4C1D95",
  cardHighlight: "#6D28D9",
  placeholder: "#5B21B6",
  separator: "#7C3AED",
  starRating: "#FACC15",
  loadingIndicator: "#FF6EC7",
  button: fabulousThemeButtons,
  badge: fabulousThemeBadges,
  text: {
    primary: "#FF6EC7",
    secondary: "#FF9AD9",
    tertiary: "#FF3DB8",
    link: "#FACC15",
    error: "#dc2626",
  },
  image: {
    textBackground: "rgba(59, 7, 100, 0.72)",
    text: "#FF6EC7",
    missingIcon: "#FF6EC7",
    missingText: "#FF9AD9",
    background: "#5B21B6",
    blurOverlay: "rgba(76, 29, 149, 0.45)",
  },
  preview: {
    page: {
      sourceIconBackground: "#ffffff",
    },
    region: {
      regionIconBackground: "#3B0764",
      regionIcon: "#FACC15",
      shadowColor: "#FACC15",
      sourceIconBackground: "#ffffff",
    },
  },
  filter: {
    checkbox: {
      uncheckedOutline: "#C084FC",
      checkedOutline: "#FACC15",
      checkedFill: "rgba(250, 204, 21, 0.28)",
    },
    radioButton: {
      uncheckedOutline: "#C084FC",
      checkedFill: "#FACC15",
    },
    switch: {
      onBackground: "#FACC15",
      offBackground: "#7C3AED",
      thumb: "#FF6EC7",
    },
    slider: {
      filledBar: "#FACC15",
      unfilledBar: "#7C3AED",
      thumb: "#EAB308",
    },
    dropdown: {
      outline: "#A855F7",
      modalBackground: "#5B21B6",
    },
    badgeSlider: {
      filledBar: "#FACC15",
      unfilledBar: "#C084FC",
      tick: "#3B0764",
    },
    disableSection: "#5B21B6",
    noteText: "#fca5a5",
    revertText: "#FACC15",
  },
  tabBar: {
    background: "#3B0764",
    iconUnfocused: "#FF9AD9",
    iconFocused: "#FACC15",
    iconHighlight: "#4ade80",
  },
  map: {
    minimap: {
      title: {
        background: "#3B0764",
        shadow: "#FACC15",
      },
      legend: {
        bodyBackground: "#4C1D95",
        headerBackground: "#3B0764",
        shadow: "#FACC15",
        collapseIcon: "#FF6EC7",
        markerIcon: "#ffffff",
      },
    },
  },
  searchBar: {
    background: "#3B0764",
    shadow: "#FACC15",
    icon: "#FF6EC7",
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
