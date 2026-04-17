const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Notifee 라이브러리를 위한 로컬 Expo 설정 플러그인
 * android/build.gradle 에 Notifee 전용 Maven 저장소를 추가합니다.
 */
const withNotifeeRepository = (config) => {
    return withProjectBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = addNotifeeMavenRepo(config.modResults.contents);
        }
        return config;
    });
};

function addNotifeeMavenRepo(src) {
    // 이미 추가되어 있는지 확인
    if (src.includes('notifee')) {
        return src;
    }

    // allprojects { repositories { ... } } 섹션을 찾아 Maven 경로 추가
    const mavenRepo = `        maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }`;
    
    // repositories { 블록 뒤에 삽입
    return src.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        `allprojects {\n    repositories {\n${mavenRepo}`
    );
}

module.exports = withNotifeeRepository;
