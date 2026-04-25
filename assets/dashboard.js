(function () {
  const HASH = "5fa75ee2c5383fa601a45136751b99f41f203754378c650440e94c75020b70b0";
  const BASE = "./";
  const FILES = {
    progress: "진도관리.json",
    errors: "오답노트.json",
    knowledge: "data/knowledge.json",
    englishDaily: "data/english_daily.json"
  };
  const LOCAL_WRONG_KEY = "english-study-local-wrong-words-v1";

  const PHASES = {
    1: { label: "Phase 1", range: "Ranks 1-500", cefr: "A1-A2", cls: "primary", total: 500, dayEnd: 30 },
    2: { label: "Phase 2", range: "Ranks 501-800", cefr: "A2-B1", cls: "green", total: 300, dayEnd: 54 },
    3: { label: "Phase 3", range: "Ranks 801-1000", cefr: "B1", cls: "accent", total: 200, dayEnd: 74 },
    4: { label: "Phase 4", range: "Ranks 1001-1500", cefr: "B1-B2", cls: "primary", total: 500, dayEnd: 134 },
    5: { label: "Phase 5", range: "Ranks 1501-2000", cefr: "B2", cls: "accent", total: 500, dayEnd: 209 },
    6: { label: "Phase 6", range: "Ranks 2001-3000", cefr: "B2-C1", cls: "green", total: 1000, dayEnd: 409 }
  };

  const state = {
    activeView: "today",
    data: null,
    openDays: new Set(),
    revealedWords: new Set(),
    localWrongWords: []
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getLocalDateYMD(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function setTodayText() {
    const d = new Date();
    $("today-date").textContent =
      `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ` +
      `(${["일", "월", "화", "수", "목", "금", "토"][d.getDay()]})`;
  }

  async function loadJSON(file, fallback = null) {
    const res = await fetch(BASE + file + "?t=" + Date.now());
    if (!res.ok) {
      if (fallback !== null) return fallback;
      throw new Error(file + " 로드 실패");
    }
    return res.json();
  }

  function getPhase(day) {
    if (day <= 30) return 1;
    if (day <= 54) return 2;
    if (day <= 74) return 3;
    if (day <= 134) return 4;
    if (day <= 209) return 5;
    return 6;
  }

  function phaseProgress(day) {
    const starts = [0, 1, 31, 55, 75, 135, 210];
    const p = getPhase(day);
    const ph = PHASES[p];
    const pStart = starts[p];
    const pTotal = ph.dayEnd - pStart + 1;
    return Math.max(0, Math.min(100, Math.round(((day - pStart + 1) / pTotal) * 100)));
  }

  function todayReviews(schedule) {
    const today = getLocalDateYMD();
    const result = [];
    [
      ["day_3", "3일 복습", "dot-red"],
      ["day_7", "7일 복습", "dot-orange"],
      ["day_30", "30일 복습", "dot-green"]
    ].forEach(([key, label, cls]) => {
      const items = (schedule[key] || []).filter(([date]) => date === today);
      if (items.length > 0) {
        result.push({ label, cls, days: items.flatMap(([, d]) => d) });
      }
    });
    return result;
  }

  function readLocalWrongWords() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_WRONG_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeLocalWrongWords(words) {
    localStorage.setItem(LOCAL_WRONG_KEY, JSON.stringify(words));
    state.localWrongWords = words;
  }

  function mergeWrongWords(words) {
    const merged = new Map();

    words.forEach((word) => {
      if (!word?.word) return;
      const key = String(word.word).trim().toLowerCase();
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, {
          ...word,
          wrong_count: Number(word.wrong_count || 1)
        });
        return;
      }

      existing.wrong_count = Number(existing.wrong_count || 0) + Number(word.wrong_count || 1);
      existing.meaning = existing.meaning || word.meaning;
      existing.example = existing.example || word.example;
      existing.category = existing.category || word.category;
      existing.added_at = existing.added_at || word.added_at;
    });

    return [...merged.values()];
  }

  function getWrongWords(errors) {
    return mergeWrongWords([...(errors.words || []), ...state.localWrongWords])
      .sort((a, b) => (b.wrong_count || 0) - (a.wrong_count || 0));
  }

  function isWrongWord(word) {
    const target = String(word || "").trim().toLowerCase();
    if (!target) return false;

    const remote = state.data?.errors?.words || [];
    return [...remote, ...state.localWrongWords]
      .some((item) => String(item?.word || "").trim().toLowerCase() === target);
  }

  function addLocalWrongWord(item) {
    if (!item?.word) return;

    const now = getLocalDateYMD();
    const key = String(item.word).trim().toLowerCase();
    const next = [...state.localWrongWords];
    const existing = next.find((word) => String(word.word || "").trim().toLowerCase() === key);

    if (existing) {
      existing.wrong_count = Number(existing.wrong_count || 1) + 1;
      existing.added_at = now;
    } else {
      next.unshift({
        word: item.word,
        meaning: item.meaning || "",
        example: item.example || "",
        category: item.category || "오늘의 영어",
        wrong_count: 1,
        added_at: now
      });
    }

    writeLocalWrongWords(next);
  }

  function getDatedEntries(store) {
    if (Array.isArray(store.entries)) {
      return [...store.entries].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    }

    if (Array.isArray(store.items)) {
      return [{
        date: store.updated_at || getLocalDateYMD(),
        title: "오늘",
        items: store.items
      }];
    }

    return [];
  }

  function getLatestEntry(store) {
    return getDatedEntries(store)[0] || { date: "", title: "", items: [] };
  }

  function getEntryItems(entry) {
    return Array.isArray(entry.items) ? entry.items : [];
  }

  function renderSourceLinks(sources) {
    const list = Array.isArray(sources) ? sources.filter((source) => source?.url) : [];
    if (!list.length) return "";

    return `
      <div class="source-list">
        ${list.map((source) => `
          <a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(source.label || "출처")}
          </a>
        `).join("")}
      </div>
    `;
  }

  function renderKnowledgeItems(items, limit) {
    const list = limit ? items.slice(0, limit) : items;
    if (!list.length) {
      return '<div class="empty-msg">상식 데이터가 없습니다.</div>';
    }

    return list.map((item) => `
      <article class="knowledge-item">
        <div class="knowledge-category">${escapeHtml(item.category || "상식")}</div>
        <h3 class="knowledge-title">${escapeHtml(item.title || "")}</h3>
        <p class="knowledge-body">${escapeHtml(item.body || "")}</p>
        ${item.takeaway ? `<p class="knowledge-takeaway">${escapeHtml(item.takeaway)}</p>` : ""}
        ${renderSourceLinks(item.sources)}
      </article>
    `).join("");
  }

  function getWordId(item, context, index) {
    return `${context || "word"}::${index}::${String(item?.word || "").trim().toLowerCase()}`;
  }

  function encodePayload(value) {
    return escapeHtml(encodeURIComponent(JSON.stringify(value)));
  }

  function renderEnglishDailyItems(items, limit, context = "latest") {
    const list = limit ? items.slice(0, limit) : items;
    if (!list.length) {
      return '<div class="empty-msg">영어 단어 데이터가 없습니다.</div>';
    }

    return list.map((item, index) => {
      const wordId = getWordId(item, context, index);
      const revealed = state.revealedWords.has(wordId);
      const added = isWrongWord(item.word);

      return `
      <article class="word-item${revealed ? " open" : ""}">
        <div class="word-head">
          <span class="word-index">${index + 1}</span>
          <div>
            <h3 class="word-title">${escapeHtml(item.word || "")}</h3>
          </div>
        </div>
        <div class="word-actions">
          <button class="word-btn" type="button" data-action="toggle-word" data-word-id="${escapeHtml(wordId)}">
            ${revealed ? "뜻 숨기기" : "뜻 보기"}
          </button>
          ${revealed ? `
            <button class="word-btn secondary" type="button" data-action="add-wrong" data-word-payload="${encodePayload(item)}" ${added ? "disabled" : ""}>
              ${added ? "오답노트에 있음" : "오답노트에 추가"}
            </button>
          ` : ""}
        </div>
        ${revealed ? `
          <div class="word-detail">
            <p class="word-meaning">${escapeHtml(item.meaning || "")}</p>
            ${item.example ? `<p class="word-example">${escapeHtml(item.example)}</p>` : ""}
            ${item.note ? `<p class="word-note">${escapeHtml(item.note)}</p>` : ""}
            ${renderSourceLinks(item.sources)}
          </div>
        ` : ""}
      </article>
    `;
    }).join("");
  }

  function renderDatedSections(entries, renderItems, emptyText, kind) {
    if (!entries.length) {
      return `<div class="empty-msg">${escapeHtml(emptyText)}</div>`;
    }

    return `
      <div class="day-list">
        ${entries.map((entry, index) => {
          const dayId = `${kind || "day"}::${entry.date || index}`;
          const open = state.openDays.has(dayId);
          const isEnglish = renderItems === renderEnglishDailyItems;

          return `
          <section class="day-section${open ? " open" : ""}">
            <button class="day-head" type="button" data-action="toggle-day" data-day-id="${escapeHtml(dayId)}" aria-expanded="${open}">
              <span>
                <span class="day-date">${escapeHtml(entry.date || "")}</span>
                <span class="day-title">${escapeHtml(entry.title || "날짜별 기록")}</span>
              </span>
              <span class="day-meta">
                <span class="pill primary">${getEntryItems(entry).length}개</span>
                <span class="day-indicator">${open ? "닫기" : "열기"}</span>
              </span>
            </button>
            <div class="day-content ${isEnglish ? "word-list" : "knowledge-list"}">
              ${renderItems(getEntryItems(entry), undefined, dayId)}
            </div>
          </section>
        `;
        }).join("")}
      </div>
    `;
  }

  function renderReviewList(reviews) {
    if (!reviews.length) {
      return '<div class="empty-msg">오늘 예정된 복습 없음</div>';
    }

    return reviews.map((r) => `
      <div class="review-item">
        <div class="review-dot ${r.cls}"></div>
        <div class="review-text">${escapeHtml(r.label)}</div>
        <div class="review-count">Day ${escapeHtml(r.days.join(", "))}</div>
      </div>
    `).join("");
  }

  function renderErrorList(wrongWords, limit = 12) {
    if (!wrongWords.length) {
      return '<div class="empty-msg">오답 단어 없음</div>';
    }

    const visible = wrongWords.slice(0, limit).map((w) => `
      <div class="error-item">
        <div class="error-word">${escapeHtml(w.word)}</div>
        <div class="error-meaning">${escapeHtml(w.meaning)}</div>
        ${w.example ? `<div class="error-example">"${escapeHtml(w.example)}"</div>` : ""}
        <div class="error-meta">
          <span class="error-tag">틀린 횟수 ${escapeHtml(w.wrong_count || 0)}회</span>
          ${w.category ? `<span class="error-tag">${escapeHtml(w.category)}</span>` : ""}
        </div>
      </div>
    `).join("");

    const hidden = wrongWords.length > limit
      ? `<div class="empty-msg">외 ${wrongWords.length - limit}개 더</div>`
      : "";

    return visible + hidden;
  }

  function getDerived(prog, errors, knowledge, englishDaily) {
    const day = prog.current_day || 0;
    const nextDay = Math.max(1, day || 1);
    const phase = prog.current_phase || getPhase(Math.max(day, 1));
    const ph = PHASES[phase] || PHASES[1];
    const pct = day > 0 ? phaseProgress(day) : 0;
    const totalPct = Math.round(((prog.total_words_learned || 0) / 3000) * 100);
    const reviews = todayReviews(prog.review_schedule || {});
    const wrongWords = getWrongWords(errors);
    const knowledgeEntries = getDatedEntries(knowledge);
    const latestKnowledge = getLatestEntry(knowledge);
    const knowledgeItems = getEntryItems(latestKnowledge);
    const englishEntries = getDatedEntries(englishDaily);
    const latestEnglish = getLatestEntry(englishDaily);
    const englishItems = getEntryItems(latestEnglish);

    return {
      day,
      nextDay,
      phase,
      ph,
      pct,
      totalPct,
      reviews,
      wrongWords,
      knowledgeEntries,
      latestKnowledge,
      knowledgeItems,
      englishEntries,
      latestEnglish,
      englishItems
    };
  }

  function renderToday(prog, errors, knowledge, englishDaily) {
    const d = getDerived(prog, errors, knowledge, englishDaily);
    const studyLabel = d.day > 0 ? `Day ${d.day}` : "Day 1";
    const updated = knowledge.updated_at ? escapeHtml(knowledge.updated_at) : "-";

    return `
      <section class="view today">
        <div class="card hero-card">
          <div class="hero-top">
            <div>
              <h2 class="hero-title">오늘 볼 것</h2>
              <p class="hero-sub">상식 3개와 영어 단어 10개를 날짜별 기록으로 관리합니다.</p>
            </div>
            <span class="pill primary">오늘</span>
          </div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-num">${d.knowledgeItems.length}</div>
              <div class="summary-label">상식</div>
            </div>
            <div class="summary-item">
              <div class="summary-num">${d.englishItems.length}</div>
              <div class="summary-label">영어 단어</div>
            </div>
            <div class="summary-item">
              <div class="summary-num">${d.reviews.length}</div>
              <div class="summary-label">복습</div>
            </div>
          </div>
          <div class="action-row">
            <button class="action-link primary" type="button" data-view-target="knowledge">상식 보기</button>
            <button class="action-link" type="button" data-view-target="english">영어 보기</button>
          </div>
        </div>

        <div class="card knowledge-preview">
          <div class="card-title">${escapeHtml(d.latestKnowledge.title || "오늘의 상식")}</div>
          <div class="knowledge-list">
            ${renderKnowledgeItems(d.knowledgeItems, 3)}
          </div>
          <div class="updated-at">업데이트: ${updated}</div>
        </div>

        <div class="card compact">
          <div class="card-title">${escapeHtml(d.latestEnglish.title || "오늘의 영어 단어")}</div>
          <div class="word-list">
            ${renderEnglishDailyItems(d.englishItems, 10, d.latestEnglish.date || "today")}
          </div>
        </div>

        <div class="card compact">
          <div class="card-title">영어 진도</div>
          <span class="pill ${d.ph.cls}">${escapeHtml(d.ph.label)} · ${escapeHtml(d.ph.cefr)}</span>
          <p class="hero-sub">${escapeHtml(studyLabel)} 기준, 누적 ${escapeHtml(prog.total_words_learned || 0)}단어입니다.</p>
          <div class="progress-bar-wrap">
            <div class="progress-bar" style="width:${d.pct}%"></div>
          </div>
          <div class="progress-label">
            <span>${escapeHtml(d.ph.range)}</span>
            <span>${d.pct}%</span>
          </div>
        </div>
      </section>
    `;
  }

  function renderEnglish(prog, errors, knowledge, englishDaily) {
    const d = getDerived(prog, errors, knowledge, englishDaily);

    return `
      <section class="view english">
        <div class="card hero-card">
          <div class="hero-top">
            <div>
              <h2 class="hero-title">오늘의 영어 단어</h2>
              <p class="hero-sub">${escapeHtml(d.latestEnglish.date || "-")} 기준 ${d.englishItems.length}개</p>
            </div>
            <span class="pill green">10개</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">${escapeHtml(d.latestEnglish.title || "오늘의 영어 단어")}</div>
          <div class="word-list">${renderEnglishDailyItems(d.englishItems, undefined, d.latestEnglish.date || "latest-english")}</div>
        </div>

        <div class="card">
          <div class="card-title">날짜별 영어 단어</div>
          ${renderDatedSections(d.englishEntries, renderEnglishDailyItems, "아직 영어 단어 기록 없음", "english")}
        </div>

        <div class="card">
          <div class="card-title">현재 진도</div>
          <span class="pill ${d.ph.cls}">${escapeHtml(d.ph.label)} · ${escapeHtml(d.ph.cefr)}</span>
          <div class="progress-row">
            <div class="prog-box">
              <div class="num">Day ${d.day || "-"}</div>
              <div class="lbl">현재 학습일</div>
            </div>
            <div class="prog-box">
              <div class="num">${escapeHtml(prog.total_words_learned || 0)}</div>
              <div class="lbl">누적 단어</div>
            </div>
            <div class="prog-box">
              <div class="num">${d.totalPct}%</div>
              <div class="lbl">전체 달성</div>
            </div>
          </div>
          <div class="progress-caption">이번 Phase 진행도</div>
          <div class="progress-bar-wrap">
            <div class="progress-bar" style="width:${d.pct}%"></div>
          </div>
          <div class="progress-label">
            <span>${escapeHtml(d.ph.range)}</span>
            <span>${d.pct}%</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">오늘 복습 예정</div>
          <div class="review-list">${renderReviewList(d.reviews)}</div>
        </div>

        <div class="card">
          <div class="card-title">오답노트 (${d.wrongWords.length}개)</div>
          <div class="error-list">${renderErrorList(d.wrongWords)}</div>
        </div>

        <div class="card">
          <div class="card-title">학습 통계</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-num">${escapeHtml(prog.stats?.total_study_sessions || 0)}</div>
              <div class="stat-lbl">총 세션</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">${escapeHtml(prog.stats?.total_correct || 0)}</div>
              <div class="stat-lbl">정답</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">${escapeHtml(prog.stats?.total_wrong || 0)}</div>
              <div class="stat-lbl">오답</div>
            </div>
          </div>
          <div class="action-row">
            <a class="action-link primary" href="./옥스포드_학습계획.html">학습 계획</a>
            <button class="action-link" type="button" data-action="refresh">새로고침</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">전체 로드맵</div>
          <div class="roadmap">
            ${Object.entries(PHASES).map(([key, ph]) => {
              const pNum = Number(key);
              const isDone = pNum < d.phase || (pNum === d.phase && d.pct >= 100);
              const isActive = pNum === d.phase && !isDone;
              const circleClass = isDone ? "road-done" : isActive ? "road-active" : "road-pending";
              const progress = isActive ? d.pct : isDone ? 100 : 0;

              return `
                <div class="road-item">
                  <div class="road-circle ${circleClass}">${isDone ? "완" : key}</div>
                  <div class="road-info">
                    <div class="road-name">${escapeHtml(ph.label)} · ${escapeHtml(ph.range)}</div>
                    <div class="road-sub">${escapeHtml(ph.cefr)} · ${escapeHtml(ph.total)}단어</div>
                  </div>
                  <div class="road-pct">${progress}%</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div class="updated-at">마지막 학습: ${escapeHtml(prog.last_studied || "-")}</div>
      </section>
    `;
  }

  function renderKnowledge(prog, errors, knowledge, englishDaily) {
    const d = getDerived(prog, errors, knowledge, englishDaily);

    return `
      <section class="view knowledge">
        <div class="card hero-card">
          <div class="hero-top">
            <div>
              <h2 class="hero-title">오늘의 상식</h2>
              <p class="hero-sub">${escapeHtml(d.latestKnowledge.date || "-")} 기준 ${d.knowledgeItems.length}개</p>
            </div>
            <span class="pill accent">3개</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">${escapeHtml(d.latestKnowledge.title || "오늘의 상식")}</div>
          <div class="knowledge-list">${renderKnowledgeItems(d.knowledgeItems)}</div>
        </div>

        <div class="card">
          <div class="card-title">날짜별 상식 목록</div>
          ${renderDatedSections(d.knowledgeEntries, renderKnowledgeItems, "아직 상식 기록 없음", "knowledge")}
        </div>
      </section>
    `;
  }

  function renderDashboard() {
    if (!state.data) return;

    const { prog, errors, knowledge, englishDaily } = state.data;
    const app = $("app");

    if (state.activeView === "english") {
      app.innerHTML = renderEnglish(prog, errors, knowledge, englishDaily);
    } else if (state.activeView === "knowledge") {
      app.innerHTML = renderKnowledge(prog, errors, knowledge, englishDaily);
    } else {
      app.innerHTML = renderToday(prog, errors, knowledge, englishDaily);
    }

    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.view === state.activeView);
    });

    $("streak-badge").textContent = `${prog.stats?.streak || 0}일`;
  }

  async function init() {
    const app = $("app");
    app.innerHTML = '<div class="loading">데이터 불러오는 중...</div>';

    try {
      state.localWrongWords = readLocalWrongWords();
      const [prog, errors, knowledge, englishDaily] = await Promise.all([
        loadJSON(FILES.progress),
        loadJSON(FILES.errors),
        loadJSON(FILES.knowledge, { updated_at: "", entries: [] }),
        loadJSON(FILES.englishDaily, { updated_at: "", entries: [] })
      ]);

      state.data = { prog, errors, knowledge, englishDaily };
      renderDashboard();
    } catch (e) {
      app.innerHTML =
        `<div class="error-load">데이터 로드 실패<br><small>${escapeHtml(e.message)}</small>` +
        '<br><br><button class="refresh-btn" type="button" data-action="refresh">다시 시도</button></div>';
    }
  }

  function setAuthError(message) {
    $("auth-error").textContent = message || "";
  }

  function showAuthModal() {
    const overlay = $("auth-overlay");
    const input = $("auth-input");
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    input.value = "";
    setAuthError("");
    setTimeout(() => input.focus(), 30);
  }

  function hideAuthModal() {
    const overlay = $("auth-overlay");
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  function renderAccessDenied() {
    $("app").innerHTML = '<div class="error-load">접근이 거부되었습니다.</div>';
  }

  async function hashPassword(pw) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function checkAuth() {
    const saved = sessionStorage.getItem("auth");
    if (saved === HASH) return true;

    return new Promise((resolve) => {
      const input = $("auth-input");
      const submitBtn = $("auth-submit");
      const cancelBtn = $("auth-cancel");

      const cleanup = () => {
        submitBtn.onclick = null;
        cancelBtn.onclick = null;
        input.onkeydown = null;
      };

      const submit = async () => {
        if (!window.crypto?.subtle) {
          setAuthError("HTTPS 환경에서 다시 열어주세요.");
          return;
        }

        const pw = input.value;
        if (!pw) {
          setAuthError("비밀번호를 입력하세요.");
          input.focus();
          return;
        }

        const hex = await hashPassword(pw);
        if (hex === HASH) {
          sessionStorage.setItem("auth", HASH);
          cleanup();
          hideAuthModal();
          resolve(true);
          return;
        }

        setAuthError("비밀번호가 올바르지 않습니다.");
        input.select();
      };

      submitBtn.onclick = submit;
      cancelBtn.onclick = () => {
        cleanup();
        hideAuthModal();
        renderAccessDenied();
        resolve(false);
      };
      input.onkeydown = (e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") cancelBtn.onclick();
      };

      showAuthModal();
    });
  }

  function initTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        state.activeView = tab.dataset.view || "today";
        renderDashboard();
      });
    });

    $("app").addEventListener("click", (event) => {
      const viewTarget = event.target.closest("[data-view-target]");
      if (viewTarget) {
        state.activeView = viewTarget.dataset.viewTarget;
        renderDashboard();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const dayToggle = event.target.closest("[data-action='toggle-day']");
      if (dayToggle) {
        const dayId = dayToggle.dataset.dayId;
        if (state.openDays.has(dayId)) {
          state.openDays.delete(dayId);
        } else {
          state.openDays.add(dayId);
        }
        renderDashboard();
        return;
      }

      const wordToggle = event.target.closest("[data-action='toggle-word']");
      if (wordToggle) {
        const wordId = wordToggle.dataset.wordId;
        if (state.revealedWords.has(wordId)) {
          state.revealedWords.delete(wordId);
        } else {
          state.revealedWords.add(wordId);
        }
        renderDashboard();
        return;
      }

      const addWrong = event.target.closest("[data-action='add-wrong']");
      if (addWrong && !addWrong.disabled) {
        try {
          const item = JSON.parse(decodeURIComponent(addWrong.dataset.wordPayload || ""));
          addLocalWrongWord(item);
          renderDashboard();
        } catch (e) {
          console.warn("오답노트 추가 실패", e);
        }
        return;
      }

      if (event.target.closest("[data-action='refresh']")) {
        init();
      }
    });
  }

  function initMemo() {
    const panel = $("memo-panel");
    const toggle = $("memo-toggle");
    const count = $("memo-count");
    const arrow = $("memo-arrow");
    const list = $("memo-list");
    const input = $("memo-input");
    const save = $("memo-save");
    const key = "__dashboard_memos__" + location.pathname;

    function read() {
      try {
        return JSON.parse(localStorage.getItem(key) || "[]");
      } catch (e) {
        return [];
      }
    }

    function write(items) {
      localStorage.setItem(key, JSON.stringify(items));
    }

    function updatePad() {
      document.body.style.paddingTop = panel.offsetHeight + "px";
    }

    function renderMemoList() {
      const memos = read();
      count.textContent = memos.length ? `(${memos.length})` : "";
      list.innerHTML = "";

      memos.forEach((memo, index) => {
        const item = document.createElement("div");
        item.className = "memo-item";

        const text = document.createElement("div");
        text.textContent = memo;
        item.appendChild(text);

        const actions = document.createElement("div");
        actions.className = "memo-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = "수정";
        edit.addEventListener("click", () => renderEditor(index, memo, item));

        const del = document.createElement("button");
        del.type = "button";
        del.textContent = "삭제";
        del.className = "danger";
        del.addEventListener("click", () => {
          if (!confirm("이 메모를 삭제할까요?")) return;
          const next = read();
          next.splice(index, 1);
          write(next);
          renderMemoList();
        });

        actions.append(edit, del);
        item.appendChild(actions);
        list.appendChild(item);
      });

      updatePad();
    }

    function renderEditor(index, memo, item) {
      item.innerHTML = "";

      const editor = document.createElement("textarea");
      editor.className = "memo-edit";
      editor.value = memo;

      const actions = document.createElement("div");
      actions.className = "memo-actions";

      const saveEdit = document.createElement("button");
      saveEdit.type = "button";
      saveEdit.textContent = "저장";
      saveEdit.addEventListener("click", () => {
        const value = editor.value.trim();
        if (!value) return;
        const next = read();
        next[index] = value;
        write(next);
        renderMemoList();
      });

      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.textContent = "취소";
      cancel.addEventListener("click", renderMemoList);

      actions.append(saveEdit, cancel);
      item.append(editor, actions);
      editor.focus();
      updatePad();
    }

    toggle.addEventListener("click", () => {
      const open = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      arrow.textContent = open ? "닫기" : "열기";
      setTimeout(updatePad, 20);
    });

    save.addEventListener("click", () => {
      const value = input.value.trim();
      if (!value) return;
      const next = read();
      next.push(value);
      write(next);
      input.value = "";
      renderMemoList();
    });

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggle.click();
      }
    });

    window.addEventListener("resize", updatePad);
    renderMemoList();
    setTimeout(updatePad, 150);
  }

  setTodayText();
  initTabs();
  initMemo();
  checkAuth().then((ok) => {
    if (ok) init();
  });
})();
