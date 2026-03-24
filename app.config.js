import 'dotenv/config';
import packageInfo from './package.json';

export default {
    expo: {
        name: "뇌벨업",
        slug: "brain-level-up",
        version: packageInfo.version,
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "brainlevelup",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        updates: {
            url: "https://u.expo.dev/2e968fa9-82cd-4fbf-ab8b-d211209f88af"
        },
        runtimeVersion: "1.3.0"/*{
            policy: "appVersion"
        }*/,
        splash: {
            image: "./assets/images/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.dksgn.brainlevelup"
        },
        android: {
            package: "com.dksgn.brainlevelup",
            versionCode: 10,
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            "expo-sqlite",
            [
                "expo-notifications",
                {
                    "icon": "./assets/images/icon.png",
                    "color": "#ffffff",
                    "sounds": [],
                    "androidMode": "default",
                    "androidCollapsedTitle": "단어 학습 알림"
                }
            ],
            [
                "react-native-google-mobile-ads",
                {
                    "androidAppId": process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID,
                    "iosAppId": process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID
                }
            ]
        ],
        experiments: {
            "typedRoutes": true
        },
        extra: {
            router: {},
            eas: {
                projectId: "2e968fa9-82cd-4fbf-ab8b-d211209f88af"
            }
        }
    }
};
