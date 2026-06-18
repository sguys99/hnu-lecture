# CLAUDE.md

**AI 세미나 Q&A 정적 웹사이트** — 대학원생 대상 AI 세미나에서 수집한 19개 질문을 카드 피드로 전시하고, 카드 클릭 시 질문 전문과 미리 작성된 개조식 답변을 보여주는 무빌드(build-less) 정적 사이트입니다.
순수 HTML/CSS/Vanilla JS만 사용하며, 빌드·서버 없이 GitHub Pages(`username.github.io/repo/`)에 상대 경로로 배포합니다.

> 상세 요구사항은 [docs/PRD.md](docs/PRD.md)를 단일 기준으로 삼습니다.

## 기술 스택

> 백엔드가 없는 순수 정적 사이트이므로 Next.js/FastAPI 등 템플릿 기본값을 사용하지 않습니다.

| 영역 | 기술 |
|---|---|
| 마크업/스타일 | 순수 HTML5, CSS3 (`DESIGN.md` 토큰 기반) |
| 로직 | Vanilla JavaScript (해시 라우팅·필터·렌더링) |
| 데이터 | 정적 JSON 파일 (`data/questions.json`) |
| 폰트 | Pretendard(CDN) + `SF Pro Text` / `system-ui` 폴백 |
| 빌드 | 없음 (번들러·npm 의존성 없음) |
| 배포 | GitHub Pages (`github.io`, 상대 경로) |

## 디렉토리 구조

```
.
├── index.html              # 마크업 + 폰트/스타일/스크립트 로드
├── styles.css              # DESIGN.md 토큰 기반 스타일
├── app.js                  # 해시 라우팅 + 카드/상세 렌더링 + 필터
├── data/
│   └── questions.json      # 19문항 질문 + 사전 작성 답변
├── docs/                   # PRD.md, question.md 등 문서
├── DESIGN.md               # 디자인 토큰 (색상·타이포·간격·컴포넌트)
└── img/                    # 이미지 자산
```

> `index.html` · `styles.css` · `app.js` · `data/questions.json` 은 아직 생성되지 않았으며 구현 단계에서 만듭니다.

## 개발 워크플로우

빌드 단계가 없으므로 정적 파일을 그대로 서빙합니다.

### 로컬 미리보기

```bash
python3 -m http.server 8000
# 또는 임의 정적 서버(npx serve 등)
# http://localhost:8000
```

> 상대 경로 동작 검증을 위해 `file://`로 직접 여는 대신 정적 서버로 확인하세요.

### 배포

```bash
git push                 # main 브랜치에 푸시 → GitHub Pages 자동 게시
```

> 빌드·테스트·린트용 npm 스크립트는 없습니다. (번들러·패키지 매니저 미사용)

## 데이터 모델 (`data/questions.json`)

루트에 `questions` 배열을 두고, 각 항목이 한 질문을 표현합니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | 질문 고유 번호 (1~19), 라우팅 키(`#/q/{id}`) |
| `part` | number | Part 번호 (1 / 2 / 3) |
| `partTitle` | string | Part 제목 |
| `title` | string | 질문 소제목 |
| `question` | string | 질문 전문 (원문 그대로) |
| `answer` | string | 사전 작성 답변 (마크다운 또는 HTML, 400자 미만 개조식) |

**Part 구성**

| Part | 범위 | 제목 |
|---|---|---|
| Part 1 | Q1~Q6 | 실험 데이터 · 공학 해석에서의 AI 활용 |
| Part 2 | Q7~Q11 | AI 도구 운용 전략 및 워크플로우 |
| Part 3 | Q12~Q19 | AI의 본질에 대한 이론적 · 철학적 질문 |

> 질문 원문은 [docs/question.md](docs/question.md)를 그대로 사용하며, 문구를 임의로 변경하지 않습니다.

## 라우팅 (해시 라우팅)

서버 API 없이 클라이언트 해시 라우팅으로 화면을 전환합니다.

| 경로 | 화면 | 설명 |
|---|---|---|
| `#/` (또는 해시 없음) | 메인 뷰 | 필터 탭 + Part별 카드 그리드 |
| `#/q/{id}` | 상세 뷰 | 질문 메타 + 전문 + 답변 |

