import type { ConfigContext, ExpoConfig } from 'expo/config';

const PACKAGE_ID = 'com.akshit.synclist';

/**
 * Google Sign-In's config plugin needs an iOS URL scheme even for Android-only builds.
 * iOS ships after the Android launch, so a placeholder is fine until then.
 */
const GOOGLE_IOS_URL_SCHEME =
  process.env.GOOGLE_IOS_URL_SCHEME ?? 'com.googleusercontent.apps.ios-not-configured';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'SyncList',
  slug: 'synclist',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'synclist',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: PACKAGE_ID,
    supportsTablet: false,
  },
  android: {
    package: PACKAGE_ID,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    'expo-secure-store',
    'expo-sqlite',
    [
      'expo-image-picker',
      { photosPermission: 'SyncList uses your photos to set your profile picture.' },
    ],
    ['@react-native-google-signin/google-signin', { iosUrlScheme: GOOGLE_IOS_URL_SCHEME }],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
});
