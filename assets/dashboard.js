(function () {
  const HASH = "5fa75ee2c5383fa601a45136751b99f41f203754378c650440e94c75020b70b0";
  const BASE = "./";
  const FILES = {
    progress: "진도관리.json",
    errors: "오답노트.json",
    knowledge: "data/knowledge.json",
    englishDaily: "data/english_daily.json",
    knowledgePool: "data/knowledge_pool.json",
    englishSource: "01_기초_동사형용사.json",
    speakingArticles: "data/speaking_articles.json",
    supabaseConfig: "data/supabase_config.json"
  };
  const LOCAL_WRONG_KEY = "english-study-local-wrong-words-v1";
  const LOCAL_FAVORITE_KNOWLEDGE_KEY = "english-study-local-favorite-knowledge-v1";
  const EXTRA_STUDY_KEY = "english-study-extra-study-v1";
  const SYNC_EMAIL_KEY = "english-study-sync-email-v1";
  const DIFFICULTIES = ["초급", "중급", "고급"];
  const EXTRA_KNOWLEDGE_QUOTA = { "초급": 2, "중급": 2, "고급": 2 };
  const EXTRA_ENGLISH_QUOTA = { "초급": 5, "중급": 5, "고급": 5 };

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
    extraStudy: {
      date: "",
      knowledgeItems: [],
      englishItems: [],
      message: ""
    },
    localWrongWords: [],
    remoteWrongWords: [],
    localFavoriteKnowledge: [],
    remoteFavoriteKnowledge: [],
    sync: {
      config: null,
      client: null,
      user: null,
      ready: false,
      loading: false,
      message: "",
      email: ""
    }
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

  function normalizeDifficulty(value) {
    const text = String(value || "").trim().toLowerCase();
    if (["intermediate", "medium", "mid", "중", "중급"].includes(text)) return "중급";
    if (["advanced", "hard", "high", "고", "고급"].includes(text)) return "고급";
    return "초급";
  }

  function difficultyClass(value) {
    const difficulty = normalizeDifficulty(value);
    if (difficulty === "중급") return "mid";
    if (difficulty === "고급") return "high";
    return "basic";
  }

  function renderDifficultyTag(value) {
    const difficulty = normalizeDifficulty(value);
    return `<span class="difficulty-tag ${difficultyClass(difficulty)}">${escapeHtml(difficulty)}</span>`;
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

  function readLocalFavoriteKnowledge() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_FAVORITE_KNOWLEDGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function readSyncEmail() {
    return localStorage.getItem(SYNC_EMAIL_KEY) || "";
  }

  function writeSyncEmail(email) {
    const value = String(email || "").trim();
    if (value) {
      localStorage.setItem(SYNC_EMAIL_KEY, value);
    } else {
      localStorage.removeItem(SYNC_EMAIL_KEY);
    }
    state.sync.email = value;
  }

  function writeLocalWrongWords(words) {
    localStorage.setItem(LOCAL_WRONG_KEY, JSON.stringify(words));
    state.localWrongWords = words;
  }

  function writeLocalFavoriteKnowledge(items) {
    localStorage.setItem(LOCAL_FAVORITE_KNOWLEDGE_KEY, JSON.stringify(items));
    state.localFavoriteKnowledge = items;
  }

  function emptyExtraStudy(message = "") {
    return {
      date: getLocalDateYMD(),
      knowledgeItems: [],
      englishItems: [],
      message
    };
  }

  function readExtraStudy() {
    try {
      const parsed = JSON.parse(localStorage.getItem(EXTRA_STUDY_KEY) || "null");
      if (!parsed || parsed.date !== getLocalDateYMD()) return emptyExtraStudy();
      return {
        date: parsed.date,
        knowledgeItems: Array.isArray(parsed.knowledgeItems) ? parsed.knowledgeItems : [],
        englishItems: Array.isArray(parsed.englishItems) ? parsed.englishItems : [],
        message: parsed.message || ""
      };
    } catch (e) {
      return emptyExtraStudy();
    }
  }

  function writeExtraStudy(extraStudy) {
    state.extraStudy = extraStudy;
    localStorage.setItem(EXTRA_STUDY_KEY, JSON.stringify(extraStudy));
  }

  function getWordKey(word) {
    return String(word || "").trim().toLowerCase();
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
    return mergeWrongWords([...(errors.words || []), ...state.localWrongWords, ...state.remoteWrongWords])
      .sort((a, b) => (b.wrong_count || 0) - (a.wrong_count || 0));
  }

  function isWrongWord(word) {
    const target = getWordKey(word);
    if (!target) return false;

    const remote = state.data?.errors?.words || [];
    return [...remote, ...state.localWrongWords, ...state.remoteWrongWords]
      .some((item) => getWordKey(item?.word) === target);
  }

  function isLocalWrongWord(word) {
    const target = getWordKey(word);
    if (!target) return false;
    return state.localWrongWords.some((item) => getWordKey(item?.word) === target);
  }

  function isRemoteWrongWord(word) {
    const target = getWordKey(word);
    if (!target) return false;
    return state.remoteWrongWords.some((item) => getWordKey(item?.word) === target);
  }

  function isUserWrongWord(word) {
    return isLocalWrongWord(word) || isRemoteWrongWord(word);
  }

  function addLocalWrongWord(item) {
    if (!item?.word) return;

    const now = getLocalDateYMD();
    const key = getWordKey(item.word);
    const next = [...state.localWrongWords];
    const existing = next.find((word) => getWordKey(word.word) === key);

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

  function removeLocalWrongWord(word) {
    const key = getWordKey(word);
    if (!key) return;

    writeLocalWrongWords(state.localWrongWords.filter((item) => getWordKey(item.word) !== key));
  }

  function toggleLocalWrongWord(item) {
    if (isLocalWrongWord(item?.word)) {
      removeLocalWrongWord(item.word);
      return;
    }

    addLocalWrongWord(item);
  }

  function getKnowledgeKey(item) {
    return String(item?.source_id || item?.id || item?.title || "").trim().toLowerCase();
  }

  function normalizeKnowledgeSources(sources) {
    let list = sources;
    if (typeof list === "string") {
      try {
        list = JSON.parse(list);
      } catch (e) {
        list = [];
      }
    }

    return Array.isArray(list)
      ? list
        .filter((source) => source?.url)
        .map((source) => ({
          label: source.label || "출처",
          url: source.url
        }))
      : [];
  }

  function normalizeFavoriteKnowledgeItem(item) {
    if (!item?.title) return null;

    return {
      source_id: item.source_id || item.id || "",
      difficulty: normalizeDifficulty(item.difficulty),
      category: item.category || "상식",
      title: item.title,
      body: item.body || "",
      takeaway: item.takeaway || "",
      sources: normalizeKnowledgeSources(item.sources),
      added_at: item.added_at || getLocalDateYMD()
    };
  }

  function mergeFavoriteKnowledge(items) {
    const merged = new Map();

    items.forEach((item) => {
      const normalized = normalizeFavoriteKnowledgeItem(item);
      const key = getKnowledgeKey(normalized);
      if (!normalized || !key) return;

      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, normalized);
        return;
      }

      existing.source_id = existing.source_id || normalized.source_id;
      existing.body = existing.body || normalized.body;
      existing.takeaway = existing.takeaway || normalized.takeaway;
      existing.category = existing.category || normalized.category;
      existing.sources = existing.sources.length ? existing.sources : normalized.sources;
      existing.added_at = existing.added_at || normalized.added_at;
    });

    return [...merged.values()].sort((a, b) => String(b.added_at || "").localeCompare(String(a.added_at || "")));
  }

  function getFavoriteKnowledge() {
    return mergeFavoriteKnowledge([...state.localFavoriteKnowledge, ...state.remoteFavoriteKnowledge]);
  }

  function isLocalFavoriteKnowledge(item) {
    const target = getKnowledgeKey(item);
    if (!target) return false;
    return state.localFavoriteKnowledge.some((saved) => getKnowledgeKey(saved) === target);
  }

  function isRemoteFavoriteKnowledge(item) {
    const target = getKnowledgeKey(item);
    if (!target) return false;
    return state.remoteFavoriteKnowledge.some((saved) => getKnowledgeKey(saved) === target);
  }

  function isFavoriteKnowledge(item) {
    return isLocalFavoriteKnowledge(item) || isRemoteFavoriteKnowledge(item);
  }

  function addLocalFavoriteKnowledge(item) {
    const normalized = normalizeFavoriteKnowledgeItem(item);
    const key = getKnowledgeKey(normalized);
    if (!normalized || !key) return;

    const next = state.localFavoriteKnowledge.filter((saved) => getKnowledgeKey(saved) !== key);
    next.unshift(normalized);
    writeLocalFavoriteKnowledge(next);
  }

  function removeLocalFavoriteKnowledge(item) {
    const key = getKnowledgeKey(item);
    if (!key) return;

    writeLocalFavoriteKnowledge(state.localFavoriteKnowledge.filter((saved) => getKnowledgeKey(saved) !== key));
  }

  function getSyncTable() {
    return state.sync.config?.wrongWordsTable || "study_wrong_words";
  }

  function getFavoriteKnowledgeTable() {
    return state.sync.config?.favoriteKnowledgeTable || "study_favorite_knowledge";
  }

  function isSupabaseConfigured(config) {
    return Boolean(config?.enabled && config?.url && config?.anonKey);
  }

  async function loadSupabaseClient() {
    if (state.sync.client) return state.sync.client;

    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
    state.sync.client = createClient(state.sync.config.url, state.sync.config.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "implicit",
        persistSession: true
      }
    });
    return state.sync.client;
  }

  function remoteRowToWrongWord(row) {
    return {
      word: row.word,
      meaning: row.meaning || "",
      example: row.example || "",
      category: row.category || "오늘의 영어",
      wrong_count: row.wrong_count || 1,
      added_at: row.added_at || null,
      remote_id: row.id
    };
  }

  function wrongWordToRemoteRow(item) {
    return {
      user_id: state.sync.user.id,
      word: item.word,
      word_key: getWordKey(item.word),
      meaning: item.meaning || "",
      example: item.example || "",
      category: item.category || "오늘의 영어",
      wrong_count: Number(item.wrong_count || 1),
      added_at: item.added_at || getLocalDateYMD(),
      updated_at: new Date().toISOString()
    };
  }

  async function loadRemoteWrongWords() {
    if (!state.sync.ready || !state.sync.user) {
      state.remoteWrongWords = [];
      return;
    }

    const { data, error } = await state.sync.client
      .from(getSyncTable())
      .select("id, word, meaning, example, category, wrong_count, added_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    state.remoteWrongWords = (data || []).map(remoteRowToWrongWord);
  }

  async function upsertRemoteWrongWord(item) {
    if (!state.sync.ready || !state.sync.user || !item?.word) return;

    const { error } = await state.sync.client
      .from(getSyncTable())
      .upsert(wrongWordToRemoteRow(item), { onConflict: "user_id,word_key" });

    if (error) throw error;
    await loadRemoteWrongWords();
  }

  async function deleteRemoteWrongWord(word) {
    if (!state.sync.ready || !state.sync.user || !word) return;

    const { error } = await state.sync.client
      .from(getSyncTable())
      .delete()
      .eq("user_id", state.sync.user.id)
      .eq("word_key", getWordKey(word));

    if (error) throw error;
    await loadRemoteWrongWords();
  }

  async function syncLocalWrongWordsToRemote() {
    if (!state.sync.ready || !state.sync.user || !state.localWrongWords.length) return;

    for (const item of state.localWrongWords) {
      await upsertRemoteWrongWord(item);
    }

    writeLocalWrongWords([]);
    await loadRemoteWrongWords();
  }

  function remoteRowToFavoriteKnowledge(row) {
    return normalizeFavoriteKnowledgeItem({
      source_id: row.source_id || "",
      difficulty: row.difficulty,
      category: row.category,
      title: row.title,
      body: row.body,
      takeaway: row.takeaway,
      sources: row.sources,
      added_at: row.added_at || null
    });
  }

  function favoriteKnowledgeToRemoteRow(item) {
    const normalized = normalizeFavoriteKnowledgeItem(item);
    if (!normalized) return null;

    return {
      user_id: state.sync.user.id,
      source_id: normalized.source_id,
      title_key: getKnowledgeKey(normalized),
      difficulty: normalized.difficulty,
      category: normalized.category,
      title: normalized.title,
      body: normalized.body,
      takeaway: normalized.takeaway,
      sources: normalized.sources,
      added_at: normalized.added_at || getLocalDateYMD(),
      updated_at: new Date().toISOString()
    };
  }

  async function loadRemoteFavoriteKnowledge() {
    if (!state.sync.ready || !state.sync.user) {
      state.remoteFavoriteKnowledge = [];
      return;
    }

    const { data, error } = await state.sync.client
      .from(getFavoriteKnowledgeTable())
      .select("id, source_id, title_key, difficulty, category, title, body, takeaway, sources, added_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    state.remoteFavoriteKnowledge = (data || []).map(remoteRowToFavoriteKnowledge).filter(Boolean);
  }

  async function upsertRemoteFavoriteKnowledge(item) {
    if (!state.sync.ready || !state.sync.user || !item?.title) return;

    const row = favoriteKnowledgeToRemoteRow(item);
    if (!row?.title_key) return;

    const { error } = await state.sync.client
      .from(getFavoriteKnowledgeTable())
      .upsert(row, { onConflict: "user_id,title_key" });

    if (error) throw error;
    await loadRemoteFavoriteKnowledge();
  }

  async function deleteRemoteFavoriteKnowledge(item) {
    if (!state.sync.ready || !state.sync.user) return;

    const key = getKnowledgeKey(item);
    if (!key) return;

    const { error } = await state.sync.client
      .from(getFavoriteKnowledgeTable())
      .delete()
      .eq("user_id", state.sync.user.id)
      .eq("title_key", key);

    if (error) throw error;
    await loadRemoteFavoriteKnowledge();
  }

  async function syncLocalFavoriteKnowledgeToRemote() {
    if (!state.sync.ready || !state.sync.user || !state.localFavoriteKnowledge.length) return;

    for (const item of state.localFavoriteKnowledge) {
      await upsertRemoteFavoriteKnowledge(item);
    }

    writeLocalFavoriteKnowledge([]);
    await loadRemoteFavoriteKnowledge();
  }

  async function toggleWrongWord(item) {
    if (isUserWrongWord(item?.word)) {
      removeLocalWrongWord(item.word);
      await deleteRemoteWrongWord(item.word);
      return;
    }

    addLocalWrongWord(item);
    await upsertRemoteWrongWord({
      ...item,
      wrong_count: 1,
      added_at: getLocalDateYMD()
    });
  }

  async function toggleFavoriteKnowledge(item) {
    if (isFavoriteKnowledge(item)) {
      removeLocalFavoriteKnowledge(item);
      try {
        await deleteRemoteFavoriteKnowledge(item);
      } catch (e) {
        state.sync.message = "관심상식 원격 해제에 실패했습니다. 잠시 후 싱크 새로고침을 눌러주세요.";
        console.warn("Favorite knowledge delete failed", e);
      }
      return;
    }

    addLocalFavoriteKnowledge(item);
    try {
      await upsertRemoteFavoriteKnowledge(item);
    } catch (e) {
      state.sync.message = "관심상식은 이 기기에 저장되었습니다. Supabase SQL 설정 후 모바일과 동기화됩니다.";
      console.warn("Favorite knowledge upsert failed", e);
    }
  }

  async function syncLocalStudyDataToRemote() {
    await syncLocalWrongWordsToRemote();
    try {
      await syncLocalFavoriteKnowledgeToRemote();
    } catch (e) {
      state.sync.message = "관심상식 동기화 테이블 설정이 필요합니다.";
      console.warn("Favorite knowledge local sync failed", e);
    }
  }

  async function refreshRemoteStudyData() {
    await loadRemoteWrongWords();
    try {
      await loadRemoteFavoriteKnowledge();
    } catch (e) {
      state.sync.message = "오답노트는 동기화했고, 관심상식은 Supabase SQL 설정이 필요합니다.";
      console.warn("Favorite knowledge refresh failed", e);
    }
  }

  function getAuthUrlError() {
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
    const error = params.get("error_description") || hashParams.get("error_description") || params.get("error") || hashParams.get("error");
    return error ? decodeURIComponent(error.replace(/\+/g, " ")) : "";
  }

  async function initSync(config) {
    state.sync.config = config || {};
    state.sync.email = readSyncEmail();
    state.sync.message = getAuthUrlError();

    if (!isSupabaseConfigured(config)) {
      state.sync.ready = false;
      state.sync.user = null;
      state.remoteWrongWords = [];
      state.remoteFavoriteKnowledge = [];
      return;
    }

    try {
      state.sync.loading = true;
      const client = await loadSupabaseClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;

      state.sync.user = data.session?.user || null;
      state.sync.ready = true;

      if (state.sync.user) {
        await syncLocalStudyDataToRemote();
        await refreshRemoteStudyData();
      }
    } catch (e) {
      state.sync.ready = false;
      state.remoteWrongWords = [];
      state.remoteFavoriteKnowledge = [];
      state.sync.message = "Supabase 동기화를 시작하지 못했습니다.";
      console.warn("Supabase sync init failed", e);
    } finally {
      state.sync.loading = false;
    }
  }

  async function signInToSync(email) {
    if (!state.sync.client || !email) return;

    state.sync.loading = true;
    try {
      writeSyncEmail(email);
      const redirectTo = state.sync.config?.authRedirectUrl || location.href.split("#")[0];
      let { error } = await state.sync.client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      });

      if (error) {
        const fallback = await state.sync.client.auth.signInWithOtp({ email });
        if (fallback.error) throw fallback.error;
        state.sync.message = "로그인 메일을 보냈습니다. 링크가 열리지 않으면 메일 인증코드를 입력하세요.";
        return;
      }

      state.sync.message = "로그인 링크와 인증코드를 이메일로 보냈습니다.";
    } catch (e) {
      state.sync.message = `로그인 링크 전송에 실패했습니다: ${e?.message || e?.error_description || "Supabase 설정을 확인해 주세요."}`;
      console.warn("Supabase sign in failed", e);
    } finally {
      state.sync.loading = false;
    }
  }

  async function verifySyncOtp(email, token) {
    if (!state.sync.client || !email || !token) return;

    state.sync.loading = true;
    try {
      writeSyncEmail(email);
      let data = null;
      let lastError = null;
      const otpTypes = ["email", "magiclink", "signup"];

      for (const type of otpTypes) {
        const result = await state.sync.client.auth.verifyOtp({ email, token, type });
        if (!result.error) {
          data = result.data;
          lastError = null;
          break;
        }
        lastError = result.error;
      }

      if (lastError) throw lastError;

      state.sync.user = data.user || data.session?.user || null;
      state.sync.ready = true;
      state.sync.message = "";
      if (state.sync.user) {
        await syncLocalStudyDataToRemote();
        await refreshRemoteStudyData();
      }
      if (!state.sync.message) {
        state.sync.message = "인증코드로 로그인되었습니다.";
      }
    } catch (e) {
      state.sync.message = "인증코드 로그인이 실패했습니다. 코드 만료 또는 이메일 불일치일 수 있습니다.";
      console.warn("Supabase OTP verify failed", e);
    } finally {
      state.sync.loading = false;
    }
  }

  async function signOutFromSync() {
    if (!state.sync.client) return;

    await state.sync.client.auth.signOut();
    state.sync.user = null;
    state.remoteWrongWords = [];
    state.remoteFavoriteKnowledge = [];
    state.sync.message = "동기화 로그아웃됨";
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

  function collectKnowledgeKeys(knowledge, extraItems = []) {
    const keys = new Set();
    getDatedEntries(knowledge).forEach((entry) => {
      getEntryItems(entry).forEach((item) => {
        [item.source_id, item.id, item.title]
          .map((value) => String(value || "").trim().toLowerCase())
          .filter(Boolean)
          .forEach((key) => keys.add(key));
      });
    });
    extraItems.forEach((item) => {
      [item.source_id, item.id, item.title]
        .map((value) => String(value || "").trim().toLowerCase())
        .filter(Boolean)
        .forEach((key) => keys.add(key));
    });
    return keys;
  }

  function collectEnglishKeys(englishDaily, extraItems = []) {
    const keys = new Set();
    getDatedEntries(englishDaily).forEach((entry) => {
      getEntryItems(entry).forEach((item) => keys.add(getWordKey(item.word)));
    });
    extraItems.forEach((item) => keys.add(getWordKey(item.word)));
    keys.delete("");
    return keys;
  }

  function pickPoolByDifficulty(items, quota, used, keyFn) {
    const picked = [];
    const pickedKeys = new Set();

    for (const difficulty of DIFFICULTIES) {
      let count = 0;
      for (const item of items || []) {
        if (normalizeDifficulty(item.difficulty) !== difficulty) continue;

        const keys = keyFn(item)
          .map((value) => String(value || "").trim().toLowerCase())
          .filter(Boolean);
        if (!keys.length || keys.some((key) => used.has(key) || pickedKeys.has(key))) continue;

        picked.push(item);
        keys.forEach((key) => pickedKeys.add(key));
        count += 1;
        if (count >= quota[difficulty]) break;
      }

      if (count < quota[difficulty]) {
        return { ok: false, difficulty, picked };
      }
    }

    return { ok: true, picked };
  }

  function cloneKnowledgePoolItem(item) {
    return {
      source_id: item.id,
      difficulty: normalizeDifficulty(item.difficulty),
      category: item.category,
      title: item.title,
      body: item.body,
      takeaway: item.takeaway,
      sources: item.sources || []
    };
  }

  function oxfordUrl(word) {
    const slug = String(word || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `https://www.oxfordlearnersdictionaries.com/definition/english/${slug}`;
  }

  function cloneEnglishPoolItem(item) {
    return {
      difficulty: normalizeDifficulty(item.difficulty),
      word: item.word,
      meaning: item.meaning,
      example: item.example,
      note: item.note || `${item.meaning || ""}라는 뜻입니다. 예문과 함께 문장째 익혀보세요.`,
      sources: item.sources || [
        {
          label: "Oxford Learner's Dictionaries",
          url: oxfordUrl(item.word)
        }
      ]
    };
  }

  function requestExtraStudy(kind) {
    if (!state.data) return;

    const today = getLocalDateYMD();
    const current = state.extraStudy.date === today ? state.extraStudy : emptyExtraStudy();
    const next = {
      date: today,
      knowledgeItems: [...current.knowledgeItems],
      englishItems: [...current.englishItems],
      message: ""
    };
    const messages = [];

    if (kind === "knowledge" || kind === "both") {
      const used = collectKnowledgeKeys(state.data.knowledge, next.knowledgeItems);
      const selected = pickPoolByDifficulty(state.data.knowledgePool?.items, EXTRA_KNOWLEDGE_QUOTA, used, (item) => [item.id, item.title]);
      if (selected.ok) {
        next.knowledgeItems.push(...selected.picked.map(cloneKnowledgePoolItem));
        messages.push("상식 추가 학습 6개를 불러왔습니다.");
      } else {
        messages.push(`${selected.difficulty} 상식 풀이 부족합니다.`);
      }
    }

    if (kind === "english" || kind === "both") {
      const used = collectEnglishKeys(state.data.englishDaily, next.englishItems);
      const selected = pickPoolByDifficulty(state.data.englishSource?.words, EXTRA_ENGLISH_QUOTA, used, (item) => [item.word]);
      if (selected.ok) {
        next.englishItems.push(...selected.picked.map(cloneEnglishPoolItem));
        messages.push("영어 추가 학습 15개를 불러왔습니다.");
      } else {
        messages.push(`${selected.difficulty} 영어 단어 풀이 부족합니다.`);
      }
    }

    next.message = messages.join(" ");
    writeExtraStudy(next);
  }

  function renderSourceLinks(sources) {
    const list = normalizeKnowledgeSources(sources);
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

    return list.map((item) => {
      const saved = isFavoriteKnowledge(item);

      return `
      <article class="knowledge-item">
        <div class="meta-row">
          <span class="knowledge-category">${escapeHtml(item.category || "상식")}</span>
          ${renderDifficultyTag(item.difficulty)}
        </div>
        <h3 class="knowledge-title">${escapeHtml(item.title || "")}</h3>
        <p class="knowledge-body">${escapeHtml(item.body || "")}</p>
        ${item.takeaway ? `<p class="knowledge-takeaway">${escapeHtml(item.takeaway)}</p>` : ""}
        ${renderSourceLinks(item.sources)}
        <div class="knowledge-actions">
          <button class="knowledge-btn${saved ? " danger" : ""}" type="button" data-action="toggle-knowledge-favorite" data-knowledge-payload="${encodePayload(item)}">
            ${saved ? "관심상식에서 제거" : "관심상식에 추가"}
          </button>
        </div>
      </article>
    `;
    }).join("");
  }

  function renderSpeakingArticleItems(items, limit) {
    const list = limit ? items.slice(0, limit) : items;
    if (!list.length) {
      return '<div class="empty-msg">1분 설명 아티클 데이터가 없습니다.</div>';
    }

    return list.map((item) => `
      <article class="speaking-article">
        <div class="meta-row">
          <span class="knowledge-category">${escapeHtml(item.topic || "말하기")}</span>
          <span class="pill primary">읽기 3분 · 말하기 1분</span>
        </div>
        <h3 class="speaking-title">${escapeHtml(item.titleKo || "")}</h3>
        <p class="speaking-body">${escapeHtml(item.bodyKo || "")}</p>
        <div class="speaking-english">
          <div class="speaking-label">English</div>
          <h4>${escapeHtml(item.titleEn || "")}</h4>
          <p>${escapeHtml(item.bodyEn || "")}</p>
        </div>
        ${item.point ? `<p class="speaking-point"><strong>핵심 주장:</strong> ${escapeHtml(item.point)}</p>` : ""}
        ${Array.isArray(item.steps) && item.steps.length ? `
          <div class="speaking-box">
            <div class="speaking-label">1분 설명 구조</div>
            <ol class="speaking-steps">
              ${item.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
            </ol>
          </div>
        ` : ""}
        ${Array.isArray(item.questions) && item.questions.length ? `
          <div class="speaking-box">
            <div class="speaking-label">생각 질문</div>
            <ul class="speaking-questions">
              ${item.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
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
      const userAdded = isUserWrongWord(item.word);
      const wrongButtonText = userAdded
        ? "오답노트에서 제거"
        : added
          ? "오답노트에 있음"
          : "오답노트에 추가";

      return `
      <article class="word-item${revealed ? " open" : ""}">
        <div class="word-head">
          <span class="word-index">${index + 1}</span>
          <div>
            <div class="word-title-row">
              <h3 class="word-title">${escapeHtml(item.word || "")}</h3>
              ${renderDifficultyTag(item.difficulty)}
            </div>
          </div>
        </div>
        <div class="word-actions">
          <button class="word-btn" type="button" data-action="toggle-word" data-word-id="${escapeHtml(wordId)}">
            ${revealed ? "뜻 숨기기" : "뜻 보기"}
          </button>
          ${revealed ? `
            <button class="word-btn secondary${userAdded ? " danger" : ""}" type="button" data-action="toggle-wrong" data-word-payload="${encodePayload(item)}" ${added && !userAdded ? "disabled" : ""}>
              ${wrongButtonText}
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
          const isSpeaking = renderItems === renderSpeakingArticleItems;

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
            <div class="day-content ${isEnglish ? "word-list" : isSpeaking ? "speaking-list" : "knowledge-list"}">
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
          ${isUserWrongWord(w.word) ? `
            <button class="error-remove" type="button" data-action="toggle-wrong" data-word-payload="${encodePayload(w)}">
              오답노트에서 제거
            </button>
          ` : ""}
        </div>
      </div>
    `).join("");

    const hidden = wrongWords.length > limit
      ? `<div class="empty-msg">외 ${wrongWords.length - limit}개 더</div>`
      : "";

    return visible + hidden;
  }

  function renderSyncPanel() {
    const configured = isSupabaseConfigured(state.sync.config);
    const message = state.sync.message ? `<p class="sync-message">${escapeHtml(state.sync.message)}</p>` : "";

    if (!configured) {
      return `
        <div class="card compact sync-card">
          <div class="card-title">기기 간 싱크</div>
          <p class="hero-sub">현재 오답노트와 관심상식은 이 브라우저에 저장됩니다. Supabase 설정을 완료하면 PC와 모바일이 같은 목록을 공유합니다.</p>
        </div>
      `;
    }

    if (state.sync.user) {
      return `
        <div class="card compact sync-card">
          <div class="card-title">기기 간 싱크</div>
          <p class="hero-sub">Supabase에 로그인되어 있습니다. 오답노트와 관심상식은 PC와 모바일에서 동기화됩니다.</p>
          <div class="sync-user">${escapeHtml(state.sync.user.email || state.sync.user.id)}</div>
          ${message}
          <div class="action-row">
            <button class="action-link primary" type="button" data-action="sync-refresh">싱크 새로고침</button>
            <button class="action-link" type="button" data-action="sync-logout">로그아웃</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="card compact sync-card">
        <div class="card-title">기기 간 싱크</div>
        <p class="hero-sub">같은 이메일로 PC와 모바일에서 로그인하면 오답노트와 관심상식이 동기화됩니다. 링크가 실패하면 이메일의 인증코드를 입력하세요.</p>
        <div class="sync-form">
          <input class="sync-input" id="sync-email" type="email" placeholder="이메일 입력" autocomplete="email" value="${escapeHtml(state.sync.email)}">
          <button class="sync-button" type="button" data-action="sync-login" ${state.sync.loading ? "disabled" : ""}>
            ${state.sync.loading ? "전송 중" : "링크/코드 받기"}
          </button>
          <input class="sync-input" id="sync-token" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="메일 인증코드" autocomplete="one-time-code">
          <button class="sync-button secondary" type="button" data-action="sync-verify" ${state.sync.loading ? "disabled" : ""}>
            코드로 로그인
          </button>
        </div>
        ${message}
      </div>
    `;
  }

  function renderExtraStatus() {
    if (!state.extraStudy.message) return "";
    return `<p class="extra-status">${escapeHtml(state.extraStudy.message)}</p>`;
  }

  function renderExtraKnowledgeCard() {
    if (!state.extraStudy.knowledgeItems.length) return "";
    return `
      <div class="card extra-card">
        <div class="card-title">추가 요청 상식 (${state.extraStudy.knowledgeItems.length}개)</div>
        <div class="knowledge-list">${renderKnowledgeItems(state.extraStudy.knowledgeItems)}</div>
      </div>
    `;
  }

  function renderExtraEnglishCard() {
    if (!state.extraStudy.englishItems.length) return "";
    return `
      <div class="card extra-card">
        <div class="card-title">추가 요청 영어 (${state.extraStudy.englishItems.length}개)</div>
        <div class="word-list">${renderEnglishDailyItems(state.extraStudy.englishItems, undefined, "extra-english")}</div>
      </div>
    `;
  }

  function renderFavoriteKnowledgeCard(items, limit) {
    if (!items.length) return "";
    const title = limit && items.length > limit
      ? `관심상식 (${limit}/${items.length}개)`
      : `관심상식 (${items.length}개)`;

    return `
      <div class="card favorite-knowledge-card">
        <div class="card-title">${title}</div>
        <div class="knowledge-list">${renderKnowledgeItems(items, limit)}</div>
        ${limit && items.length > limit ? `
          <div class="action-row favorite-actions">
            <button class="action-link" type="button" data-view-target="knowledge">전체 관심상식 보기</button>
          </div>
        ` : ""}
      </div>
    `;
  }

  function getDerived(prog, errors, knowledge, englishDaily, speakingArticles) {
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
    const speakingEntries = getDatedEntries(speakingArticles || { entries: [] });
    const latestSpeaking = getLatestEntry(speakingArticles || { entries: [] });
    const speakingItems = getEntryItems(latestSpeaking);
    const favoriteKnowledge = getFavoriteKnowledge();

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
      favoriteKnowledge,
      englishEntries,
      latestEnglish,
      englishItems,
      speakingEntries,
      latestSpeaking,
      speakingItems
    };
  }

  function renderToday(prog, errors, knowledge, englishDaily, speakingArticles) {
    const d = getDerived(prog, errors, knowledge, englishDaily, speakingArticles);
    const studyLabel = d.day > 0 ? `Day ${d.day}` : "Day 1";
    const updated = knowledge.updated_at ? escapeHtml(knowledge.updated_at) : "-";
    const speakingUpdated = speakingArticles?.updated_at ? escapeHtml(speakingArticles.updated_at) : "-";

    return `
      <section class="view today">
        <div class="card hero-card">
          <div class="hero-top">
            <div>
              <h2 class="hero-title">오늘 볼 것</h2>
              <p class="hero-sub">상식, 영어, 1분 설명 아티클을 날짜별로 관리합니다.</p>
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
              <div class="summary-num">${d.speakingItems.length}</div>
              <div class="summary-label">말하기</div>
            </div>
            <div class="summary-item">
              <div class="summary-num">${d.favoriteKnowledge.length}</div>
              <div class="summary-label">관심상식</div>
            </div>
            <div class="summary-item">
              <div class="summary-num">${d.reviews.length}</div>
              <div class="summary-label">복습</div>
            </div>
          </div>
          <div class="action-row">
            <button class="action-link primary" type="button" data-view-target="knowledge">상식 보기</button>
            <button class="action-link" type="button" data-view-target="english">영어 보기</button>
            <button class="action-link" type="button" data-view-target="speaking">말하기 연습</button>
            <button class="action-link" type="button" data-action="request-extra" data-extra-kind="both">추가 학습 요청</button>
          </div>
          ${renderExtraStatus()}
        </div>

        <div class="card speaking-preview">
          <div class="card-title">${escapeHtml(d.latestSpeaking.title || "오늘의 1분 설명 아티클")}</div>
          <div class="speaking-list">
            ${renderSpeakingArticleItems(d.speakingItems)}
          </div>
          <div class="updated-at">업데이트: ${speakingUpdated}</div>
        </div>

        <div class="card knowledge-preview">
          <div class="card-title">${escapeHtml(d.latestKnowledge.title || "오늘의 상식")}</div>
          <div class="knowledge-list">
            ${renderKnowledgeItems(d.knowledgeItems)}
          </div>
          <div class="updated-at">업데이트: ${updated}</div>
        </div>

        <div class="card compact">
          <div class="card-title">${escapeHtml(d.latestEnglish.title || "오늘의 영어 단어")}</div>
          <div class="word-list">
            ${renderEnglishDailyItems(d.englishItems, undefined, d.latestEnglish.date || "today")}
          </div>
        </div>

        ${renderExtraKnowledgeCard()}
        ${renderExtraEnglishCard()}
        ${renderFavoriteKnowledgeCard(d.favoriteKnowledge, 3)}

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

  function renderEnglish(prog, errors, knowledge, englishDaily, speakingArticles) {
    const d = getDerived(prog, errors, knowledge, englishDaily, speakingArticles);

    return `
      <section class="view english">
        ${renderSyncPanel()}

        <div class="card hero-card">
          <div class="hero-top">
            <div>
              <h2 class="hero-title">오늘의 영어 단어</h2>
              <p class="hero-sub">${escapeHtml(d.latestEnglish.date || "-")} 기준 ${d.englishItems.length}개</p>
            </div>
            <span class="pill green">15개</span>
          </div>
          <div class="action-row">
            <button class="action-link primary" type="button" data-action="request-extra" data-extra-kind="english">추가 단어 요청</button>
            <button class="action-link" type="button" data-action="refresh">새로고침</button>
          </div>
          ${renderExtraStatus()}
        </div>

        <div class="card">
          <div class="card-title">${escapeHtml(d.latestEnglish.title || "오늘의 영어 단어")}</div>
          <div class="word-list">${renderEnglishDailyItems(d.englishItems, undefined, d.latestEnglish.date || "latest-english")}</div>
        </div>

        ${renderExtraEnglishCard()}

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

  function renderKnowledge(prog, errors, knowledge, englishDaily, speakingArticles) {
    const d = getDerived(prog, errors, knowledge, englishDaily, speakingArticles);

    return `
      <section class="view knowledge">
        ${renderSyncPanel()}

        <div class="card hero-card">
          <div class="hero-top">
            <div>
              <h2 class="hero-title">오늘의 상식</h2>
              <p class="hero-sub">${escapeHtml(d.latestKnowledge.date || "-")} 기준 ${d.knowledgeItems.length}개</p>
            </div>
            <span class="pill accent">6개</span>
          </div>
          <div class="action-row">
            <button class="action-link primary" type="button" data-action="request-extra" data-extra-kind="knowledge">추가 상식 요청</button>
            <button class="action-link" type="button" data-action="refresh">새로고침</button>
          </div>
          ${renderExtraStatus()}
        </div>

        <div class="card">
          <div class="card-title">${escapeHtml(d.latestKnowledge.title || "오늘의 상식")}</div>
          <div class="knowledge-list">${renderKnowledgeItems(d.knowledgeItems)}</div>
        </div>

        ${renderExtraKnowledgeCard()}

        ${d.favoriteKnowledge.length
          ? renderFavoriteKnowledgeCard(d.favoriteKnowledge)
          : '<div class="card"><div class="card-title">관심상식 (0개)</div><div class="empty-msg">관심상식에 추가한 항목이 없습니다.</div></div>'}

        <div class="card">
          <div class="card-title">날짜별 상식 목록</div>
          ${renderDatedSections(d.knowledgeEntries, renderKnowledgeItems, "아직 상식 기록 없음", "knowledge")}
        </div>
      </section>
    `;
  }

  function renderSpeaking(prog, errors, knowledge, englishDaily, speakingArticles) {
    const d = getDerived(prog, errors, knowledge, englishDaily, speakingArticles);

    return `
      <section class="view speaking">
        ${renderSyncPanel()}

        <div class="card hero-card">
          <div class="hero-top">
            <div>
              <h2 class="hero-title">1분 설명 아티클</h2>
              <p class="hero-sub">${escapeHtml(d.latestSpeaking.date || "-")} 기준 ${d.speakingItems.length}개</p>
            </div>
            <span class="pill primary">말하기</span>
          </div>
          <div class="action-row">
            <button class="action-link primary" type="button" data-view-target="today">오늘로 돌아가기</button>
            <button class="action-link" type="button" data-action="refresh">새로고침</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">${escapeHtml(d.latestSpeaking.title || "오늘의 1분 설명 아티클")}</div>
          <div class="speaking-list">${renderSpeakingArticleItems(d.speakingItems)}</div>
        </div>

        <div class="card">
          <div class="card-title">날짜별 1분 설명 아티클</div>
          ${renderDatedSections(d.speakingEntries, renderSpeakingArticleItems, "아직 1분 설명 아티클 기록 없음", "speaking")}
        </div>
      </section>
    `;
  }

  function renderDashboard() {
    if (!state.data) return;

    const { prog, errors, knowledge, englishDaily, speakingArticles } = state.data;
    const app = $("app");

    if (state.activeView === "english") {
      app.innerHTML = renderEnglish(prog, errors, knowledge, englishDaily, speakingArticles);
    } else if (state.activeView === "knowledge") {
      app.innerHTML = renderKnowledge(prog, errors, knowledge, englishDaily, speakingArticles);
    } else if (state.activeView === "speaking") {
      app.innerHTML = renderSpeaking(prog, errors, knowledge, englishDaily, speakingArticles);
    } else {
      app.innerHTML = renderToday(prog, errors, knowledge, englishDaily, speakingArticles);
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
      state.localFavoriteKnowledge = readLocalFavoriteKnowledge();
      state.extraStudy = readExtraStudy();
      const [prog, errors, knowledge, englishDaily, knowledgePool, englishSource, speakingArticles, supabaseConfig] = await Promise.all([
        loadJSON(FILES.progress),
        loadJSON(FILES.errors),
        loadJSON(FILES.knowledge, { updated_at: "", entries: [] }),
        loadJSON(FILES.englishDaily, { updated_at: "", entries: [] }),
        loadJSON(FILES.knowledgePool, { items: [] }),
        loadJSON(FILES.englishSource, { words: [] }),
        loadJSON(FILES.speakingArticles, { updated_at: "", default_daily_count: 1, entries: [] }),
        loadJSON(FILES.supabaseConfig, { enabled: false })
      ]);

      state.data = { prog, errors, knowledge, englishDaily, knowledgePool, englishSource, speakingArticles };
      await initSync(supabaseConfig);
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

    $("app").addEventListener("click", async (event) => {
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

      const wrongToggle = event.target.closest("[data-action='toggle-wrong']");
      if (wrongToggle && !wrongToggle.disabled) {
        try {
          const item = JSON.parse(decodeURIComponent(wrongToggle.dataset.wordPayload || ""));
          await toggleWrongWord(item);
          renderDashboard();
        } catch (e) {
          console.warn("오답노트 변경 실패", e);
        }
        return;
      }

      const knowledgeFavoriteToggle = event.target.closest("[data-action='toggle-knowledge-favorite']");
      if (knowledgeFavoriteToggle) {
        try {
          const item = JSON.parse(decodeURIComponent(knowledgeFavoriteToggle.dataset.knowledgePayload || ""));
          await toggleFavoriteKnowledge(item);
          renderDashboard();
        } catch (e) {
          state.sync.message = "관심상식 변경에 실패했습니다.";
          console.warn("관심상식 변경 실패", e);
          renderDashboard();
        }
        return;
      }

      const extraRequest = event.target.closest("[data-action='request-extra']");
      if (extraRequest) {
        requestExtraStudy(extraRequest.dataset.extraKind || "both");
        renderDashboard();
        return;
      }

      if (event.target.closest("[data-action='sync-login']")) {
        await signInToSync($("sync-email")?.value.trim());
        renderDashboard();
        return;
      }

      if (event.target.closest("[data-action='sync-verify']")) {
        await verifySyncOtp($("sync-email")?.value.trim(), $("sync-token")?.value.trim());
        renderDashboard();
        return;
      }

      if (event.target.closest("[data-action='sync-logout']")) {
        await signOutFromSync();
        renderDashboard();
        return;
      }

      if (event.target.closest("[data-action='sync-refresh']")) {
        try {
          state.sync.message = "";
          await refreshRemoteStudyData();
          if (!state.sync.message) {
            state.sync.message = "오답노트와 관심상식을 다시 동기화했습니다.";
          }
        } catch (e) {
          state.sync.message = "동기화 새로고침에 실패했습니다.";
          console.warn("Supabase refresh failed", e);
        }
        renderDashboard();
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
