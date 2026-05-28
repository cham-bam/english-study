const DIFFICULTIES = ["초급", "중급", "고급"];

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

function makeSource(label, url) {
  return url ? [{ label, url }] : [];
}

const KNOWLEDGE_GENERATION_VERSION = "topic-diversity-v3";

const KNOWLEDGE_TOPICS = {
  "초급": [
    ["생물", "식물은 빛으로 양분을 만든다", "식물은 햇빛, 물, 이산화탄소를 이용해 스스로 양분을 만듭니다. 이 과정에서 산소도 만들어져 생태계의 기본 에너지 흐름을 시작합니다.", "광합성은 식물이 먹이를 만들고 생태계에 에너지를 공급하는 과정입니다.", "NASA Climate Kids", "https://climatekids.nasa.gov/greenhouse-cards/"],
    ["건강", "수면은 기억을 정리하는 시간이다", "잠을 자는 동안 뇌는 낮에 들어온 정보를 정리하고 몸의 회복을 돕습니다. 충분한 수면은 집중력과 감정 조절에도 영향을 줍니다.", "수면은 쉬는 시간이면서 동시에 뇌와 몸을 정비하는 시간입니다.", "NIH Sleep", "https://www.nhlbi.nih.gov/health/sleep"],
    ["물리", "마찰은 물체의 움직임을 늦춘다", "마찰은 두 표면이 맞닿아 움직일 때 생기는 저항입니다. 마찰 덕분에 우리는 미끄러지지 않고 걷지만, 기계에서는 에너지 손실을 만들기도 합니다.", "마찰은 불편한 저항이면서 생활을 가능하게 하는 힘입니다.", "", ""],
    ["지구", "물은 순환하며 지구를 돈다", "물은 증발해 구름이 되고, 비나 눈으로 다시 땅에 내려옵니다. 강과 지하수를 거쳐 바다로 돌아가는 과정이 물의 순환입니다.", "물의 순환은 지구의 기후와 생명 활동을 이어 주는 기본 흐름입니다.", "USGS Water Cycle", "https://www.usgs.gov/special-topics/water-science-school/science/water-cycle"],
    ["경제", "희소성은 선택을 만든다", "시간, 돈, 자원은 무한하지 않습니다. 그래서 사람과 사회는 무엇을 먼저 할지 선택해야 하고, 이 선택이 경제 활동의 출발점이 됩니다.", "경제는 제한된 자원을 어떻게 쓸지 결정하는 과정에서 시작됩니다.", "", ""],
    ["기술", "센서는 주변 변화를 숫자로 바꾼다", "센서는 온도, 빛, 움직임 같은 물리적 변화를 감지해 기계가 읽을 수 있는 신호로 바꿉니다. 스마트폰과 자동차에도 많은 센서가 들어 있습니다.", "센서는 현실 세계를 디지털 기기가 이해할 수 있게 해 주는 통로입니다.", "", ""],
    ["언어", "맥락은 같은 말의 의미를 바꾼다", "같은 단어라도 어떤 상황에서 쓰였는지에 따라 의미가 달라질 수 있습니다. 그래서 글을 읽을 때는 문장 앞뒤와 말하는 목적을 함께 봐야 합니다.", "의미는 단어 하나보다 맥락 속에서 더 정확해집니다.", "", ""],
    ["수학", "평균은 전체 경향을 간단히 보여 준다", "평균은 여러 값을 더한 뒤 개수로 나눈 값입니다. 전체적인 수준을 빠르게 파악할 수 있지만, 극단적인 값의 영향을 받을 수 있습니다.", "평균은 유용하지만 데이터의 모든 차이를 설명하지는 못합니다.", "", ""],
    ["생활과학", "음식 보관은 미생물 성장을 늦추는 일이다", "음식을 차갑게 보관하거나 건조하게 두는 이유는 미생물이 빠르게 늘어나는 조건을 줄이기 위해서입니다. 보관법은 맛뿐 아니라 안전과도 연결됩니다.", "식품 보관의 핵심은 미생물이 좋아하는 조건을 줄이는 것입니다.", "FDA Food Safety", "https://www.fda.gov/food/buy-store-serve-safe-food"],
    ["심리", "주의는 한 번에 많은 것을 담기 어렵다", "사람은 여러 정보를 동시에 보는 것 같아도 실제로는 중요한 것에 주의를 나누어 씁니다. 그래서 알림이 많으면 집중이 쉽게 흔들립니다.", "집중력을 지키려면 주의를 빼앗는 자극을 줄여야 합니다.", "", ""],
    ["환경", "재활용은 분리보다 오염 줄이기가 중요하다", "재활용품에 음식물이나 다른 재질이 섞이면 처리 효율이 떨어집니다. 깨끗하게 비우고 재질별로 나누는 습관이 재활용의 품질을 높입니다.", "재활용은 버리는 행동이 아니라 다시 쓰기 쉽게 준비하는 과정입니다.", "EPA Recycling", "https://www.epa.gov/recycle"],
    ["역사", "달력은 시간을 사회적으로 맞추는 도구다", "달력은 계절과 날짜를 정리해 농사, 종교, 행정, 약속을 맞추게 해 줍니다. 시간을 같은 기준으로 나누면 사회가 함께 움직이기 쉬워집니다.", "달력은 시간을 기록하는 도구이면서 사회적 약속의 체계입니다.", "", ""]
  ],
  "중급": [
    ["경제", "기회비용은 선택하지 않은 대안의 가치다", "어떤 선택을 하면 동시에 포기하는 선택지가 생깁니다. 기회비용은 그중 가장 가치 있는 대안을 포기한 비용을 뜻합니다.", "좋은 선택은 가격뿐 아니라 포기한 가능성까지 함께 보는 일입니다.", "", ""],
    ["과학", "피드백은 시스템을 안정시키거나 증폭시킨다", "피드백은 결과가 다시 원인에 영향을 주는 구조입니다. 음의 피드백은 변화를 줄이고, 양의 피드백은 변화를 키울 수 있습니다.", "복잡한 현상은 원인과 결과가 되돌아 연결될 때 더 잘 이해됩니다.", "", ""],
    ["기술", "암호화는 내용을 읽을 수 없게 바꾸는 기술이다", "암호화는 데이터를 정해진 규칙과 열쇠로 변환해 허가받은 사람만 읽을 수 있게 합니다. 온라인 결제와 메시지 보호에 널리 쓰입니다.", "암호화는 디지털 신뢰를 지탱하는 기본 보안 기술입니다.", "NIST Cryptography", "https://www.nist.gov/cryptography"],
    ["사회", "네트워크 효과는 사용자가 많을수록 가치를 키운다", "메신저나 결제 서비스는 쓰는 사람이 많을수록 더 편리해집니다. 이런 현상을 네트워크 효과라고 합니다.", "네트워크 효과는 서비스의 품질뿐 아니라 참여자 수가 가치를 만드는 구조입니다.", "", ""],
    ["통계", "상관관계는 인과관계와 다르다", "두 현상이 함께 움직인다고 해서 하나가 다른 하나를 일으킨다고 단정할 수는 없습니다. 숨은 변수나 우연한 패턴이 있을 수 있습니다.", "데이터를 해석할 때는 함께 움직임과 원인 관계를 구분해야 합니다.", "", ""],
    ["생태", "생태계는 에너지 흐름과 물질 순환으로 유지된다", "생태계 안에서 에너지는 먹이 관계를 따라 이동하고, 물질은 분해와 재사용을 거쳐 순환합니다. 두 흐름이 균형을 만들며 생태계를 유지합니다.", "생태계는 생물 목록보다 서로 주고받는 흐름으로 이해해야 합니다.", "", ""],
    ["경영", "병목은 전체 속도를 제한하는 지점이다", "업무 과정에서 가장 느린 단계가 전체 처리 속도를 결정할 때가 많습니다. 병목을 찾으면 작은 개선으로도 전체 효율이 커질 수 있습니다.", "효율 개선은 모든 곳을 빠르게 하는 것보다 가장 막힌 곳을 푸는 데서 시작됩니다.", "", ""],
    ["의사결정", "기준을 먼저 정하면 선택이 덜 흔들린다", "선택지가 많을수록 감정이나 최근 정보에 흔들리기 쉽습니다. 미리 기준을 정하면 비교가 쉬워지고 후회도 줄어듭니다.", "좋은 판단은 선택지보다 판단 기준을 먼저 세우는 데서 시작됩니다.", "", ""],
    ["AI", "학습 데이터는 모델의 관점을 만든다", "AI 모델은 주어진 데이터에서 패턴을 배웁니다. 데이터가 치우쳐 있으면 결과도 특정 방향으로 기울 수 있습니다.", "AI 결과를 믿으려면 모델뿐 아니라 어떤 데이터로 배웠는지도 봐야 합니다.", "NIST AI RMF", "https://www.nist.gov/itl/ai-risk-management-framework"],
    ["도시", "접근성은 거리보다 이동 시간에 가깝다", "지도상 거리가 가까워도 교통이 불편하면 실제 접근성은 낮을 수 있습니다. 이동 시간, 비용, 환승 편의가 함께 작용합니다.", "입지의 가치는 단순 거리보다 실제 이동 가능성에서 더 잘 드러납니다.", "", ""],
    ["금융", "분산투자는 하나의 위험에 덜 흔들리게 한다", "자산을 여러 곳에 나누면 특정 자산의 손실이 전체에 미치는 영향을 줄일 수 있습니다. 다만 모든 위험을 없애는 것은 아닙니다.", "분산투자는 수익을 보장하는 기술이 아니라 큰 흔들림을 줄이는 원칙입니다.", "Investor.gov Diversification", "https://www.investor.gov/introduction-investing/investing-basics/glossary/diversification"],
    ["커뮤니케이션", "좋은 요약은 삭제가 아니라 구조화다", "요약은 문장을 짧게 줄이는 일만이 아닙니다. 핵심 주장, 근거, 예시를 구분해 상대가 빠르게 이해하도록 다시 배열하는 일입니다.", "요약의 힘은 내용을 줄이는 데보다 이해 순서를 만드는 데 있습니다.", "", ""]
  ],
  "고급": [
    ["통계", "베이즈 사고는 새 증거로 믿음을 갱신한다", "베이즈적 판단은 기존의 가능성에 새 증거를 반영해 결론을 갱신하는 방식입니다. 불확실한 상황에서 판단을 조금씩 조정할 때 유용합니다.", "확률적 사고는 확신을 고정하는 대신 증거에 따라 믿음을 업데이트합니다.", "", ""],
    ["경제", "도덕적 해이는 책임 구조가 약할 때 생긴다", "어떤 사람이 위험의 결과를 온전히 부담하지 않으면 더 위험한 선택을 할 수 있습니다. 보험, 금융, 조직 설계에서 자주 논의되는 문제입니다.", "인센티브를 설계할 때는 행동의 이익과 책임이 어떻게 연결되는지 봐야 합니다.", "", ""],
    ["기술", "분산 시스템은 합의와 지연의 균형을 다룬다", "여러 컴퓨터가 함께 일하는 시스템에서는 데이터 일관성, 응답 속도, 장애 대응을 동시에 고려해야 합니다. 네트워크 지연은 설계를 어렵게 만듭니다.", "분산 시스템의 핵심은 빠른 처리와 믿을 수 있는 합의 사이의 균형입니다.", "", ""],
    ["철학", "환원주의는 복잡한 대상을 작은 단위로 설명하려 한다", "환원주의는 복잡한 현상을 더 작은 구성 요소로 나누어 이해하려는 관점입니다. 강력한 분석 방법이지만 전체 맥락을 놓칠 수도 있습니다.", "복잡한 문제는 부분의 설명과 전체의 관계를 함께 봐야 합니다.", "", ""],
    ["AI", "과적합은 훈련 데이터에는 강하지만 새 상황에 약한 상태다", "모델이 훈련 데이터의 세부 패턴까지 지나치게 외우면 실제 새 데이터에서 성능이 떨어질 수 있습니다. 이를 과적합이라고 합니다.", "좋은 모델은 본 데이터를 외우는 것이 아니라 보지 못한 상황에도 일반화해야 합니다.", "Google ML Crash Course", "https://developers.google.com/machine-learning/crash-course/overfitting/overfitting"],
    ["법과사회", "규제는 혁신 속도와 사회적 위험 사이에서 균형을 찾는다", "새 기술은 편익을 만들지만 개인정보, 안전, 시장 독점 같은 위험도 가져올 수 있습니다. 규제는 금지가 아니라 위험 배분의 방식이기도 합니다.", "좋은 규제는 변화를 막는 것이 아니라 위험을 보이게 만들고 책임을 배치합니다.", "", ""],
    ["경영", "전략은 하지 않을 일을 정하는 능력이다", "자원이 제한된 조직은 모든 기회를 동시에 잡을 수 없습니다. 전략은 목표를 위해 집중할 영역과 포기할 영역을 명확히 정하는 일입니다.", "전략의 선명함은 선택한 것보다 포기한 것에서 드러날 때가 많습니다.", "", ""],
    ["인지과학", "메타인지는 내가 아는 것과 모르는 것을 보는 능력이다", "메타인지는 자신의 이해 상태를 점검하는 사고입니다. 학습에서는 무엇을 다시 봐야 하는지 판단하는 데 특히 중요합니다.", "잘 배우는 사람은 많이 아는 사람보다 모르는 지점을 빨리 찾는 사람입니다.", "", ""],
    ["정보이론", "신호와 잡음의 구분은 의사결정의 질을 좌우한다", "데이터에는 의미 있는 변화와 우연한 흔들림이 함께 들어 있습니다. 잡음을 신호로 착각하면 잘못된 결론에 도달할 수 있습니다.", "좋은 분석은 더 많은 데이터를 보는 것만이 아니라 의미 있는 패턴을 가려내는 일입니다.", "", ""],
    ["심리", "인지부하는 생각의 작업 공간을 제한한다", "사람의 작업기억은 한 번에 처리할 수 있는 정보가 제한적입니다. 설명이 복잡할수록 정보를 나누고 순서를 잡아야 이해가 쉬워집니다.", "어려운 내용을 잘 설명하려면 정보량보다 처리 순서를 설계해야 합니다.", "", ""],
    ["조직", "심리적 안전감은 반대 의견을 말할 수 있는 조건이다", "팀원이 실수나 다른 의견을 말해도 처벌받지 않는다고 느낄 때 학습이 빨라집니다. 이는 무조건 편한 분위기와는 다릅니다.", "좋은 팀은 갈등이 없는 팀이 아니라 필요한 말을 안전하게 꺼낼 수 있는 팀입니다.", "", ""],
    ["시장", "락인 효과는 전환 비용이 선택을 붙잡는 현상이다", "사용자가 다른 서비스로 옮기고 싶어도 데이터 이전, 학습 비용, 관계망 때문에 머무를 수 있습니다. 이를 락인 효과라고 합니다.", "시장의 힘은 제품 품질뿐 아니라 사용자가 떠나기 어려운 구조에서도 생깁니다.", "", ""]
  ]
};

