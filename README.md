# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Mapbox maps (iOS / Android)

This app uses [@rnmapbox/maps](https://rnmapbox.github.io/docs/install) with Expo. It **cannot run in Expo Go** because it uses custom native code.

1. **Generate native projects** (required before running on device/simulator):
   ```bash
   npx expo prebuild --clean
   ```
   If you see **`pod install` failed** / **spawn pod ENOENT**, the CocoaPods CLI wasn’t on the PATH of the process Expo used. Prebuild still succeeded. If `pod` is not found in a new terminal either, add the Ruby gem executables directory to your PATH (one-time), then run `pod install`:
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
