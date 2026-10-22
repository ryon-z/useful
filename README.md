# 🧰 USEFUL (유용한 생활 도구 모음)

> **일상에 꼭 필요한 라이프 유틸리티 & 웹 도구 포털**  
> GitHub Pages(정적 호스팅)와 GitHub Actions(Serverless Cron 파이프라인)를 통해 서버 비용 **0원**으로 운영되는 웹 플랫폼입니다.

---

## 🌐 서비스 바로가기

- **통합 포털 홈**: [https://ryon-z.github.io/useful/](https://ryon-z.github.io/useful/)
- **🍀 사주 로또 6/45 명당 & 실시간 분석기**: [https://ryon-z.github.io/useful/lottery/](https://ryon-z.github.io/useful/lottery/)

---

## 🛠️ 제공 및 개발 예정 도구 목록

| 도구명 | 디렉터리 | 상태 | 주요 기능 |
| :--- | :--- | :---: | :--- |
| **사주 로또 명당 & 실시간 분석기** | [`/lottery/`](./lottery/) | **운영 중** | 1·2등 실시간 당첨금, 사주 오행 5게임 추천, 통계 필터 번호 생성기, 실수령액 세금 계산기 (50대 시니어 가독성 최적화) |
| **만 나이 & 띠·천간지지 계산기** | `/age/` (예정) | 준비 중 | 개정 법적 만 나이, 연 나이, 세는 나이 및 12간지 띠·육십갑자 계산 |
| **예·적금 만기 이자 계산기** | `/interest/` (예정) | 준비 중 | 예금·적금 단리/복리 계산, 15.4% 이자과세 공제 후 실수령액 계산 |
| **D-Day & 음력·양력 변환기** | `/dday/` (예정) | 준비 중 | 음력/양력 기념일 및 제사일 변환, D-Day 카운트다운 |

---

## 📂 저장소 전체 구조 (Repository Tree)

```text
useful/
├── index.html                   # USEFUL 통합 도구 모음 포털 메인 페이지
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
