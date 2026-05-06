import 'dotenv/config';
import packageInfo from './package.json';

export default {
    expo: {
        name: "뇌벨업",
        slug: "brain-level-up",
        version: packageInfo.version,
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "com.googleusercontent.apps.93551489917-8a5eule47c8ib1a5iu9imvvbg1jadp74",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        updates: {
            url: "https://u.expo.dev/2e968fa9-82cd-4fbf-ab8b-d211209f88af"
        },
        runtimeVersion: "1.4.0"/*{
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
            versionCode: 13,
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
            "./plugins/notifee-plugin"
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
