// AI 세미나 Q&A — 애플리케이션 로직
// Phase 3: 데이터 로드 + 메인 뷰(히어로 + 필터 탭 + Part별 카드 그리드) + 카드 클릭.
// Phase 4: 해시 라우팅(#/ ↔ #/q/{id}) + 상세 뷰 + 딥링크. MD 미니 파서는 Phase 5에서 확장합니다.

'use strict';

/* ============================================================
   상태
   ============================================================ */
let QUESTIONS = [];
let activeFilter = 'all'; // 'all' | 1 | 2 | 3
let searchQuery = '';     // 카드 검색어(제목·질문 전문 대상)

const PARTS = [1, 2, 3];

const app = document.getElementById('app');

/* ============================================================
   유틸
   ============================================================ */
// 신뢰된 정적 데이터지만 안전 마진 확보용 HTML 이스케이프.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   마크다운 미니 파서 (Phase 5) — 외부 의존성 없는 경량 MD→HTML.
   지원: 굵게(**), 기울임(*), 불릿(-), 번호(1.), 표(| |),
        제목(##/###), 인라인 링크([텍스트](url)), 문단/줄바꿈.
   안전: 모든 텍스트는 escapeHtml 선통과 후 화이트리스트 태그만 주입.
   ============================================================ */

// 안전한 링크 스킴만 허용(javascript: 등 차단).
const SAFE_URL = /^(https?:\/\/|mailto:|#|\/|\.\/)/i;

// 인라인 변환: 이스케이프 → 링크 → 굵게 → 기울임.
function renderInline(text) {
  let out = escapeHtml(text);
  // 링크 [텍스트](url) — 화이트리스트 스킴만 <a>로, 그 외엔 원문 유지.
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    const href = url.trim();
    if (!SAFE_URL.test(href)) return match;
    return `<a href="${href.replace(/"/g, '&quot;')}">${label}</a>`;
  });
  // 굵게(**)를 기울임(*)보다 먼저 처리해 ** 구분자를 선소거.
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return out;
}

// 표 블록(헤더행 + 구분선 + 본문행) → <table>.
function renderTable(lines) {
  const toCells = (line) =>
    line
      .trim()
      .replace(/^\||\|$/g, '') // 양끝 파이프 제거
      .split('|')
      .map((c) => c.trim());
  const head = toCells(lines[0]);
  const body = lines.slice(2).map(toCells);
  const thead = `<thead><tr>${head
    .map((c) => `<th>${renderInline(c)}</th>`)
    .join('')}</tr></thead>`;
  const tbody = `<tbody>${body
    .map(
      (row) =>
        `<tr>${row.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`
    )
    .join('')}</tbody>`;
  return `<table>${thead}${tbody}</table>`;
}

// 블록 토크나이저: 빈 줄을 경계로 블록을 분류해 HTML로 변환.
function parseMarkdown(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;

  const isTableSep = (line) =>
    line != null && /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-');

  while (i < lines.length) {
    const line = lines[i];

    // 빈 줄 — 블록 경계.
    if (!line.trim()) {
      i++;
      continue;
    }

    // 표: 현재 줄이 파이프를 포함하고 다음 줄이 구분선.
    if (line.includes('|') && isTableSep(lines[i + 1])) {
      const tbl = [lines[i], lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        tbl.push(lines[i]);
        i++;
      }
      html.push(renderTable(tbl));
      continue;
    }

    // 제목 ##/### (#도 h2로).
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length >= 3 ? 3 : 2;
      html.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // 순서 목록.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(renderInline(lines[i].replace(/^\s*\d+\.\s+/, '')));
        i++;
      }
      html.push(`<ol>${items.map((t) => `<li>${t}</li>`).join('')}</ol>`);
      continue;
    }

    // 불릿 목록.
    if (/^\s*-\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(renderInline(lines[i].replace(/^\s*-\s+/, '')));
        i++;
      }
      html.push(`<ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>`);
      continue;
    }

    // 그 외 — 문단(연속 비빈 줄 묶음). 단독 **굵게** 줄은 소제목으로 승격.
    const isBlockStart = (ln, next) =>
      /^\s*(-\s+|\d+\.\s+|#{1,3}\s+)/.test(ln) ||
      (ln.includes('|') && isTableSep(next));
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isBlockStart(lines[i], lines[i + 1])
    ) {
      para.push(lines[i]);
      i++;
    }
    const joined = para.join('\n');
    if (para.length === 1 && /^\*\*[^*]+\*\*$/.test(joined.trim())) {
      const inner = joined.trim().replace(/^\*\*|\*\*$/g, '');
      html.push(`<h4 class="prose-subhead">${renderInline(inner)}</h4>`);
    } else {
      html.push(`<p>${renderInline(joined).replace(/\n/g, '<br>')}</p>`);
    }
  }

  return html.join('');
}

