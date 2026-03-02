/**
 * Strings.ts
 * 앱 전체에서 사용되는 모든 텍스트, 아이콘, 이미지 경로를 중앙 관리하는 파일입니다.
 * 관리자님은 이 파일의 값만 수정하여 앱의 문구와 디자인 요소를 변경할 수 있습니다.
 */

export const Strings = {
    /**
     * 전역 공통 요소를 정의합니다. (버튼, 알림 메시지 등)
     */
    common: {
        confirm: "확인", // 일반 확인 버튼
        cancel: "취소", // 일반 취소 버튼
        save: "저장", // 저장 버튼
        edit: "수정", // 수정 버튼
        delete: "삭제", // 삭제 버튼
        appName: "뇌벨업", // [전체] 앱 이름
        close: "닫기", // 모달 등 닫기 버튼
        add: "추가", // 추가 버튼
        success: "성공", // 성공 알림 제목
        error: "오류", // 오류 알림 제목
        warning: "경고", // 경고 알림 제목
        info: "알림", // 정보 안내 알림 제목
        loading: "로딩 중...", // 데이터 로딩 중 메시지
        saving: "저장 중...", // 데이터 저장 중 메시지
        creating: "생성 중...", // 생성 프로세스 중 메시지
        noData: "데이터가 없습니다.", // 목록이 비었을 때 메시지
        reset: "초기화", // 초기화 버튼
        confirmTitle: "확인", // 일반 확인창 제목
        deleteConfirmTitle: "삭제 확인", // 삭제 확인창 제목
        deleteConfirmMsg: "정말 삭제하시겠습니까?", // 삭제 확인창 메시지
        loginRequired: "로그인이 필요합니다.", // 비로그인 접근 제한 메시지
        title: "제목", // 제목 레이블 공통 텍스트
        description: "설명", // 설명 레이블 공통 텍스트
        category: "카테고리", // 카테고리 레이블 공통 텍스트
        yes: "예", // 긍정 응답
        no: "아니오", // 부정 응답
        ok: "확인", // 단순 확인 버튼
        // 단위 텍스트 (전체 화면 공통 사용)
        unitWord: "문제", // [(tabs)/index.tsx, library/*, adminSharedSection] 단어 개수 표시 단위
        unitMinute: "분", // [(tabs)/stats.tsx, study/*] 시간 단위
        unitCount: "횟", // [(tabs)/stats.tsx] 횟수 단위
        icons: {
            delete: "trash", // [전체] 삭제 아이콘
            edit: "pencil", // [전체] 수정 아이콘
            add: "plus", // [전체] 추가(+) 아이콘
            close: "times", // [전체] 닫기(×) 아이콘
            check: "check", // [전체] 선택/체크 아이콘
            back: "chevron-left", // [전체] 뒤로가기 화살표
            more: "ellipsis-v", // [전체] 더보기(⋮) 아이콘
            refresh: "refresh", // [전체] 새로고침 아이콘
            sort: "sort", // [전체] 순서 변경 아이콘
            speaker: "volume-up", // [전체] TTS 스피커 아이콘
        },
    },

    /**
     * 인증(로그인, 가입) 화면 텍스트입니다.
     */
    auth: {
        appName: "뇌벨업", // 서비스 이름
        welcomeMsg: "스마트한 암기 생활의 시작,\n지금 바로 경험해보세요.", // 로그인 환영 문구
        googleLogin: "Google로 시작하기", // 구글 로그인 버튼
        appleLogin: "Apple로 시작하기", // 애플 로그인 버튼
        appleComingSoon: "애플 로그인은 곧 지원될 예정입니다.", // 애플 로그인 미지원 안내
        guestLogin: "게스트로 계속하기", // 익명 로그인 버튼
        or: "또는", // 구분선 "또는"
        footerLaw: "로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.", // 하단 법적 고지
        errorSession: "세션을 가져오지 못했습니다.", // 세션 획득 실패 알림
        errorNoParams: "반환된 URL에 파라미터가 없습니다.", // URL 파라미터 누락 오류
        errorNoToken: "토큰을 찾을 수 없습니다.", // 인증 토큰 없음 오류
        errorGoogleTitle: "구글 로그인 오류", // 구글 로그인 실패 알림 제목
        errorLoginTitle: "로그인 오류", // 일반 로그인 실패 알림 제목
        errorNoAdmin: "관리자 정보를 찾을 수 없습니다.", // 관리자 인증 실패

        icons: {
            logo: "book", // 메인 로고 아이콘
            google: "google", // 구글 로그인 버튼 아이콘
            apple: "apple", // 애플 로그인 버튼 아이콘
        }
    },

    /**
     * 하단 탭 바의 이름과 아이콘을 정의합니다.
     */
    tabs: {
        home: "나의 암기장", // 첫 번째 탭 제목
        shared: "자료실", // 두 번째 탭 제목
        stats: "통계", // 세 번째 탭 제목
        settings: "설정", // 네 번째 탭 제목
        icons: {
            home: "book", // 홈 탭 아이콘 (FontAwesome)
            shared: "globe", // 자료실 탭 아이콘
            stats: "bar-chart", // 통계 탭 아이콘
            settings: "gear", // 설정 탭 아이콘
            libraries: "books", // 암기장 목록 아이콘
        }
    },

    /**
     * 홈 화면 (나의 암기장 리스트)에서 사용하는 텍스트들입니다.
    /**
     * 홈 화면 ((탭)/index.tsx) - 나의 암기장 리스트 화면
     */
    home: {
        greeting: (name: string) => `안녕하세요, ${name}님! 👋`, // 상단 인사말
        subGreeting: "오늘도 목표를 달성하고 지식을 쌓아보세요.", // 인사말 하단 문구
        sectionTitle: "나의 암기장", // 리스트 제목
        reorderDone: "순서 완료", // 정렬 모드 종료 버튼
        reorderStart: "순서 변경", // 정렬 모드 시작 버튼
        newLibrary: "새 암기장", // 암기장 생성 버튼
        emptyDescription: "작성된 설명이 없습니다.", // 설명이 비었을 때 문구
        emptyPrompt: "첫 번째 암기장을 만들어 학습을 시작해보세요!", // 빈 화면 안내 문구
        editAction: "수정하기", // 카드 메뉴 - 수정
        deleteAction: "삭제하기", // 카드 메뉴 - 삭제
        icons: {
            more: "ellipsis-v", // 카드 우측 상단 더보기 아이콘
            items: "file-text-o", // 단어 개수 아이콘
            date: "calendar-o", // 날짜 아이콘
            arrowRight: "angle-right", // 카드 우측 화살표 아이콘
            up: "arrow-up", // 순서 올리기 아이콘
            down: "arrow-down", // 순서 내리기 아이콘
            bell: "bell-o", // 상단 알림 아이콘 ((탭)/index.tsx)
        },
        searchPlaceholder: "암기장 제목 검색...", // 암기장 검색 플레이스홀더
        images: {
            libraryDefault: "https://cdn-icons-png.flaticon.com/512/3389/3389081.png", // 암기장 기본 아이콘 이미지 URL
        }
    },

    /**
     * 암기장 생성/수정 폼 (library/create.tsx, library/edit.tsx)
     */
    libraryForm: {
        createTitle: "새 암기장 만들기", // library/create.tsx 화면 타이틀
        editTitle: "암기장 수정", // library/edit.tsx 화면 타이틀
        labelTitle: "제목 *", // 제목 입력 필드 라벨
        labelDesc: "설명", // 설명 입력 필드 라벨
        labelCategory: "카테고리", // 카테고리 입력 필드 라벨
        placeholderTitle: "예: 토익 보카 2024", // 제목 플레이스홀더
        placeholderDesc: "이 암기장에 대한 설명 (선택)", // 설명 플레이스홀더
        placeholderCategory: "예: 영어, 자격증, IT", // 카테고리 플레이스홀더
        submitCreate: "만들기", // 생성 완료 버튼
        submitEdit: "수정 완료", // 수정 완료 버튼
        validationTitle: "제목을 입력해주세요.", // 제목 미입력 에러
        deleteBtn: "암기장 삭제하기", // library/edit.tsx 삭제 버튼
        deleteConfirm: "정말 이 암기장을 삭제하시겠습니까?\n포함된 모든 단어가 함께 삭제됩니다.", // 삭제 확인 메시지
        deleteSuccess: "암기장이 삭제되었습니다.", // library/create·edit 삭제 왕료 (공통 값)
        fetchError: "정보를 불러오지 못했습니다.", // 데이터 로드 실패 메시지
        deleteFail: "삭제 실패", // 삭제 실패 알림 제목 (공통: common.deleteConfirmTitle 사용)
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
    },
    /**
     * 1:1 문의 및 건의사항 제출 화면 텍스트입니다.
     */
    support: {
        screenTitle: "Q&A 및 건의사항",
        description: "앱 사용 중 궁금한 점이나 개선이 필요한 점, 발견하신 버그를 알려주세요. 관리자가 확인 후 답변 드리거나 반영하겠습니다.",
        labelCategory: "카테고리",
        labelTitle: "제목",
        labelContent: "내용",
        placeholderTitle: "제목을 입력하세요",
        placeholderContent: "내용을 입력하세요 (버그 제보 시 발생 상황을 상세히 적어주시면 큰 도움이 됩니다)",
        submitBtn: "제출하기",
        alerts: {
            enterAll: "제목과 내용을 모두 입력해주세요.",
            submitSuccess: "소중한 의견이 제출되었습니다. 확인 후 처리해 드리겠습니다.",
            submitError: "제출 중 문제가 발생했습니다:",
        },
        categories: {
            qa: "Q&A",
            suggestion: "건의사항",
            bug: "버그",
        }
    },
    /**
     * 사용자용 공지사항 목록/상세 화면 텍스트입니다.
     */
    notices: {
        screenTitle: "공지사항",
        detailTitle: "공지사항 상세",
        badgeImportant: "중요",
        empty: "등록된 공지사항이 없습니다.",
        notFound: "공지사항을 찾을 수 없습니다.",
        createdAt: (date: string) => `등록일: ${date}`,
        important: "중요",
    },
    /**
     * 사용자용 푸시 알림 목록/상세 화면 텍스트입니다.
     */
    notifications: {
        screenTitle: "알림",
        detailTitle: "알림 상세",
        markAllRead: "모두 읽음",
        empty: "새로운 알림이 없습니다.",
        deleteConfirm: "알림을 삭제하시겠습니까?",
        deleteConfirmDetail: "이 알림을 삭제하시겠습니까?",
        deleteTitle: "알림 삭제",
        notFound: "알림을 찾을 수 없습니다.",
        fetchFail: "알림을 불러오는 데 실패했습니다.",
        deleteFail: "알림 삭제에 실패했습니다.",
        noData: "데이터가 없습니다.",
        types: {
            study: "학습 알림",
            system: "시스템 알림",
        }
    },

    /**
     * 멤버십 결제 및 플랜 관련 텍스트입니다.
     */
    membership: {
        screenTitle: "멤버십 플랜", // 화면 타이틀
        subtitle: "나에게 딱 맞는 학습 플랜을 선택하고\n더 효율적으로 암기하세요.", // 서브 타이틀
        currentPlan: "현재 플랜", // 현재 사용중 배지
        using: "사용 중", // 사용중 버튼 텍스트
        upgrade: "플랜 업그레이드", // 업그레이드 버튼 텍스트
        checkMaintenance: "현재 멤버십 결제 기능 준비 중입니다. 잠시 후 다시 이용해 주세요.", // 시스템 점검 문구
        alerts: {
            alreadySubscribed: "이미 사용 중인 플랜입니다.",
            limitReachedTitle: "생성 한도 초과",
            limitReachedMsg: "현재 플랜의 생성 한도에 도달했습니다. 더 많은 암기장을 만드려면 플랜을 업그레이드하세요.",
        },
        plans: {
            basic: {
                name: "BASIC",
                price: "무료",
                features: ['최대 5개의 암기장', '암기장당 50개 단어', '기본 학습 통계', '광고 포함'],
            },
            premium: {
                name: "PREMIUM",
                price: "₩4,900 /월",
                features: ['암기장 무제한 생성', '단어 등록 무제한', '광고 제거', '모든 테마 사용 가능', '우선 순위 지원'],
            },
            pro: {
                name: "PRO",
                price: "₩9,900 /월",
                features: ['PREMIUM 모든 기능', '마켓플레이스 공유', '고급 학습 통합 분석', '클라우드 실시간 동기화'],
            }
        }
    },

    /**
     * 설정 화면 메뉴 및 프로필 관리 관련 텍스트입니다.
     */
    settings: {
        guestName: "사용자", // 닉네임 없을 때 표시
        idLabel: (id: string | number) => `UID: #${id}`, // 유저 ID 표시 고정 텍스트
        sectionAccount: "계정 서비스", // 계정 영역 제목
        sectionApp: "앱 환경 설정", // 앱 설정 영역 제목
        menuMembership: "멤버십 관리",
        menuProfile: "프로필 관리",
        menuNotice: "공지사항",
        menuSupport: "Q&A 및 건의사항",
        menuSignOut: "로그아웃",
        menuTheme: "테마 설정",
        themeTitle: "테마 설정",
        themeSubtitle: "앱의 테마를 선택해주세요.",
        menuPush: "푸시 단어 암기 알림",
        menuPushDetail: "상세 설정 변경하기",
        studyProgress: "학습 진행도",
        menuVersion: "버전 정보",
        menuAccountManage: "계정 관리",

        themeModes: {
            light: "라이트 모드",
            dark: "다크 모드",
            system: "시스템 설정",
        },

        options: {
            notificationOff: "초기화",
        },

        profile: {
            labelNickname: "닉네임",
            labelAccount: "로그인 계정 (이메일)",
            placeholderNickname: "2~8자 입력",
            hintNickname: "닉네임은 2자에서 8자까지 설정 가능합니다.",
            withdraw: "회원 탈퇴",
            editTitle: "프로필 관리",
            changeSuccess: "닉네임이 변경되었습니다.",
        },

        icons: {
            userCircle: "user-circle-o",
            pencil: "pencil",
            star: "star",
            user: "user-o",
            bullhorn: "bullhorn",
            question: "question-circle-o",
            signOut: "sign-out",
            themeSun: "sun-o",
            themeMoon: "moon-o",
            info: "info-circle",
            lock: "lock",
            cog: "cog",
            refresh: "refresh",
            close: "close",
            check: "check-circle",
            circle: "circle-o",
            down: "chevron-down",
        }
    },

    /**
     * 푸시 알림 상세 설정 모달 관련 텍스트입니다.
     */
    pushModal: {
        title: "알림 상세 설정",
        step1: "1. 학습할 암기장 선택",
        step2: "2. 세부 항목 선택 (소분)",
        labelRange: "문제 범위",
        labelFormat: "노출 형식",
        labelOrder: "출력 순서",
        labelInterval: "알림 간격 (분)",
        unitInterval: "분 마다 알림",
        hintInterval: "최소 10분 이상 설정해야 합니다.",
        submit: "설정 완료",
        libraryPlaceholder: "암기장을 선택해주세요",
        sectionAll: "전체",
        loading: "설정 불러오는 중...",
        librarySelected: "암기장 선택됨",
        sectionSelected: "항목 선택됨",

        ranges: { all: "전체", learned: "외움만", confused: "헷갈림만" },
        formats: { both: "문제+정답", word_only: "문제만", meaning_only: "정답만" },
        orders: { sequential: "순차적", random: "랜덤" },

        alerts: {
            permissionNeeded: "푸시 알림 권한이 필요합니다. 설정에서 권한을 허용해 주세요.",
            selectLibrary: "알림을 받을 암기장을 선택해 주세요.",
            intervalTooShort: "알림 간격은 최소 10분 이상으로 설정해 주세요.",
            resetTitle: "설정 초기화",
            resetMsg: "푸시 알림 설정을 초기화하시겠습니까?",
            resetSuccess: "초기화되었습니다.",
            resetFail: "초기화에 실패했습니다.",
        },
    },

    /**
     * 관리자 전역 설정을 위한 텍스트 및 아이콘입니다.
     */
    admin: {
        welcome: "관리자 개요", // 상단 타이틀
        subWelcome: "시스템 통계 및 운영 현황", // 상단 서브 타이틀
        viewAnalysis: "상세 분석 보기", // 분석 페이지 이동 버튼
        essentialStats: "필수 운영 지표", // 섹션 제목 1
        cumulativeStats: "누적 데이터 요약", // 섹션 제목 2
        recentActivity: "최근 활동 로그", // 섹션 제목 3
        recentActivitySub: "플랫폼 내 주요 발생 이벤트입니다.", // 최근 활동 서브 타이틀
        noActivity: "최근 활동 내역이 없습니다.", // 활동 내역 없을 때

        // 지표 카드 라벨
        stats: {
            dau: "오늘 활성 사용자 (DAU)",
            newUsers: "신규 가입자",
            revenue: "예상 광고 수익",
            error: "시스템 에러",
            totalUsers: "총 사용자",
            totalLibraries: "전체 암기장",
            avgStudy: "평균 학습 시간",
            totalDownloads: "총 다운로드",
        },

        // 지표 하단 부가 설명
        subLabels: {
            mau: (count: number) => `전체 MAU: ${count}`,
            trend: "어제 대비 변동",
            adViews: (count: number) => `오늘 광고 시청: ${count}회`,
            error24h: "최근 24시간 발생 건수",
            userTotal: "전체 회원 수",
            libTotal: "사용자 생성 암기장",
            avgMinute: "회당 평균 학습 (분)",
            downTotal: "자료실 이용 횟수",
        },

        icons: {
            analysis: "bar-chart", // 분석 보기 버튼 아이콘
            dau: "bolt",
            newUsers: "user-plus",
            revenue: "money",
            error: "exclamation-triangle",
            users: "users",
            libraries: "book",
            study: "clock-o",
            download: "download",
            arrowRight: "angle-right",
            success: "check-circle",
            filter: "filter",
        }
    },

    /**
     * 관리자 대시보드 화면 텍스트입니다.
     */
    adminUsers: {
        title: "사용자 관리",
        subtitle: (count: number) => `총 ${count}명의 사용자가 등록되어 있습니다.`,
        searchPlaceholder: "사용자 이메일 검색...",
        table: {
            userInfo: "사용자 정보",
            role: "권한",
            membership: "멤버십",
            joinDate: "가입일",
            manage: "관리",
        },
        roles: {
            admin: "관리자",
            user: "일반",
        },
        prompts: {
            roleChange: (email: string, role: string) => `${email} 님의 권한을 ${role}(으)로 변경하시겠습니까?`,
            membershipChange: "변경할 멤버십 등급을 입력하세요 (BASIC, PREMIUM, PRO):",
            invalidMembership: "올바른 멤버십 등급을 입력해주세요.",
        },
        icons: {
            search: "search",
        }
    },

    /**
     * 지표 상세 조회 (Drill-down) 화면 텍스트입니다.
     */
    adminStats: {
        titles: {
            dau: "오늘 활성 사용자 (DAU) 상세",
            newUsers: "신규 가입자 상세 (최근 7일)",
            errors: "시스템 에러 로그 상세",
            revenue: "광고 수익 발생 상세 (최근 50건)",
            default: "상세 정보",
        },
        headers: {
            email: "사용자 (Email)",
            membership: "멤버십",
            lastAccess: "마지막 접속",
            joinDate: "가입 일시",
            timestamp: "발생 시간",
            errorMessage: "에러 메시지",
            user: "사용자",
            adTime: "시청 시간",
            adType: "유형",
            adLocation: "위치",
        }
    },

    /**
     * 공유 자료실 화면 텍스트입니다.
     */
    shared: {
        title: "공유 자료실",
        subtitle: "최고의 암기 비법을 서로 나누고 함께 성장하세요.",
        tabs: {
            official: "공식 자료실",
            user: "유저 자료실",
        },
        categoryAll: "전체",
        downloadCount: (count: number) => `${count}회`,
        import: "가져오기",
        empty: "공유된 자료가 없습니다.",
        loading: "자료를 불러오는 중...",
        searchPlaceholder: "자료 제목 검색...",

        adModal: {
            title: "자료 받기",
            description: "광고를 시청하시면 이 암기장을 무료로 내 보관함에 추가할 수 있습니다.",
        },

        alerts: {
            downloadSuccess: "내 암기장에 추가되었습니다.",
            downloadFail: "다운로드 실패",
            goLibrary: "바로가기",
            loginRequired: "자료를 다운로드하려면 로그인이 필요합니다.",
            deleteConfirm: "정말 이 자료를 자료실에서 삭제하시겠습니까?",
            deleteSuccess: "자료가 삭제되었습니다.",
            reportConfirm: "정말 이 자료를 부적절한 자료로 신고하시겠습니까?\n신고가 누적되면 해당 자료는 숨김 처리될 수 있습니다.",
            reportCancelConfirm: "이미 신고하신 자료입니다. 신고를 취소하시겠습니까?",
            reportSuccess: "신고가 접수되었습니다. 감사합니다.",
            reportCancelSuccess: "신고가 취소되었습니다.",
            reportFail: "신고 접수 중 오류가 발생했습니다.",
            reportCancelFail: "신고 취소 중 오류가 발생했습니다.",
            updateSuccess: "정보가 수정되었습니다.",
            adRequiredDownload: "광고를 시청하시면 자료를 이용하실 수 있습니다.",
            watchAd: "광고 시청하기",
        },

        edit: {
            title: "공유 자료 수정",
            btnSubmit: "수정 완료",
        },

        report: "신고하기",
        reported: "신고함",

        icons: {
            globe: "globe",
            download: "download",
            plus: "plus",
            search: "search",
            filter: "filter",
        }
    },

    /**
     * 학습 통계 탭 화면 (app/(tabs)/stats.tsx)
     * 단위 텍스트(분/회/개)는 common.unitMinute / common.unitCount / common.unitWord 사용
     */
    statsTab: {
        title: "학습 리포트", // [(tabs)/stats.tsx] 탭 화면 제목
        subtitle: "나의 학습 기록을 한눈에 확인하고 성장을 경험하세요.", // 서브 타이틀
        weeklyTitle: "주간 학습 현황", // 주간 섹션 제목
        dailyTitle: "오늘의 성과", // 일간 섹션 제목
        totalStudyTime: "총 학습 시간", // 통계 카드 라벨
        studyCount: "학습 횟수", // 통계 카드 라벨
        newWords: "새로 배운 단어", // 통계 카드 라벨
        streakMsg: (days: number) => `🔥 현재 ${days}일 연속 학습 중 🔥`, // 스트릭 메시지
        chartTitle: "전체 학습 상태도", // 도넛 차트 제목
        detailLink: "암기장별 상세 분석 보기", // 상세 분석 링크

        legends: {
            learned: "외움", // 외운 단어 범례
            confused: "헷갈림", // 헷갈리는 단어 범례
            undecided: "미완료", // 미완료 단어 범례
        },

        sections: {
            chart: "학습량 추이", // 학습 추이 섹션 제목
            achievements: "달성 업적", // 업적 섹션 제목
            insights: "AI 학습 인사이트", // AI 분석 섹션 제목
        },

        empty: "학습 데이터가 부족합니다.\n지금 바로 암기를 시작해보세요!", // 데이터 없을 때 안내
    },

    /**
     * 관리자 고급 행태 분석 화면 텍스트입니다.
     */
    adminAnalysis: {
        title: "사용자 행태 분석",
        distributionTitle: "접속 시간대 분포 (최근 7일)",
        distributionSub: "사용자들이 주로 어떤 시간에 학습을 시작하는지 확인합니다.",
        funnelTitle: "학습 전환 퍼널",
        popularTitle: "인기 단어장/주제 랭킹",
        unitHour: (h: number) => `${h}시`,
        unitPerson: (count: number) => `${count}명`,
        unitDownload: (count: number) => `다운로드 ${count}회`,
        other: "기타",
        stages: {
            create: "암기장 생성",
            add: "문제 추가",
            study: "학습 실천 (30일내)",
        }
    },
    /**
     * 관리자 통계 상세 드릴다운(Drill-down) 화면 텍스트입니다.
     * stats/[type].tsx 에서 사용합니다.
     */
    adminStatsDetail: {
        titleDau: "오늘 활성 사용자 (DAU) 상세",
        titleNewUsers: "신규 가입자 상세 (최근 7일)",
        titleErrors: "시스템 에러 로그 상세",
        titleRevenue: "광고 수익 발생 상세 (최근 50건)",
        titleDefault: "상세 정보",
        headers: {
            userEmail: "사용자 (Email)",
            membership: "멤버십",
            lastAccess: "마지막 접속",
            joinDate: "가입 일시",
            occurTime: "발생 시간",
            errorMessage: "에러 메시지",
            user: "사용자",
            watchTime: "시청 시간",
            type: "유형",
            location: "위치",
        },
        empty: "데이터가 없습니다.",
    },
    /**
     * 관리자 사용자 상세 정보 화면 텍스트입니다.
     * users/[id].tsx 에서 사용합니다.
     */
    adminUserDetail: {
        title: "사용자 상세 정보",
        statLibrary: "암기장",
        statRecent: "최근 학습",
        statJoin: "가입일",
        sectionActivity: "최근 학습 활동 (최근 10개)",
        emptyActivity: "학습 기록이 없습니다.",
        correct: "맞춤",
        wrong: "틀림",
        studyTime: (min: number, sec: number) => `학습 시간: ${min}분 ${sec}초`,
        backBtn: "목록으로 돌아가기",
        fetchError: "사용자 정보를 불러올 수 없습니다.",
    },

    /**
     * 관리자 공지사항 관리 화면 텍스트입니다.
     */
    adminNotices: {
        title: "공지사항 관리",
        subtitle: "시스템 공지 및 주요 안내 사항 관리",
        newNotice: "새 공지 작성",
        table: {
            content: "공지 내용",
            regDate: "등록 일시",
            manage: "관리",
        },
        modal: {
            viewTitle: "공지사항 상세",
            editTitle: "공지사항 수정",
            createTitle: "새 공지사항",
            labelImportant: "중요 공지 설정",
            labelTitle: "제목",
            labelContent: "내용",
            placeholderTitle: "공지 제목을 입력하세요",
            placeholderContent: "공지 내용을 입력하세요",
            btnUpdate: "수정하기",
            btnEdit: "수정",
            btnCreate: "등록",
        },
        alerts: {
            enterAll: "제목과 내용을 모두 입력해주세요.",
            saveSuccess: "공지사항이 등록되었습니다.",
            updSuccess: "공지사항이 수정되었습니다.",
            saveError: "저장 중 오류가 발생했습니다.",
            delConfirm: "정말 이 공지사항을 삭제하시겠습니까?",
            delError: "삭제 중 문제가 발생했습니다.",
            empty: "등록된 공지사항이 없습니다.",
            importantTag: "[중요]",
        }
    },

    /**
     * 관리자 가입/카테고리 관리 화면 텍스트입니다.
     */
    adminCategories: {
        title: "카테고리 설정",
        subtitle: "공유 자료실 분류 체계 및 정렬 순서 설정",
        addBtn: "신규 카테고리",
        table: {
            index: "#",
            title: "카테고리 명칭",
            manage: "관리",
        },
        modal: {
            addTitle: "새 카테고리 추가",
            editTitle: "카테고리 이름 수정",
            placeholder: "예: 비즈니스 영어, JLPT N1 등",
            save: "저장하기",
        },
        alerts: {
            enterName: "카테고리 이름을 입력해주세요.",
            deleteConfirm: (title: string) => `"${title}" 카테고리를 삭제하시겠습니까?\n이 카테고리에 속한 자료들은 카테고리 미지정 상태가 됩니다.`,
            empty: "등록된 카테고리가 없습니다.",
        }
    },
    /**
     * 관리자 1:1 문의 관리 화면 텍스트입니다.
     */
    adminInquiries: {
        title: "문의 및 건의사항",
        subtitle: "사용자 피드백 수집 및 이슈 대응 현황",
        filterBtn: "필터링",
        filters: {
            sort: "정렬",
            newest: "최신순",
            oldest: "과거순",
            status: "상태",
            all: "전체",
            resolved: "해결",
            unresolved: "미해결",
            category: "카테고리",
        },
        icons: {
            study: "book",
            library: "folder",
            shared: "globe",
            profile: "user",
            settings: "cog",
            add: "plus",
            edit: "edit",
            delete: "trash",
            more: "ellipsis-v",
            check: "check",
            close: "times",
            globe: "globe",
            filter: "filter",
        },
        categories: {
            qa: "Q&A",
            suggestion: "건의사항",
            bug: "버그",
        },
        status: {
            resolved: "해결됨",
            unresolved: "답변대기",
        },
        details: {
            content: "내용",
            userInfo: "사용자 정보",
            nickname: "닉네임",
            email: "이메일",
            userId: "유저 고유번호",
            none: "미정",
        },
        table: {
            category: "분류",
            content: "내용",
            status: "상태",
            date: "날짜",
            manage: "관리",
        },
        alerts: {
            statusFail: "상태 변경에 실패했습니다.",
            empty: "등록된 문의사항이 없습니다.",
        }
    },
    /**
     * 사용자 암기장에 CSV/Excel 파일로 단어를 가져오는 화면 텍스트입니다.
     * library/[id]/import.tsx 에서 사용합니다.
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
     * 관리자 푸시 알림 발송 화면 텍스트입니다.
     */
    adminNotifications: {
        title: "푸시 알림 센터",
        subtitle: "전체 또는 개별 사용자에게 푸시 알림을 발송합니다.",
        labelTarget: "발송 대상",
        labelTitle: "알림 제목",
        labelContent: "알림 내용",
        labelLink: "이동 링크 (선택사항, 예: /membership)",
        btnSend: "알림 발송하기",
        sending: "발송 중...",
        targets: {
            all: "전체 사용자",
            individual: "개별 사용자 (이메일 지정)",
        },
        placeholders: {
            email: "대상 사용자의 이메일을 입력하세요",
            title: "공지 또는 혜택 안내 제목",
            content: "사용자에게 전달할 핵심 메시지",
        },
        alerts: {
            enterAll: "제목과 내용을 입력해주세요.",
            enterEmail: "개별 전송 시 대상 이메일이 필요합니다.",
            sendConfirm: (count: number) => `총 ${count}명에게 푸시 알림을 발송하시겠습니까?`,
            sendSuccess: "알림 발송 요청이 완료되었습니다.",
            sendError: "발송 중 오류가 발생했습니다.",
        }
    },
    /**
     * 관리자 공유 콘텐츠(마켓플레이스) 총괄 관리 화면 텍스트입니다.
     */
    adminSharedManager: {
        title: "공유 콘텐츠 관리",
        subtitle: "마켓플레이스 자료 큐레이션 및 품질 관리",
        addBtn: "신규 자료 등록",
        tabs: {
            draft: (count: number) => `임시 저장 (${count})`,
            published: (count: number) => `게시 완료 (${count})`,
        },
        table: {
            info: "암기장 정보",
            status: "상태",
            download: "다운로드",
            date: "생성일",
            manage: "관리",
        },
        status: {
            draft: "임시 저장",
            published: "게시됨",
        },
        modal: {
            editTitle: "공유 암기장 수정",
            draftEditTitle: "임시 저장 자료 수정",
            createTitle: "신규 자료 직접 작성 및 게시",
            labelTitle: "제목",
            labelDesc: "설명",
            labelCategory: "카테고리",
            none: "미지정",
            placeholderTitle: "예: [공식] 수능 필수 영단어 TOP 100",
            placeholderDesc: "자료에 대한 상세 설명을 입력하세요.",
            placeholderDescDraft: "설명 (선택)",
        },
        alerts: {
            updated: "수정되었습니다.",
            noSections: "최소 1개 이상의 섹션이 필요합니다.",
            publishConfirm: (title: string) => `"${title}" 자료를 공유 자료실에 정식으로 게시하시겠습니까?`,
            publishSuccess: "공유 자료실에 게시되었습니다!",
            deleteConfirm: (title: string) => `"${title}" 을(를) 삭제하시겠습니까?`,
            deleteSharedConfirm: (title: string) => `"${title}" 게시물을 완전히 삭제하시겠습니까?`,
            unpublishConfirm: (title: string) => `"${title}" 게시물을 임시 저장 상태로 되돌리시겠습니까?\n마켓플레이스에서 더 이상 노출되지 않습니다.`,
            enterTitle: "제목을 입력해주세요.",
            saveSuccess: "임시 저장되었습니다. 임시 저장 탭에서 내용을 추가해주세요.",
            emptyDraft: "임시 저장된 자료가 없습니다.",
            emptyPublished: "게시된 자료가 없습니다.",
        }
    },
    /**
     * 관리자 공유 자료 상세(섹션 목록) 화면 텍스트입니다.
     * shared-library/[id].tsx 에서 사용합니다.
     */
    adminSharedDetail: {
        title: "자료 상세",
        count: (count: number) => `총 ${count}개의 섹션`,
        addSection: "섹션 추가",
        addFirstSection: "첫 번째 섹션 추가하기",
        sectionList: "섹션 목록",
        empty: "섹션을 추가해주세요.",
        modal: {
            createTitle: "새 섹션 추가",
            editTitle: "섹션 수정",
            placeholder: "섹션 이름",
        },
        alerts: {
            enterName: "섹션 이름을 입력해주세요.",
            createFail: "섹션 생성 실패",
            editFail: "섹션 수정 실패",
            deleteConfirm: (title: string) => `'${title}' 섹션을 삭제하시겠습니까? 내부의 모든 문제도 삭제됩니다.`,
            reorderFail: "순서 변경 실패",
        }
    },
    /**
     * 관리자 공유 자료 단어 목록(섹션 상세) 화면 텍스트입니다.
     * shared-library/[id]/section/[sectionId].tsx 에서 사용합니다.
     */
    adminSharedSection: {
        title: "문제 목록",
        count: (count: number) => `총 ${count}개의 문제`,
        addItem: "문제 추가",
        importCsv: "CSV 가져오기",
        addFirstItem: "첫 번째 문제 추가하기",
        empty: "등록된 문제가 없습니다.",
        labelQuestion: "질문 *",
        labelAnswer: "답변 *",
        labelMemo: "메모 (선택)",
        placeholderQuestion: "질문 (앞면)",
        placeholderAnswer: "답변 (뒷면)",
        placeholderMemo: "추가 설명이나 예문",
        modal: {
            createTitle: "문제 추가",
            editTitle: "문제 수정",
        },
        alerts: {
            enterQA: "질문과 답변을 입력해주세요.",
            fetchFail: "데이터를 가져오는데 실패했습니다.",
            addFail: "문제 추가 실패",
            editFail: "문제 수정 실패",
            deleteConfirm: (title: string) => `'${title}' 문제를 삭제하시겠습니까?`,
        }
    },
    /**
     * 관리자 공유 자료 CSV/Excel 대량 임포트 화면 텍스트입니다.
     * shared-library/.../import.tsx 에서 사용합니다.
     */
    adminImport: {
        title: "데이터 대량 등록 (관리자)",
        guide: {
            title: "관리자 업로드 가이드",
            step1: "1. 엑셀(xlsx) 또는 CSV 파일을 준비하세요.",
            step2: "2. 헤더에 '문제', '정답' (또는 'question', 'answer') 컬럼이 필수입니다.",
            step3: "3. '메모' 컬럼은 선택 사항입니다.",
        },
        fileSelect: "파일 선택하기",
        fileChange: "파일 변경",
        preview: (count: number) => `미리보기 (${count}개 항목)`,
        more: (count: number) => `외 ${count}개의 항목...`,
        btnImport: "공유 자료실에 등록하기",
        alerts: {
            noData: "가져올 데이터가 없습니다.",
            invalidAccess: "잘못된 접근입니다.",
            emptyFile: "파일에 데이터가 없거나 형식이 올바르지 않습니다.",
            parseError: "파일을 분석하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.",
            pickError: "파일을 선택하는 중 오류가 발생했습니다.",
            noColumns: "유효한 데이터 컬럼(문제/정답)을 찾지 못했습니다.",
            importSuccess: (count: number) => `${count}개의 항목을 가져왔습니다.`,
            importFail: "가져오기 실패",
        }
    },
    /**
     * 암기장별 세부 학습 상태도 화면 텍스트입니다. (stats 탭 연결)
     */
    stats: {
        detailTitle: "세부 학습 상태도",
    },
    /**
     * 공유 자료실 단일 항목 상세 보기 화면 텍스트입니다. (비관리자용)
     */
    sharedDetail: {
        screenTitle: "상세 보기",
        downloadBtn: "자료 받기",
        downloadGuide: "광고를 시청하시면 이 암기장을 무료로 내 보관함에 추가할 수 있습니다.",
        alerts: {
            loginRequired: "자료를 다운로드하려면 로그인이 필요합니다.",
            downloadSuccess: "내 암기장에 추가되었습니다.",
            goToLibrary: "바로가기",
            downloadFail: "다운로드 실패",
        }
    },
    /**
     * 프로필 설정 및 회원 탈퇴 화면 텍스트입니다.
     */
    profile: {
        screenTitle: "프로필 설정",
        deleteAccount: "회원 탈퇴",
        deleteConfirm: "정말 탈퇴하시겠습니까? 모든 데이터가 영구 삭제되며 복구할 수 없습니다.",
    },
    /**
     * 사용자 암기장 상세(섹션 목록) 화면 텍스트입니다.
     * library/[id].tsx 에서 사용합니다.
     */
    libraryDetail: {
        title: "암기장",
        sectionListHeader: "항목 목록 (Day, Chapter 등)",
        empty: "생성된 항목이 없습니다.",
        addFirst: "첫 번째 항목 추가하기",
        share: "공유하기",
        modal: {
            createTitle: "새 항목 추가",
            editTitle: "항목 이름 수정",
            subtitle: "예: Day 1, Chapter 1, 업무용 단어 등",
            placeholder: "항목 이름을 입력하세요",
            btnAdd: "추가하기",
            btnEdit: "수정하기",
        },
        alerts: {
            enterName: "이름을 입력해주세요.",
            createFail: "섹션 생성 실패",
            editFail: "섹션 수정 실패",
            deleteConfirm: (title: string) => `'${title}' 섹션을 삭제하시겠습니까? 내부의 모든 문제도 삭제됩니다.`,
            deleteFail: "삭제 실패",
            shareConfirm: "이 암기장을 유저 자료실에 공유하시겠습니까?\n공유된 자료는 모든 사용자가 볼 수 있습니다.",
            shareSuccess: "자료실에 성공적으로 공유되었습니다!",
            shareFail: "공유 중 오류가 발생했습니다.",
        }
    },
    /**
     * 사용자 암기장 단어 목록(섹션 상세) 화면 텍스트입니다.
     * library/[id]/section/[sectionId].tsx 에서 사용합니다.
     */
    librarySection: {
        title: "문제 목록",
        count: (count: number) => `총 ${count}개의 문제`,
        empty: "등록된 문제가 없습니다.",
        addFirst: "첫 번째 문제 추가하기",
        playBtn: "이 항목 학습하기",
        menu: {
            reorderStart: "순서 변경",
            reorderEnd: "순서 변경 종료",
            exportPdf: "PDF 내보내기",
            importWords: "문제 가져오기",
        },
        statusModal: {
            title: "상태 변경",
            learned: "외움",
            confused: "헷갈림",
            undecided: "미정",
        },
        itemOptions: {
            title: "작업 선택",
            edit: "수정",
            delete: "삭제",
        },
        alerts: {
            deleteFail: "삭제 실패",
            changeFail: "변경 실패",
            changeError: "오류 발생",
            exportError: "PDF 생성 중 문제가 발생했습니다:",
        }
    },
    /**
     * 단어 추가/수정 폼 화면 텍스트입니다.
     * create-item.tsx / edit-item.tsx 에서 사용합니다.
     */
    itemForm: {
        createTitle: "문제 추가",
        editTitle: "문제 수정",
        labelQuestion: "문제 (단어) *",
        labelAnswer: "정답 (뜻) *",
        labelMemo: "메모",
        placeholderQuestion: "예: Ambiguous",
        placeholderAnswer: "예: 애매모호한, 불분명한",
        placeholderMemo: "예문이나 팁을 적어보세요.",
        submitSave: "저장하기",
        submitSaving: "저장 중...",
        alerts: {
            enterAll: "문제와 정답을 모두 입력해주세요.",
            invalidAccess: "잘못된 접근입니다.",
            notFound: "문제를 찾을 수 없습니다.",
            saveSuccess: "추가되었습니다. 계속 추가하시겠습니까?",
            editSuccess: "수정되었습니다.",
            saveFail: "추가 실패",
            editFail: "수정 실패",
        }
    },
    /**
     * 인앱 웹뷰 화면 텍스트입니다. (이용약관, 개인정보처리방침 등)
     */
    webview: {
        screenTitle: "웹 페이지",
        invalidUrl: "올바르지 않은 주소입니다.",
    },
    userShareModal: {
        title: "자료 공유하기",
        btnNext: "다음",
        btnPrev: "이전",
        btnShare: "공유하기",
        step1: {
            title: "1. 암기장 선택",
            label: "공유할 암기장을 선택하세요",
            placeholder: "암기장 선택",
            empty: "선택할 수 있는 암기장이 없습니다.",
        },
        step2: {
            title: "2. 카테고리 지정",
            label: "자료의 카테고리를 선택하세요",
            placeholder: "카테고리 선택",
        },
        step3: {
            title: "3. 해시태그 추가",
            label: "태그를 입력하세요 (쉼표로 구분)",
            placeholder: "예: 필수, 기초, 토익",
            hint: "최대 5개까지 입력 가능합니다.",
        },
        alerts: {
            selectLibrary: "공유할 암기장을 선택해 주세요.",
            selectCategory: "카테고리를 지정해 주세요.",
            uploadSuccess: "유저 자료실에 성공적으로 등록되었습니다!",
            uploadFail: "등록에 실패했습니다.",
        }
    },
    /**
     * 관리자 유저 자료 관리 화면 텍스트입니다.
     */
    adminUserShared: {
        title: "유저 자료 관리",
        subtitle: "사용자들이 공유한 자료 모니터링 및 관리",
        menuTitle: "유저 자료실 관리",
        menuSub: "신고된 누적 자료 확인 및 노출 제어",
        table: {
            title: "자료 제목",
            owner: "작성자",
            reports: "신고",
            status: "상태",
            manage: "관리",
        },
        status: {
            visible: "노출 중",
            hidden: "숨김 처리됨",
        },
        btns: {
            hide: "숨기기",
            show: "노출하기",
            delete: "완전 삭제",
        },
        alerts: {
            hideConfirm: "이 자료를 자료실에서 숨기시겠습니까?",
            showConfirm: "이 자료를 다시 자료실에 노출하시겠습니까?",
            hideSuccess: "숨김 처리되었습니다.",
            showSuccess: "노출 설정되었습니다.",
            delConfirm: "이 자료를 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
            delSuccess: "자료가 영구 삭제되었습니다.",
        }
    }
};
