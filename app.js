// AI 세미나 Q&A — 애플리케이션 로직
// Phase 3: 데이터 로드 + 메인 뷰(히어로 + 필터 탭 + Part별 카드 그리드) + 카드 클릭.
// 해시 라우팅·상세 뷰는 Phase 4, MD 미니 파서는 Phase 5에서 확장합니다.

'use strict';

/* ============================================================
   상태
   ============================================================ */
let QUESTIONS = [];
let activeFilter = 'all'; // 'all' | 1 | 2 | 3

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
function cardHtml(q) {
  return `
    <a class="q-card" href="#/q/${q.id}">
      <div class="q-card__meta">
        <span class="q-card__num">Q${q.id}</span>
        <span class="q-badge">Part ${q.part}</span>
      </div>
      <h3 class="q-card__title">${escapeHtml(q.title)}</h3>
      <p class="q-card__preview">${escapeHtml(q.question)}</p>
    </a>`;
}

function sectionHtml(part) {
  const items = questionsByPart(part);
  if (items.length === 0) return '';
  const cards = items.map(cardHtml).join('');
  return `
    <section class="part-section">
      <h2 class="part-section__title">Part ${part} · ${escapeHtml(partTitleOf(part))}</h2>
      <div class="card-grid">${cards}</div>
    </section>`;
}

function tabsHtml() {
  const tabs = [
    { value: 'all', label: '전체' },
    { value: 1, label: 'Part 1' },
    { value: 2, label: 'Part 2' },
    { value: 3, label: 'Part 3' },
  ];
  return tabs
    .map((t) => {
      const active = String(t.value) === String(activeFilter) ? ' is-active' : '';
      return `<button type="button" class="filter-tab${active}" data-filter="${t.value}" aria-pressed="${active ? 'true' : 'false'}">${t.label}</button>`;
    })
    .join('');
}

function groupsHtml() {
  const parts = activeFilter === 'all' ? PARTS : [Number(activeFilter)];
  return parts.map(sectionHtml).join('');
}

// 필터 변경 시 그룹 영역만 다시 그린다.
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
    <div class="filters" role="tablist" aria-label="Part 필터">${tabsHtml()}</div>
    <div id="groups">${groupsHtml()}</div>`;

  const filters = app.querySelector('.filters');
  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    const value = btn.dataset.filter;
    activeFilter = value === 'all' ? 'all' : Number(value);
    // 탭 활성 상태 갱신
    filters.querySelectorAll('.filter-tab').forEach((el) => {
      const on = el.dataset.filter === value;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    renderGroups();
  });
}

function renderError(message) {
  app.innerHTML = `<p class="load-error">${escapeHtml(message)}</p>`;
}

/* ============================================================
   초기화
   ============================================================ */
async function init() {
  try {
    await loadData();
    renderMain();
  } catch (err) {
    renderError('질문 데이터를 불러오지 못했습니다. 새로고침하거나 정적 서버로 접속했는지 확인하세요.');
    console.error(err);
  }
}

init();
