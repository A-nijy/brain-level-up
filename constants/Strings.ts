/**
 * Strings.ts
 * 앱 전체에서 사용되는 모든 텍스트, 아이콘, 이미지 경로를 중앙 관리하는 파일입니다.
 */

export const Strings = {
    /**
     * 전역 공통 요소를 정의합니다. (버튼, 알림 메시지 등)
     */
    common: {
        confirm: "확인",
        cancel: "취소",
        save: "저장",
        edit: "수정",
        delete: "삭제",
        appName: "뇌벨업",
        close: "닫기",
        add: "추가",
        success: "성공",
        error: "오류",
        warning: "경고",
        info: "알림",
        loading: "로딩 중...",
        saving: "저장 중...",
        creating: "생성 중...",
        noData: "데이터가 없습니다.",
        reset: "초기화",
        confirmTitle: "확인",
        deleteConfirmTitle: "삭제 확인",
        deleteConfirmMsg: "정말 삭제하시겠습니까?",
        loginRequired: "로그인이 필요합니다.",
        title: "제목",
        description: "설명",
        category: "카테고리",
        yes: "예",
        no: "아니오",
        ok: "확인",
        unitWord: "문제",
        unitMinute: "분",
        unitCount: "횟",
        icons: {
            delete: "trash",
            edit: "pencil",
            add: "plus",
            close: "times",
            check: "check",
            back: "chevron-left",
            more: "ellipsis-v",
            refresh: "refresh",
            sort: "sort",
            speaker: "volume-up",
        },
    },

    /**
     * 하단 탭 바의 이름과 아이콘을 정의합니다.
     */
    tabs: {
        home: "나의 암기장",
        shared: "자료실",
        stats: "통계",
        settings: "설정",
        icons: {
            home: "book",
            shared: "globe",
            stats: "bar-chart",
            settings: "gear",
            libraries: "book",
        }
    },

    /**
     * 홈 화면 ((탭)/index.tsx) - 나의 암기장 리스트 화면
     */
    home: {
        greeting: (name: string) => `안녕하세요, ${name}님! 👋`,
        subGreeting: "오늘도 목표를 달성하고 지식을 쌓아보세요.",
        sectionTitle: "나의 암기장",
        reorderDone: "순서 완료",
        reorderStart: "순서 변경",
        newLibrary: "새 암기장",
        emptyDescription: "작성된 설명이 없습니다.",
        emptyPrompt: "첫 번째 암기장을 만들어 학습을 시작해보세요!",
        editAction: "수정하기",
        deleteAction: "삭제하기",
        icons: {
            more: "ellipsis-v",
            items: "file-text-o",
            date: "calendar-o",
            arrowRight: "angle-right",
            up: "arrow-up",
            down: "arrow-down",
            bell: "bell-o",
        },
        searchPlaceholder: "암기장 제목 검색...",
        images: {
            libraryDefault: "https://cdn-icons-png.flaticon.com/512/330/330731.png", // 기본 책 아이콘
        },
    },

    /**
     * 암기장 생성/수정 폼 (library/create.tsx, library/edit.tsx)
     */
    libraryForm: {
        createTitle: "새 암기장 만들기",
        editTitle: "암기장 수정",
        labelTitle: "제목 *",
        labelDesc: "설명",
        labelCategory: "카테고리",
        placeholderTitle: "예: 토익 보카 2024",
        placeholderDesc: "이 암기장에 대한 설명 (선택)",
        placeholderCategory: "예: 영어, 자격증, IT",
        submitCreate: "만들기",
        submitEdit: "수정 완료",
        validationTitle: "제목을 입력해주세요.",
        deleteBtn: "암기장 삭제하기",
        deleteConfirm: "정말 이 암기장을 삭제하시겠습니까?\n포함된 모든 단어가 함께 삭제됩니다.",
        deleteSuccess: "암기장이 삭제되었습니다.",
        fetchError: "정보를 불러오지 못했습니다.",
        deleteFail: "삭제에 실패했습니다.",
    },

    /**
     * 암기장 상세 (library/[id].tsx)
     */
    libraryDetail: {
        title: "암기장 상세",
        sectionListHeader: "학습 섹션 목록",
        empty: "등록된 섹션이 없습니다.",
        addFirst: "첫 번째 섹션 추가하기",
        modal: {
            createTitle: "새 섹션 추가",
            editTitle: "섹션 수정",
            subtitle: "학습할 주제나 단어 묶음의 이름을 정해주세요.",
            placeholder: "예: Day 01, 기초 명사 등",
            btnAdd: "추가하기",
            btnEdit: "수정 완료",
        },
        alerts: {
            enterName: "이름을 입력해주세요.",
            createFail: "섹션 생성에 실패했습니다.",
            editFail: "섹션 수정에 실패했습니다.",
            deleteFail: "섹션 삭제에 실패했습니다.",
            deleteConfirm: (name: string) => `'${name}' 섹션을 삭제하시겠습니까?\n포함된 모든 문제가 함께 삭제됩니다.`,
        }
    },

    /**
     * 섹션 관리 (library/[id]/section/[sectionId].tsx)
     */
    librarySection: {
        title: "섹션 상세",
        addSection: "섹션 추가",
        empty: "등록된 단어가 없습니다.",
        addFirst: "첫 번째 문제 추가하기",
        playBtn: "학습 시작하기",
        count: (count: number) => `총 ${count}개의 문제`,
        menu: {
            reorderStart: "순서 변경",
            reorderEnd: "변경 완료",
            exportPdf: "PDF로 내보내기",
            importWords: "문제 가져오기 (CSV/Excel)",
        },
        itemOptions: {
            title: "문제 관리",
            edit: "문제 수정",
            delete: "문제 삭제",
        },
        statusModal: {
            title: "학습 상태 변경",
            learned: "완벽히 외움",
            confused: "아직 헷갈림",
            undecided: "학습 전",
        },
        alerts: {
            deleteFail: "삭제에 실패했습니다.",
            exportError: "내보내기 중 오류가 발생했습니다.",
            changeFail: "상태 변경 실패",
            changeError: "데이터를 업데이트하지 못했습니다.",
        }
    },

    /**
     * 문제 생성/수정 폼 (library/[id]/create-item.tsx, edit-item.tsx)
     */
    itemForm: {
        createTitle: "새 문제 추가",
        editTitle: "문제 수정",
        labelQuestion: "질문 (앞면) *",
        labelAnswer: "답변 (뒷면) *",
        labelMemo: "메모",
        placeholderQuestion: "질문을 입력하세요",
        placeholderAnswer: "답변을 입력하세요",
        placeholderMemo: "참고할 메모 (선택사항)",
        submitCreate: "추가하기",
        submitEdit: "수정 완료",
        submitSave: "저장하기",
        submitSaving: "저장 중...",
        validationEmpty: "질문과 답변을 모두 입력해주세요.",
        deleteConfirm: "문제를 삭제하시겠습니까?",
        alerts: {
            enterAll: "질문과 답변을 모두 입력해주세요.",
            invalidAccess: "잘못된 접근입니다.",
            saveSuccess: "문제가 저장되었습니다. 계속 추가하시겠습니까?",
            saveFail: "저장에 실패했습니다.",
            editSuccess: "수정되었습니다.",
            editFail: "수정에 실패했습니다.",
            deleteSuccess: "삭제되었습니다.",
            deleteFail: "삭제에 실패했습니다.",
            notFound: "문제를 찾을 수 없습니다.",
        }
    },

    /**
     * 학습 화면 텍스트입니다. (단어 플래시카드 학습)
     */
    study: {
        screenTitle: (current: number, total: number) => `${current} / ${total}`,
        completeTitle: "Study Complete!",
        completeSubtitle: "학습을 모두 완료했습니다.",
        correct: "정답",
        wrong: "오답",
        backBtn: "돌아가기",
        questionTag: "QUESTION",
        answerTag: "ANSWER",
        hintText: "탭하여 정답 확인",
        dontKnow: "몰라요",
        know: "알아요",
        finishTitle: "학습 완료",
        config: {
            title: "학습 설정",
            rangeTitle: "학습 범위",
            rangeAll: "전체",
            frontSideTitle: "카드 앞면",
            frontSideQuestion: "문제",
            frontSideAnswer: "정답",
            orderTitle: "출제 순서",
            orderSequential: "기본순",
            orderRandom: "랜덤순",
            startBtn: "학습 시작",
        }
    },

    /**
     * 공유 자료실 화면 텍스트입니다.
     */
    shared: {
        title: "공유 자료실",
        subtitle: "최고의 암기 비법을 공식 자료실에서 만나보세요.",
        categoryAll: "전체",
        downloadCount: (count: number) => `${count}회`,
        import: "가져오기",
        empty: "공유된 자료가 없습니다.",
        loading: "자료를 불러오는 중...",
        searchPlaceholder: "자료 제목 검색...",
        alerts: {
            downloadSuccess: "내 암기장에 추가되었습니다.",
            downloadFail: "다운로드 실패",
            goLibrary: "바로가기",
        },
        icons: {
            plus: "plus",
        }
    },

    /**
     * 공유 자료 상세 (shared/[id].tsx)
     */
    sharedDetail: {
        screenTitle: "자료 상세",
        downloadBtn: "내 보관함에 추가",
        count: (count: number) => `총 ${count}개의 섹션`,
        alerts: {
            loginRequired: "다운로드를 위해 기기 인증이 필요합니다.",
            downloadSuccess: "내 암기장에 추가되었습니다.",
            downloadFail: "다운로드 실패",
            goToLibrary: "바로가기",
        }
    },

    /**
     * 학습 통계 탭 화면 (app/(tabs)/stats.tsx)
     */
    statsTab: {
        title: "학습 리포트",
        subtitle: "나의 학습 기록을 한눈에 확인하고 성장을 경험하세요.",
        weeklyTitle: "주간 학습 현황",
        dailyTitle: "오늘의 성과",
        totalStudyTime: "총 학습 시간",
        studyCount: "학습 횟수",
        newWords: "새로 배운 단어",
        streakMsg: (days: number) => `🔥 현재 ${days}일 연속 학습 중 🔥`,
        chartTitle: "전체 학습 상태도",
        detailLink: "암기장별 상세 분석 보기",
        legends: {
            learned: "외움",
            confused: "헷갈림",
            undecided: "미완료",
        },
        empty: "학습 데이터가 부족합니다.\n지금 바로 암기를 시작해보세요!",
    },

    /**
     * 통계 상세 화면
     */
    stats: {
        detailTitle: "학습 분석 상세",
    },

    /**
     * 설정 화면 메뉴 관련 텍스트입니다.
     */
    settings: {
        sectionApp: "앱 환경 설정",
        menuTheme: "테마 설정",
        themeTitle: "테마 설정",
        themeSubtitle: "앱의 테마를 선택해주세요.",
        menuPush: "암기장 푸시 알림",
        menuPushDetail: "상세 설정 변경하기",
        menuVersion: "버전 정보",
        themeModes: {
            light: "라이트 모드",
            dark: "다크 모드",
            system: "시스템 설정",
        },
        icons: {
            themeSun: "sun-o",
            themeMoon: "moon-o",
            cog: "cog",
            info: "info-circle",
            close: "close",
            down: "chevron-down",
            pencil: "pencil",
            check: "check-circle",
            circle: "circle-o",
        }
    },

    /**
     * 데이터 백업 및 복구 관련 텍스트입니다.
     */
    backup: {
        title: "데이터 백업 및 복구",
        btnBackup: "구글 드라이브 백업",
        btnRestore: "구글 드라이브 복구",
        backupSuccess: "백업이 완료되었습니다.",
        restoreSuccess: "데이터 복구가 완료되었습니다. 앱을 재시작해 주세요.",
        confirmRestore: "기존의 모든 데이터가 백업 데이터로 대체됩니다. 계속하시겠습니까?",
        loginRequired: "백업 기능을 이용하려면 구글 로그인이 필요합니다.",
        confirmRestoreTitle: "복구 확인",
    },

    /**
     * 푸시 알림 상세 설정 모달 관련 텍스트입니다.
     */
    pushModal: {
        title: "알림 상세 설정",
        step1: "1. 학습할 암기장 선택",
        step2: "2. 세부 항목 선택 (섹션)",
        labelRange: "문제 범위",
        labelInterval: "알림 간격 (분)",
        unitInterval: "분 마다 알림",
        submit: "설정 완료",
        libraryPlaceholder: "암기장을 선택해주세요",
        sectionAll: "전체",
        librarySelected: "암기장 선택됨",
        sectionSelected: "항목 선택됨",
        ranges: { all: "전체", learned: "외움", confused: "헷갈림", undecided: "미정" },
        alerts: {
            permissionNeeded: "푸시 알림 권한이 필요합니다. 설정에서 권한을 허용해 주세요.",
            selectLibrary: "알림을 받을 암기장을 선택해 주세요.",
            intervalTooShort: "알림 간격은 최소 5분 이상으로 설정해 주세요.",
        },
    },

    /**
     * 사용자 암기장에 CSV/Excel 파일로 단어를 가져오는 화면 텍스트입니다.
     */
    userImport: {
        title: "문제 가져오기",
        fileSelect: "파일 선택하기 (CSV, Excel)",
        fileChange: "파일 변경하기",
        btnImport: "데이터 가져오기",
        preview: (count: number) => `데이터 미리보기 (${count}개)`,
        more: (count: number) => `외 ${count}개 항목 더 있음...`,
        guide: {
            title: "가져오기 가이드",
            step1: "1. 엑셀이나 CSV 파일을 준비해주세요.",
            step2: "2. 첫 줄에 '문제(Question)'와 '정답(Answer)' 컬럼이 필수로 포함되어야 하며, '메모' 컬럼은 선택사항입니다.",
            step3: "3. 파일을 선택하고 아래 버튼을 누르면 암기장에 추가됩니다.",
        },
        alerts: {
            emptyFile: "파일에 내용이 없습니다.",
            parseError: "파일 읽기에 실패했습니다.",
            pickError: "파일 선택 중 오류 발생",
            noData: "가져올 데이터가 없습니다.",
            noColumns: "문제/정답 컬럼을 찾을 수 없습니다.",
            importSuccess: (count: number) => `${count}개의 문제를 성공적으로 가져왔습니다.`,
            importFail: "가져오기 실패",
        },
        icons: {
            excel: "file-excel-o",
            upload: "cloud-upload",
        }
    },

    /**
     * 알림 센터
     */
    notifications: {
        screenTitle: "알림함",
        detailTitle: "알림 상세",
        empty: "새로운 알림이 없습니다.",
        noData: "알림 정보를 찾을 수 없습니다.",
        markAllRead: "모두 읽음으로 표시",
        deleteTitle: "알림 삭제",
        deleteConfirm: "모든 알림을 삭제하시겠습니까?",
        deleteConfirmDetail: "이 알림을 삭제하시겠습니까?",
        notFound: "알림을 찾을 수 없습니다.",
        fetchFail: "알림을 불러오지 못했습니다.",
        deleteFail: "삭제에 실패했습니다.",
        types: {
            study: "학습 알림",
            system: "시스템 알림",
        }
    },

    /**
     * 웹뷰 화면
     */
    webview: {
        screenTitle: "웹 페이지",
        invalidUrl: "올바르지 않은 주소입니다.",
    },
};
