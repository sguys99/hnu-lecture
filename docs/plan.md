# AI 세미나 Q&A 정적 웹사이트 상세 작업 계획서

## Context

`docs/PRD.md` v1.0(AI 세미나 Q&A 정적 웹사이트)을 구현하기 위한 단계별 작업 계획서다.
대학원생 대상 AI 세미나에서 수집한 **19개 질문**(`docs/question.md`)을 카드 피드로 전시하고,
카드 클릭 시 질문 전문과 사전 작성 답변을 상세 뷰로 보여주는 **무빌드(build-less) 정적 사이트**를
순수 HTML/CSS/JS로 구현하여 GitHub Pages(상대 경로, 서브패스)로 배포한다.

**현재 구현 상태:** Next.js 템플릿 셸만 존재(빈 상태). 루트에 `index.html`/`styles.css`/`app.js` 없음,
`data/questions.json` 미생성. 단, `docs/question.md`(19문항), `DESIGN.md`(디자인 토큰), `docs/PRD.md`는 모두 준비됨.

**핵심 결정 사항(사용자 확정):**
1. **답변 렌더링** — 답변을 마크다운으로 `questions.json`에 저장하고, `app.js`에 **외부 의존성 없는 경량 MD→HTML 미니 파서**(불릿·번호·표)를 직접 구현.
2. **답변 본문 작성** — 19개 답변(개조식·400자 미만·웹검색 검증) 작성을 **별도 Phase로 본 계획에 포함**.
3. **다크모드** — `ThemeToggle`을 **MVP 범위에 포함**(`DESIGN.md` 다크 타일 토큰 활용, 라이트 우선·시스템 설정 존중).