const KNOWLEDGE_ANGLES = [
  {
    id: "principle",
    label: "핵심 원리",
    title: (topic) => topic[1],
    point2: "둘째, 이 지식은 단순한 사실 암기보다 원인과 결과를 연결해 볼 때 더 오래 기억됩니다.",
    point3: (topic) => `셋째, 실제 판단에서는 '${topic[3]}'라는 결론을 기준 문장으로 삼으면 응용하기 쉽습니다.`
  },
  {
    id: "application",
    label: "생활 적용",
    title: (topic) => `${topic[1]}: 생활 속 판단으로 확장하기`,
    point2: "둘째, 생활 속 사례에 적용하면 같은 현상을 더 빠르게 분류하고 불필요한 오해를 줄일 수 있습니다.",
    point3: (topic) => `셋째, '${topic[3]}'를 한 문장으로 말해 보면 설명할 때 핵심을 놓치지 않습니다.`
  },
  {
    id: "comparison",
    label: "비교 관점",
    title: (topic) => `${topic[1]}: 비교로 핵심 보기`,
    point2: "둘째, 비슷해 보이는 개념과 비교하면 이 주제가 언제 중요해지는지 경계가 분명해집니다.",
    point3: (topic) => `셋째, 비교 후에는 '${topic[3]}'라는 정리 문장으로 돌아오면 이해가 흩어지지 않습니다.`
  }
];

