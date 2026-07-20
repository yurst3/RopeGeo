import type { UiScaleProfile } from "../types";
import { FontSizeStep } from "../types";

/** Same token sizes as {@link mediumUiScaleProfile}; system accessibility scaling enabled. */
export const autoUiScaleProfile: UiScaleProfile = {
  global: {
    accessibilityScaling: {
      enabled: true,
      min: 0.8,
      max: 2.0,
    },
  },
  common: {
    buttons: {
      back: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
      },
      share: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
      },
      save: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
      },
      filter: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.3 },
      },
      externalLink: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.2 },
      },
    },
  },
  preview: {
    text: {
      starRating: {
        default: FontSizeStep.SMALL,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 10,
      },
      title: {
        default: FontSizeStep.LARGE,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 12,
      },
      akaNames: {
        default: FontSizeStep.SMALL,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 9,
      },
      locationHierarchy: {
        default: FontSizeStep.SMALL,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 8,
      },
      other: {
        default: FontSizeStep.SMALL,
        accessibilityScaling: { enabled: true, min: 0.8, max: 1.5 },
      },
      download: {
        default: FontSizeStep.SMALL,
        accessibilityScaling: { enabled: true, min: 0.8, max: 1.5 },
        floor: FontSizeStep.SMALL,
      },
    },
    icon: {
      sourceIcon: { scale: 1.0, accessibilityScalingStrength: 0.5 },
      imageSourceIcon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
      regionIcon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
    },
    buttons: {
      download: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
      },
    },
  },
  betaSection: {
    text: {
      title: {
        default: FontSizeStep.LARGE,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 20,
      },
      body: {
        default: FontSizeStep.MEDIUM,
        accessibilityScaling: { max: 1.5 },
        floor: FontSizeStep.SMALL,
      },
      caption: {
        default: FontSizeStep.MEDIUM,
        floor: FontSizeStep.SMALL,
      },
    },
    buttons: {
      showMore: {
        text: {
          default: FontSizeStep.MEDIUM,
          floor: FontSizeStep.SMALL,
        },
      },
    },
  },
  pageScreen: {
    text: {
      title: {
        default: FontSizeStep.LARGE,
        floor: FontSizeStep.LARGE,
      },
      akaNames: {
        default: FontSizeStep.MEDIUM,
        floor: FontSizeStep.SMALL,
      },
      locationHierarchy: {
        default: FontSizeStep.MEDIUM,
        floor: FontSizeStep.SMALL,
      },
      starRating: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
      stat: {
        default: FontSizeStep.LARGE,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 17,
      },
      statLabel: {
        default: FontSizeStep.MEDIUM,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 11,
      },
      badgeTypeLabel: {
        default: FontSizeStep.MEDIUM,
        accessibilityScaling: { enabled: true, min: 0.5, max: 1.2 },
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 10,
      },
      badgeLabel: {
        default: FontSizeStep.SMALL,
        accessibilityScaling: { enabled: true, min: 0.8, max: 1.2 },
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 8,
      },
      metaData: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
    },
    buttons: {
      download: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        text: {
          default: FontSizeStep.SMALL,
          accessibilityScaling: { enabled: true, min: 0.8, max: 1.5 },
          floor: FontSizeStep.SMALL,
        },
      },
      removeDownload: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
      },
    },
  },
  filter: {
    text: {
      title: {
        default: FontSizeStep.LARGE,
        floor: FontSizeStep.MEDIUM,
      },
      sectionTitle: {
        default: FontSizeStep.MEDIUM,
        floor: FontSizeStep.SMALL,
      },
      note: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
      multiSliderThumbLabel: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
      multiSliderTickLabel: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
    },
    icon: {
      multiSliderThumb: { scale: 1.0, accessibilityScalingStrength: 0.15 },
    },
    buttons: {
      checkbox: {
        selectable: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        text: {
          default: FontSizeStep.MEDIUM,
          computeFloorFromAccessibilityScaling: true,
          computedFloorConstant: 11,
        },
      },
      radio: {
        selectable: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        text: {
          default: FontSizeStep.MEDIUM,
          floor: FontSizeStep.XSMALL,
        },
        subtext: {
          default: FontSizeStep.SMALL,
          computeFloorFromAccessibilityScaling: true,
          computedFloorConstant: 9,
        },
      },
      switch: {
        selectable: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        text: {
          default: FontSizeStep.MEDIUM,
          computeFloorFromAccessibilityScaling: true,
          computedFloorConstant: 11,
        },
      },
      revert: {
        text: { default: FontSizeStep.MEDIUM, floor: FontSizeStep.SMALL },
      },
      chip: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        text: { default: FontSizeStep.MEDIUM },
      },
    },
  },
  map: {
    text: {
      title: {
        default: FontSizeStep.LARGE,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 12,
      },
      markerLabel: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
      clusterLabel: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
      markerTooltip: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
      legendTitle: {
        default: FontSizeStep.MEDIUM,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 11,
      },
      legendItem: {
        default: FontSizeStep.SMALL,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 11,
      },
      relevantInfoTitle: {
        default: FontSizeStep.MEDIUM,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 11,
      },
      relevantInfoMeasurement: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
      relevantInfoSectionTitle: {
        default: FontSizeStep.MEDIUM,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 11,
      },
      relevantInfoBody: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
      relevantInfoCaption: {
        default: FontSizeStep.XSMALL,
        floor: FontSizeStep.XSMALL,
      },
      relevantInfoError: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
    },
    buttons: {
      searchBar: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        text: { default: FontSizeStep.MEDIUM, floor: FontSizeStep.MEDIUM },
      },
      expandMiniMap: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.2 },
      },
      resetCameraToPosition: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
      },
      resetCameraOrientation: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
      },
      resetCameraToBounds: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.2 },
      },
      appleDirections: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
      },
      googleDirections: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
      },
    },
  },
  tabs: {
    buttons: {
      tabBar: {
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        text: { default: FontSizeStep.XSMALL, floor: FontSizeStep.XSMALL },
      },
    },
  },
  toast: {
    text: {
      message: {
        default: FontSizeStep.MEDIUM,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 11,
      },
      subtitle: {
        default: FontSizeStep.MEDIUM,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 11,
      },
    },
    buttons: {
      action: {
        background: { scale: 1.0, accessibilityScalingStrength: 0.4 },
        icon: { scale: 1.0, accessibilityScalingStrength: 0.4 },
      },
    },
  },
  regionScreen: {
    text: {
      title: {
        default: FontSizeStep.XLARGE,
        floor: FontSizeStep.LARGE,
      },
      locationHierarchy: {
        default: FontSizeStep.LARGE,
        floor: FontSizeStep.MEDIUM,
      },
      previewCount: {
        default: FontSizeStep.LARGE,
        floor: FontSizeStep.MEDIUM,
      },
    },
  },
  infoScreen: {
    text: {
      title: {
        default: FontSizeStep.LARGE,
        floor: FontSizeStep.MEDIUM,
      },
      description: {
        default: FontSizeStep.MEDIUM,
        floor: FontSizeStep.SMALL,
      },
      badgeLabel: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
      badgeDescription: {
        default: FontSizeStep.MEDIUM,
        floor: FontSizeStep.SMALL,
      },
      badgeDescriptionHeader: {
        default: FontSizeStep.MEDIUM,
        floor: FontSizeStep.SMALL,
      },
    },
  },
  settingsScreen: {
    text: {
      unitConversion: {
        default: FontSizeStep.LARGE,
        computeFloorFromAccessibilityScaling: true,
        computedFloorConstant: 17,
      },
    },
  },
};