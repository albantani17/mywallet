/**
 * Config plugin: add a real `release` signing config to the generated
 * Android project.
 *
 * The Expo template signs `release` with the debug keystore. This plugin
 * patches `android/app/build.gradle` so that `release` builds are signed
 * with a keystore supplied through Gradle properties:
 *
 *   MYWALLET_UPLOAD_STORE_FILE      (path relative to android/app, e.g. release.keystore)
 *   MYWALLET_UPLOAD_STORE_PASSWORD
 *   MYWALLET_UPLOAD_KEY_ALIAS
 *   MYWALLET_UPLOAD_KEY_PASSWORD
 *
 * When those properties are absent (a normal local `expo run:android`),
 * the build falls back to the debug keystore, so day-to-day work is
 * unaffected. CI passes them via android/gradle.properties.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_SIGNING_CONFIG = `        release {
            if (project.hasProperty('MYWALLET_UPLOAD_STORE_FILE')) {
                storeFile file(MYWALLET_UPLOAD_STORE_FILE)
                storePassword MYWALLET_UPLOAD_STORE_PASSWORD
                keyAlias MYWALLET_UPLOAD_KEY_ALIAS
                keyPassword MYWALLET_UPLOAD_KEY_PASSWORD
            }
        }
`;

function patchBuildGradle(contents) {
  if (contents.includes('MYWALLET_UPLOAD_STORE_FILE')) {
    return contents;
  }

  let patched = contents;

  // 1. Add a `release` block right after the existing `debug` signing config.
  patched = patched.replace(
    /(signingConfigs \{\n\s*debug \{[\s\S]*?\n\s*\}\n)/,
    `$1${RELEASE_SIGNING_CONFIG}`,
  );

  // 2. Point the `release` build type at the release signing config when
  //    the keystore properties are present, otherwise keep debug.
  patched = patched.replace(
    /(\/\/ see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\n\s*)signingConfig signingConfigs\.debug/,
    "$1signingConfig project.hasProperty('MYWALLET_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
  );

  if (patched === contents) {
    throw new Error(
      '[with-release-signing] could not patch android/app/build.gradle — the template changed; update the plugin.',
    );
  }

  return patched;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('[with-release-signing] expected a groovy build.gradle');
    }
    cfg.modResults.contents = patchBuildGradle(cfg.modResults.contents);
    return cfg;
  });
};
