const DIFFICULTIES = ["초급", "중급", "고급"];

const KNOWLEDGE_GENERATION_VERSION = "source-summary-v2";
const ENGLISH_GENERATION_VERSION = "dictionary-source-v1";
const SPEAKING_GENERATION_VERSION = "source-speaking-v2";
const CARE_GENERATION_VERSION = "relationship-source-v1";

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function dateSeed(date) {
  return String(date || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function rotate(items, offset) {
  if (!items.length) return [];
  const start = Math.abs(offset) % items.length;
  return items.slice(start).concat(items.slice(0, start));
}

function source(label, url) {
  return { label, url };
}

function oxfordUrl(word) {
  const slug = normalizeKey(word).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `https://www.oxfordlearnersdictionaries.com/definition/english/${slug}`;
}

const KNOWLEDGE_SOURCES = [
  {
    id: "water-cycle-usgs",
    difficulty: "초급",
    category: "지구",
    title: "물의 순환은 지구의 냉각 장치이자 운반 시스템이다",
    body: "USGS의 물 순환 설명을 요약하면, 물은 증발, 응결, 강수, 지표 흐름, 지하수 흐름을 거치며 지구 안에서 계속 위치를 바꿉니다. 첫째, 이 과정은 바다와 대기와 땅을 연결해 기후와 날씨를 움직입니다. 둘째, 강과 지하수는 생태계와 사람이 쓸 물을 옮기는 통로가 됩니다. 셋째, 물은 사라지는 것이 아니라 상태와 위치가 바뀌기 때문에 오염과 사용 습관도 결국 순환 안에서 되돌아옵니다.",
    takeaway: "물은 사라지는 자원이 아니라 순환하는 자원이므로 사용과 오염을 함께 생각해야 합니다.",
    sources: [source("USGS Water Cycle", "https://www.usgs.gov/special-topics/water-science-school/science/water-cycle")]
  },
  {
    id: "sleep-nih",
    difficulty: "초급",
    category: "건강",
    title: "수면은 쉬는 시간이 아니라 몸의 유지보수 시간이다",
    body: "NIH의 수면 자료를 요약하면, 수면은 에너지를 아끼는 시간이 아니라 뇌와 몸이 회복 작업을 하는 시간입니다. 첫째, 충분한 수면은 기억과 학습에 관여합니다. 둘째, 심장, 호르몬, 면역 기능처럼 몸의 기본 조절에도 영향을 줍니다. 셋째, 잠이 부족하면 집중력과 감정 조절이 흔들려 다음 날 판단 품질까지 떨어질 수 있습니다.",
    takeaway: "수면은 게으름이 아니라 다음 날의 기억, 회복, 판단을 준비하는 생리적 과정입니다.",
    sources: [source("NIH Sleep", "https://www.nhlbi.nih.gov/health/sleep")]
  },
  {
    id: "food-safety-fda",
    difficulty: "초급",
    category: "생활과학",
    title: "식품 보관은 맛보다 미생물 조건을 관리하는 일이다",
    body: "FDA의 식품 안전 안내를 요약하면, 음식을 안전하게 보관하려면 온도, 시간, 오염 가능성을 함께 봐야 합니다. 첫째, 차갑게 보관하면 미생물 증식 속도를 낮출 수 있습니다. 둘째, 익힌 음식과 날음식을 분리하면 교차오염 위험이 줄어듭니다. 셋째, 남은 음식은 오래 두는 것보다 빨리 식히고 밀폐해 보관하는 편이 안전합니다.",
    takeaway: "식품 안전의 핵심은 음식의 상태보다 미생물이 자라기 어려운 조건을 만드는 데 있습니다.",
    sources: [source("FDA Food Safety", "https://www.fda.gov/food/buy-store-serve-safe-food")]
  },
  {
    id: "recycling-epa",
    difficulty: "초급",
    category: "환경",
    title: "재활용은 분리보다 오염을 줄이는 과정이다",
    body: "EPA의 재활용 안내를 요약하면, 재활용은 버리는 행동이 아니라 다시 쓸 수 있는 재료로 준비하는 과정입니다. 첫째, 음식물과 액체가 남아 있으면 재활용품 전체 품질이 떨어집니다. 둘째, 지역마다 처리 가능한 재질이 다르기 때문에 표시와 지역 기준을 확인해야 합니다. 셋째, 재사용과 감량은 재활용보다 앞단에서 폐기물 자체를 줄이는 방법입니다.",
    takeaway: "재활용의 품질은 많이 버리는 것보다 깨끗하게 비우고 지역 기준에 맞추는 데서 올라갑니다.",
    sources: [source("EPA Recycling", "https://www.epa.gov/recycle")]
  },
  {
    id: "ai-risk-nist",
    difficulty: "중급",
    category: "AI",
    title: "AI 신뢰성은 성능 점수보다 위험 관리에서 나온다",
    body: "NIST AI Risk Management Framework를 요약하면, AI는 정확도만으로 평가하기 어렵고 위험을 식별하고 줄이는 절차가 함께 필요합니다. 첫째, 데이터 편향이나 부정확한 출력은 실제 사람의 판단과 권리에 영향을 줄 수 있습니다. 둘째, 모델이 어떤 상황에서 실패하는지 기록하고 평가해야 합니다. 셋째, 조직은 AI의 책임자, 검토 기준, 사용 제한을 정해야 신뢰 가능한 도입이 가능합니다.",
    takeaway: "AI를 잘 쓰려면 모델 선택보다 데이터, 평가, 책임 구조를 함께 설계해야 합니다.",
    sources: [source("NIST AI RMF", "https://www.nist.gov/itl/ai-risk-management-framework")]
  },
  {
    id: "diversification-investor",
    difficulty: "중급",
    category: "금융",
    title: "분산투자는 수익을 보장하지 않고 충격을 나눈다",
    body: "Investor.gov의 분산투자 설명을 요약하면, 분산투자는 여러 자산에 나누어 투자해 특정 위험에 덜 흔들리도록 만드는 원칙입니다. 첫째, 한 자산의 손실이 전체 자산을 한 번에 무너뜨리는 것을 줄입니다. 둘째, 서로 다르게 움직이는 자산을 섞을수록 충격 흡수 효과가 커질 수 있습니다. 셋째, 분산은 손실을 없애는 기술이 아니라 과도한 집중을 피하는 위험 관리입니다.",
    takeaway: "분산투자는 더 많이 벌기 위한 보증서가 아니라 크게 흔들리지 않기 위한 구조입니다.",
    sources: [source("Investor.gov Diversification", "https://www.investor.gov/introduction-investing/investing-basics/glossary/diversification")]
  },
  {
    id: "home-affordability-cfpb",
    difficulty: "중급",
    category: "부동산",
    title: "주택 구매 가능성은 가격보다 월 부담액에서 먼저 갈린다",
    body: "CFPB의 주택 구매 안내를 요약하면, 집을 살 수 있는지는 매매가 하나가 아니라 대출 조건과 월 지출 전체로 판단해야 합니다. 첫째, 금리가 바뀌면 같은 가격의 집도 월 납입액이 크게 달라집니다. 둘째, 세금, 보험, 관리비, 유지보수비가 실제 주거비에 포함됩니다. 셋째, 무리한 대출은 가격 상승 기대가 맞아도 생활 현금흐름을 압박할 수 있습니다.",
    takeaway: "부동산 판단은 집값이 아니라 월 부담액과 유지 가능한 현금흐름을 기준으로 해야 합니다.",
    sources: [source("CFPB Owning a Home", "https://www.consumerfinance.gov/owning-a-home/")]
  },
  {
    id: "ev-doe",
    difficulty: "중급",
    category: "자동차",
    title: "전기차 선택은 차량 스펙과 충전 생활권을 함께 보는 일이다",
    body: "미국 에너지부의 전기차 안내를 요약하면, 전기차는 배터리와 모터만의 문제가 아니라 충전 환경과 사용 패턴의 문제입니다. 첫째, 집이나 직장에서 충전할 수 있으면 일상 사용의 불편이 크게 줄어듭니다. 둘째, 주행거리와 충전 속도는 장거리 이동에서 중요해집니다. 셋째, 전기차의 비용 판단은 구매가뿐 아니라 에너지 비용과 유지관리 비용까지 함께 봐야 합니다.",
    takeaway: "전기차의 실사용 가치는 차의 성능과 내가 사는 충전 환경이 함께 결정합니다.",
    sources: [source("U.S. DOE Electric Vehicles", "https://www.energy.gov/eere/electricvehicles/electric-vehicles")]
  },
  {
    id: "overfitting-google",
    difficulty: "고급",
    category: "AI",
    title: "과적합은 훈련 문제를 잘 푼 모델이 현실 문제에 약한 상태다",
    body: "Google Machine Learning Crash Course의 과적합 설명을 요약하면, 모델이 훈련 데이터의 세부 패턴을 지나치게 외우면 새 데이터에서 성능이 떨어질 수 있습니다. 첫째, 훈련 점수만 높다고 좋은 모델이라고 말할 수 없습니다. 둘째, 검증 데이터와 테스트 데이터는 모델이 일반화하는지 확인하는 장치입니다. 셋째, 단순화, 정규화, 더 나은 데이터 분할은 과적합을 줄이는 데 쓰입니다.",
    takeaway: "좋은 AI 모델은 본 데이터를 외우는 모델이 아니라 보지 못한 상황에도 안정적으로 작동하는 모델입니다.",
    sources: [source("Google ML Crash Course", "https://developers.google.com/machine-learning/crash-course/overfitting/overfitting")]
  },
  {
    id: "auto-safety-nhtsa",
    difficulty: "고급",
    category: "자동차",
    title: "자동차 안전 기술은 운전자를 대체하기보다 위험 순간을 줄인다",
    body: "NHTSA의 차량 안전 기술 자료를 요약하면, 자동 긴급제동, 차선 유지, 경고 시스템 같은 기술은 운전자를 없애기보다 위험을 빠르게 감지하고 반응 시간을 줄이는 데 초점이 있습니다. 첫째, 센서는 사람이 놓칠 수 있는 거리와 속도 변화를 감지합니다. 둘째, 경고와 보조 기능은 사고 전 몇 초의 대응 여지를 늘립니다. 셋째, 기술이 있어도 운전 책임과 시스템 한계를 이해해야 안전 효과가 커집니다.",
    takeaway: "차량 안전 기술은 만능 자동화가 아니라 위험 순간의 대응 여지를 넓히는 보조 체계입니다.",
    sources: [source("NHTSA Driver Assistance Technologies", "https://www.nhtsa.gov/vehicle-safety/driver-assistance-technologies")]
  },
  {
    id: "cryptography-nist",
    difficulty: "고급",
    category: "보안",
    title: "암호화는 비밀을 숨기는 기술이 아니라 신뢰를 나누는 약속이다",
    body: "NIST의 암호 기술 자료를 요약하면, 암호화는 데이터를 정해진 규칙과 열쇠로 바꾸어 허가된 사람만 읽게 하는 기술입니다. 첫째, 온라인 결제와 메시지 보호는 암호 기술 위에서 작동합니다. 둘째, 안전한 시스템은 알고리즘뿐 아니라 키 관리와 인증 절차가 함께 필요합니다. 셋째, 암호화는 데이터를 완전히 안전하게 만드는 마법이 아니라 공격 비용을 높이고 접근 권한을 통제하는 방법입니다.",
    takeaway: "암호화의 핵심은 데이터를 숨기는 것보다 누가 읽을 수 있는지를 안전하게 정하는 데 있습니다.",
    sources: [source("NIST Cryptography", "https://www.nist.gov/cryptography")]
  },
  {
    id: "automated-vehicles-nhtsa",
    difficulty: "고급",
    category: "모빌리티",
    title: "자율주행의 난점은 평범한 도로보다 예외 상황이다",
    body: "NHTSA의 자동화 차량 자료를 요약하면, 자율주행은 모든 상황에서 사람을 바로 대체하는 기술이라기보다 자동화 수준과 책임 범위를 구분해야 하는 분야입니다. 첫째, 평범한 차선 유지보다 공사 구간, 악천후, 돌발 보행자 같은 예외가 어렵습니다. 둘째, 시스템이 언제 운전자 개입을 요구하는지 명확해야 합니다. 셋째, 안전 검증은 기술 성능뿐 아니라 책임, 규제, 사용자의 이해를 함께 요구합니다.",
    takeaway: "자율주행은 얼마나 자동으로 달리느냐보다 예외 상황에서 얼마나 안전하게 실패하느냐가 중요합니다.",
    sources: [source("NHTSA Automated Vehicles", "https://www.nhtsa.gov/vehicle-safety/automated-vehicles-safety")]
  }
];

function pickByDifficulty(catalog, date, quota, usedKeys, prefix) {
  const seed = dateSeed(date);
  const picked = [];
  const pickedKeys = new Set();

  DIFFICULTIES.forEach((difficulty, difficultyIndex) => {
    const candidates = rotate(
      catalog.filter((item) => item.difficulty === difficulty),
      seed + difficultyIndex * 11
    );
    const pickedCategories = new Set();
    let count = 0;

    for (const item of candidates) {
      const keys = [item.id, item.title].map(normalizeKey).filter(Boolean);
      if (pickedCategories.has(item.category)) continue;
      if (keys.some((key) => usedKeys.has(key) || pickedKeys.has(key))) continue;
      picked.push({
        ...item,
        id: `source-knowledge-${item.id}`
      });
      pickedCategories.add(item.category);
      keys.forEach((key) => pickedKeys.add(key));
      count += 1;
      if (count >= quota[difficulty]) break;
    }

    for (const item of candidates) {
      if (count >= quota[difficulty]) break;
      const keys = [item.id, item.title].map(normalizeKey).filter(Boolean);
      if (keys.some((key) => pickedKeys.has(key))) continue;
      picked.push({
        ...item,
        id: `${prefix}-${date}-${item.id}`,
        title: `${item.title}: 출처 복습`
      });
      keys.forEach((key) => pickedKeys.add(key));
      count += 1;
    }
  });

  return picked;
}

function makeGeneratedKnowledge(date, quota, usedKeys) {
  return pickByDifficulty(KNOWLEDGE_SOURCES, date, quota, usedKeys, "source-knowledge-review");
}

const ENGLISH_WORDS = {
  "초급": [
    ["bring", "가져오다", "Please bring your notebook.", "공책을 가져와 주세요."],
    ["leave", "떠나다, 남기다", "We leave early tomorrow.", "우리는 내일 일찍 떠난다."],
    ["meet", "만나다", "I meet my friend after work.", "나는 퇴근 후 친구를 만난다."],
    ["need", "필요하다", "You need a clear plan.", "너는 명확한 계획이 필요하다."],
    ["open", "열다", "Open the window, please.", "창문을 열어 주세요."],
    ["close", "닫다", "Close the door quietly.", "문을 조용히 닫아 주세요."],
    ["learn", "배우다", "We learn from small mistakes.", "우리는 작은 실수에서 배운다."],
    ["share", "공유하다", "They share useful ideas.", "그들은 유용한 아이디어를 공유한다."],
    ["move", "움직이다, 이사하다", "The family moves next week.", "그 가족은 다음 주에 이사한다."],
    ["save", "아끼다, 저장하다", "This habit saves time.", "이 습관은 시간을 아낀다."]
  ],
  "중급": [
    ["assess", "평가하다", "The team assesses the risk.", "그 팀은 위험을 평가한다."],
    ["allocate", "배분하다", "We allocate the budget carefully.", "우리는 예산을 신중하게 배분한다."],
    ["adapt", "적응하다, 조정하다", "Companies adapt to new demand.", "기업들은 새로운 수요에 적응한다."],
    ["indicate", "나타내다", "The data indicates a clear trend.", "그 데이터는 뚜렷한 추세를 나타낸다."],
    ["maintain", "유지하다", "Good systems maintain quality.", "좋은 시스템은 품질을 유지한다."],
    ["optimize", "최적화하다", "The app optimizes the route.", "그 앱은 경로를 최적화한다."],
    ["summarize", "요약하다", "She summarizes the report.", "그녀는 보고서를 요약한다."],
    ["distinguish", "구별하다", "We distinguish facts from opinions.", "우리는 사실과 의견을 구별한다."],
    ["implement", "실행하다, 구현하다", "They implement the new policy.", "그들은 새 정책을 실행한다."],
    ["sustain", "지속하다", "The city sustains long-term growth.", "그 도시는 장기 성장을 지속한다."]
  ],
  "고급": [
    ["mitigate", "완화하다", "The policy mitigates financial risk.", "그 정책은 재무 위험을 완화한다."],
    ["scrutinize", "면밀히 살피다", "Analysts scrutinize the source.", "분석가들은 출처를 면밀히 살핀다."],
    ["corroborate", "입증하다, 뒷받침하다", "The evidence corroborates the claim.", "그 증거는 주장을 뒷받침한다."],
    ["delineate", "명확히 구분하다", "The rule delineates responsibility.", "그 규칙은 책임을 명확히 구분한다."],
    ["contingent", "조건부의", "The plan is contingent on funding.", "그 계획은 자금 확보에 달려 있다."],
    ["empirical", "경험적, 실증적인", "Empirical evidence supports the model.", "실증적 증거가 그 모델을 뒷받침한다."],
    ["substantiate", "입증하다", "The report substantiates the concern.", "그 보고서는 우려를 입증한다."],
    ["constrain", "제한하다", "Limited data constrains the analysis.", "제한된 데이터가 분석을 제약한다."],
    ["converge", "수렴하다", "Several signals converge on one conclusion.", "여러 신호가 하나의 결론으로 수렴한다."],
    ["calibrate", "조정하다", "We calibrate the model with new data.", "우리는 새 데이터로 모델을 조정한다."]
  ]
};

function englishCatalog(difficulty) {
  return (ENGLISH_WORDS[difficulty] || []).map((item) => ({
    difficulty,
    word: item[0],
    meaning: item[1],
    example: item[2],
    exampleKo: item[3],
    note: `Oxford Learner's Dictionaries 항목을 확인할 수 있는 단어입니다. 뜻과 예문을 함께 보고, 해석 버튼으로 한국어 의미를 확인하세요.`,
    sources: [source("Oxford Learner's Dictionaries", oxfordUrl(item[0]))]
  }));
}

function lookupEnglishWord(word) {
  const key = normalizeKey(word);
  for (const difficulty of DIFFICULTIES) {
    const item = englishCatalog(difficulty).find((candidate) => normalizeKey(candidate.word) === key);
    if (item) return item;
  }
  return null;
}

function lookupExampleTranslation(example) {
  const key = String(example || "").trim();
  for (const difficulty of DIFFICULTIES) {
    const item = englishCatalog(difficulty).find((candidate) => candidate.example === key);
    if (item) return item.exampleKo;
  }
  return "";
}

function makeGeneratedEnglish(date, quota, usedWords) {
  const seed = dateSeed(date);
  const picked = [];
  const pickedWords = new Set();

  DIFFICULTIES.forEach((difficulty, difficultyIndex) => {
    const candidates = rotate(englishCatalog(difficulty), seed + difficultyIndex * 13);
    let count = 0;
    for (const item of candidates) {
      const key = normalizeKey(item.word);
      if (usedWords.has(key) || pickedWords.has(key)) continue;
      picked.push(item);
      pickedWords.add(key);
      count += 1;
      if (count >= quota[difficulty]) break;
    }
    for (const item of candidates) {
      if (count >= quota[difficulty]) break;
      const key = normalizeKey(item.word);
      if (pickedWords.has(key)) continue;
      picked.push({
        ...item,
        note: `Oxford Learner's Dictionaries 출처로 다시 확인하는 복습 단어입니다. 오늘은 예문을 먼저 읽고 의미를 맞혀보세요.`
      });
      pickedWords.add(key);
      count += 1;
    }
  });

  return picked;
}

const SPEAKING_SOURCES = [
  {
    id: "ai-risk-management",
    topic: "AI",
    titleKo: "AI 도입은 모델 성능보다 위험 관리 설계가 먼저다",
    titleEn: "AI adoption starts with risk management, not model performance",
    bodyKo: "NIST AI Risk Management Framework를 요약하면, AI를 업무에 넣을 때 가장 먼저 봐야 할 것은 모델이 얼마나 똑똑한가가 아니라 어떤 위험을 만들 수 있고 누가 관리할 것인가입니다. 첫째, 데이터 편향과 부정확한 출력은 사람의 판단과 권리에 영향을 줄 수 있습니다. 둘째, AI가 실패하는 조건을 미리 평가하고 기록해야 반복 사용에서 신뢰를 만들 수 있습니다. 셋째, 사용자는 결과를 그대로 믿는 사람이 아니라 출처, 맥락, 책임 범위를 확인하는 검토자가 되어야 합니다. 1분 설명에서는 'AI는 성능 도구이면서 동시에 위험 관리 대상'이라고 시작하면 좋습니다.",
    bodyEn: "A summary of the NIST AI Risk Management Framework is that organizations should not start AI adoption only by asking how powerful the model is. They should ask what risks it may create and who is responsible for managing them. Biased data and inaccurate outputs can affect decisions and rights. Failure conditions should be evaluated and documented before repeated use. Users should treat AI output as something to review with sources, context, and responsibility in mind.",
    point: "AI 도입의 핵심은 모델 선택보다 위험, 책임, 검토 절차를 함께 설계하는 것입니다.",
    sources: [source("NIST AI RMF", "https://www.nist.gov/itl/ai-risk-management-framework")]
  },
  {
    id: "home-affordability",
    topic: "부동산",
    titleKo: "집을 살 수 있는지는 매매가가 아니라 월 부담액으로 판단해야 한다",
    titleEn: "Housing affordability should be judged by monthly burden",
    bodyKo: "CFPB의 주택 구매 안내를 요약하면, 집값 하나만 보고 구매 가능성을 판단하면 실제 부담을 놓치기 쉽습니다. 첫째, 금리와 대출 기간은 같은 매매가의 집도 완전히 다른 월 납입액으로 바꿉니다. 둘째, 세금, 보험, 관리비, 수리비는 매달 생활비와 함께 나가는 비용입니다. 셋째, 집값 상승 기대가 있더라도 현금흐름이 버티지 못하면 생활 안정성이 흔들립니다. 1분 설명에서는 '가격보다 월 부담액, 월 부담액보다 지속 가능한 현금흐름' 순서로 말하면 구조가 잡힙니다.",
    bodyEn: "The CFPB home-buying guide shows that affordability is not the sale price alone. Interest rates and loan terms can turn the same home price into very different monthly payments. Taxes, insurance, maintenance, and repairs also affect the real cost of ownership. Even if someone expects prices to rise, weak cash flow can damage daily stability.",
    point: "부동산 판단은 집값보다 월 부담액과 유지 가능한 현금흐름을 먼저 봐야 합니다.",
    sources: [source("CFPB Owning a Home", "https://www.consumerfinance.gov/owning-a-home/")]
  },
  {
    id: "ev-charging",
    topic: "자동차 산업",
    titleKo: "전기차 시장은 차량 스펙에서 충전 경험 경쟁으로 이동한다",
    titleEn: "EV competition is shifting toward charging experience",
    bodyKo: "미국 에너지부의 전기차 자료를 요약하면, 전기차 선택은 배터리 용량이나 주행거리만으로 끝나지 않습니다. 첫째, 집이나 직장에서 충전할 수 있는 사람은 일상 사용의 불편이 크게 줄어듭니다. 둘째, 장거리 이동에서는 충전기의 위치뿐 아니라 작동 여부, 충전 속도, 대기 시간이 중요합니다. 셋째, 전기차 비용은 구매가와 연료비, 유지비를 함께 보는 총소유비용 관점으로 이해해야 합니다. 1분 설명에서는 전기차의 다음 경쟁력이 '차량 성능 + 충전 생활권'이라고 정리하면 됩니다.",
    bodyEn: "The U.S. Department of Energy explains that EV choice is not just battery size or driving range. Home or workplace charging greatly reduces daily friction. On long trips, charger reliability, speed, and waiting time matter. EV cost should also be understood through total cost of ownership, including energy and maintenance.",
    point: "전기차 확산의 관건은 좋은 차를 넘어서 믿을 수 있는 충전 생활권입니다.",
    sources: [source("U.S. DOE Electric Vehicles", "https://www.energy.gov/eere/electricvehicles/electric-vehicles")]
  },
  {
    id: "auto-safety-tech",
    topic: "자동차 + AI",
    titleKo: "차량 안전 기술은 운전자를 없애기보다 위험 순간을 줄인다",
    titleEn: "Vehicle safety technology reduces risky moments",
    bodyKo: "NHTSA의 차량 안전 기술 자료를 요약하면, 운전자 보조 기술은 운전자를 완전히 대체하기보다 위험 순간을 줄이는 보조 체계입니다. 첫째, 센서와 경고는 사람이 놓칠 수 있는 거리와 속도 변화를 빠르게 잡아냅니다. 둘째, 자동 긴급제동이나 차선 유지 기능은 사고 직전의 반응 시간을 늘립니다. 셋째, 기술의 한계를 모르면 운전자가 시스템을 과신해 오히려 위험해질 수 있습니다. 1분 설명에서는 '자동차 AI는 만능 조종사가 아니라 위험을 줄이는 보조자'라고 말하면 핵심이 잡힙니다.",
    bodyEn: "NHTSA materials on vehicle safety technology show that driver assistance is not a full replacement for drivers. Sensors and warnings detect changes in distance and speed. Emergency braking and lane support can add reaction time before a crash. But drivers still need to understand system limits to avoid overconfidence.",
    point: "자동차 AI의 가치는 완전 대체보다 위험 순간의 대응 여지를 넓히는 데 있습니다.",
    sources: [source("NHTSA Driver Assistance Technologies", "https://www.nhtsa.gov/vehicle-safety/driver-assistance-technologies")]
  },
  {
    id: "ai-building-management",
    topic: "부동산 + AI",
    titleKo: "AI 건물 관리는 고장 후 수리에서 고장 전 감지로 이동한다",
    titleEn: "AI building management moves from repair to early detection",
    bodyKo: "NIST의 AI 위험 관리 관점과 건물 운영의 일반 원리를 연결해 요약하면, AI 건물 관리는 설비 데이터를 통해 이상 신호를 더 빨리 찾는 방향으로 발전합니다. 첫째, 온도, 전력 사용, 진동, 출입 패턴 같은 데이터는 설비 상태의 단서가 됩니다. 둘째, 고장을 예측하면 입주자 불편과 운영 중단을 줄일 수 있습니다. 셋째, 건물 데이터는 사생활과 보안 문제를 만들 수 있어 수집 범위와 접근 권한을 명확히 해야 합니다. 1분 설명에서는 '효율과 신뢰를 동시에 설계해야 하는 운영 기술'이라고 정리하면 좋습니다.",
    bodyEn: "Using the NIST AI risk-management view, AI building management can be explained as a shift toward earlier detection of operational problems. Data such as temperature, energy use, vibration, and access patterns can signal equipment condition. Predictive maintenance can reduce tenant inconvenience and downtime. But building data also raises privacy and security questions, so access rules matter.",
    point: "AI 건물 관리는 비용 절감 기술이면서 데이터 신뢰와 권한 설계가 필요한 운영 방식입니다.",
    sources: [source("NIST AI RMF", "https://www.nist.gov/itl/ai-risk-management-framework")]
  },
  {
    id: "industrial-ai-bottleneck",
    topic: "AI + 산업",
    titleKo: "산업 AI는 화려한 답변보다 병목 제거에서 가치가 난다",
    titleEn: "Industrial AI creates value by removing bottlenecks",
    bodyKo: "NIST의 AI 관리 관점으로 산업 적용을 요약하면, AI의 가치는 멋진 답변보다 반복 업무의 병목을 줄일 때 분명해집니다. 첫째, 생산, 물류, 고객 응대 중 시간이 가장 많이 막히는 지점을 찾아야 적용 지점이 보입니다. 둘째, 오류 비용이 큰 단계일수록 작은 자동화도 큰 효과를 낼 수 있습니다. 셋째, 데이터가 정리되어 있지 않으면 좋은 모델도 현장 개선으로 이어지기 어렵습니다. 1분 설명에서는 '산업 AI는 모델 도입이 아니라 병목 정의와 성과 측정의 문제'라고 말하면 됩니다.",
    bodyEn: "From an AI risk-management perspective, industrial AI creates clear value when it reduces operational bottlenecks. Companies first need to identify where work is delayed in production, logistics, or service. Small automation can matter when a task repeats often or mistakes are expensive. But without clean operational data, even a strong model may not improve the field process.",
    point: "산업 AI는 가장 막힌 단계를 줄일 때 실제 생산성으로 바뀝니다.",
    sources: [source("NIST AI RMF", "https://www.nist.gov/itl/ai-risk-management-framework")]
  }
];

function topicForDate(date) {
  const topics = ["부동산", "자동차 산업", "AI", "부동산 + AI", "자동차 + AI", "AI + 산업"];
  const dayIndex = Math.floor(Date.parse(date + "T00:00:00Z") / 86400000);
  return topics[Math.abs(dayIndex) % topics.length];
}

function expandSpeakingSummaryKo(item) {
  return `${item.bodyKo} 출처 요약을 내 말로 바꿀 때는 세 가지를 붙이면 좋습니다. 먼저 이 출처가 어떤 문제를 경고하거나 설명하는지 말하고, 다음으로 그 문제가 실제 생활이나 산업에서 어떤 행동 변화를 요구하는지 연결합니다. 마지막으로 너무 단정하지 않고 한계를 붙입니다. 예를 들어 "이 자료는 ${item.sources[0]?.label || "출처"} 기준의 요약이므로, 최신 수치나 개별 기업 사례는 별도 확인이 필요하다"라고 닫으면 설명이 더 신뢰 있게 들립니다.`;
}

function expandSpeakingSummaryEn(item) {
  return `${item.bodyEn} To explain this in your own words, add three layers. Start with the problem the source is describing. Then connect it to a practical change in daily life or industry. Finally, close with a limitation: this is a summary based on ${item.sources[0]?.label || "the source"}, so current numbers or individual company cases should be checked separately.`;
}

function makeGeneratedSpeakingArticle(date, usedKeys = new Set()) {
  const seed = dateSeed(date);
  const target = topicForDate(date);
  const preferred = rotate(SPEAKING_SOURCES.filter((item) => item.topic === target), seed);
  const candidates = preferred.length ? preferred.concat(rotate(SPEAKING_SOURCES, seed)) : rotate(SPEAKING_SOURCES, seed);
  const picked = candidates.find((item) => {
    const keys = [item.id, item.titleKo, item.titleEn].map(normalizeKey).filter(Boolean);
    return !keys.some((key) => usedKeys.has(key));
  }) || candidates[0];

  return {
    id: `speaking-${SPEAKING_GENERATION_VERSION}-${date}-${picked.id}`,
    topic: picked.topic,
    titleKo: picked.titleKo,
    bodyKo: expandSpeakingSummaryKo(picked),
    titleEn: picked.titleEn,
    bodyEn: expandSpeakingSummaryEn(picked),
    point: picked.point,
    steps: [
      "출처가 말하는 핵심 배경을 한 문장으로 요약하기",
      "근거 세 가지를 원인, 영향, 주의점 순서로 연결하기",
      "내 판단 기준이나 생활 예시로 마무리하기"
    ],
    questions: [
      "이 출처 요약에서 가장 중요한 근거는 무엇일까?",
      "내 말로 설명할 때 어떤 예시를 붙이면 더 쉬울까?"
    ],
    sources: picked.sources
  };
}

const CARE_SOURCES = [
  {
    id: "turn-toward",
    label: "반응",
    title: "상대의 작은 신호에 돌아서서 반응하기",
    action: "Gottman Institute의 'turn toward' 개념을 요약하면, 관계의 신뢰는 큰 이벤트보다 작은 관심 요청에 어떻게 반응하는지에서 자주 쌓입니다. 상대가 말을 걸거나 피곤함을 비칠 때 휴대폰을 잠깐 내려놓고 눈을 맞추는 행동이 작은 신호에 응답하는 방식입니다.",
    why: "작은 관심 요청을 반복해서 받아주는 사람은 상대에게 안전한 사람으로 느껴집니다.",
    practice: "오늘 상대가 말을 시작하면 하던 일을 멈추고 첫 문장만큼은 완전히 듣기",
    example: "응, 그 얘기 궁금해. 잠깐 이것만 내려놓고 들을게.",
    avoid: "대답은 하면서 시선과 몸은 계속 다른 곳에 두지 않기",
    sources: [source("The Gottman Institute", "https://www.gottman.com/blog/turn-toward-instead-of-away/")]
  },
  {
    id: "healthy-communication",
    label: "대화",
    title: "내 감정과 요구를 공격이 아니라 설명으로 말하기",
    action: "APA의 관계 자료를 바탕으로 요약하면, 건강한 관계에서는 상대를 비난하기보다 자신의 감정과 필요를 명확히 말하는 방식이 중요합니다. '너는 항상 그래'보다 '나는 이 상황에서 서운했고 다음에는 이렇게 해주면 좋겠어'가 더 안전한 대화입니다.",
    why: "비난은 방어를 부르고, 설명은 조정할 수 있는 정보를 줍니다.",
    practice: "오늘 불편한 일이 있으면 '너'로 시작하는 문장을 '나는'으로 바꿔 말하기",
    example: "나는 기다리는 동안 조금 서운했어. 다음엔 늦을 것 같으면 먼저 말해주면 좋겠어.",
    avoid: "상대 성격을 단정하는 말로 문제를 키우지 않기",
    sources: [source("APA Relationships", "https://www.apa.org/topics/relationships")]
  },
  {
    id: "appreciation",
    label: "감사",
    title: "받은 배려를 구체적인 감사로 되돌려주기",
    action: "Gottman Institute의 관계 연구 흐름을 요약하면, 좋은 관계는 긍정적 상호작용을 자주 쌓는 쪽으로 강해집니다. 상대가 해준 일을 그냥 넘기지 말고 무엇이 편했고 왜 고마웠는지 구체적으로 말해 주세요.",
    why: "구체적인 감사는 상대의 행동이 당연하게 소비되지 않았다는 신호가 됩니다.",
    practice: "오늘 받은 배려 하나를 '무엇이, 왜' 고마웠는지 붙여 말하기",
    example: "네가 먼저 시간 맞춰줘서 내가 덜 조급했어. 고마워.",
    avoid: "고맙다는 말을 생략한 채 다음 배려를 기대하지 않기",
    sources: [source("The Gottman Institute", "https://www.gottman.com/blog/turn-toward-instead-of-away/")]
  },
  {
    id: "repair",
    label: "회복",
    title: "다툰 뒤에는 사과보다 회복 행동을 붙이기",
    action: "관계 회복 자료들의 공통점을 요약하면, 갈등 후에는 '미안해'에서 멈추지 않고 다음 행동을 말해야 신뢰가 회복됩니다. 인정, 영향 이해, 다음 행동을 짧게 연결하세요.",
    why: "상대는 완벽함보다 같은 상처가 반복되지 않을 것이라는 신호를 원합니다.",
    practice: "갈등 후 '내가 한 행동', '네가 느꼈을 영향', '다음 행동'을 한 문장씩 말하기",
    example: "내가 말 끊은 건 미안해. 무시당한 느낌이었을 것 같아. 다음엔 끝까지 듣고 말할게.",
    avoid: "사과 직후 바로 변명으로 넘어가지 않기",
    sources: [source("APA Relationships", "https://www.apa.org/topics/relationships")]
  },
  {
    id: "small-care",
    label: "센스",
    title: "큰 선물보다 반복되는 작은 불편을 줄이기",
    action: "Gottman Institute가 강조하는 작은 상호작용의 관점으로 요약하면, 관계의 온도는 거창한 이벤트보다 자주 반복되는 작은 행동에서 유지됩니다. 추운 날 실내 동선을 잡거나, 피곤한 날 이동을 줄여주는 식의 행동이 실제 체감 배려입니다.",
    why: "상대가 불편해진 뒤 해결하는 것보다 불편해지기 전에 알아차리는 편이 더 깊게 느껴집니다.",
    practice: "다음 만남 전 날씨, 이동, 식사 대기 시간을 한 번 확인하기",
    example: "오늘 춥다길래 오래 걷지 않는 쪽으로 잡아봤어.",
    avoid: "준비를 해놓고 칭찬을 요구하지 않기",
    sources: [source("The Gottman Institute", "https://www.gottman.com/blog/turn-toward-instead-of-away/")]
  },
  {
    id: "boundary",
    label: "존중",
    title: "좋은 의도라도 먼저 물어보고 행동하기",
    action: "APA의 건강한 관계 관점으로 요약하면, 존중은 상대의 경계와 선택권을 인정하는 데서 시작됩니다. 사진을 올리거나 일정을 정하거나 누군가에게 소개할 때는 내 의도가 좋아도 먼저 물어보는 편이 안전합니다.",
    why: "배려는 내가 좋다고 생각한 것을 밀어붙이는 것이 아니라 상대가 선택할 공간을 남기는 것입니다.",
    practice: "대신 정하려던 일을 오늘 하나만 질문으로 바꾸기",
    example: "이 사진 올려도 괜찮아? 싫으면 안 올릴게.",
    avoid: "허락을 구하는 척하면서 이미 결정해두지 않기",
    sources: [source("APA Relationships", "https://www.apa.org/topics/relationships")]
  }
];

function makeGeneratedCare(date, count, usedKeys) {
  const seed = dateSeed(date);
  const candidates = rotate(CARE_SOURCES, seed);
  const picked = [];
  const pickedKeys = new Set();

  for (const item of candidates) {
    if (picked.length >= count) break;
    const keys = [item.id, item.title].map(normalizeKey).filter(Boolean);
    if (keys.some((key) => usedKeys.has(key) || pickedKeys.has(key))) continue;
    picked.push({
      ...item,
      id: `care-${CARE_GENERATION_VERSION}-${item.id}`,
      baseKey: item.id
    });
    keys.forEach((key) => pickedKeys.add(key));
  }

  for (const item of candidates) {
    if (picked.length >= count) break;
    const keys = [item.id, item.title].map(normalizeKey).filter(Boolean);
    if (keys.some((key) => pickedKeys.has(key))) continue;
    picked.push({
      ...item,
      id: `care-${CARE_GENERATION_VERSION}-${date}-${item.id}`,
      baseKey: item.id,
      title: `${item.title}: 출처 복습`
    });
    keys.forEach((key) => pickedKeys.add(key));
  }

  return picked;
}

module.exports = {
  makeGeneratedKnowledge,
  KNOWLEDGE_GENERATION_VERSION,
  makeGeneratedEnglish,
  ENGLISH_GENERATION_VERSION,
  makeGeneratedSpeakingArticle,
  SPEAKING_GENERATION_VERSION,
  makeGeneratedCare,
  CARE_GENERATION_VERSION,
  lookupEnglishWord,
  lookupExampleTranslation
};
