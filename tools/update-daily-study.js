const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");
const printDate = process.argv.includes("--print-date");

const paths = {
  knowledge: path.join(root, "data", "knowledge.json"),
  knowledgePool: path.join(root, "data", "knowledge_pool.json"),
  english: path.join(root, "data", "english_daily.json"),
  englishSource: path.join(root, "01_기초_동사형용사.json")
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

function getEntryItems(entry) {
  return Array.isArray(entry?.items) ? entry.items : [];
}

function cloneKnowledgeItem(item) {
  return {
    source_id: item.id,
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

  const dailyCount = Number(knowledge.default_daily_count || pool.daily_count || 3);
  const existing = knowledge.entries.find((entry) => entry.date === date);
  if (existing && getEntryItems(existing).length >= dailyCount) {
    return { changed: false, reason: "knowledge already exists", picked: [] };
  }

  const used = new Set();
  knowledge.entries.forEach((entry) => {
    getEntryItems(entry).forEach((item) => {
      [item.source_id, item.id, item.title]
        .map(normalizeKey)
        .filter(Boolean)
        .forEach((key) => used.add(key));
    });
  });

  const picked = [];
  for (const item of pool.items || []) {
    const key = normalizeKey(item.id || item.title);
    const titleKey = normalizeKey(item.title);
    if (!key || used.has(key) || used.has(titleKey)) continue;
    picked.push(item);
    if (picked.length === dailyCount) break;
  }

  if (picked.length < dailyCount) {
    return {
      changed: false,
      reason: `knowledge pool needs refill: ${picked.length}/${dailyCount}`,
      picked: picked.map((item) => item.title)
    };
  }

  const entry = {
    date,
    title: `${date.replace(/-/g, ".")} 상식`,
    items: picked.map(cloneKnowledgeItem)
  };

  const index = knowledge.entries.findIndex((item) => item.date === date);
  if (index >= 0) {
    knowledge.entries[index] = entry;
  } else {
    knowledge.entries.unshift(entry);
  }
  knowledge.updated_at = date;

  writeJson(paths.knowledge, knowledge);

  return {
    changed: true,
    reason: "knowledge added",
    picked: picked.map((item) => item.title)
  };
}

function oxfordUrl(word) {
  const slug = normalizeKey(word).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `https://www.oxfordlearnersdictionaries.com/definition/english/${slug}`;
}

function cloneEnglishWord(item) {
  return {
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

  const dailyCount = Number(english.default_daily_count || 10);
  const existing = english.entries.find((entry) => entry.date === date);
  if (existing && getEntryItems(existing).length >= dailyCount) {
    return { changed: false, reason: "english already exists", day: existing.day, picked: [] };
  }

  const usedWords = new Set();
  let maxUsedDay = 0;
  english.entries.forEach((entry) => {
    maxUsedDay = Math.max(maxUsedDay, Number(entry.day || 0));
    getEntryItems(entry).forEach((item) => usedWords.add(normalizeKey(item.word)));
  });

  const byDay = new Map();
  (source.words || []).forEach((item) => {
    if (!byDay.has(item.day)) byDay.set(item.day, []);
    byDay.get(item.day).push(item);
  });

  const nextDay = [...byDay.keys()].sort((a, b) => a - b).find((day) => day > maxUsedDay);
  if (!nextDay) {
    return { changed: false, reason: "english pool needs refill", day: null, picked: [] };
  }

  const picked = (byDay.get(nextDay) || [])
    .filter((item) => !usedWords.has(normalizeKey(item.word)))
    .slice(0, dailyCount);

  if (picked.length < dailyCount) {
    return {
      changed: false,
      reason: `english day ${nextDay} has only ${picked.length}/${dailyCount} unused words`,
      day: nextDay,
      picked: picked.map((item) => item.word)
    };
  }

  const entry = {
    date,
    day: nextDay,
    title: `Day ${nextDay} 기본 동사/형용사 ${dailyCount}개`,
    items: picked.map(cloneEnglishWord)
  };

  const index = english.entries.findIndex((item) => item.date === date);
  if (index >= 0) {
    english.entries[index] = entry;
  } else {
    english.entries.unshift(entry);
  }
  english.updated_at = date;

  writeJson(paths.english, english);

  return {
    changed: true,
    reason: "english added",
    day: nextDay,
    picked: picked.map((item) => item.word)
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
  const changed = knowledge.changed || english.changed;

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `study_date=${date}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed ? "true" : "false"}\n`);
  }

  console.log(JSON.stringify({ date, dryRun, changed, knowledge, english }, null, 2));
}

main();