- `hashchange` 감지 시 해당 뷰 렌더링.
- `#/q/{id}` 직접 진입·새로고침 시에도 상세 복원(딥링크).
- 브라우저 뒤로가기로 메인 ↔ 상세 이동.
- 존재하지 않는 `id`는 메인 뷰로 폴백.

## 답변 작성 규칙

`data/questions.json`의 `answer`를 작성할 때 따릅니다.

- 각 답변은 **400자 미만**(한글 기준).
- **개조식**(불릿·번호 목록·표)으로 작성, 줄글 지양.
- 대학원생이 실무·연구에 바로 활용 가능한 구체적 수준.
- 사실·기술·학술 문항은 **웹검색으로 검증 후 작성** (특히 Part 1·2 도구/기법 문항과 Q13·Q14·Q16·Q18).
- **출처/참고 링크는 답변 본문에 포함하지 않음** (웹검색은 검증 용도).
- **철학적 문항(Q12~Q19)**은 중립 나열이 아니라 **강사로서 명확한 입장 + 핵심 근거 2~3개**를 개조식으로 제시.

## 디자인 시스템

프론트엔드 작업(페이지/컴포넌트 생성·수정, 스타일링, 레이아웃 변경 등)을 수행할 때는 반드시 [DESIGN.md](DESIGN.md)를 먼저 참고하세요.

- 색상, 타이포그래피, 간격(spacing), 모서리(radius), 컴포넌트 스펙은 `DESIGN.md` 프론트매터 토큰을 기준으로 사용합니다.
- 인라인 hex/px 값을 새로 도입하지 말고 정의된 토큰(`{colors.*}`, `{typography.*}`, `{spacing.*}`, `{rounded.*}`, `{component.*}`)을 참조하세요.
- "Do's and Don'ts" 규칙(단일 액센트 컬러, 그림자 제한, 라운드 규격 등)을 반드시 준수합니다.
- 새 컴포넌트를 만들기 전에 `DESIGN.md`의 `components:` 항목에 유사 정의가 있는지 확인하세요.

**핵심 제약 (PRD §9)**

- 단일 액센트 컬러 `#0066cc`, 두 번째 브랜드 컬러 도입 금지.
- 캔버스 `#ffffff` / `#f5f5f7`, 본문 17px.
- 카드: 1px hairline 보더(`#e0e0e0`) + radius 18px(`rounded.lg`) + padding 24px.
- 버튼·필터 탭은 pill(`rounded.pill`).
- **UI 크롬에 그림자 사용 금지.**
- 폰트 스택: `'Pretendard', 'SF Pro Text', system-ui, -apple-system, sans-serif`.
- 터치 타깃 최소 44×44px, 반응형(데스크톱 3~4열 → 태블릿 2열 → 모바일 1열).

## Claude 에이전트 목록

`.claude/agents/` 에 프리셋 에이전트가 준비되어 있습니다. 본 정적 사이트 프로젝트에서 활용 가능한 항목:

| 에이전트 | 용도 |
|---------|------|
| `ui-markup-specialist` | UI 컴포넌트 마크업 및 스타일링 |
| `code-reviewer` | 코드 리뷰 |
| `development-planner` | ROADMAP.md 작성 및 개발 계획 수립 |
| `prd-generator` | PRD 문서 생성 |
| `prd-validator` | PRD 기술적 타당성 검증 |

> `nextjs-app-developer`, `starter-cleaner`는 Next.js 템플릿 전용으로, 본 정적 프로젝트에서는 사용하지 않습니다. `.claude/agents/humanize/`의 한글 윤문 에이전트는 콘텐츠 다듬기에 별도로 활용할 수 있습니다.

## 코딩 컨벤션

- **순수 HTML/CSS/JS만** 사용 — 빌드 단계·번들러·npm 의존성 도입 금지.
- 외부 의존성은 **CDN 폰트(Pretendard)만** 허용(폰트 로컬 호스팅도 가능).
- 모든 자산은 **상대 경로**로 참조 (GitHub Pages 서브패스 배포 대응).
- `DESIGN.md` 토큰 준수 — 인라인 hex/px 신규 도입 금지.
- 콘텐츠와 UI 텍스트는 모두 한국어.
- 최신 데스크톱·모바일 브라우저(ES2015+) 기준으로 작성.
