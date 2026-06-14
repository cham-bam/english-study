const fs = require("fs");
const path = require("path");
const {
  makeGeneratedKnowledge,
  KNOWLEDGE_GENERATION_VERSION,
  makeGeneratedEnglish,
  makeGeneratedSpeakingArticle,
  SPEAKING_GENERATION_VERSION,
  makeGeneratedCare,
  CARE_GENERATION_VERSION,
  lookupEnglishWord,
  lookupExampleTranslation
} = require("./generated-content");

const root = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");
const printDate = process.argv.includes("--print-date");

const DIFFICULTIES = ["초급", "중급", "고급"];
const DEFAULT_KNOWLEDGE_QUOTA = { "초급": 2, "중급": 2, "고급": 2 };
const DEFAULT_ENGLISH_QUOTA = { "초급": 5, "중급": 5, "고급": 5 };
const DEFAULT_SPEAKING_DAILY_COUNT = 1;
const DEFAULT_CARE_DAILY_COUNT = 2;

const paths = {
  knowledge: path.join(root, "data", "knowledge.json"),
  knowledgePool: path.join(root, "data", "knowledge_pool.json"),
  english: path.join(root, "data", "english_daily.json"),
  englishSource: path.join(root, "01_기초_동사형용사.json"),
  speaking: path.join(root, "data", "speaking_articles.json"),
  speakingPool: path.join(root, "data", "speaking_article_pool.json"),
  care: path.join(root, "data", "care_daily.json")
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  if (dryRun) return;
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function getKstDate() {
  if (process.env.STUDY_DATE) return process.env.STUDY_DATE;

  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeDifficulty(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["beginner", "basic", "easy", "초", "초급"].includes(text)) return "초급";
  if (["intermediate", "medium", "mid", "중", "중급"].includes(text)) return "중급";
  if (["advanced", "hard", "high", "고", "고급"].includes(text)) return "고급";
  return "초급";
}

function getEntryItems(entry) {
  return Array.isArray(entry?.items) ? entry.items : [];
}

function getQuotaMap(source, fallback) {
  const result = {};
  DIFFICULTIES.forEach((difficulty) => {
    result[difficulty] = Number(source?.[difficulty] || fallback[difficulty] || 0);
  });
  return result;
}

function quotaTotal(quota) {
  return DIFFICULTIES.reduce((sum, difficulty) => sum + Number(quota[difficulty] || 0), 0);
}

function pickByDifficulty(items, quota, used, keyFns) {
  const picked = [];
  const pickedKeys = new Set();

  for (const difficulty of DIFFICULTIES) {
    let count = 0;
    for (const item of items) {
      if (normalizeDifficulty(item.difficulty) !== difficulty) continue;

      const keys = keyFns.flatMap((fn) => {
        const value = fn(item);
        return Array.isArray(value) ? value : [value];
      }).map(normalizeKey).filter(Boolean);

      if (!keys.length || keys.some((key) => used.has(key) || pickedKeys.has(key))) continue;

      picked.push(item);
      keys.forEach((key) => pickedKeys.add(key));
      count += 1;
      if (count >= quota[difficulty]) break;
    }

    if (count < quota[difficulty]) {
      return {
        ok: false,
        difficulty,
        needed: quota[difficulty],
        found: count,
        picked
      };
    }
  }

  return { ok: true, picked };
}

function cloneKnowledgeItem(item) {
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

function isGeneratedKnowledgeEntry(entry) {
  return getEntryItems(entry).some((item) => {
    const key = String(item.source_id || item.id || "");
    return key.startsWith("generated-knowledge-");
  });
}

function updateKnowledge(date) {
  const knowledge = readJson(paths.knowledge);
  knowledge.entries = Array.isArray(knowledge.entries) ? knowledge.entries : [];

  const existing = knowledge.entries.find((entry) => entry.date === date);
  const shouldRegenerate = existing
    && existing.generation_version !== KNOWLEDGE_GENERATION_VERSION
    && isGeneratedKnowledgeEntry(existing);

  if (existing && !shouldRegenerate) {
    return { changed: false, reason: "knowledge already exists", picked: [] };
  }

  const quota = getQuotaMap(knowledge.daily_by_difficulty, DEFAULT_KNOWLEDGE_QUOTA);
  const dailyCount = quotaTotal(quota);
  const used = new Set();
  knowledge.entries.forEach((entry) => {
    if (entry.date === date) return;
    getEntryItems(entry).forEach((item) => {
      [item.source_id, item.id, item.title]
        .map(normalizeKey)
        .filter(Boolean)
        .forEach((key) => used.add(key));
    });
  });

  const picked = makeGeneratedKnowledge(date, quota, used);

  const entry = {
    date,
    title: `${date.replace(/-/g, ".")} 난이도별 상식 ${dailyCount}개`,
    generation_version: KNOWLEDGE_GENERATION_VERSION,
    items: picked.map(cloneKnowledgeItem)
  };

  if (existing) {
    Object.assign(existing, entry);
  } else {
    knowledge.entries.unshift(entry);
  }
  knowledge.updated_at = date;
  knowledge.default_daily_count = dailyCount;
  knowledge.daily_by_difficulty = quota;

  writeJson(paths.knowledge, knowledge);

  return {
    changed: true,
    reason: shouldRegenerate ? "knowledge regenerated with improved quality rules" : "knowledge generated",
    picked: picked.map((item) => `${normalizeDifficulty(item.difficulty)}:${item.title}`)
  };
}

function oxfordUrl(word) {
  const slug = normalizeKey(word).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `https://www.oxfordlearnersdictionaries.com/definition/english/${slug}`;
}

function cloneEnglishWord(item) {
  return {
    difficulty: normalizeDifficulty(item.difficulty),
    word: item.word,
    meaning: item.meaning,
    example: item.example,
    exampleKo: item.exampleKo || "",
    note: item.note || `${item.meaning}라는 뜻입니다. 예문과 함께 문장째 익혀보세요.`,
    sources: item.sources || [
      {
        label: "Oxford Learner's Dictionaries",
        url: oxfordUrl(item.word)
      }
    ]
  };
}

function normalizeEnglishTranslations(english) {
  let changed = false;
  english.entries.forEach((entry) => {
    getEntryItems(entry).forEach((item) => {
      const exactExampleKo = lookupExampleTranslation(item.example);
      if (exactExampleKo && item.exampleKo !== exactExampleKo) {
        item.exampleKo = exactExampleKo;
        changed = true;
        return;
      }

      if (item.exampleKo) return;
      const generated = lookupEnglishWord(item.word);
      if (!generated?.exampleKo) return;
      item.exampleKo = generated.exampleKo;
      changed = true;
    });
  });
  return changed;
}

function updateEnglish(date) {
  const english = readJson(paths.english);
  english.entries = Array.isArray(english.entries) ? english.entries : [];
  const normalized = normalizeEnglishTranslations(english);

  const existing = english.entries.find((entry) => entry.date === date);
  if (existing) {
    if (normalized) writeJson(paths.english, english);
    return {
      changed: normalized,
      reason: normalized ? "english translations normalized" : "english already exists",
      day: existing.day,
      picked: []
    };
  }

  const quota = getQuotaMap(english.daily_by_difficulty, DEFAULT_ENGLISH_QUOTA);
  const dailyCount = quotaTotal(quota);
  const usedWords = new Set();
  let maxUsedDay = 0;
  english.entries.forEach((entry) => {
    maxUsedDay = Math.max(maxUsedDay, Number(entry.day || 0));
    getEntryItems(entry).forEach((item) => usedWords.add(normalizeKey(item.word)));
  });

  const picked = makeGeneratedEnglish(date, quota, usedWords);

  const nextDay = maxUsedDay + 1;
  const entry = {
    date,
    day: nextDay,
    title: `Day ${nextDay} 난이도별 영단어 ${dailyCount}개`,
    items: picked.map(cloneEnglishWord)
  };

  english.entries.unshift(entry);
  english.updated_at = date;
  english.default_daily_count = dailyCount;
  english.daily_by_difficulty = quota;

  writeJson(paths.english, english);

  return {
    changed: true,
    reason: "english generated",
    day: nextDay,
    picked: picked.map((item) => `${normalizeDifficulty(item.difficulty)}:${item.word}`)
  };
}

function normalizeSources(sources) {
  return Array.isArray(sources)
    ? sources
      .filter((source) => source?.url)
      .map((source) => ({
        label: source.label || "출처",
        url: source.url
      }))
    : [];
}

function cloneSpeakingArticle(item) {
  return {
    id: item.id,
    topic: item.topic || "1분 설명",
    titleKo: item.titleKo,
    bodyKo: item.bodyKo,
    titleEn: item.titleEn,
    bodyEn: item.bodyEn,
    point: item.point,
    steps: Array.isArray(item.steps) ? item.steps : [],
    questions: Array.isArray(item.questions) ? item.questions : [],
    sources: normalizeSources(item.sources)
  };
}

function isGeneratedSpeakingEntry(entry) {
  return getEntryItems(entry).some((item) => {
    const key = String(item.id || "");
    return key.startsWith("speaking-");
  });
}

function parseDateValue(date) {
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) ? time : 0;
}

function formatDateValue(time) {
  return new Date(time).toISOString().slice(0, 10);
}

function getMissingSpeakingDates(entries, targetDate) {
  const existingDates = new Set(entries.map((entry) => entry.date).filter(Boolean));
  if (!existingDates.size) return [targetDate];
  if (existingDates.has(targetDate)) return [targetDate];

  const latestTime = Math.max(...Array.from(existingDates).map(parseDateValue));
  const targetTime = parseDateValue(targetDate);
  if (!targetTime || latestTime >= targetTime) return [targetDate];

  const dayMs = 86400000;
  const gap = Math.round((targetTime - latestTime) / dayMs);
  if (gap > 45) return [targetDate];

  const dates = [];
  for (let cursor = latestTime + dayMs; cursor <= targetTime; cursor += dayMs) {
    const next = formatDateValue(cursor);
    if (!existingDates.has(next)) dates.push(next);
  }
  return dates.length ? dates : [targetDate];
}

function updateSpeakingArticle(date) {
  const speaking = readJson(paths.speaking);
  speaking.entries = Array.isArray(speaking.entries) ? speaking.entries : [];

  const existing = speaking.entries.find((entry) => entry.date === date);
  const shouldRegenerate = existing
    && existing.generation_version !== SPEAKING_GENERATION_VERSION
    && isGeneratedSpeakingEntry(existing);

  if (existing && !shouldRegenerate) {
    return {
      changed: false,
      reason: "speaking article already exists",
      picked: getEntryItems(existing).map((item) => item.titleKo || item.titleEn || item.id)
    };
  }

  const used = new Set();
  speaking.entries.forEach((entry) => {
    if (entry.date === date) return;
    getEntryItems(entry).forEach((item) => {
      [item.id, item.titleKo, item.titleEn]
        .map(normalizeKey)
        .filter(Boolean)
        .forEach((key) => used.add(key));
    });
  });

  const dates = shouldRegenerate ? [date] : getMissingSpeakingDates(speaking.entries, date);
  const pickedTitles = [];

  dates.forEach((targetDate) => {
    const picked = makeGeneratedSpeakingArticle(targetDate, used);
    const entry = {
      date: targetDate,
      title: `${targetDate.replace(/-/g, ".")} 1분 설명 아티클`,
      generation_version: SPEAKING_GENERATION_VERSION,
      items: [cloneSpeakingArticle(picked)]
    };

    const existingEntry = speaking.entries.find((candidate) => candidate.date === targetDate);
    if (existingEntry) {
      Object.assign(existingEntry, entry);
    } else {
      speaking.entries.unshift(entry);
    }

    [picked.id, picked.titleKo, picked.titleEn]
      .map(normalizeKey)
      .filter(Boolean)
      .forEach((key) => used.add(key));
    pickedTitles.push(`${picked.topic || "1분 설명"}:${picked.titleKo || picked.titleEn || picked.id}`);
  });

  speaking.entries.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  speaking.updated_at = date;
  speaking.default_daily_count = DEFAULT_SPEAKING_DAILY_COUNT;

  writeJson(paths.speaking, speaking);

  return {
    changed: true,
    reason: shouldRegenerate ? "speaking article regenerated" : "speaking articles generated",
    picked: pickedTitles
  };
}

function isGeneratedCareEntry(entry) {
  return getEntryItems(entry).some((item) => {
    const key = String(item.id || "");
    return key.startsWith("care-");
  });
}

function updateCare(date) {
  const care = readJson(paths.care);
  care.entries = Array.isArray(care.entries) ? care.entries : [];

  const existing = care.entries.find((entry) => entry.date === date);
  const shouldRegenerate = existing
    && existing.generation_version !== CARE_GENERATION_VERSION
    && isGeneratedCareEntry(existing);

  if (existing && !shouldRegenerate) {
    return {
      changed: false,
      reason: "care already exists",
      picked: getEntryItems(existing).map((item) => item.title || item.id)
    };
  }

  const used = new Set();
  care.entries.forEach((entry) => {
    if (entry.date === date) return;
    getEntryItems(entry).forEach((item) => {
      [item.id, item.baseKey, item.title]
        .map(normalizeKey)
        .filter(Boolean)
        .forEach((key) => used.add(key));
    });
  });

  const picked = makeGeneratedCare(date, Number(care.default_daily_count || DEFAULT_CARE_DAILY_COUNT), used);
  const entry = {
    date,
    title: `${date.replace(/-/g, ".")} 오늘의 배려 ${picked.length}가지`,
    generation_version: CARE_GENERATION_VERSION,
    items: picked
  };

  if (existing) {
    Object.assign(existing, entry);
  } else {
    care.entries.unshift(entry);
  }
  care.entries.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  care.updated_at = date;
  care.default_daily_count = DEFAULT_CARE_DAILY_COUNT;

  writeJson(paths.care, care);

  return {
    changed: true,
    reason: shouldRegenerate ? "care regenerated with improved variety rules" : "care generated",
    picked: picked.map((item) => item.title)
  };
}

function main() {
  const date = getKstDate();
  if (printDate) {
    console.log(date);
    return;
  }

  const knowledge = updateKnowledge(date);
  const english = updateEnglish(date);
  const speaking = updateSpeakingArticle(date);
  const care = updateCare(date);
  const changed = knowledge.changed || english.changed || speaking.changed || care.changed;

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `study_date=${date}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed ? "true" : "false"}\n`);
  }

  console.log(JSON.stringify({ date, dryRun, changed, knowledge, english, speaking, care }, null, 2));
}

main();
