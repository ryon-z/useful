# 🌐 GoModo (고모도) - 일상 생활 유틸리티 포털

> **일상에 꼭 필요한 라이프 유틸리티 & 웹 도구 포털**  
> 공식 도메인: [https://www.gomodo.cloud/](https://www.gomodo.cloud/)  
> GitHub Pages(정적 호스팅)와 GitHub Actions(Serverless Cron 파이프라인)를 통해 서버 비용 **0원**으로 운영되는 오픈형 웹 플랫폼입니다.

---

## 🌐 서비스 바로가기

- **통합 포털 홈**: [https://www.gomodo.cloud/](https://www.gomodo.cloud/)
- **🍀 사주 로또 6/45 명당 & 실시간 분석기**: [https://www.gomodo.cloud/lottery/](https://www.gomodo.cloud/lottery/)
- **📅 만 나이 & 띠·천간지지 계산기**: [https://www.gomodo.cloud/age/](https://www.gomodo.cloud/age/)
- **💰 예·적금 만기 이자 & 실수령액 계산기**: [https://www.gomodo.cloud/interest/](https://www.gomodo.cloud/interest/)
- **⏳ D-Day 및 음력·양력 기념일 변환기**: [https://www.gomodo.cloud/dday/](https://www.gomodo.cloud/dday/)

---

## 🛠️ 제공 도구 라인업

| 도구명 | 디렉터리 | 상태 | 주요 기능 |
| :--- | :--- | :---: | :--- |
| **사주 로또 명당 & 실시간 분석기** | [`/lottery/`](./lottery/) | **운영 중** | 1·2등 실시간 당첨금, 사주 오행 5게임 추천, 통계 필터 번호 생성기, 실수령액 세금 계산기 (50대 시니어 가독성 최적화) |
| **만 나이 & 띠·천간지지 계산기** | [`/age/`](./age/) | **운영 중** | 개정 법적 만 나이, 연 나이, 세는 나이 및 12간지 띠·색상·육십갑자, 생애 주기별 복지 혜택 & 국민연금 개시 연령 안내 |
| **예·적금 만기 이자 계산기** | [`/interest/`](./interest/) | **운영 중** | 정기예금·적금 단리/복리 계산, 15.4% 일반과세, 9.5% 세금우대, 비과세종합저축 절세 비교, 월별 납입 스케줄표 |
| **D-Day & 음력·양력 변환기** | [`/dday/`](./dday/) | **운영 중** | 한국천문연구원 음양력 정밀 변환, 부모님 음력 생신·제사일 3개년 양력 조회, 환갑·칠순·팔순 수연 나이 계산 |

---

## 📂 저장소 전체 구조 (Repository Tree)

```text
useful/
├── CNAME                        # 공식 커스텀 도메인 (www.gomodo.cloud)
├── index.html                   # GoModo 통합 도구 모음 포털 메인 페이지
├── ads.txt                      # Google AdSense 루트 인증 파일
├── README.md                    # 본 문서 (전체 저장소 가이드)
│
├── lottery/                     # [도구 1] 사주 로또 6/45 분석기
│   ├── index.html               # 50대 최적화 로또 웹 애플리케이션
│   ├── manifest.json            # PWA 웹 앱 매니페스트
│   ├── sw.js                    # 오프라인 캐싱 서비스 워커
│   ├── data/
│   │   └── latest.json          # 최신 회차 당첨 데이터 (JSON)
│   └── README.md                # 로또 도구 전용 상세 사양서
│
├── age/                         # [도구 2] 만 나이 & 띠·천간지지 계산기
│   ├── index.html               # 만 나이, 띠, 연령별 복지 혜택 웹 애플리케이션
│   ├── manifest.json            # PWA 웹 앱 매니페스트
│   └── sw.js                    # 오프라인 캐싱 서비스 워커
│
├── interest/                    # [도구 3] 예·적금 만기 이자 & 실수령액 계산기
│   ├── index.html               # 단리/복리, 과세 비교 웹 애플리케이션
│   ├── manifest.json            # PWA 웹 앱 매니페스트
│   └── sw.js                    # 오프라인 캐싱 서비스 워커
│
├── dday/                        # [도구 4] D-Day 및 음력·양력 변환기
│   ├── index.html               # 음양력, 부모님 생신/제사일, 칠순 계산기
│   ├── korean-lunar-calendar.min.js # 한국천문연구원 음양력 엔진
│   ├── manifest.json            # PWA 웹 앱 매니페스트
│   └── sw.js                    # 오프라인 캐싱 서비스 워커
│
├── about/                       # GoModo 서비스 소개 및 문의 (About & Contact)
├── terms/                       # 이용약관 및 면책조항 (Terms of Service)
├── privacy/                     # 개인정보처리방침 (Google AdSense 쿠키 고지)
│
├── scripts/
│   └── fetch-lotto.js           # 동행복권 API 호출 및 lottery/data 갱신 크롤러
│
└── .github/workflows/
    └── update-lotto.yml         # 매주 토요일 21:15, 21:45 KST 자동 크론잡
```

---

## 🚀 배포 및 자동화

1. **GitHub Pages 배포**:
   - `Settings` > `Pages` > `Source: Deploy from a branch` (`main` / `root`)
2. **백그라운드 데이터 수집 (GitHub Actions)**:
   - 매주 토요일 저녁 21:15, 21:45 KST에 `.github/workflows/update-lotto.yml`이 자동 실행되어 동행복권 공식 API 데이터를 `lottery/data/latest.json`에 최신으로 반영합니다.
   - 로컬 테스트 명령어:
     ```bash
     node scripts/fetch-lotto.js
     ```

---

## 📜 라이선스 및 유의사항
- 본 프로젝트는 일상 편의를 위한 무료 오픈소스 웹 유틸리티 모음입니다.
- 복권 관련 콘텐츠는 건전한 오락 목적의 참고용 서비스입니다.
