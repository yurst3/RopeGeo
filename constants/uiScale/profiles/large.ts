import type { UiScaleProfile } from "../types";
import { FontSizeStep } from "../types";

/** Fixed sizes above medium; accessibility scaling disabled. */
export const largeUiScaleProfile: UiScaleProfile = {
  global: {
    accessibilityScaling: {
      enabled: false,
    },
    defaultIconScale: 1.5,
  },
  common: {
    buttons: {
      back: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
      share: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
      save: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
      filter: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
      externalLink: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
    },
  },
  preview: {
    text: {
      starRating: {
        default: FontSizeStep.MEDIUM,
      },
      title: {
        default: FontSizeStep.LARGE,
        ceiling: FontSizeStep.XLARGE,
      },
      akaNames: {
        default: FontSizeStep.MEDIUM,
      },
      locationHierarchy: {
        default: FontSizeStep.MEDIUM,
      },
      other: {
        default: FontSizeStep.MEDIUM,
      },
      download: {
        default: FontSizeStep.MEDIUM,
      },
    },
    icon: {
      sourceIcon: { scale: 1.2 },
      imageSourceIcon: { scale: 1.2 },
      regionIcon: { scale: 1.2 },
    },
    buttons: {
      download: {
        background: { scale: 1.2 },
        icon: { scale: 1.2 },
      },
    },
  },
  betaSection: {
    text: {
      title: {
        default: FontSizeStep.XLARGE,
        ceiling: FontSizeStep.XLARGE,
      },
      body: {
        default: FontSizeStep.LARGE,
      },
      caption: {
        default: FontSizeStep.LARGE,
      },
    },
    buttons: {
      showMore: {
        text: { default: FontSizeStep.LARGE },
      },
    },
  },
  pageScreen: {
    text: {
      title: {
        default: FontSizeStep.XLARGE,
        ceiling: FontSizeStep.XLARGE,
      },
      akaNames: {
        default: FontSizeStep.LARGE,
      },
      locationHierarchy: {
        default: FontSizeStep.LARGE,
      },
      starRating: {
        default: FontSizeStep.MEDIUM,
      },
      stat: {
        default: FontSizeStep.XLARGE,
      },
      statLabel: {
        default: FontSizeStep.MEDIUM,
      },
      badgeTypeLabel: {
        default: FontSizeStep.MEDIUM,
      },
      badgeLabel: {
        default: FontSizeStep.MEDIUM,
      },
      metaData: {
        default: FontSizeStep.MEDIUM,
      },
    },
    buttons: {
      download: {
        background: { scale: 1.2 },
        icon: { scale: 1.2 },
        text: {
          default: FontSizeStep.MEDIUM,
        },
      },
      removeDownload: {
        background: { scale: 1.2 },
        icon: { scale: 1.2 },
      },
    },
  },
  filter: {
    text: {
      title: {
        default: FontSizeStep.XLARGE,
        ceiling: FontSizeStep.XLARGE,
      },
      sectionTitle: {
        default: FontSizeStep.LARGE,
      },
      note: {
        default: FontSizeStep.SMALL,
      },
      multiSliderThumbLabel: {
        default: FontSizeStep.MEDIUM,
        floor: FontSizeStep.XSMALL,
      },
      multiSliderTickLabel: {
        default: FontSizeStep.SMALL,
        floor: FontSizeStep.XSMALL,
      },
    },
    icon: {
      multiSliderThumb: { scale: 1.2 },
    },
    buttons: {
      checkbox: {
        selectable: { scale: 1.2 },
        icon: { scale: 1.2 },
        text: { default: FontSizeStep.MEDIUM },
      },
      radio: {
        selectable: { scale: 1.2 },
        text: {
          default: FontSizeStep.MEDIUM,
          floor: FontSizeStep.XSMALL,
        },
        subtext: { default: FontSizeStep.SMALL },
      },
      switch: {
        selectable: { scale: 1.2 },
        text: { default: FontSizeStep.MEDIUM },
      },
      revert: { text: { default: FontSizeStep.MEDIUM } },
      chip: {
        background: { scale: 1.2 },
        text: { default: FontSizeStep.MEDIUM },
      },
    },
  },
  map: {
    text: {
      title: {
        default: FontSizeStep.XLARGE,
        ceiling: FontSizeStep.XLARGE,
      },
      markerLabel: {
        default: FontSizeStep.MEDIUM,
      },
      clusterLabel: {
        default: FontSizeStep.MEDIUM,
      },
      markerTooltip: {
        default: FontSizeStep.SMALL,
      },
      legendTitle: {
        default: FontSizeStep.LARGE,
      },
      legendItem: {
        default: FontSizeStep.MEDIUM,
      },
      relevantInfoTitle: {
        default: FontSizeStep.LARGE,
      },
      relevantInfoMeasurement: {
        default: FontSizeStep.SMALL,
      },
      relevantInfoSectionTitle: {
        default: FontSizeStep.LARGE,
      },
      relevantInfoBody: {
        default: FontSizeStep.MEDIUM,
      },
      relevantInfoCaption: {
        default: FontSizeStep.SMALL,
      },
      relevantInfoError: {
        default: FontSizeStep.SMALL,
      },
    },
    buttons: {
      searchBar: {
        background: { scale: 1.2 },
        icon: { scale: 1.2 },
        text: { default: FontSizeStep.LARGE, ceiling: FontSizeStep.LARGE },
      },
      expandMiniMap: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
      resetCameraToPosition: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
      resetCameraOrientation: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
      resetCameraToBounds: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
      appleDirections: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
      googleDirections: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
      relevantInfoStrengthLabel: {
        icon: { scale: 1.2 },
        text: { default: FontSizeStep.SMALL },
      },
      relevantInfoHiddenPill: {
        icon: { scale: 1.2 },
        text: { default: FontSizeStep.SMALL },
      },
      measurementContextPill: {
        icon: { scale: 1.2 },
        text: { default: FontSizeStep.MEDIUM },
      },
    },
  },
  tabs: {
    buttons: {
      tabBar: {
        icon: { scale: 1.2 },
        text: { default: FontSizeStep.SMALL },
      },
    },
  },
  toast: {
    text: {
      message: {
        default: FontSizeStep.MEDIUM,
      },
      subtitle: {
        default: FontSizeStep.MEDIUM,
      },
    },
    buttons: {
      action: { background: { scale: 1.2 }, icon: { scale: 1.2 } },
    },
  },
  regionScreen: {
    text: {
      title: {
        default: FontSizeStep.XLARGE,
        ceiling: FontSizeStep.XLARGE,
      },
      locationHierarchy: {
        default: FontSizeStep.LARGE,
      },
      previewCount: {
        default: FontSizeStep.LARGE,
      },
    },
  },
  infoScreen: {
    text: {
      title: {
        default: FontSizeStep.XLARGE,
        ceiling: FontSizeStep.XLARGE,
      },
      description: {
        default: FontSizeStep.LARGE,
      },
      badgeLabel: {
        default: FontSizeStep.MEDIUM,
      },
      badgeDescription: {
        default: FontSizeStep.LARGE,
      },
      badgeDescriptionHeader: {
        default: FontSizeStep.MEDIUM,
      },
    },
  },
  settingsScreen: {
    text: {
      unitConversion: {
        default: FontSizeStep.XLARGE,
        computedFloorConstant: 20,
        floor: FontSizeStep.SMALL
      },
    },
  },
};