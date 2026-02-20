const fs = require("fs");
const path = require("path");
const {
  withInfoPlist,
  withStringsXml,
  withAndroidManifest,
  AndroidConfig,
} = require("expo/config-plugins");

function getMapboxToken(projectRoot) {
  const envToken =
    process.env.MAPBOX_ACCESS_TOKEN ||
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (envToken && envToken.trim()) {
    return envToken.trim();
  }

  const tokenFile = path.join(projectRoot, ".mapbox");
  if (!fs.existsSync(tokenFile)) {
    return null;
  }

  const token = fs.readFileSync(tokenFile, "utf8").trim();
  return token || null;
}

function withAndroidMapboxToken(config, token) {
  if (!token) {
    return config;
  }

  let updated = withStringsXml(config, (mod) => {
    mod.modResults = AndroidConfig.Strings.setStringItem(
      [
        {
          $: {
            name: "mapbox_access_token",
            translatable: "false",
          },
          _: token,
        },
      ],
      mod.modResults
    );
    return mod;
  });

  updated = withAndroidManifest(updated, (mod) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    app["meta-data"] = app["meta-data"] || [];

    const name = "com.mapbox.token";
    const value = "@string/mapbox_access_token";
    const existing = app["meta-data"].find(
      (item) => item.$ && item.$["android:name"] === name
    );

    if (existing) {
      existing.$["android:value"] = value;
    } else {
      app["meta-data"].push({
        $: {
          "android:name": name,
          "android:value": value,
        },
      });
    }

    return mod;
  });

  return updated;
}

module.exports = ({ config }) => {
  const token = getMapboxToken(__dirname);

  if (!token) {
    // Non-fatal in config phase; app will fail to load Mapbox style at runtime.
    console.warn(
      "[Mapbox] No token found. Set MAPBOX_ACCESS_TOKEN or create a .mapbox file in the project root."
    );
    return config;
  }

  let updated = withInfoPlist(config, (mod) => {
    mod.modResults.MBXAccessToken = token;
    return mod;
  });

  updated = withAndroidMapboxToken(updated, token);
  return updated;
};
