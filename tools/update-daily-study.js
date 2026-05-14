const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");
const printDate = process.argv.includes("--print-date");

const DIFFICULTIES = ["초급", "중급", "고급"];
const DEFAULT_KNOWLEDGE_QUOTA = { "초급": 2, "중급": 2, "고급": 2 };
const DEFAULT_ENGLISH_QUOTA = { "초급": 5, "중급": 5, "고급": 5 };
const DEFAULT_SPEAKING_DAILY_COUNT = 1;

const paths = {
  knowledge: path.join(root, "data", "knowledge.json"),
  knowledgePool: path.join(root, "data", "knowledge_pool.json"),
  english: path.join(root, "data", "english_daily.json"),
  englishSource: path.join(root, "01_기초_동사형용사.json"),
  speaking: path.join(root, "data", "speaking_articles.json"),
  speakingPool: path.join(root, "data", "speaking_article_pool.json")
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

function updateKnowledge(date) {
  const knowledge = readJson(paths.knowledge);
  const pool = readJson(paths.knowledgePool);
  knowledge.entries = Array.isArray(knowledge.entries) ? knowledge.entries : [];

  const existing = knowledge.entries.find((entry) => entry.date === date);
  if (existing) {
    return { changed: false, reason: "knowledge already exists", picked: [] };
  }

  const quota = getQuotaMap(knowledge.daily_by_difficulty || pool.daily_by_difficulty, DEFAULT_KNOWLEDGE_QUOTA);
  const dailyCount = quotaTotal(quota);
  const used = new Set();
  knowledge.entries.forEach((entry) => {
    getEntryItems(entry).forEach((item) => {
      [item.source_id, item.id, item.title]
        .map(normalizeKey)
        .filter(Boolean)
        .forEach((key) => used.add(key));
    });
  });

  const picked = pickByDifficulty(pool.items || [], quota, used, [
    (item) => item.id,
    (item) => item.title
  ]);

  if (!picked.ok) {
    return {
      changed: false,
      reason: `knowledge pool needs refill: ${picked.difficulty} ${picked.found}/${picked.needed}`,
      picked: picked.picked.map((item) => item.title)
    };
  }

  const entry = {
    date,
    title: `${date.replace(/-/g, ".")} 난이도별 상식 ${dailyCount}개`,
    items: picked.picked.map(cloneKnowledgeItem)
  };

  knowledge.entries.unshift(entry);
  knowledge.updated_at = date;
  knowledge.default_daily_count = dailyCount;
  knowledge.daily_by_difficulty = quota;

  writeJson(paths.knowledge, knowledge);

  return {
    changed: true,
    reason: "knowledge added",
    picked: picked.picked.map((item) => `${normalizeDifficulty(item.difficulty)}:${item.title}`)
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
    note: item.note || `${item.meaning}라는 뜻입니다. 예문과 함께 문장째 익혀보세요.`,
    sources: item.sources || [
      {
        label: "Oxford Learner's Dictionaries",
        url: oxfordUrl(item.word)
      }
    ]
  };
}

function updateEnglish(date) {
  const english = readJson(paths.english);
  const source = readJson(paths.englishSource);
  english.entries = Array.isArray(english.entries) ? english.entries : [];

  const existing = english.entries.find((entry) => entry.date === date);
  if (existing) {
    return { changed: false, reason: "english already exists", day: existing.day, picked: [] };
  }

  const quota = getQuotaMap(english.daily_by_difficulty || source.daily_by_difficulty, DEFAULT_ENGLISH_QUOTA);
  const dailyCount = quotaTotal(quota);
  const usedWords = new Set();
  let maxUsedDay = 0;
  english.entries.forEach((entry) => {
    maxUsedDay = Math.max(maxUsedDay, Number(entry.day || 0));
    getEntryItems(entry).forEach((item) => usedWords.add(normalizeKey(item.word)));
  });

  const picked = pickByDifficulty(source.words || [], quota, usedWords, [
    (item) => item.word
  ]);

  if (!picked.ok) {
    return {
      changed: false,
      reason: `english pool needs refill: ${picked.difficulty} ${picked.found}/${picked.needed}`,
      day: null,
      picked: picked.picked.map((item) => item.word)
    };
  }

  const nextDay = maxUsedDay + 1;
  const entry = {
    date,
    day: nextDay,
    title: `Day ${nextDay} 난이도별 영단어 ${dailyCount}개`,
    items: picked.picked.map(cloneEnglishWord)
  };

  english.entries.unshift(entry);
  english.updated_at = date;
  english.default_daily_count = dailyCount;
  english.daily_by_difficulty = quota;

  writeJson(paths.english, english);

  return {
    changed: true,
    reason: "english added",
    day: nextDay,
    picked: picked.picked.map((item) => `${normalizeDifficulty(item.difficulty)}:${item.word}`)
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

function getSpeakingTopicForDate(date) {
  const topics = ["부동산", "자동차 산업", "AI", "부동산 + AI", "자동차 + AI", "AI + 산업"];
  const dayIndex = Math.floor(Date.parse(date + "T00:00:00Z") / 86400000);
  return topics[Math.abs(dayIndex) % topics.length];
}

function updateSpeakingArticle(date) {
  const speaking = readJson(paths.speaking);
  const pool = readJson(paths.speakingPool);
  speaking.entries = Array.isArray(speaking.entries) ? speaking.entries : [];

  const existing = speaking.entries.find((entry) => entry.date === date);
  if (existing) {
    return {
      changed: false,
      reason: "speaking article already exists",
      picked: getEntryItems(existing).map((item) => item.titleKo || item.titleEn || item.id)
    };
  }

  const used = new Set();
  speaking.entries.forEach((entry) => {
    getEntryItems(entry).forEach((item) => {
      [item.id, item.titleKo, item.titleEn]
        .map(normalizeKey)
        .filter(Boolean)
        .forEach((key) => used.add(key));
    });
  });

  const candidates = (pool.items || []).filter((item) => {
    const keys = [item.id, item.titleKo, item.titleEn].map(normalizeKey).filter(Boolean);
    return keys.length && !keys.some((key) => used.has(key));
  });

  if (!candidates.length) {
    return { changed: false, reason: "speaking article pool needs refill", picked: [] };
  }

  const targetTopic = getSpeakingTopicForDate(date);
  const picked = candidates.find((item) => item.topic === targetTopic) || candidates[0];
  const entry = {
    date,
    title: `${date.replace(/-/g, ".")} 1분 설명 아티클`,
    items: [cloneSpeakingArticle(picked)]
  };

  speaking.entries.unshift(entry);
  speaking.updated_at = date;
  speaking.default_daily_count = DEFAULT_SPEAKING_DAILY_COUNT;

  writeJson(paths.speaking, speaking);

  return {
    changed: true,
    reason: "speaking article added",
    picked: [`${picked.topic || "1분 설명"}:${picked.titleKo || picked.titleEn || picked.id}`]
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
  const changed = knowledge.changed || english.changed || speaking.changed;

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `study_date=${date}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed ? "true" : "false"}\n`);
  }

  console.log(JSON.stringify({ date, dryRun, changed, knowledge, english, speaking }, null, 2));
}

main();