function buildKnowledgeBody(topic, angle) {
  return `핵심은 세 가지입니다. 첫째, ${topic[2]} ${angle.point2} ${angle.point3(topic)}`;
}

function generatedKnowledgeCatalog(difficulty, seed) {
  const topics = KNOWLEDGE_TOPICS[difficulty] || [];
  return topics.map((topic, topicIndex) => {
    const angle = KNOWLEDGE_ANGLES[Math.abs(seed + topicIndex) % KNOWLEDGE_ANGLES.length];
    return {
      id: `generated-knowledge-${KNOWLEDGE_GENERATION_VERSION}-${difficulty}-${topicIndex + 1}-${angle.id}`,
      topicKey: `${difficulty}-${topicIndex + 1}`,
      difficulty,
      category: topic[0],
      title: angle.title(topic),
      body: buildKnowledgeBody(topic, angle),
      takeaway: topic[3],
      sources: makeSource(topic[4], topic[5])
    };
  });
}

function fallbackKnowledge(date, difficulty, index) {
  const subjects = {
    "초급": ["관찰", "비교", "기록", "습관"],
    "중급": ["시스템", "피드백", "균형", "선택"],
    "고급": ["불확실성", "인센티브", "구조", "검증"]
  };
  const subject = subjects[difficulty][index % subjects[difficulty].length];
  return {
    id: `generated-knowledge-${KNOWLEDGE_GENERATION_VERSION}-${date}-${difficulty}-${index + 1}`,
    topicKey: `${difficulty}-fallback-${index + 1}`,
    difficulty,
    category: "생성상식",
    title: `${subject}을 이해하면 판단이 더 선명해진다`,
    body: `핵심은 세 가지입니다. 첫째, ${subject}은 복잡한 정보를 정리할 때 유용한 관점입니다. 둘째, 대상의 핵심 요소를 나누면 원인과 결과를 더 차분하게 볼 수 있습니다. 셋째, 요소들이 서로 어떤 영향을 주는지 확인하면 단순한 인상보다 더 안정적인 판단을 할 수 있습니다.`,
    takeaway: `좋은 이해는 많은 정보를 외우는 것보다 ${subject}의 구조를 잡는 데서 시작됩니다.`,
    sources: []
  };
}

