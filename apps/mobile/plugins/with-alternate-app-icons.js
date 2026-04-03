const { withAndroidManifest, withDangerousMod, withInfoPlist, withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const IOS_ALTERNATE_ICON_NAME = 'AppIconBlack';
const IOS_ALTERNATE_ICON_FILE = 'App-Icon-Black-1024x1024@1x.png';
const ANDROID_DEFAULT_ALIAS = '.MainActivityDefault';
const ANDROID_BLACK_ALIAS = '.MainActivityBlack';
const ANDROID_BLACK_ICON_NAME = 'ic_launcher_black.png';
const ANDROID_INTENT_MAIN = 'android.intent.action.MAIN';
const ANDROID_CATEGORY_LAUNCHER = 'android.intent.category.LAUNCHER';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFileIfChanged(sourcePath, targetPath) {
  const next = fs.readFileSync(sourcePath);
  const prev = fs.existsSync(targetPath) ? fs.readFileSync(targetPath) : null;
  if (prev && Buffer.compare(prev, next) === 0) {
    return;
  }
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, next);
}

function isLauncherIntentFilter(intentFilter) {
  const actions = intentFilter.action ?? [];
  const categories = intentFilter.category ?? [];
  const hasMain = actions.some((entry) => entry?.$?.['android:name'] === ANDROID_INTENT_MAIN);
  const hasLauncher = categories.some((entry) => entry?.$?.['android:name'] === ANDROID_CATEGORY_LAUNCHER);
  return hasMain && hasLauncher;
}

function createLauncherAlias(name, icon) {
  return {
    $: {
      'android:name': name,
      'android:enabled': name === ANDROID_DEFAULT_ALIAS ? 'true' : 'false',
      'android:exported': 'true',
      'android:icon': icon,
      'android:roundIcon': icon,
      'android:targetActivity': '.MainActivity',
    },
    'intent-filter': [
      {
        action: [{ $: { 'android:name': ANDROID_INTENT_MAIN } }],
        category: [{ $: { 'android:name': ANDROID_CATEGORY_LAUNCHER } }],
      },
    ],
  };
}

function withAlternateAppIcons(config) {
  config = withInfoPlist(config, (cfg) => {
    const icons = cfg.modResults.CFBundleIcons ?? {};
    const primaryIcon = icons.CFBundlePrimaryIcon ?? {};
    const primaryFiles = Array.isArray(primaryIcon.CFBundleIconFiles) ? primaryIcon.CFBundleIconFiles : [];
    const alternateIcons = icons.CFBundleAlternateIcons ?? {};

    cfg.modResults.CFBundleIcons = {
      ...icons,
      CFBundlePrimaryIcon: {
        ...primaryIcon,
        CFBundleIconFiles: Array.from(new Set([...primaryFiles, 'AppIcon'])),
      },
      CFBundleAlternateIcons: {
        ...alternateIcons,
        [IOS_ALTERNATE_ICON_NAME]: {
          ...(alternateIcons[IOS_ALTERNATE_ICON_NAME] ?? {}),
          CFBundleIconFiles: [IOS_ALTERNATE_ICON_NAME],
          UIPrerenderedIcon: false,
        },
      },
    };

    return cfg;
  });

  config = withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const targetName = cfg.modRequest.projectName;
    project.updateBuildProperty('ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES', [IOS_ALTERNATE_ICON_NAME], undefined, targetName);
    project.updateBuildProperty('ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS', 'YES', undefined, targetName);
    return cfg;
  });

  config = withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const appRoot = cfg.modRequest.projectRoot;
      const iosRoot = cfg.modRequest.platformProjectRoot;
      const appName = cfg.modRequest.projectName;
      const sourceIconPath = path.join(appRoot, 'assets', 'app-icons', 'black', 'app-icon-black-1024.png');
      const appIconSetDir = path.join(iosRoot, appName, 'Images.xcassets', `${IOS_ALTERNATE_ICON_NAME}.appiconset`);
      const contentsPath = path.join(appIconSetDir, 'Contents.json');
      const targetIconPath = path.join(appIconSetDir, IOS_ALTERNATE_ICON_FILE);

      ensureDir(appIconSetDir);
      copyFileIfChanged(sourceIconPath, targetIconPath);

      const contents = JSON.stringify({
        images: [
          {
            filename: IOS_ALTERNATE_ICON_FILE,
            idiom: 'universal',
            platform: 'ios',
            size: '1024x1024',
          },
        ],
        info: {
          version: 1,
          author: 'clawket',
        },
      }, null, 2);
      if (!fs.existsSync(contentsPath) || fs.readFileSync(contentsPath, 'utf8') !== `${contents}\n`) {
        fs.writeFileSync(contentsPath, `${contents}\n`);
      }

      return cfg;
    },
  ]);

  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults?.manifest?.application?.[0];
    if (!app) {
      throw new Error('AndroidManifest.xml is missing the <application> node.');
    }

    const mainActivity = (app.activity ?? []).find((activity) => activity?.$?.['android:name'] === '.MainActivity');
    if (!mainActivity) {
      throw new Error('AndroidManifest.xml is missing .MainActivity.');
    }

    const filteredIntentFilters = (mainActivity['intent-filter'] ?? []).filter((intentFilter) => !isLauncherIntentFilter(intentFilter));
    if (filteredIntentFilters.length > 0) {
      mainActivity['intent-filter'] = filteredIntentFilters;
    } else {
      delete mainActivity['intent-filter'];
    }

    const remainingAliases = (app['activity-alias'] ?? []).filter((activityAlias) => {
      const aliasName = activityAlias?.$?.['android:name'];
      return aliasName !== ANDROID_DEFAULT_ALIAS && aliasName !== ANDROID_BLACK_ALIAS;
    });

    app['activity-alias'] = [
      ...remainingAliases,
      createLauncherAlias(ANDROID_DEFAULT_ALIAS, '@mipmap/ic_launcher'),
      createLauncherAlias(ANDROID_BLACK_ALIAS, '@mipmap/ic_launcher_black'),
    ];

    return cfg;
  });

  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const appRoot = cfg.modRequest.projectRoot;
      const androidResRoot = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
      const sourceRoot = path.join(appRoot, 'assets', 'app-icons', 'black', 'android');
      const densities = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

      for (const density of densities) {
        const sourcePath = path.join(sourceRoot, density, ANDROID_BLACK_ICON_NAME);
        const targetPath = path.join(androidResRoot, density, ANDROID_BLACK_ICON_NAME);
        copyFileIfChanged(sourcePath, targetPath);
      }

      return cfg;
    },
  ]);

  return config;
}

module.exports = withAlternateAppIcons;
