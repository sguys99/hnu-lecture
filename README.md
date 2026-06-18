# AI 세미나 Q&A

대학원생 대상 AI 세미나에서 수집한 **19개 질문**을 카드 피드로 전시하고, 카드 클릭 시 질문 전문과 사전 작성 답변을 보여주는 **무빌드(build-less) 정적 웹사이트**입니다.

순수 HTML/CSS/Vanilla JS만 사용하며, 빌드·서버 없이 GitHub Pages(`username.github.io/repo/`)에 상대 경로로 배포합니다.

> 상세 요구사항은 [docs/PRD.md](docs/PRD.md), 작업 계획은 [docs/plan.md](docs/plan.md)를 참고하세요.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 마크업/스타일 | 순수 HTML5, CSS3 (`DESIGN.md` 토큰 기반) |
| 로직 | Vanilla JavaScript (해시 라우팅·필터·렌더링) |
| 데이터 | 정적 JSON 파일 (`data/questions.json`) |
| 폰트 | Pretendard(CDN) + `SF Pro Text` / `system-ui` 폴백 |
| 빌드 | 없음 (번들러·npm 의존성 없음) |
| 배포 | GitHub Pages (`github.io`, 상대 경로) |

## 빠른 시작 (로컬 미리보기)

빌드 단계가 없으므로 정적 파일을 그대로 서빙합니다. 상대 경로 동작 검증을 위해 `file://`로 직접 열지 말고 정적 서버로 확인하세요.

```bash
python3 -m http.server 8000
# 또는 임의 정적 서버(npx serve 등)
# http://localhost:8000
```

## 디렉토리 구조

```
.
├── index.html          # 마크업 + 폰트/스타일/스크립트 로드
├── styles.css          # DESIGN.md 토큰 기반 스타일
├── app.js              # 해시 라우팅 + 카드/상세 렌더링 + 필터
├── data/
│   └── questions.json  # 19문항 질문 + 사전 작성 답변
├── docs/               # PRD.md, plan.md, question.md 등 문서
├── DESIGN.md           # 디자인 토큰 (색상·타이포·간격·컴포넌트)
└── img/                # 이미지 자산
```

## 배포

```bash
git push   # main 브랜치에 푸시 → GitHub Pages 자동 게시
```

> 빌드·테스트·린트용 npm 스크립트는 없습니다. (번들러·패키지 매니저 미사용)

## 라이선스

Apache 2.0. [LICENSE](LICENSE) 참고.
