import type { UiScaleProfile } from "../types";
import { FontSizeStep } from "../types";

/** Baseline profile; {@link autoUiScaleProfile} reuses these sizes with accessibility scaling on. */
export const mediumUiScaleProfile: UiScaleProfile = {
  global: {
    accessibilityScaling: {
      enabled: false,
    },
    defaultIconScale: 1.0,
  },
  common: {
    buttons: {
      back: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
      share: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
      save: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
      filter: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
      externalLink: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
    },
  },
  preview: {
    text: {
      starRating: {
        default: FontSizeStep.SMALL,
      },
      title: {
        default: FontSizeStep.LARGE,
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
        default: FontSizeStep.SMALL,
      },
    },
    icon: {
      sourceIcon: { scale: 1.0 },
      imageSourceIcon: { scale: 1.0 },
      regionIcon: { scale: 1.0 },
    },
    buttons: {
      download: {
        background: { scale: 1.0 },
        icon: { scale: 1.0 },
      },
    },
  },
  betaSection: {
    text: {
      title: {
        default: FontSizeStep.LARGE,
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
        default: FontSizeStep.LARGE,
      },
      statLabel: {
        default: FontSizeStep.MEDIUM,
      },
      badgeTypeLabel: {
        default: FontSizeStep.MEDIUM,
      },
      badgeLabel: {
        default: FontSizeStep.SMALL,
      },
      metaData: {
        default: FontSizeStep.SMALL,
      },
    },
    buttons: {
      download: {
        background: { scale: 1.0 },
        icon: { scale: 1.0 },
        text: {
          default: FontSizeStep.SMALL,
        },
      },
      removeDownload: {
        background: { scale: 1.0 },
        icon: { scale: 1.0 },
      },
    },
  },
  filter: {
    text: {
      title: {
        default: FontSizeStep.LARGE,
      },
      sectionTitle: {
        default: FontSizeStep.MEDIUM,
      },
      note: {
        default: FontSizeStep.SMALL,
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
      multiSliderThumb: { scale: 1.0 },
    },
    buttons: {
      checkbox: {
        selectable: { scale: 1.0 },
        icon: { scale: 1.0 },
        text: { default: FontSizeStep.MEDIUM },
      },
      radio: {
        selectable: { scale: 1.0 },
        text: {
          default: FontSizeStep.MEDIUM,
          floor: FontSizeStep.XSMALL,
        },
        subtext: { default: FontSizeStep.SMALL },
      },
      switch: {
        selectable: { scale: 1.0 },
        text: { default: FontSizeStep.MEDIUM },
      },
      revert: { text: { default: FontSizeStep.MEDIUM } },
      chip: {
        background: { scale: 1.0 },
        text: { default: FontSizeStep.MEDIUM },
      },
    },
  },
  map: {
    text: {
      title: {
        default: FontSizeStep.LARGE,
      },
      markerLabel: {
        default: FontSizeStep.SMALL,
      },
      clusterLabel: {
        default: FontSizeStep.SMALL,
      },
      markerTooltip: {
        default: FontSizeStep.SMALL,
      },
      legendTitle: {
        default: FontSizeStep.MEDIUM,
      },
      legendItem: {
        default: FontSizeStep.SMALL,
      },
      relevantInfoTitle: {
        default: FontSizeStep.MEDIUM,
      },
      relevantInfoMeasurement: {
        default: FontSizeStep.SMALL,
      },
      relevantInfoSectionTitle: {
        default: FontSizeStep.MEDIUM,
      },
      relevantInfoBody: {
        default: FontSizeStep.SMALL,
      },
      relevantInfoCaption: {
        default: FontSizeStep.XSMALL,
      },
      relevantInfoError: {
        default: FontSizeStep.SMALL,
      },
    },
    buttons: {
      searchBar: {
        background: { scale: 1.0 },
        icon: { scale: 1.0 },
        text: { default: FontSizeStep.MEDIUM },
      },
      expandMiniMap: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
      resetCameraToPosition: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
      resetCameraOrientation: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
      resetCameraToBounds: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
      appleDirections: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
      googleDirections: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
    },
  },
  tabs: {
    buttons: {
      tabBar: {
        icon: { scale: 1.0 },
        text: { default: FontSizeStep.XSMALL },
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
      action: { background: { scale: 1.0 }, icon: { scale: 1.0 } },
    },
  },
  regionScreen: {
    text: {
      title: {
        default: FontSizeStep.XLARGE,
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
        default: FontSizeStep.LARGE,
      },
      description: {
        default: FontSizeStep.MEDIUM,
      },
      badgeLabel: {
        default: FontSizeStep.SMALL,
      },
      badgeDescription: {
        default: FontSizeStep.MEDIUM,
      },
      badgeDescriptionHeader: {
        default: FontSizeStep.MEDIUM,
      },
    },
  },
  settingsScreen: {
    text: {
      unitConversion: {
        default: FontSizeStep.LARGE,
        computedFloorConstant: 20,
        floor: FontSizeStep.SMALL
      },
    },
  },
};