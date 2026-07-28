import type { UiScaleProfile } from "../types";
import { FontSizeStep } from "../types";

/** Fixed sizes below medium; accessibility scaling disabled. */
export const smallUiScaleProfile: UiScaleProfile = {
  global: {
    accessibilityScaling: {
      enabled: false,
    },
    defaultIconScale: 0.8,
  },
  common: {
    buttons: {
      back: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
      share: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
      save: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
      filter: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
      externalLink: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
    },
  },
  preview: {
    text: {
      starRating: {
        default: FontSizeStep.SMALL,
      },
      title: {
        default: FontSizeStep.MEDIUM,
      },
      akaNames: {
        default: FontSizeStep.SMALL,
      },
      locationHierarchy: {
        default: FontSizeStep.SMALL,
      },
      other: {
        default: FontSizeStep.SMALL,
      },
      download: {
        default: FontSizeStep.XSMALL,
      },
    },
    icon: {
      sourceIcon: { scale: 0.8 },
      imageSourceIcon: { scale: 0.8 },
      regionIcon: { scale: 0.8 },
    },
    buttons: {
      download: {
        background: { scale: 0.8 },
        icon: { scale: 0.8 },
      },
    },
  },
  betaSection: {
    text: {
      title: {
        default: FontSizeStep.MEDIUM,
      },
      body: {
        default: FontSizeStep.MEDIUM,
      },
      caption: {
        default: FontSizeStep.MEDIUM,
      },
    },
    buttons: {
      showMore: {
        text: { default: FontSizeStep.MEDIUM },
      },
    },
  },
  pageScreen: {
    text: {
      title: {
        default: FontSizeStep.LARGE,
      },
      akaNames: {
        default: FontSizeStep.MEDIUM,
      },
      locationHierarchy: {
        default: FontSizeStep.MEDIUM,
      },
      starRating: {
        default: FontSizeStep.SMALL,
      },
      stat: {
        default: FontSizeStep.MEDIUM,
      },
      statLabel: {
        default: FontSizeStep.SMALL,
      },
      badgeTypeLabel: {
        default: FontSizeStep.SMALL,
      },
      badgeLabel: {
        default: FontSizeStep.XSMALL,
      },
      metaData: {
        default: FontSizeStep.SMALL,
      },
    },
    buttons: {
      download: {
        background: { scale: 0.8 },
        icon: { scale: 0.8 },
        text: {
          default: FontSizeStep.XSMALL,
        },
      },
      removeDownload: {
        background: { scale: 0.8 },
        icon: { scale: 0.8 },
      },
    },
  },
  filter: {
    text: {
      title: {
        default: FontSizeStep.MEDIUM,
      },
      sectionTitle: {
        default: FontSizeStep.SMALL,
      },
      note: {
        default: FontSizeStep.XSMALL,
      },
      multiSliderThumbLabel: {
        default: FontSizeStep.XSMALL,
        floor: FontSizeStep.XSMALL,
      },
      multiSliderTickLabel: {
        default: FontSizeStep.XSMALL,
        floor: FontSizeStep.XSMALL,
      },
    },
    icon: {
      multiSliderThumb: { scale: 0.8 },
    },
    buttons: {
      checkbox: {
        selectable: { scale: 0.8 },
        icon: { scale: 0.8 },
        text: { default: FontSizeStep.SMALL },
      },
      radio: {
        selectable: { scale: 0.8 },
        text: {
          default: FontSizeStep.SMALL,
          floor: FontSizeStep.XSMALL,
        },
        subtext: { default: FontSizeStep.XSMALL },
      },
      switch: {
        selectable: { scale: 0.8 },
        text: { default: FontSizeStep.SMALL },
      },
      revert: { text: { default: FontSizeStep.SMALL } },
      chip: {
        background: { scale: 0.8 },
        text: { default: FontSizeStep.SMALL },
      },
    },
  },
  map: {
    text: {
      title: {
        default: FontSizeStep.MEDIUM,
      },
      markerLabel: {
        default: FontSizeStep.XSMALL,
      },
      clusterLabel: {
        default: FontSizeStep.XSMALL,
      },
      markerTooltip: {
        default: FontSizeStep.XSMALL,
      },
      legendTitle: {
        default: FontSizeStep.SMALL,
      },
      legendItem: {
        default: FontSizeStep.XSMALL,
      },
      relevantInfoTitle: {
        default: FontSizeStep.SMALL,
      },
      relevantInfoMeasurement: {
        default: FontSizeStep.XSMALL,
      },
      relevantInfoSectionTitle: {
        default: FontSizeStep.SMALL,
      },
      relevantInfoBody: {
        default: FontSizeStep.XSMALL,
      },
      relevantInfoCaption: {
        default: FontSizeStep.XSMALL,
      },
      relevantInfoError: {
        default: FontSizeStep.XSMALL,
      },
    },
    buttons: {
      searchBar: {
        background: { scale: 0.8 },
        icon: { scale: 0.8 },
        text: { default: FontSizeStep.SMALL },
      },
      expandMiniMap: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
      resetCameraToPosition: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
      resetCameraOrientation: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
      resetCameraToBounds: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
      appleDirections: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
      googleDirections: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
      relevantInfoStrengthLabel: {
        icon: { scale: 0.8 },
        text: { default: FontSizeStep.XSMALL },
      },
      relevantInfoHiddenPill: {
        icon: { scale: 0.8 },
        text: { default: FontSizeStep.XSMALL },
      },
      measurementContextPill: {
        icon: { scale: 0.8 },
        text: { default: FontSizeStep.XSMALL },
      },
    },
  },
  tabs: {
    buttons: {
      tabBar: {
        icon: { scale: 0.8 },
        text: { default: FontSizeStep.XSMALL },
      },
    },
  },
  toast: {
    text: {
      message: {
        default: FontSizeStep.SMALL,
      },
      subtitle: {
        default: FontSizeStep.SMALL,
      },
    },
    buttons: {
      action: { background: { scale: 0.8 }, icon: { scale: 0.8 } },
    },
  },
  regionScreen: {
    text: {
      title: {
        default: FontSizeStep.LARGE,
      },
      locationHierarchy: {
        default: FontSizeStep.MEDIUM,
      },
      previewCount: {
        default: FontSizeStep.MEDIUM,
      },
    },
  },
  infoScreen: {
    text: {
      title: {
        default: FontSizeStep.MEDIUM,
      },
      description: {
        default: FontSizeStep.SMALL,
      },
      badgeLabel: {
        default: FontSizeStep.XSMALL,
      },
      badgeDescription: {
        default: FontSizeStep.SMALL,
      },
      badgeDescriptionHeader: {
        default: FontSizeStep.SMALL,
      },
    },
  },
  settingsScreen: {
    text: {
      unitConversion: {
        default: FontSizeStep.MEDIUM,
        computedFloorConstant: 20,
        floor: FontSizeStep.SMALL
      },
    },
  },
};