// 해당 Part의 문항 목록.
function questionsByPart(part) {
  return QUESTIONS.filter((q) => q.part === part);
}

// 해당 Part의 제목(첫 문항의 partTitle).
function partTitleOf(part) {
  const first = QUESTIONS.find((q) => q.part === part);
  return first ? first.partTitle : '';
}

/* ============================================================
   데이터 로드
   ============================================================ */
async function loadData() {
  const res = await fetch('./data/questions.json');
  if (!res.ok) throw new Error(`데이터 로드 실패 (HTTP ${res.status})`);
  const data = await res.json();
  QUESTIONS = Array.isArray(data.questions) ? data.questions : [];
}

/* ============================================================
   렌더링
   ============================================================ */
// 검색어 일치 여부(대소문자 무시, 제목 + 질문 전문 부분일치).
function matchesSearch(q) {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return true;
  return `${q.title} ${q.question}`.toLowerCase().includes(query);
}

// 참조 ArticleCard 패턴: 메타행 = Part 배지(좌) + Q번호(우, muted).
function cardHtml(q) {
  return `
    <a class="q-card" href="#/q/${q.id}">
      <div class="q-card__meta">
        <span class="q-badge">Part ${q.part}</span>
        <span class="q-card__num">Q${q.id}</span>
      </div>
      <h3 class="q-card__title">${escapeHtml(q.title)}</h3>
      <p class="q-card__preview">${escapeHtml(q.question)}</p>
    </a>`;
}

function sectionHtml(part) {
  const items = questionsByPart(part).filter(matchesSearch);
  if (items.length === 0) return '';
  const cards = items.map(cardHtml).join('');
  return `
    <section class="part-section">
      <h2 class="part-section__title">Part ${part} · ${escapeHtml(partTitleOf(part))}</h2>
      <div class="card-grid">${cards}</div>
    </section>`;
}

const FILTER_TABS = [
  { value: 'all', label: '전체' },
  { value: 1, label: 'Part 1' },
  { value: 2, label: 'Part 2' },
  { value: 3, label: 'Part 3' },
];

function tabsHtml() {
  return FILTER_TABS.map((t) => {
    const active = String(t.value) === String(activeFilter) ? ' is-active' : '';
    return `<button type="button" class="filter-tab${active}" data-filter="${t.value}" aria-pressed="${active ? 'true' : 'false'}">${t.label}</button>`;
  }).join('');
}

// 현재 필터의 표시 라벨(모바일 필터 트리거 버튼용).
function currentFilterLabel() {
  const tab = FILTER_TABS.find((t) => String(t.value) === String(activeFilter));
  return tab ? tab.label : '전체';
}

function emptyStateHtml() {
  return `<p class="empty-state">검색 결과가 없습니다.</p>`;
}

function groupsHtml() {
  const parts = activeFilter === 'all' ? PARTS : [Number(activeFilter)];
  return parts.map(sectionHtml).join('') || emptyStateHtml();
}

// 필터/검색 변경 시 그룹 영역만 다시 그린다(검색 입력 포커스 유지).
function renderGroups() {
  const groups = app.querySelector('#groups');
  if (groups) groups.innerHTML = groupsHtml();
}