function makeGeneratedKnowledge(date, quota, usedKeys) {
  const picked = [];
  const pickedKeys = new Set();
  const seed = dateSeed(date);

  DIFFICULTIES.forEach((difficulty, difficultyIndex) => {
    const candidates = rotate(generatedKnowledgeCatalog(difficulty, seed + difficultyIndex * 11), seed + difficultyIndex * 11);
    const pickedTopicKeys = new Set();
    let count = 0;

    for (const item of candidates) {
      const keys = [item.id, item.title].map(normalizeKey).filter(Boolean);
      if (pickedTopicKeys.has(item.topicKey)) continue;
      if (keys.some((key) => usedKeys.has(key) || pickedKeys.has(key))) continue;
      picked.push(item);
      pickedTopicKeys.add(item.topicKey);
      keys.forEach((key) => pickedKeys.add(key));
      count += 1;
      if (count >= quota[difficulty]) break;
    }

    while (count < quota[difficulty]) {
      const item = fallbackKnowledge(date, difficulty, count + picked.length);
      picked.push(item);
      pickedTopicKeys.add(item.topicKey);
      [item.id, item.title].map(normalizeKey).forEach((key) => pickedKeys.add(key));
      count += 1;
    }
  });

  return picked;
}

const ENGLISH_WORDS = {
  "초급": [
    ["laugh", "웃다", "We laugh at the funny story.", "우리는 그 재미있는 이야기에 웃는다."],
    ["play", "놀다, 경기하다", "Children play in the park.", "아이들이 공원에서 논다."],
    ["talk", "말하다", "We talk after dinner.", "우리는 저녁 식사 후에 이야기한다."],
    ["walk", "걷다", "I walk to the station.", "나는 역까지 걸어간다."],
    ["write", "쓰다", "She writes a short note.", "그녀는 짧은 메모를 쓴다."],
    ["choose", "선택하다", "I choose a simple plan.", "나는 간단한 계획을 선택한다."],
    ["clean", "청소하다, 깨끗한", "Please clean the table.", "식탁을 청소해 주세요."],
    ["draw", "그리다", "She draws a small map.", "그녀는 작은 지도를 그린다."],
    ["drink", "마시다", "I drink water after lunch.", "나는 점심 후에 물을 마신다."],
    ["find", "찾다", "We find the answer together.", "우리는 함께 답을 찾는다."],
    ["fix", "고치다", "He fixes the broken chair.", "그는 부서진 의자를 고친다."],
    ["hope", "바라다", "I hope you feel better.", "나는 네가 좀 나아지길 바란다."],
    ["rest", "쉬다", "You should rest today.", "너는 오늘 쉬어야 한다."],
    ["send", "보내다", "I send a message at night.", "나는 밤에 메시지를 보낸다."],
    ["stand", "서다", "They stand near the door.", "그들은 문 근처에 서 있다."],
    ["stay", "머무르다", "We stay home on Sunday.", "우리는 일요일에 집에 머문다."],
    ["turn", "돌다, 바꾸다", "Turn left at the corner.", "모퉁이에서 왼쪽으로 도세요."],
    ["visit", "방문하다", "I visit my parents often.", "나는 부모님을 자주 방문한다."],
    ["wait", "기다리다", "Please wait for five minutes.", "5분만 기다려 주세요."],
    ["carry", "나르다", "Can you carry this bag?", "이 가방을 들어 줄 수 있나요?"],
    ["catch", "잡다", "He catches the ball.", "그는 공을 잡는다."],
    ["fill", "채우다", "Fill the bottle with water.", "병을 물로 채우세요."],
    ["guess", "추측하다", "Can you guess the meaning?", "그 뜻을 추측할 수 있나요?"],
    ["reach", "도착하다, 닿다", "We reach the station early.", "우리는 역에 일찍 도착한다."],
    ["start", "시작하다", "The class starts at nine.", "수업은 9시에 시작한다."],
    ["build", "짓다, 만들다", "They build a small house.", "그들은 작은 집을 짓는다."],
    ["change", "바꾸다", "I change my plan.", "나는 계획을 바꾼다."],
    ["check", "확인하다", "Check your answer again.", "답을 다시 확인하세요."],
    ["follow", "따라가다", "Follow the blue line.", "파란 선을 따라가세요."],
    ["miss", "놓치다, 그리워하다", "I miss the morning bus.", "나는 아침 버스를 놓친다."]
  ],
  "중급": [
    ["combine", "결합하다", "We combine two ideas.", "우리는 두 가지 아이디어를 결합한다."],
    ["distribute", "분배하다", "The system distributes the workload.", "그 시스템은 작업량을 분배한다."],
    ["predict", "예측하다", "The model predicts future demand.", "그 모델은 미래 수요를 예측한다."],
    ["prevent", "예방하다", "Early action prevents bigger problems.", "빠른 조치는 더 큰 문제를 예방한다."],
    ["reflect", "반영하다, 성찰하다", "The result reflects user behavior.", "그 결과는 사용자 행동을 반영한다."],
    ["facilitate", "촉진하다", "Clear rules facilitate teamwork.", "명확한 규칙은 팀워크를 촉진한다."],
    ["monitor", "감시하다, 살피다", "We monitor the system daily.", "우리는 시스템을 매일 살핀다."],
    ["verify", "검증하다", "Please verify the source first.", "먼저 출처를 검증해 주세요."],
    ["integrate", "통합하다", "The app integrates several tools.", "그 앱은 여러 도구를 통합한다."],
    ["clarify", "명확히 하다", "She clarifies the main point.", "그녀는 핵심 요점을 명확히 한다."],
    ["estimate", "추정하다", "They estimate the total cost.", "그들은 총비용을 추정한다."],
    ["compare", "비교하다", "Compare the two options carefully.", "두 선택지를 신중히 비교하세요."],
    ["support", "지원하다", "The policy supports small firms.", "그 정책은 소규모 기업을 지원한다."],
    ["reduce", "줄이다", "Good design reduces confusion.", "좋은 설계는 혼란을 줄인다."],
    ["expand", "확장하다", "The company expands its service.", "그 회사는 서비스를 확장한다."],
    ["detect", "감지하다", "Sensors detect small changes.", "센서는 작은 변화를 감지한다."],
    ["convert", "전환하다", "The tool converts speech into text.", "그 도구는 음성을 텍스트로 전환한다."],
    ["balance", "균형을 맞추다", "We balance speed and safety.", "우리는 속도와 안전의 균형을 맞춘다."],
    ["measure", "측정하다", "The survey measures customer trust.", "그 설문은 고객 신뢰를 측정한다."],
    ["deliver", "전달하다", "The team delivers the report today.", "그 팀은 오늘 보고서를 전달한다."],
    ["protect", "보호하다", "Encryption protects private data.", "암호화는 개인 데이터를 보호한다."],
    ["restore", "복원하다", "The backup restores lost files.", "백업은 잃어버린 파일을 복원한다."],
    ["resolve", "해결하다", "They resolve the issue quickly.", "그들은 문제를 빠르게 해결한다."],
    ["prioritize", "우선순위를 정하다", "Prioritize the urgent tasks.", "긴급한 일의 우선순위를 정하세요."],
    ["interpret", "해석하다", "Analysts interpret the chart.", "분석가들은 그 차트를 해석한다."],
    ["draft", "초안을 작성하다", "I draft the proposal first.", "나는 먼저 제안서 초안을 작성한다."],
    ["align", "정렬하다, 맞추다", "The plan aligns with our goal.", "그 계획은 우리의 목표와 맞다."],
    ["evaluate", "평가하다", "We evaluate the result every week.", "우리는 매주 결과를 평가한다."],
    ["coordinate", "조율하다", "She coordinates the project schedule.", "그녀는 프로젝트 일정을 조율한다."],
    ["streamline", "간소화하다", "Automation streamlines repeated work.", "자동화는 반복 업무를 간소화한다."]
  ],
  "고급": [
    ["feasible", "실현 가능한", "The plan is feasible within a month.", "그 계획은 한 달 안에 실현 가능하다."],
    ["lucid", "명료한", "Her explanation was lucid and calm.", "그녀의 설명은 명료하고 차분했다."],
    ["prudent", "신중한", "A prudent investor checks the risk.", "신중한 투자자는 위험을 확인한다."],
    ["succinct", "간결한", "Give me a succinct summary.", "간결한 요약을 해 주세요."],
    ["furtive", "은밀한", "He made a furtive glance at the door.", "그는 문 쪽을 은밀히 흘끗 보았다."],
    ["cogent", "설득력 있는", "She made a cogent argument.", "그녀는 설득력 있는 주장을 했다."],
    ["assiduous", "성실한, 꾸준한", "Assiduous practice improves fluency.", "꾸준한 연습은 유창성을 높인다."],
    ["nuanced", "미묘한 차이를 담은", "The issue requires a nuanced answer.", "그 문제는 섬세한 답변을 필요로 한다."],
    ["salient", "두드러진", "The salient risk is timing.", "두드러진 위험은 시점이다."],
    ["robust", "탄탄한", "A robust plan survives small errors.", "탄탄한 계획은 작은 오류에도 버틴다."],
    ["granular", "세분화된", "Granular data reveals hidden patterns.", "세분화된 데이터는 숨은 패턴을 드러낸다."],
    ["iterative", "반복적인", "Writing is an iterative process.", "글쓰기는 반복적인 과정이다."],
    ["discreet", "신중한", "Be discreet with sensitive details.", "민감한 세부사항은 신중히 다루세요."],
    ["proactive", "선제적인", "A proactive response prevents delays.", "선제적인 대응은 지연을 막는다."],
    ["tangible", "분명히 느낄 수 있는", "The change produced tangible benefits.", "그 변화는 분명한 이익을 만들었다."],
    ["latent", "잠재된", "The data shows latent demand.", "그 데이터는 잠재 수요를 보여 준다."],
    ["cohesive", "응집력 있는", "The team built a cohesive strategy.", "그 팀은 응집력 있는 전략을 세웠다."],
    ["incremental", "점진적인", "Incremental progress still matters.", "점진적인 진전도 여전히 중요하다."],
    ["contextual", "맥락적인", "Contextual clues clarify the meaning.", "맥락 단서는 의미를 명확히 한다."],
    ["deliberate", "의도적인, 신중한", "Deliberate practice targets weak points.", "의도적인 연습은 약점을 겨냥한다."],
    ["credible", "믿을 만한", "The claim needs credible evidence.", "그 주장은 믿을 만한 증거가 필요하다."],
    ["resilient", "회복력 있는", "Resilient systems recover after shocks.", "회복력 있는 시스템은 충격 후에 회복한다."],
    ["subtle", "미묘한", "A subtle change improved the tone.", "미묘한 변화가 어조를 개선했다."],
    ["decisive", "결정적인", "The final test was decisive.", "마지막 시험은 결정적이었다."],
    ["composed", "침착한", "She stayed composed under pressure.", "그녀는 압박 속에서도 침착함을 유지했다."],
    ["judicious", "현명한", "A judicious choice saves time.", "현명한 선택은 시간을 아낀다."],
    ["compelling", "강력한, 설득력 있는", "The data tells a compelling story.", "그 데이터는 설득력 있는 이야기를 보여 준다."],
    ["pragmatic", "실용적인", "We need a pragmatic solution.", "우리는 실용적인 해결책이 필요하다."],
    ["discernible", "식별 가능한", "There is a discernible pattern.", "식별 가능한 패턴이 있다."],
    ["substantive", "실질적인", "The meeting led to substantive changes.", "그 회의는 실질적인 변화를 이끌었다."]
  ]
};

