#!/bin/sh
# Injects Mapbox access token into the built app's Info.plist at build time.
# Token is read from (in order): project root .mapbox, ~/.mapbox, ~/mapbox.
# See: https://docs.mapbox.com/help/troubleshooting/private-access-token-android-and-ios/

set -e

PROJECT_ROOT="${SRCROOT}/../"
token_file="${PROJECT_ROOT}.mapbox"
token_file2="$HOME/.mapbox"
token_file3="$HOME/mapbox"

token="$(cat "$token_file" 2>/dev/null || cat "$token_file2" 2>/dev/null || cat "$token_file3" 2>/dev/null)" || true

if [ -n "$token" ]; then
  plutil -replace MBXAccessToken -string "$token" "$TARGET_BUILD_DIR/$INFOPLIST_PATH"
else
  echo "warning: Missing Mapbox access token."
  echo "warning: Create a file named .mapbox in the project root (or ~/.mapbox) containing your token."
  echo "warning: Get a token from https://account.mapbox.com/access-tokens/"
fi