function renderMain() {
  app.innerHTML = `
    <section class="hero">
      <h1 class="hero__title">AI 세미나 Q&amp;A</h1>
      <p class="hero__desc">대학원생 대상 AI 세미나에서 수집한 19개 질문과 답변</p>
    </section>
    <div class="toolbar">
      <div class="search-row">
        <svg class="search-row__icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true" focusable="false">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input id="search-input" class="search-input" type="search"
               placeholder="질문 제목·내용 검색" aria-label="질문 검색"
               value="${escapeHtml(searchQuery)}" />
      </div>
      <div class="filters" role="tablist" aria-label="Part 필터">${tabsHtml()}</div>
      <button type="button" class="filter-trigger" id="filter-trigger"
              aria-haspopup="dialog" aria-expanded="false">
        <span class="filter-trigger__label">필터</span>
        <span class="filter-trigger__current">${currentFilterLabel()}</span>
      </button>
    </div>
    <div id="groups">${groupsHtml()}</div>

    <div class="sheet-backdrop" id="sheet-backdrop" hidden></div>
    <div class="filter-sheet" id="filter-sheet" role="dialog" aria-modal="true" aria-label="Part 필터" hidden>
      <div class="filter-sheet__handle" aria-hidden="true"></div>
      <div class="filter-sheet__title">Part 필터</div>
      <div class="filter-sheet__options" role="tablist">${tabsHtml()}</div>
      <button type="button" class="filter-sheet__apply" id="sheet-apply">결과 보기</button>
    </div>`;
}

// 필터 선택 반영: 상태 + 모든 pill(데스크톱·시트) 활성표시 + 트리거 라벨 + 그룹 재렌더.
function setFilter(value) {
  activeFilter = value === 'all' ? 'all' : Number(value);
  app.querySelectorAll('.filter-tab').forEach((el) => {
    const on = el.dataset.filter === value;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const cur = app.querySelector('.filter-trigger__current');
  if (cur) cur.textContent = currentFilterLabel();
  renderGroups();
}

/* ---- 모바일 필터 바텀시트 ---- */
function openSheet() {
  const sheet = document.getElementById('filter-sheet');
  const backdrop = document.getElementById('sheet-backdrop');
  const trigger = document.getElementById('filter-trigger');
  if (!sheet || !backdrop) return;
  sheet.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => {
    sheet.classList.add('is-open');
    backdrop.classList.add('is-open');
  });
  document.body.classList.add('no-scroll');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
}

function closeSheet() {
  const sheet = document.getElementById('filter-sheet');
  const backdrop = document.getElementById('sheet-backdrop');
  const trigger = document.getElementById('filter-trigger');
  document.body.classList.remove('no-scroll');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  if (!sheet || !backdrop) return;
  sheet.classList.remove('is-open');
  backdrop.classList.remove('is-open');
  setTimeout(() => {
    if (sheet && !sheet.classList.contains('is-open')) sheet.hidden = true;
    if (backdrop && !backdrop.classList.contains('is-open')) backdrop.hidden = true;
  }, 200);
}

// 메인 뷰 인터랙션(검색·필터·시트) — #app에 위임 1회 등록(재렌더에도 유지).
function initMainEvents() {
  app.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (tab) {
      setFilter(tab.dataset.filter);
      if (e.target.closest('#filter-sheet')) closeSheet();
      return;
    }
    if (e.target.closest('#filter-trigger')) return openSheet();
    if (e.target.closest('#sheet-apply')) return closeSheet();
    if (e.target.id === 'sheet-backdrop') return closeSheet();
  });

  let debounce;
  app.addEventListener('input', (e) => {
    if (e.target.id !== 'search-input') return;
    const val = e.target.value;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = val;
      renderGroups();
    }, 300);
  });
}

// 답변 렌더 훅 — 마크다운을 미니 파서로 HTML 변환해 주입(Phase 5).
function renderAnswer(answer) {
  if (!answer || !answer.trim()) {
    return '<p class="detail__answer detail__answer--empty">답변 준비 중입니다.</p>';
  }
  return `<div class="prose detail__answer">${parseMarkdown(answer)}</div>`;
}

// 이전/다음 문항 내비게이션(인접 id 기준, 1~19 범위 안에서만).
function detailNavHtml(q) {
  const prev = QUESTIONS.find((item) => item.id === q.id - 1);
  const next = QUESTIONS.find((item) => item.id === q.id + 1);
  const prevHtml = prev
    ? `<a class="detail__nav-link" href="#/q/${prev.id}">← 이전 · Q${prev.id}</a>`
    : '<span class="detail__nav-link is-disabled" aria-hidden="true"></span>';
  const nextHtml = next
    ? `<a class="detail__nav-link detail__nav-link--next" href="#/q/${next.id}">다음 · Q${next.id} →</a>`
    : '<span class="detail__nav-link is-disabled" aria-hidden="true"></span>';
  return `<nav class="detail__nav" aria-label="질문 이동">${prevHtml}${nextHtml}</nav>`;
}

