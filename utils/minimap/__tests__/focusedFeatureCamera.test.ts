import {
  FOCUS_PADDING_GAP,
  MIN_FOCUS_VIEWPORT_HEIGHT,
  POINT_FOCUS_ANIMATION_MS,
  POINT_FOCUS_MIN_ZOOM,
  focusCameraPadding,
  pointFocusCameraStop,
} from "../focusedFeatureCamera";

const FALLBACK = {
  paddingTop: 40,
  paddingBottom: 60,
  paddingLeft: 24,
  paddingRight: 24,
};

describe("focusCameraPadding", () => {
  it("frames between the measured header bottom and overlay top", () => {
    const padding = focusCameraPadding({
      headerBottomY: 100,
      overlayTopY: 600,
      windowHeight: 800,
      fallback: FALLBACK,
    });
    expect(padding).toEqual({
      paddingTop: 100 + FOCUS_PADDING_GAP,
      paddingBottom: 800 - 600 + FOCUS_PADDING_GAP,
      paddingLeft: FALLBACK.paddingLeft,
      paddingRight: FALLBACK.paddingRight,
    });
  });

  it("centers a feature halfway between header and overlay row", () => {
    const windowHeight = 800;
    const headerBottomY = 120;
    const overlayTopY = 560;
    const padding = focusCameraPadding({
      headerBottomY,
      overlayTopY,
      windowHeight,
      fallback: FALLBACK,
    });
    const viewportCenter =
      padding.paddingTop + (windowHeight - padding.paddingTop - padding.paddingBottom) / 2;
    expect(viewportCenter).toBe((headerBottomY + overlayTopY) / 2);
  });

  it("falls back when header or overlay measurements are missing", () => {
    expect(
      focusCameraPadding({
        headerBottomY: null,
        overlayTopY: 600,
        windowHeight: 800,
        fallback: FALLBACK,
      }),
    ).toBe(FALLBACK);
    expect(
      focusCameraPadding({
        headerBottomY: 100,
        overlayTopY: null,
        windowHeight: 800,
        fallback: FALLBACK,
      }),
    ).toBe(FALLBACK);
  });

  it("falls back when the remaining viewport would be too small", () => {
    const padding = focusCameraPadding({
      headerBottomY: 300,
      overlayTopY: 380,
      windowHeight: 800,
      fallback: FALLBACK,
    });
    expect(380 - 300).toBeLessThan(MIN_FOCUS_VIEWPORT_HEIGHT);
    expect(padding).toBe(FALLBACK);
  });
});

describe("pointFocusCameraStop", () => {
  it("keeps the current zoom when already above the minimum", () => {
    const stop = pointFocusCameraStop([-113.5, 37.1], 16.2, FALLBACK);
    expect(stop).toEqual({
      centerCoordinate: [-113.5, 37.1],
      zoomLevel: 16.2,
      padding: FALLBACK,
      animationDuration: POINT_FOCUS_ANIMATION_MS,
    });
  });

  it("raises zoom to the minimum when below it", () => {
    const stop = pointFocusCameraStop([-113.5, 37.1], 11, FALLBACK);
    expect(stop.zoomLevel).toBe(POINT_FOCUS_MIN_ZOOM);
  });
});
