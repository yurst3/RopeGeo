# RopeGeo Mobile

## App routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/(tabs)/explore` (explore tab). |
| `/explore` | Explore tab: map, route markers, search bar; tapping a route shows a preview. |
| `/explore/search` | Full-screen search; results are page and region previews. |
| `/explore/[id]/page` | Page detail screen. Requires query params `source` (PageDataSource) and `routeType` (RouteType). Renders e.g. Ropewiki page when `source=ropewiki`. |
| `/explore/shuttle-info` | Info screen for shuttle requirement badges; optional `highlightedShuttle` param. |
| `/explore/permit-info` | Info screen for permit status badges. |
| `/explore/risk-info` | Info screen for risk ratings. |
| `/explore/technical-info` | Info screen for technical difficulty ratings. |
| `/explore/water-info` | Info screen for water difficulty ratings. |
| `/explore/time-info` | Info screen for time ratings. |
| `/explore/vehicle-info` | Info screen for vehicle type. |

## Mapbox maps (iOS / Android)

This app uses [@rnmapbox/maps](https://rnmapbox.github.io/docs/install) with Expo. It **cannot run in Expo Go** because it uses custom native code.

1. **Generate native projects** (required before running on device/simulator):
   ```bash
   npx expo prebuild --clean
   ```
   If you see **`pod install` failed** / **spawn pod ENOENT**, the CocoaPods CLI wasn't on the PATH of the process Expo used. Prebuild still succeeded. If `pod` is not found in a new terminal either, add the Ruby gem executables directory to your PATH (one-time), then run `pod install`:
   ```bash
   echo 'export PATH="$(ruby -e '\''puts Gem.bindir'\''):$PATH"' >> ~/.zshrc
   source ~/.zshrc
   cd ios && pod install
   ```
2. **Mapbox access token:** Get a token from [Mapbox](https://account.mapbox.com/access-tokens/) and add it per [@rnmapbox/maps credentials](https://rnmapbox.github.io/docs/install) (e.g. `.mapbox` in project root for iOS, or your chosen method). Without a token, the map may not load.
   - Token changes are applied to native iOS/Android config during prebuild. If you update `.mapbox` (or token env vars), rerun:
   ```bash
   npx expo prebuild --clean
   ```

After prebuild (and `pod install` if needed), run **iOS** with `npx expo run:ios` and **Android** with `npx expo run:android` (development builds).
