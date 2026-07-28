import {
  MAPBOX_WORLD_SIZE,
  boundsFocusCameraStop,
  centerOfBounds,
  zoomForBounds,
} from "../zoomForBounds";

const PADDING = {
  paddingTop: 12,
  paddingBottom: 52,
  paddingLeft: 12,
  paddingRight: 12,
};

/** Route bounds from the collapse-from-focused debug session (Moab area). */
const ROUTE_BOUNDS = {
  north: 38.56693,
  south: 38.5400217,
  east: -109.56845,
  west: -109.5932294,
};

describe("centerOfBounds", () => {
  it("returns the arithmetic midpoint", () => {
    expect(centerOfBounds(ROUTE_BOUNDS)).toEqual([
      (ROUTE_BOUNDS.west + ROUTE_BOUNDS.east) / 2,
      (ROUTE_BOUNDS.south + ROUTE_BOUNDS.north) / 2,
    ]);
  });
});

describe("zoomForBounds", () => {
  it("returns a zoom clearly below the focused-point floor for the collapsed square", () => {
    const zoom = zoomForBounds(ROUTE_BOUNDS, { width: 362, height: 362 }, PADDING);
    expect(zoom).toBeGreaterThan(10);
    expect(zoom).toBeLessThan(15);
  });

  it("returns -Infinity when padding consumes the viewport", () => {
    expect(
      zoomForBounds(ROUTE_BOUNDS, { width: 40, height: 40 }, PADDING),
    ).toBe(Number.NEGATIVE_INFINITY);
  });

  it("returns a higher zoom for a smaller geographic span", () => {
    const small = {
      north: 38.551,
      south: 38.55,
      east: -109.58,
      west: -109.581,
    };
    const largeZoom = zoomForBounds(ROUTE_BOUNDS, { width: 362, height: 362 }, PADDING);
    const smallZoom = zoomForBounds(small, { width: 362, height: 362 }, PADDING);
    expect(smallZoom).toBeGreaterThan(largeZoom);
  });

  it("uses the Mapbox world size of 512 by default", () => {
    const a = zoomForBounds(ROUTE_BOUNDS, { width: 362, height: 362 }, PADDING);
    const b = zoomForBounds(
      ROUTE_BOUNDS,
      { width: 362, height: 362 },
      PADDING,
      MAPBOX_WORLD_SIZE,
    );
    expect(a).toBe(b);
  });

  it("handles antimeridian longitude spans", () => {
    const crossing = {
      north: 10,
      south: 0,
      east: -170,
      west: 170,
    };
    const zoom = zoomForBounds(crossing, { width: 400, height: 400 }, {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    });
    expect(Number.isFinite(zoom)).toBe(true);
    expect(zoom).toBeLessThan(5);
  });
});

describe("boundsFocusCameraStop", () => {
  it("returns center+zoom below the point-focus floor for a typical route", () => {
    const stop = boundsFocusCameraStop(
      ROUTE_BOUNDS,
      { width: 402, height: 874 },
      {
        paddingTop: 80,
        paddingBottom: 200,
        paddingLeft: 20,
        paddingRight: 20,
      },
      300,
    );
    expect(stop).not.toBeNull();
    expect(stop!.centerCoordinate).toEqual(centerOfBounds(ROUTE_BOUNDS));
    expect(stop!.zoomLevel).toBeLessThan(15);
    expect(stop!.animationDuration).toBe(300);
  });

  it("returns null when padding consumes the viewport", () => {
    expect(
      boundsFocusCameraStop(ROUTE_BOUNDS, { width: 40, height: 40 }, PADDING, 200),
    ).toBeNull();
  });

  it("forwards optional heading and pitch", () => {
    const stop = boundsFocusCameraStop(
      ROUTE_BOUNDS,
      { width: 362, height: 362 },
      PADDING,
      220,
      { heading: 0, pitch: 0 },
    );
    expect(stop).toMatchObject({ heading: 0, pitch: 0, animationDuration: 220 });
    expect(stop).not.toHaveProperty("padding");
  });

  it("attaches padding when offsetCenterWithPadding is set", () => {
    const focusPadding = {
      paddingTop: 80,
      paddingBottom: 200,
      paddingLeft: 20,
      paddingRight: 20,
    };
    const stop = boundsFocusCameraStop(
      ROUTE_BOUNDS,
      { width: 402, height: 874 },
      focusPadding,
      300,
      { offsetCenterWithPadding: true },
    );
    expect(stop?.padding).toEqual(focusPadding);
  });
});