function renderDetail(q) {
  app.innerHTML = `
    <article class="detail">
      <a class="detail__back" href="#/">← 목록으로</a>
      <header class="detail__header">
        <div class="detail__meta">
          <span class="q-card__num">Q${q.id}</span>
          <span class="q-badge">Part ${q.part}</span>
        </div>
        <h1 class="detail__title">${escapeHtml(q.title)}</h1>
      </header>
      <section class="detail__section">
        <div class="detail__label">질문</div>
        <p class="detail__question">${escapeHtml(q.question)}</p>
      </section>
      <section class="detail__section">
        <div class="detail__label">답변</div>
        ${renderAnswer(q.answer)}
      </section>
      ${detailNavHtml(q)}
    </article>`;
}

function renderError(message) {
  app.innerHTML = `<p class="load-error">${escapeHtml(message)}</p>`;
}

/* ============================================================
   해시 라우터 (#/ ↔ #/q/{id})
   ============================================================ */
// location.hash → { view: 'main' } | { view: 'detail', id }
function parseHash() {
  const m = location.hash.match(/^#\/q\/(\d+)$/);
  if (m) return { view: 'detail', id: Number(m[1]) };
  return { view: 'main' };
}

// 현재 해시에 맞는 뷰를 렌더. 없는 id는 메인으로 폴백.
function router() {
  closeSheet(); // 뷰 전환 시 열린 시트·스크롤 락 정리
  const route = parseHash();
  if (route.view === 'detail') {
    const q = QUESTIONS.find((item) => item.id === route.id);
    if (!q) {
      location.hash = '#/'; // → hashchange가 다시 router 호출 → 메인
      return;
    }
    renderDetail(q);
    setBottomTab('detail');
    window.scrollTo(0, 0);
    return;
  }
  renderMain();
  setBottomTab('main');
}

/* ============================================================
   모바일 하단 탭바 (참조 BottomTabBar) — 피드 / 검색
   ============================================================ */
// 현재 뷰에 맞춰 탭 활성 표시.
function setBottomTab(view) {
  const feed = document.getElementById('tab-feed');
  if (feed) {
    const on = view === 'main';
    feed.classList.toggle('is-active', on);
    feed.setAttribute('aria-current', on ? 'page' : 'false');
  }
}

function initBottomBar() {
  const search = document.getElementById('tab-search');
  if (search) {
    search.addEventListener('click', () => {
      const focusInput = () => {
        const input = document.getElementById('search-input');
        if (input) {
          input.scrollIntoView({ block: 'center' });
          input.focus();
        }
      };
      if (parseHash().view !== 'main') {
        location.hash = '#/';
        setTimeout(focusInput, 0); // 메인 렌더 후 포커스
      } else {
        focusInput();
      }
    });
  }
}

/* ============================================================
   다크모드 토글 (라이트 우선 · 시스템 존중 · localStorage 영속)
   속성 적용 자체는 <head> 부트스트랩이 페인트 전에 처리. 여기선
   버튼 동기화 + 사용자 토글만 담당한다.
   ============================================================ */
// 현재 적용 중인 테마 판정: 명시적 data-theme → 없으면 시스템 설정.
function currentTheme() {
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit === 'dark' || explicit === 'light') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 버튼 aria-label을 "전환될 모드" 기준으로 갱신.
function syncToggleLabel(btn) {
  const next = currentTheme() === 'dark' ? '라이트' : '다크';
  btn.setAttribute('aria-label', next + ' 모드로 전환');
}

function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  syncToggleLabel(btn);
  btn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {}
    syncToggleLabel(btn);
  });
}

/* ============================================================
   초기화
   ============================================================ */
async function init() {
  initTheme(); // 데이터 로드와 무관 — fetch 실패와 상관없이 토글 보장
  initMainEvents(); // 검색·필터·시트 위임 핸들러(#app, 1회 등록)
  initBottomBar();
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSheet();
  });
  try {
    await loadData();
    window.addEventListener('hashchange', router);
    router(); // 딥링크 초기 진입(#/q/{id} 직접 진입·새로고침) 대응
  } catch (err) {
    renderError('질문 데이터를 불러오지 못했습니다. 새로고침하거나 정적 서버로 접속했는지 확인하세요.');
    console.error(err);
  }
}

init();
