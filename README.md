# RopeGeo

Onboarding guide for new developers. This repo is a React Native app using Mapbox maps.

---

## Prerequisites

Install these before setting up the project:

| Requirement | Notes |
|-------------|--------|
| **Node.js** | `>= 22.11.0` (check with `node -v`). Use [nvm](https://github.com/nvm-sh/nvm) or [nodejs.org](https://nodejs.org). |
| **npm** | Comes with Node. |
| **Git** | For cloning and version control. |
| **Xcode** (macOS only) | For iOS builds and **iOS Simulator**. Install from the App Store; then install the iOS Simulator via Xcode → Settings → Platforms. |
| **Android Studio** | For Android builds and **Android Emulator**. Install from [developer.android.com/studio](https://developer.android.com/studio). During setup, install the Android SDK and at least one system image (e.g. Pixel 6, API 34). |
| **Ruby** | Used for CocoaPods on iOS. macOS has a system Ruby; for fewer issues, [rbenv](https://github.com/rbenv/rbenv) or [Homebrew Ruby](https://formulae.brew/formula/ruby) is recommended. |

---

## 1. Clone and install dependencies

```bash
git clone <repo-url>
cd RopeGeo
npm install
```

### iOS (macOS only)

From the project root:

```bash
bundle install
cd ios && bundle exec pod install && cd ..
```

Make the Mapbox token-injection script executable (required for the iOS build to succeed):

```bash
chmod +x ios/scripts/inject-mapbox-token.sh
```

If you hit Ruby/Bundler or CocoaPods errors, see the project’s troubleshooting notes or ask the team.

---

## 2. Mapbox access token (required to run the app)

**You need a Mapbox access token to build and run the app.** Tokens are not in the repo for security.

- **Get a token:** Ask **Ethan** for the RopeGeo Mapbox access token.
- **Where to put it:** Follow **[docs/MAPBOX_ACCESS_TOKEN.md](docs/MAPBOX_ACCESS_TOKEN.md)**. Summary:
  - **iOS:** Create a file named `.mapbox` in the **project root** (same folder as `package.json`) and paste in the token as a single line. This file is gitignored.
  - **Android:** Create `android/app/src/main/res/values/developer-config.xml` with the token (see the doc). That file is gitignored.

Do not add the token to `Info.plist`, `mapbox_access_token.xml`, or any file that gets committed.

---

## 3. Run the app

1. **Start Metro** (from the project root):
   ```bash
   npm start
   ```

2. In another terminal, run the app:
   - **iOS:** `npm run ios` (uses the iOS Simulator if no device is connected).
   - **Android:** `npm run android` (uses the Android Emulator if no device is connected).

Make sure an iOS Simulator or Android Emulator is running (or a device is connected) before running the app command.

---

## Quick reference

| Task | Command |
|------|--------|
| Install JS dependencies | `npm install` |
| Install iOS pods | `bundle install` then `cd ios && bundle exec pod install` |
| Start Metro | `npm start` |
| Run on iOS | `npm run ios` |
| Run on Android | `npm run android` |
| Lint | `npm run lint` |

---

## Need help?

- **Mapbox token or access:** Ask **Ethan**.
- **Setup or build issues:** Check with the team or open an issue in the repo.