**기술 제약(PRD §9):** 순수 HTML/CSS/JS, 번들러·npm 의존성 없음. 외부 의존성은 CDN 폰트(Pretendard)만 허용.
상대 경로 동작. 단일 액센트 `#0066cc`, UI 크롬 그림자 금지, 카드 radius 18px·1px hairline(#e0e0e0)·padding 24px, 본문 17px.

---

## Phase 0: 프로젝트 정리 및 파일 스켈레톤

**목표:** 무빌드 정적 사이트 기반 구조 확보(불필요한 템플릿 잔재 제거 + 빈 파일 골격 생성)

### 0-1. 스타터 잔재 정리
- [x] 루트의 Next.js 템플릿 잔재(불필요한 `components.json`, shadcn 관련 설정 등) 영향 여부 확인 — 정적 사이트와 무관하므로 그대로 두고 README를 정적 사이트 기준으로 갱신
- [x] `.gitignore`에 정적 사이트 배포 산출물/임시 파일 정책 확인 — `data/{raw,intermediate,processed}/*`만 무시, `data/questions.json`은 추적됨(수정 불필요)

### 0-2. 파일 골격 생성(상대 경로 기준)
- [x] `index.html` — 마크업 스켈레톤 + Pretendard CDN 링크 + `styles.css`/`app.js` **상대 경로** 로드(`./styles.css`, `./app.js`)
- [x] `styles.css` — 빈 파일(Phase 2에서 토큰 채움)
- [x] `app.js` — 빈 파일(Phase 3~6에서 로직 채움)
- [x] `data/questions.json` — 빈 `{"questions": []}` 골격

### 0-3. 로컬 미리보기 확인
- [x] `python3 -m http.server`로 루트 서빙 → `index.html`/`styles.css`/`app.js`/`data/questions.json` 모두 200 응답 확인, `json.tool` 유효성 통과(빌드 도구 없이 동작)

---

## Phase 1: 데이터 모델 (questions.json 스키마)

**목표:** PRD §6 스키마를 확정하고 샘플 데이터로 구조 검증
**의존성:** Phase 0

### 1-1. 스키마 확정
- [x] PRD §6.1 필드(`id`, `part`, `partTitle`, `title`, `question`, `answer`) 기준으로 JSON 스키마 확정
- [x] Part 구성 매핑 확정: Part 1(Q1~Q6) / Part 2(Q7~Q11) / Part 3(Q12~Q19)

### 1-2. 질문 19개 메타·전문 채우기(답변 제외)
- [x] `docs/question.md`의 19문항 소제목·질문 전문을 **원문 그대로** `questions.json`에 입력(`answer`는 빈 문자열로 보류)
- [x] `id` 1~19, `part`/`partTitle` 정확히 매핑

### 1-3. 샘플 답변 1~2개 + 검증
- [x] 대표 1~2문항에 마크다운 답변(불릿+표 포함) 임시 작성 → 렌더링 파이프라인 테스트용 시드 확보(Q1: 불릿·번호·강조·표, Q19: 입장형 답변)
- [x] JSON 유효성 검사(`python3 -m json.tool data/questions.json`)

---

## Phase 2: 핵심 스타일 (DESIGN.md 토큰 → CSS)

**목표:** `DESIGN.md` 토큰을 CSS 변수로 정의하고 라이트/다크 테마 기반 마련
**의존성:** Phase 0 (Phase 3~7과 병렬 보완 가능)

### 2-1. CSS 변수(디자인 토큰)
- [x] `:root`에 토큰 정의: 참조(global-ai-news) globals.css 값 채택 — 캔버스 `#f5f5f7`/`#ffffff`, foreground `#1d1d1f`, hairline `#e0e0e0`, radius 18px(`rounded.lg`)·pill, spacing 스케일, 본문 17px(line-height 1.47). 모노크롬 잉크 모델 — 파랑 `#0066cc`는 본문 인라인 링크 전용(`--link`)
- [x] 폰트 스택: `'Pretendard', 'SF Pro Text', system-ui, -apple-system, sans-serif`
- [x] 다크 테마 변수 세트 정의(`[data-theme="dark"]`, 참조 다크 토큰 `#000`/`#1d1d1f`/`#333` 기준) + `prefers-color-scheme` 기본값(명시적 속성 우선)

### 2-2. 기본 레이아웃·타이포 규칙
- [x] 헤더("AI 세미나 Q&A", sticky+backdrop-blur+hairline)/푸터 스타일, 본문 타이포 래더(300/400/600/700, weight 500 금지)
- [x] **Do/Don't 준수**: 단일 액센트(모노크롬+인라인 링크 파랑), UI 크롬 그림자 금지, radius grammar 혼용 금지

---

## Phase 3: 메인 뷰 (카드 그리드 + 필터 탭)

**목표:** 홈 화면에 Part별 카드 그리드 + 필터 탭 구현 (PRD §3.2)
**의존성:** Phase 1, Phase 2

### 3-1. 데이터 로드
- [x] `app.js`에서 `fetch('./data/questions.json')`(상대 경로) → 파싱 → 상태 보관

### 3-2. 필터 탭 (pill)
- [x] `전체` / `Part 1` / `Part 2` / `Part 3` pill 탭 렌더링 + 활성 상태 표시(모노크롬 색반전)
- [x] 필터 선택 시 해당 Part 카드만 표시(전체는 Part별 섹션 헤더로 그룹화)

### 3-3. 질문 카드
- [x] 카드 구성: 질문 번호(Q1 등) · Part 뱃지 · 소제목 · 질문 요약 미리보기(3줄 클램프)
- [x] 카드 전체 클릭 가능 영역(`<a href="#/q/{id}">`, 터치 타깃 ≥ 44×44px) → 클릭 시 `#/q/{id}` 이동
- [x] 카드 스타일: 1px hairline 보더, radius 18px, padding 24px, 그림자 없음

---

## Phase 4: 상세 뷰 + 해시 라우팅 + 딥링크

**목표:** SPA 해시 라우팅으로 메인↔상세 전환 + 딥링크 (PRD §3.3, §7)
**의존성:** Phase 3

### 4-1. 해시 라우터
- [x] `hashchange` + 초기 로드 시 라우팅 처리: `#/`(또는 해시 없음)→메인, `#/q/{id}`→상세
- [x] 존재하지 않는 `id`는 메인 뷰로 폴백(또는 안내)

### 4-2. 상세 뷰 렌더링
- [x] 질문 메타(Part·번호) + 질문 전문 + 답변 영역 렌더링
- [x] "← 목록으로" 버튼 + 브라우저 뒤로가기 모두 지원
- [x] (추가) 상세 하단 이전/다음 질문 내비게이션

### 4-3. 딥링크 검증
- [x] `#/q/3` 직접 진입·새로고침 시 상세 뷰 복원 확인

---

## Phase 5: 마크다운 → HTML 답변 렌더링 (미니 파서)

**목표:** 외부 의존성 없는 경량 MD→HTML 변환기 구현 (PRD §3.4)
**의존성:** Phase 4

### 5-1. 미니 파서 구현
- [x] `app.js`에 MD→HTML 변환 함수 구현: 불릿(`- `)·번호 목록(`1. `)·표(`| ... |`)·강조(`**`/`*`)·줄바꿈 처리 + (확장) 인라인 링크·`##`/`###` 제목·단독 굵은 줄 소제목 승격
- [x] XSS 방지: 모든 텍스트 `escapeHtml` 선통과 후 화이트리스트 태그만 주입, 링크는 안전 스킴(`http(s)`/`mailto`/`#`/상대경로)만 허용(`javascript:` 차단)

### 5-2. 상세 뷰 연결
- [x] `answer` 마크다운 → `parseMarkdown()` → 상세 뷰 답변 HTML 주입(`renderAnswer`), `.prose` prose 스타일 추가(목록·표 헤어라인 그리드·소제목)

### 5-3. 파서 검증(스크립트성 점검)
- [x] 불릿/번호/표/강조/제목/링크/XSS 혼합 샘플 18종 변환 결과 점검(`app.js`에서 실제 함수 추출해 Node로 검증) — 전부 통과

---

## Phase 6: 반응형 + 다크모드 토글 + 접근성

**목표:** 전 화면 폭 대응 + ThemeToggle + 접근성 마무리 (PRD §3.5, §4)
**의존성:** Phase 3, Phase 4, Phase 5

### 6-1. 반응형 레이아웃
- [x] 카드 그리드: 데스크톱 3열(참조 repo 동일) → 태블릿 2열(640px) → 모바일 1열(1024px 분기) — Phase 3에서 구현, 참조와 일치 확인
- [x] 상세 뷰 가독 폭 제한(`--reading-max: 672px`) + 모바일 좌우 패딩 축소(≤640px `--space-md`)

### 6-2. 다크모드 토글
- [x] `ThemeToggle` UI(헤더, lucide 스타일 Sun/Moon 인라인 SVG·ghost 버튼) + `[data-theme]` 전환 로직(`app.js`)
- [x] 선택값 `localStorage`(`theme`) 저장 + 초기 로드 시 시스템 설정(`prefers-color-scheme`) 존중 + `<head>` 부트스트랩으로 FOUC 방지

### 6-3. 접근성·내비게이션
- [x] 터치 타깃 ≥ 44×44px(토글 44×44) 확인, 전역 `:focus-visible` 포커스 링·네이티브 `<button>` 키보드 지원, 동적 한국어 `aria-label`
- [x] 브라우저 뒤로가기로 메인↔상세 이동 정상 동작 재확인(기존 라우터 회귀 점검)

---

## Phase 7: 답변 콘텐츠 작성 (19문항)

**목표:** 19개 답변을 PRD §3.1 규칙대로 작성하여 `questions.json` 완성
**의존성:** Phase 1(스키마), Phase 5(렌더링 확인) — UI와 병렬 진행 가능

### 7-1. 답변 작성 규칙 적용
- [ ] 각 답변 **400자 미만(한글)**, **개조식**(불릿·번호·표), 줄글 지양
- [ ] 대학원생이 실무·연구에 바로 활용 가능한 구체적 수준
- [ ] 철학적 문항(Q12~Q19)은 **강사로서 명확한 입장 + 핵심 근거 2~3개** 개조식 제시
- [ ] 출처/참고 링크는 본문에 미포함(웹검색은 검증 용도)

### 7-2. 웹검색 검증 문항 작성
- [ ] Part 1·2 도구/기법 문항 + Q13(Mechanistic Interpretability), Q14(Emergent Ability), Q16(The Bitter Lesson), Q18(Chinese Room) **웹검색 검증 후 작성**

### 7-3. Part별 일괄 작성·점검
- [ ] Part 1 (Q1~Q6) 답변 작성·렌더링 확인
- [ ] Part 2 (Q7~Q11) 답변 작성·렌더링 확인
- [ ] Part 3 (Q12~Q19) 답변 작성·렌더링 확인
- [ ] 19문항 전부 400자 미만·개조식 충족 최종 검수

---

## Phase 8: 배포 및 검증 (GitHub Pages)

**목표:** GitHub Pages(서브패스, 상대 경로) 배포 및 성공 지표 검증
**의존성:** 모든 Phase 완료

### 8-1. 상대 경로·배포 점검
- [ ] 모든 자원(`styles.css`, `app.js`, `data/questions.json`, 폰트)이 **상대 경로**로 로드되는지 확인(서브패스 `username.github.io/repo/` 가정)
- [ ] GitHub Pages 설정(브랜치/디렉토리) 및 배포

### 8-2. 성공 지표 검증 (PRD §10)
- [ ] 답변 완성도: 19문항 전부 작성(400자 미만·개조식)
- [ ] 핵심 플로우: 카드 그리드 → 카드 클릭 → 상세 전환 → 목록 복귀 정상
- [ ] 딥링크: `#/q/N` 새로고침·직접 진입 시 상세 유지
- [ ] 디자인 일관성: `#0066cc`, radius 18px, 본문 17px, 그림자 미사용 준수
- [ ] 반응형: 데스크톱 3~4열 → 태블릿 2열 → 모바일 1열 전환
- [ ] 배포: GitHub Pages(서브패스) 상대 경로 정상 동작

---

## Phase 의존성 다이어그램

```
Phase 0 (스켈레톤)
    │
    ├── Phase 1 (데이터 모델)
    │       │
    │       ├── Phase 3 (메인 뷰) ←── Phase 2 (스타일)
    │       │       │
    │       │       └── Phase 4 (상세 + 라우팅)
    │       │                   │
    │       │            Phase 5 (MD 렌더링)
    │       │                   │
    │       │            Phase 6 (반응형 + 다크모드 + 접근성)
    │       │
    │       └── Phase 7 (답변 작성) ←── Phase 5 확인 후 병렬 가능
    │
    └── Phase 8 (배포 / 검증) ←── 전 Phase 완료
```

---

## 검증 지표 (MVP 성공 기준)

| 항목 | 목표 |
|---|---|
| 답변 완성도 | 19문항 전부 답변(400자 미만·개조식) |
| 핵심 플로우 | 카드 → 상세 → 목록 복귀 정상 동작 |
| 딥링크 | `#/q/N` 새로고침·직접 진입 시 상세 유지 |
| 디자인 일관성 | `#0066cc`, radius 18px, 본문 17px, 그림자 미사용 |
| 반응형 | 데스크톱 3~4열 → 태블릿 2열 → 모바일 1열 |
| 배포 | GitHub Pages(서브패스) 상대 경로 정상 동작 |

## 주요 파일 참조

- [docs/PRD.md](PRD.md) — 요구사항 원천 문서(v1.0)
- [docs/question.md](question.md) — 19문항 원본 질문
- [DESIGN.md](../DESIGN.md) — 디자인 토큰(색상·타이포·간격·컴포넌트)
- `index.html` / `styles.css` / `app.js` — 구현 대상(루트, 무빌드)
- `data/questions.json` — 19문항 질문 + 사전 작성 답변

---

## 검증 방법(End-to-End)

1. **로컬 서빙:** 루트에서 `python3 -m http.server 8000` → `http://localhost:8000` 접속.
2. **핵심 플로우:** 필터 탭(전체/Part 1/2/3) 동작 → 카드 클릭 → 상세 전환 → "← 목록으로" 복귀 확인.
3. **딥링크:** 주소창에 `#/q/3` 직접 입력 후 새로고침 → 상세 유지 확인. 존재하지 않는 `#/q/99` → 메인 폴백.
4. **마크다운 렌더링:** 불릿·번호·표·강조 혼합 답변이 상세 뷰에서 올바른 HTML로 표시되는지 확인.
5. **반응형:** 브라우저 폭 조절(또는 DevTools)로 3~4열 → 2열 → 1열 전환 확인.
6. **다크모드:** ThemeToggle 전환 + 새로고침 후 `localStorage` 유지 + 시스템 설정 반영 확인.
7. **상대 경로:** 서브패스 흉내(예: `/repo/` 하위 서빙)로 자원 404 없이 로드되는지 확인.
8. **JSON 유효성:** `python3 -m json.tool data/questions.json` 통과.
