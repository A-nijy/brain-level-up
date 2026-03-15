import * as Speech from 'expo-speech';

/**
 * TtsService
 * 텍스트의 언어를 자동으로 감지하여 최적의 TTS(Text-to-Speech) 설정을 적용하는 서비스입니다.
 */
export const TtsService = {
    /**
     * 입력된 텍스트의 언어를 감지합니다.
     * @param text 감지할 텍스트
     * @returns 감지된 언어 코드 (ISO 형식)
     */
    detectLanguage(text: string): string {
        if (!text) return 'en-US';

        // 1. 한국어 감지 (한글 범위)
        const koRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/;
        if (koRegex.test(text)) return 'ko-KR';

        // 2. 일본어 감지 (히라가나, 가타카나)
        const jaRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
        if (jaRegex.test(text)) return 'ja-JP';

        // 3. 중국어 감지 (한자 범위 - 일본어 특징이 없을 때)
        const zhRegex = /[\u4E00-\u9FFF]/;
        if (zhRegex.test(text)) return 'zh-CN';

        // 기본값: 영어
        return 'en-US';
    },

    /**
     * 텍스트를 음성으로 읽어줍니다.
     * @param text 읽을 텍스트
     * @param options Speech.SpeechOptions 확장
     */
    speak(text: string, options: Speech.SpeechOptions = {}) {
        if (!text) return;

        // 새로운 음성을 재생하기 전 기존 음성 중단
        Speech.stop();

        const lang = options.language || this.detectLanguage(text);

        // 언어별 속도 미세 조정 (영어는 조금 더 자연스럽게)
        const rate = options.rate || (lang.startsWith('en') ? 1.0 : 0.9);

        // 띄어쓰기, 줄바꿈, 괄호 등을 기준으로 텍스트 분할 후 빈 문자열 제거
        const chunks = text.split(/[\s\(\)\[\]\{\}\<\>]+/).filter(Boolean);

        let isStopped = false;

        const playNext = (index: number) => {
            if (isStopped || index >= chunks.length) {
                if (index >= chunks.length && options.onDone) options.onDone();
                return;
            }

            Speech.speak(chunks[index], {
                ...options,
                language: lang,
                rate: rate,
                onDone: () => {
                    if (index < chunks.length - 1) {
                        // 다음 단어를 읽기 전 0.5초(500ms) 대기
                        setTimeout(() => {
                            if (!isStopped) playNext(index + 1);
                        }, 500);
                    } else {
                        if (options.onDone) options.onDone();
                    }
                },
                onStopped: () => {
                    isStopped = true;
                    if (options.onStopped) options.onStopped();
                },
                onError: (e) => {
                    isStopped = true;
                    if (options.onError) options.onError(e);
                }
            });
        };

        if (chunks.length > 0) {
            playNext(0);
        }
    },

    /**
     * 현재 진행 중인 음성을 중단합니다.
     */
    stop() {
        Speech.stop();
    }
};