function englishCatalog(difficulty) {
  return (ENGLISH_WORDS[difficulty] || []).map((item) => ({
    difficulty,
    word: item[0],
    meaning: item[1],
    example: item[2],
    exampleKo: item[3],
    note: `${item[1]}라는 뜻입니다. 예문과 함께 문장째 익혀보세요.`
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

const EXAMPLE_TRANSLATIONS = {
  "We laugh at the joke.": "우리는 그 농담에 웃는다.",
  "The children play outside.": "아이들이 밖에서 논다.",
  "We talk after class.": "우리는 수업 후에 이야기한다.",
  "I walk to work.": "나는 걸어서 출근한다.",
  "Please write your name.": "이름을 써 주세요.",
  "Combine the two ideas.": "두 가지 아이디어를 결합하세요.",
  "Distribute the materials evenly.": "자료를 고르게 나누어 주세요.",
  "The model predicts demand.": "그 모델은 수요를 예측한다.",
  "Masks can help prevent spread.": "마스크는 확산을 예방하는 데 도움이 될 수 있다.",
  "Take time to reflect on the results.": "결과를 성찰할 시간을 가지세요.",
  "The plan is feasible within a month.": "그 계획은 한 달 안에 실현 가능하다.",
  "Her explanation was lucid.": "그녀의 설명은 명료했다.",
  "It is prudent to save cash.": "현금을 저축하는 것은 신중한 일이다.",
  "He gave a succinct answer.": "그는 간결한 답을 했다.",
  "He gave a furtive glance at his notes.": "그는 자기 노트를 은밀히 흘끗 보았다."
};

function lookupExampleTranslation(example) {
  return EXAMPLE_TRANSLATIONS[String(example || "").trim()] || "";
}

function makeGeneratedEnglish(date, quota, usedWords) {
  const picked = [];
  const pickedWords = new Set();
  const seed = dateSeed(date);

  DIFFICULTIES.forEach((difficulty, difficultyIndex) => {
    const candidates = rotate(englishCatalog(difficulty), seed + difficultyIndex * 13);
    let count = 0;

    for (const item of candidates) {
      const key = normalizeKey(item.word);
      if (!key || usedWords.has(key) || pickedWords.has(key)) continue;
      picked.push(item);
      pickedWords.add(key);
      count += 1;
      if (count >= quota[difficulty]) break;
    }

    for (const item of candidates) {
      if (count >= quota[difficulty]) break;
      const key = normalizeKey(item.word);
      if (!key || pickedWords.has(key)) continue;
      picked.push({ ...item, note: `${item.meaning}라는 뜻입니다. 오늘은 복습 단어로 다시 문장 속에서 익혀보세요.` });
      pickedWords.add(key);
      count += 1;
    }
  });

  return picked;
}

const CARE_ITEMS = [
  ["listening-before-fixing", "경청", "바로 해결책을 주기 전에 먼저 들어주기", "상대가 힘든 일을 말할 때 곧장 조언하기보다 '그랬구나, 많이 힘들었겠다'처럼 감정을 먼저 받아 주세요.", "받는 데 익숙했던 사람에게 가장 먼저 필요한 표현은 정답보다 상대의 마음을 놓치지 않는 태도입니다.", "오늘은 조언보다 공감 한 문장을 먼저 말해보기"],
  ["small-weather-check", "센스", "날씨와 동선까지 먼저 챙기기", "비가 오거나 추운 날에는 우산, 겉옷, 이동 시간을 먼저 떠올려 주세요. '오늘 비 오니까 내가 역 쪽으로 갈게' 같은 말은 작지만 크게 느껴집니다.", "사랑은 큰 이벤트보다 상대가 불편해지기 전에 알아차리는 감각에서 자주 전달됩니다.", "상대의 오늘 이동 경로를 한 번 상상해보기"],
  ["food-memory", "관찰", "좋아하는 음식과 싫어하는 재료 기억하기", "상대가 좋아한 메뉴, 매운 정도, 못 먹는 재료를 메모해 두면 다음 선택이 배려가 됩니다. 기억해 준다는 느낌은 강한 애정 신호입니다.", "배려는 상대의 취향을 내 기준으로 바꾸지 않고 저장해 두는 일입니다.", "최근 상대가 좋아한다고 말한 것을 하나 적어두기"],
  ["after-meeting-message", "표현", "만난 뒤 짧게 고마움을 전하기", "데이트가 끝난 뒤 '오늘 같이 걸어서 좋았어'처럼 구체적으로 고마움을 말해 주세요. 막연한 연락보다 오늘의 장면을 짚는 말이 더 따뜻합니다.", "사랑 표현은 길이보다 구체성에서 진심이 살아납니다.", "오늘 좋았던 장면 하나를 문장으로 남기기"],
  ["share-decision-load", "책임", "선택 부담을 혼자 맡기지 않기", "뭐 먹을지, 어디 갈지 늘 상대에게 맡기면 배려처럼 보여도 피로가 쌓일 수 있습니다. 두세 가지 후보를 먼저 제안하고 같이 고르게 해 주세요.", "센스 있는 배려는 결정권을 빼앗는 것이 아니라 결정 부담을 나누는 것입니다.", "다음 약속 후보 2개를 먼저 준비해보기"],
  ["notice-effort", "인정", "상대의 노력과 변화를 알아봐 주기", "새 옷, 바쁜 일정 속 준비, 기분을 다잡은 노력처럼 작게 지나갈 수 있는 변화를 말로 인정해 주세요. '오늘 준비 많이 했네'는 좋은 칭찬입니다.", "사람은 자신이 애쓴 부분을 알아봐 주는 사람에게 마음을 열기 쉽습니다.", "상대가 애쓴 점 하나를 구체적으로 말하기"],
  ["phone-away", "집중", "함께 있을 때 휴대폰을 내려놓기", "대화 중 계속 화면을 보면 상대는 자신이 뒤로 밀렸다고 느낄 수 있습니다. 짧은 시간이라도 눈을 보고 듣는 태도가 큰 배려가 됩니다.", "관심은 말보다 시선과 몸의 방향에서 먼저 전달됩니다.", "식사 시작 후 20분은 휴대폰 뒤집어두기"],
  ["safe-return", "안심", "귀가와 안전을 자연스럽게 확인하기", "늦은 시간에는 '도착하면 편하게 한 줄만 줘'처럼 부담 없는 말로 안전을 챙겨 주세요. 통제처럼 느껴지지 않게 선택권을 남기는 것이 중요합니다.", "안심을 주는 배려는 감시가 아니라 걱정을 부드럽게 표현하는 방식입니다.", "상대가 부담스럽지 않은 귀가 확인 문장을 준비하기"],
  ["apology-with-action", "회복", "미안하다는 말 뒤에 행동을 붙이기", "늦었거나 서운하게 했다면 변명보다 인정, 사과, 다음 행동을 짧게 말해 주세요. '기다리게 해서 미안해. 다음엔 10분 일찍 출발할게'처럼요.", "관계의 신뢰는 실수 없음보다 회복 방식에서 더 많이 쌓입니다.", "사과할 때 다음 행동을 한 가지 같이 말하기"],
  ["respect-rhythm", "존중", "연락 리듬을 상대와 맞추기", "자주 연락하는 것이 항상 사랑은 아닐 수 있습니다. 상대가 일하거나 쉬는 시간에는 답장을 재촉하지 않고, 서로 편한 리듬을 맞추는 것이 좋습니다.", "배려는 내 불안을 상대에게 숙제로 넘기지 않는 데서 시작됩니다.", "상대가 바쁜 시간대를 기억하고 재촉하지 않기"],
  ["quiet-help", "실행", "말없이 필요한 일을 하나 덜어주기", "짐이 많으면 자연스럽게 들어주고, 추우면 자리를 바꿔주고, 피곤해 보이면 이동을 줄여 주세요. 과시하지 않는 도움이 오래 남습니다.", "센스 있는 행동은 생색보다 타이밍이 먼저입니다.", "오늘 상대의 번거로움을 하나 줄여보기"],
  ["specific-compliment", "칭찬", "외모보다 선택과 태도를 구체적으로 칭찬하기", "예쁘다라는 말도 좋지만, '그 색 잘 골랐다', '오늘 말하는 방식이 다정했다'처럼 선택과 태도를 칭찬하면 더 깊게 전달됩니다.", "구체적인 칭찬은 상대를 자세히 보고 있다는 증거가 됩니다.", "칭찬할 때 무엇이 좋았는지 이유까지 붙이기"],
  ["remember-important-day", "기억", "상대의 중요한 날을 먼저 기억하기", "시험, 발표, 병원, 가족 일정처럼 상대에게 중요한 날을 기억해 두었다가 먼저 응원해 주세요. 큰 선물보다 먼저 기억한 한마디가 힘이 됩니다.", "사랑은 상대의 하루를 내 일정 안에 자리 잡게 하는 일입니다.", "상대의 중요한 일정 하나를 캘린더에 적기"],
  ["ask-consent", "존중", "좋은 의도라도 먼저 물어보기", "사진을 올리거나 계획을 정하거나 누군가에게 소개할 때는 먼저 물어보세요. 배려는 내가 좋다고 생각한 것을 밀어붙이지 않는 것입니다.", "센스는 상대의 경계를 존중할 때 더 성숙하게 보입니다.", "내가 대신 정하려는 일을 먼저 질문으로 바꾸기"],
  ["warm-transition", "다정함", "헤어질 때 다음 안정감을 남기기", "헤어지는 순간에 '조심히 가고, 내일 네 얘기 이어서 듣자'처럼 다음 연결감을 남겨 주세요. 관계가 끊기지 않는다는 느낌을 줍니다.", "작별 인사는 끝맺음이 아니라 다음 만남의 온도를 정하는 순간입니다.", "헤어질 때 다음에 이어갈 말을 하나 남기기"],
  ["emotional-reciprocity", "상호성", "받은 배려를 말로 되돌려주기", "상대가 챙겨준 일을 당연하게 넘기지 말고 '네가 그렇게 해줘서 편했어'라고 말해 주세요. 받은 것을 알아차리는 사람이 줄 수 있는 사람으로 바뀝니다.", "감사는 배려를 사랑으로 순환시키는 가장 쉬운 시작점입니다.", "오늘 받은 배려 하나를 이름 붙여 고맙다고 말하기"]
];

function careCatalog() {
  return CARE_ITEMS.map((item, index) => ({
    id: `care-${index + 1}`,
    category: item[0],
    label: item[1],
    title: item[2],
    action: item[3],
    why: item[4],
    practice: item[5]
  }));
}

function makeGeneratedCare(date, count, usedIds) {
  const seed = dateSeed(date);
  const catalog = rotate(careCatalog(), seed);
  const picked = [];
  const pickedIds = new Set();

  for (const item of catalog) {
    if (picked.length >= count) break;
    if (usedIds.has(item.id) || pickedIds.has(item.id)) continue;
    picked.push(item);
    pickedIds.add(item.id);
  }

  for (const item of catalog) {
    if (picked.length >= count) break;
    if (pickedIds.has(item.id)) continue;
    picked.push(item);
    pickedIds.add(item.id);
  }

  return picked;
}

module.exports = {
  makeGeneratedKnowledge,
  KNOWLEDGE_GENERATION_VERSION,
  makeGeneratedEnglish,
  makeGeneratedCare,
  lookupEnglishWord,
  lookupExampleTranslation
};
