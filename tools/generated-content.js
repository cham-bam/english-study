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

const KNOWLEDGE_GENERATION_VERSION = "source-digest-v4";

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

const KNOWLEDGE_LENSES = [
  {
    id: "decision",
    title: (topic) => `${topic[1]}: 판단 기준`,
    body: (topic) => `이 주제는 단순한 사실보다 판단 기준으로 읽을 때 힘이 납니다. 먼저 ${topic[2]} 다음으로 이 개념은 원인과 결과를 연결해 주기 때문에 겉으로 보이는 현상만 보고 성급히 결론 내리는 일을 줄입니다. 마지막으로 실제 상황에서는 "${topic[3]}"라는 문장을 기준으로 삼으면, 새 사례를 만났을 때도 무엇을 봐야 하는지 빠르게 정리할 수 있습니다.`
  },
  {
    id: "contrast",
    title: (topic) => `${topic[1]}: 비슷한 개념과 가르는 선`,
    body: (topic) => `비슷해 보이는 것과 구분하면 핵심이 더 선명해집니다. ${topic[2]} 여기서 첫 번째 포인트는 개념의 정의이고, 두 번째 포인트는 그 개념이 작동하는 조건이며, 세 번째 포인트는 다른 상황에 옮겨도 유지되는 기준입니다. 그래서 이 주제를 설명할 때는 사례 하나를 붙인 뒤 "${topic[3]}"라는 결론으로 닫으면 이해가 흐트러지지 않습니다.`
  },
  {
    id: "system",
    title: (topic) => `${topic[1]}: 시스템 관점`,
    body: (topic) => `이 내용을 하나의 시스템처럼 보면 세 축이 보입니다. 입력은 어떤 조건에서 현상이 시작되는지, 과정은 어떤 힘이 변화를 만들고 늦추는지, 결과는 우리 판단에 어떤 기준을 남기는지입니다. ${topic[2]} 결국 중요한 것은 조각난 사실을 외우는 일이 아니라 연결을 보는 일이며, 그 연결을 한 문장으로 줄이면 "${topic[3]}"입니다.`
  },
  {
    id: "everyday",
    title: (topic) => `${topic[1]}: 일상 판단 힌트`,
    body: (topic) => `일상에 적용하려면 세 가지를 나눠 보면 좋습니다. 첫째, 이 주제가 설명하는 기본 현상은 "${topic[1]}"입니다. 둘째, ${topic[2]} 셋째, 실제 판단에서는 예외와 한계를 함께 봐야 합니다. 그래야 지식을 암기한 상태에서 끝나지 않고, 비슷한 문제를 만났을 때 "${topic[3]}"라는 기준으로 스스로 설명할 수 있습니다.`
  },
  {
    id: "why-it-matters",
    title: (topic) => `${topic[1]}: 중요한 이유`,
    body: (topic) => `이 주제가 중요한 이유는 세 겹입니다. 표면에서는 익숙한 현상을 설명해 주고, 중간에서는 그 현상이 반복되는 조건을 보여 주며, 깊은 층에서는 판단의 실수를 줄이는 기준을 제공합니다. ${topic[2]} 그래서 이 개념을 말할 때는 정의, 작동 조건, 실제 적용 순서로 정리하면 좋고, 결론은 "${topic[3]}"로 압축할 수 있습니다.`
  }
];

function generatedKnowledgeCatalog(difficulty, seed) {
  const topics = KNOWLEDGE_TOPICS[difficulty] || [];
  const lenses = rotate(KNOWLEDGE_LENSES, seed);

  return topics.flatMap((topic, topicIndex) => lenses.map((lens, lensIndex) => ({
    id: `generated-knowledge-${KNOWLEDGE_GENERATION_VERSION}-${difficulty}-${topicIndex + 1}-${lens.id}`,
    topicKey: `${difficulty}-${topicIndex + 1}`,
    difficulty,
    category: topic[0],
    title: lens.title(topic),
    body: lens.body(topic),
    takeaway: topic[3],
    sources: makeSource(topic[4], topic[5]),
    sortKey: topicIndex * lenses.length + lensIndex
  })));
}

const FALLBACK_KNOWLEDGE = {
  "초급": [
    {
      category: "생활과학",
      title: "온도 관리는 맛보다 안전에 먼저 영향을 준다",
      body: "음식을 보관할 때 온도는 단순히 신선함의 문제가 아니라 안전의 문제입니다. 낮은 온도는 미생물 증식을 늦추고, 일정한 온도는 재료의 상태 변화를 줄이며, 먹기 전 재가열은 이미 늘어난 위험을 완전히 되돌리지 못할 수 있습니다. 그래서 보관은 냉장고에 넣는 행동 하나가 아니라 시간, 온도, 밀폐 상태를 함께 관리하는 과정으로 봐야 합니다.",
      takeaway: "식품 안전은 맛보다 미생물이 자라기 어려운 조건을 만드는 데서 시작됩니다.",
      sources: makeSource("FDA Food Safety", "https://www.fda.gov/food/buy-store-serve-safe-food")
    },
    {
      category: "환경",
      title: "전기를 아끼는 행동은 사용 시간보다 피크를 줄이는 데서 커진다",
      body: "전기 절약은 무조건 오래 끄는 일만 뜻하지 않습니다. 전력 수요가 몰리는 시간에는 발전과 송전 부담이 커지고, 냉난방처럼 순간 전력이 큰 기기는 작은 습관 차이도 전체 부하에 영향을 줍니다. 따라서 사용하지 않는 기기를 끄는 것, 온도를 급격히 바꾸지 않는 것, 여러 고전력 기기를 동시에 쓰지 않는 것이 함께 작동할 때 절약 효과가 커집니다.",
      takeaway: "전기 절약은 총량과 피크 사용을 함께 줄이는 습관입니다.",
      sources: []
    }
  ],
  "중급": [
    {
      category: "도시",
      title: "도시의 혼잡은 차가 많아서만 생기지 않는다",
      body: "혼잡은 차량 수만의 문제가 아니라 도로 용량, 신호 체계, 출발 시간이 한꺼번에 겹친 결과입니다. 같은 차량 수라도 이동 시간이 몰리면 병목이 커지고, 작은 사고나 불법 주정차가 흐름 전체를 늦추며, 대체 교통수단이 부족하면 선택지가 줄어 혼잡이 더 오래 갑니다. 그래서 교통 문제는 도로를 넓히는 질문보다 수요를 분산하고 선택권을 늘리는 질문으로 봐야 합니다.",
      takeaway: "교통 혼잡은 차량 수보다 흐름과 선택권의 문제에 가깝습니다.",
      sources: []
    },
    {
      category: "AI",
      title: "AI 결과물은 정답보다 검토 가능한 초안에 가깝다",
      body: "AI가 만든 문장이나 요약은 빠르지만 그 자체로 검증이 끝난 결과는 아닙니다. 첫째, 모델은 학습한 패턴을 바탕으로 그럴듯한 답을 만들 수 있고, 둘째, 출처나 최신 사실을 자동으로 확인하지 못하는 경우가 있으며, 셋째, 사용자의 질문 방식에 따라 강조점이 크게 달라집니다. 따라서 좋은 사용법은 결과를 그대로 믿는 것이 아니라 초안을 받은 뒤 근거와 맥락을 다시 확인하는 것입니다.",
      takeaway: "AI는 사고를 대체하는 정답기보다 검토해야 할 초안을 빠르게 만드는 도구입니다.",
      sources: makeSource("NIST AI RMF", "https://www.nist.gov/itl/ai-risk-management-framework")
    }
  ],
  "고급": [
    {
      category: "시장",
      title: "가격은 정보이지만 언제나 충분한 설명은 아니다",
      body: "시장에서 가격은 수요와 공급의 압축된 신호지만, 그 신호만으로 모든 것을 설명하기는 어렵습니다. 유동성이 낮으면 소수 거래가 가격을 크게 움직일 수 있고, 기대가 과열되면 현재 가치보다 미래 서사가 더 크게 반영되며, 규제나 세금처럼 거래 밖 조건도 가격을 바꿉니다. 그래서 가격을 볼 때는 숫자 하나보다 거래량, 참여자 심리, 제도 환경을 함께 읽어야 합니다.",
      takeaway: "가격은 중요한 신호이지만 거래 구조와 제도 조건을 함께 봐야 해석이 완성됩니다.",
      sources: []
    },
    {
      category: "인지과학",
      title: "전문성은 많이 아는 상태보다 빠르게 구분하는 능력에 가깝다",
      body: "전문가는 정보를 더 많이 외운 사람이라기보다 중요한 차이를 빨리 구분하는 사람에 가깝습니다. 초보자는 표면적 특징을 넓게 보지만, 숙련자는 어떤 단서가 결과를 바꾸는지 알고, 불필요한 정보를 과감히 버리며, 예외 상황에서 자신의 판단을 점검합니다. 그래서 학습의 핵심은 양을 늘리는 것만이 아니라 비교, 설명, 피드백을 통해 구분 능력을 키우는 데 있습니다.",
      takeaway: "전문성은 지식의 양보다 중요한 차이를 알아보는 판단력에서 드러납니다.",
      sources: []
    }
  ]
};

function fallbackKnowledge(date, difficulty, index) {
  const items = FALLBACK_KNOWLEDGE[difficulty] || FALLBACK_KNOWLEDGE["초급"];
  const item = items[Math.abs(dateSeed(date) + index) % items.length];
  return {
    id: `generated-knowledge-${KNOWLEDGE_GENERATION_VERSION}-${date}-${difficulty}-fallback-${index + 1}`,
    topicKey: `${difficulty}-fallback-${index + 1}`,
    difficulty,
    category: item.category,
    title: `${item.title}: ${date.slice(5).replace("-", ".")} 관점`,
    body: item.body,
    takeaway: item.takeaway,
    sources: item.sources || []
  };
}

function makeGeneratedKnowledge(date, quota, usedKeys) {
  const picked = [];
  const pickedKeys = new Set();
  const seed = dateSeed(date);

  DIFFICULTIES.forEach((difficulty, difficultyIndex) => {
    const candidates = rotate(
      generatedKnowledgeCatalog(difficulty, seed + difficultyIndex * 17),
      seed + difficultyIndex * 19
    );
    const pickedTopicKeys = new Set();
    const pickedCategories = new Set();
    let count = 0;

    for (const item of candidates) {
      const keys = [item.id, item.title].map(normalizeKey).filter(Boolean);
      if (pickedTopicKeys.has(item.topicKey)) continue;
      if (pickedCategories.has(item.category)) continue;
      if (keys.some((key) => usedKeys.has(key) || pickedKeys.has(key))) continue;
      picked.push(item);
      pickedTopicKeys.add(item.topicKey);
      pickedCategories.add(item.category);
      keys.forEach((key) => pickedKeys.add(key));
      count += 1;
      if (count >= quota[difficulty]) break;
    }

    for (const item of candidates) {
      if (count >= quota[difficulty]) break;
      const keys = [item.id, item.title].map(normalizeKey).filter(Boolean);
      if (pickedTopicKeys.has(item.topicKey)) continue;
      if (keys.some((key) => usedKeys.has(key) || pickedKeys.has(key))) continue;
      picked.push(item);
      pickedTopicKeys.add(item.topicKey);
      pickedCategories.add(item.category);
      keys.forEach((key) => pickedKeys.add(key));
      count += 1;
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

const SPEAKING_GENERATION_VERSION = "generated-speaking-v3";

const SPEAKING_TOPIC_ORDER = ["부동산", "자동차 산업", "AI", "부동산 + AI", "자동차 + AI", "AI + 산업"];

function speakingTopicForDate(date) {
  const dayIndex = Math.floor(Date.parse(date + "T00:00:00Z") / 86400000);
  return SPEAKING_TOPIC_ORDER[Math.abs(dayIndex) % SPEAKING_TOPIC_ORDER.length];
}

const SPEAKING_THEMES = [
  {
    id: "location-access",
    topic: "부동산",
    titleKo: "좋은 입지는 거리보다 시간과 선택권으로 결정된다",
    titleEn: "A good location is about time and options, not just distance",
    leadKo: "부동산에서 입지는 가까운가 먼가의 문제가 아니라 생활을 얼마나 덜 소모하게 만드는가의 문제입니다.",
    pointsKo: [
      "첫째, 지도상 거리가 가까워도 환승이 불편하거나 출퇴근 시간이 흔들리면 실제 접근성은 낮아집니다.",
      "둘째, 병원, 학교, 장보기, 산책 공간처럼 자주 쓰는 생활 인프라가 가까우면 집의 만족도와 시간 효율이 함께 올라갑니다.",
      "셋째, 좋은 입지는 특정 직장 하나에만 기대지 않고 여러 이동 선택지를 제공하기 때문에 미래 변화에도 버티는 힘이 있습니다."
    ],
    closeKo: "그래서 입지를 설명할 때는 역세권 같은 단어 하나보다 이동 시간, 생활 인프라, 대체 선택권을 함께 말해야 합니다.",
    leadEn: "In real estate, location is not only about physical distance. It is about how much time and energy a place saves in daily life.",
    pointsEn: [
      "First, a short distance on the map can still feel far if transfers are difficult or commute times are unstable.",
      "Second, everyday infrastructure such as clinics, schools, grocery stores, and walkable streets raises both convenience and satisfaction.",
      "Third, a resilient location gives people more than one mobility option, so it is less dependent on one job, one road, or one train line."
    ],
    closeEn: "That is why a good one-minute explanation should describe travel time, daily infrastructure, and alternative choices rather than using only a simple label.",
    point: "좋은 입지는 가까운 곳이 아니라 시간을 아끼고 선택권을 넓히는 곳입니다.",
    sources: makeSource("CFPB Owning a Home", "https://www.consumerfinance.gov/owning-a-home/")
  },
  {
    id: "housing-rate",
    topic: "부동산",
    titleKo: "금리는 집값보다 먼저 구매 가능성을 바꾼다",
    titleEn: "Interest rates change affordability before they change home prices",
    leadKo: "집을 살 수 있는지는 집값만으로 결정되지 않습니다. 같은 가격이라도 금리가 달라지면 매달 감당해야 할 비용이 크게 바뀝니다.",
    pointsKo: [
      "첫째, 대출 이자가 오르면 같은 소득으로 빌릴 수 있는 금액이 줄어 실수요자의 선택지가 좁아집니다.",
      "둘째, 매수자가 줄어도 매도자는 바로 가격을 낮추지 않을 수 있어 거래량이 먼저 줄고 가격은 늦게 반응할 때가 많습니다.",
      "셋째, 전세와 월세 시장도 금리의 영향을 받기 때문에 주거비 부담은 매매 시장 밖에서도 함께 움직입니다."
    ],
    closeKo: "따라서 부동산 시장을 설명할 때는 가격, 대출 가능액, 월 부담액을 한 묶음으로 봐야 현실적인 판단이 됩니다.",
    leadEn: "Whether someone can buy a home is not decided by the listing price alone. Monthly payment changes sharply when interest rates move.",
    pointsEn: [
      "First, higher borrowing costs reduce the amount a household can borrow with the same income.",
      "Second, transaction volume may fall before prices adjust, because sellers do not always cut prices immediately.",
      "Third, rent and deposit markets are also affected by interest rates, so housing costs move beyond the purchase market."
    ],
    closeEn: "A practical explanation of real estate should connect price, borrowing capacity, and monthly payment instead of treating them separately.",
    point: "금리는 집값의 방향보다 먼저 사람들이 실제로 감당할 수 있는 범위를 바꿉니다.",
    sources: makeSource("CFPB Owning a Home", "https://www.consumerfinance.gov/owning-a-home/")
  },
  {
    id: "neighborhood-cycle",
    topic: "부동산",
    titleKo: "동네의 가치는 건물보다 생활 패턴이 먼저 바꾼다",
    titleEn: "Neighborhood value changes through daily patterns before buildings",
    leadKo: "동네의 변화는 새 건물이 들어서는 순간에만 생기지 않습니다. 사람들이 어디서 걷고, 소비하고, 머무는지가 먼저 분위기를 바꿉니다.",
    pointsKo: [
      "첫째, 유동 인구가 늘면 작은 상권이 생기고 그 상권은 다시 방문 이유를 늘립니다.",
      "둘째, 교통이나 공공시설 개선은 생활 반경을 바꾸기 때문에 기존 주거지의 평가를 새롭게 만듭니다.",
      "셋째, 변화가 빠른 동네일수록 임대료 상승과 기존 주민 부담 같은 부작용도 함께 살펴야 합니다."
    ],
    closeKo: "그래서 동네 가치를 말할 때는 개발 호재 하나보다 사람의 이동, 소비, 체류 시간이 어떻게 바뀌는지를 봐야 합니다.",
    leadEn: "A neighborhood does not change only when new buildings appear. It changes when people walk, spend time, and spend money differently.",
    pointsEn: [
      "First, more foot traffic can create small businesses, and those businesses create more reasons to visit.",
      "Second, transit and public facilities reshape daily travel patterns, so existing housing can be revalued.",
      "Third, fast improvement can also bring pressure, such as rising rents and displacement risk."
    ],
    closeEn: "So the better explanation is not just about a development project. It is about movement, spending, and time spent in the neighborhood.",
    point: "동네의 가치는 건물 자체보다 사람이 머무는 방식이 바뀔 때 먼저 움직입니다.",
    sources: []
  },
  {
    id: "sdv",
    topic: "자동차 산업",
    titleKo: "자동차는 기계에서 소프트웨어 플랫폼으로 이동하고 있다",
    titleEn: "Cars are moving from machines to software platforms",
    leadKo: "자동차 산업의 큰 변화는 엔진 종류만 바뀌는 데서 끝나지 않습니다. 차 안의 기능이 소프트웨어로 제어되면서 자동차의 가치 계산법도 달라지고 있습니다.",
    pointsKo: [
      "첫째, 운전자 보조, 인포테인먼트, 배터리 관리 같은 기능이 업데이트를 통해 개선될 수 있습니다.",
      "둘째, 제조사는 판매 이후에도 구독 서비스, 데이터 기반 정비, 기능 추가로 고객 관계를 이어갈 수 있습니다.",
      "셋째, 반대로 보안, 개인정보, 장기 업데이트 책임이 커져 자동차 회사가 기술 회사처럼 운영되어야 합니다."
    ],
    closeKo: "따라서 자동차를 설명할 때는 이제 마력과 연비뿐 아니라 운영체제, 데이터, 업데이트 전략까지 함께 봐야 합니다.",
    leadEn: "The shift in the auto industry is not only about engines. As more functions are controlled by software, the way a car creates value is changing.",
    pointsEn: [
      "First, driver assistance, infotainment, and battery management can improve through updates.",
      "Second, automakers can maintain customer relationships after the sale through subscriptions, data-based maintenance, and new features.",
      "Third, security, privacy, and long-term update responsibility become much more important."
    ],
    closeEn: "A modern car should be explained through software, data, and update strategy as well as horsepower and fuel efficiency.",
    point: "자동차의 경쟁력은 하드웨어 성능뿐 아니라 판매 이후에도 개선되는 소프트웨어 능력에서 커집니다.",
    sources: makeSource("NHTSA Vehicle Safety Technology", "https://www.nhtsa.gov/technology-innovation/vehicle-safety-technology")
  },
  {
    id: "ev-infrastructure",
    topic: "자동차 산업",
    titleKo: "전기차 확산은 차보다 충전 경험의 문제로 넘어간다",
    titleEn: "EV adoption increasingly depends on the charging experience",
    leadKo: "전기차를 살지 말지의 판단은 주행거리만으로 정해지지 않습니다. 실제 사용자는 충전 장소, 속도, 결제 편의성, 대기 시간을 함께 경험합니다.",
    pointsKo: [
      "첫째, 집이나 직장에서 안정적으로 충전할 수 있으면 전기차의 불편이 크게 줄어듭니다.",
      "둘째, 장거리 이동에서는 충전소 위치보다 충전기가 실제로 작동하는지와 대기 시간이 더 중요해집니다.",
      "셋째, 충전 인프라는 전력망, 주차장, 상업시설과 연결되기 때문에 자동차 산업 밖의 사업자도 경쟁에 들어옵니다."
    ],
    closeKo: "그래서 전기차 시장은 좋은 차를 만드는 경쟁에서 끊기지 않는 충전 경험을 설계하는 경쟁으로 확장되고 있습니다.",
    leadEn: "The decision to buy an EV is not based only on driving range. Users experience charging location, speed, payment, and waiting time together.",
    pointsEn: [
      "First, reliable charging at home or work removes much of the friction.",
      "Second, for long trips, charger uptime and waiting time can matter more than the simple number of stations.",
      "Third, charging infrastructure connects cars with power grids, parking, and retail locations."
    ],
    closeEn: "EV competition is expanding from making better cars to designing a reliable charging experience.",
    point: "전기차 확산의 다음 관문은 차량 스펙이 아니라 충전 경험의 신뢰성입니다.",
    sources: makeSource("U.S. DOE Electric Vehicles", "https://www.energy.gov/eere/electricvehicles/electric-vehicles")
  },
  {
    id: "auto-supply-chain",
    topic: "자동차 산업",
    titleKo: "자동차 공급망은 효율보다 회복력을 더 중시하게 됐다",
    titleEn: "Auto supply chains now value resilience as much as efficiency",
    leadKo: "자동차는 수많은 부품이 정해진 시간에 모여야 완성되는 산업입니다. 그래서 작은 부품 하나의 부족도 생산 전체를 멈출 수 있습니다.",
    pointsKo: [
      "첫째, 반도체와 배터리처럼 핵심 부품의 공급 안정성은 자동차 회사의 생산 계획을 좌우합니다.",
      "둘째, 비용을 줄이기 위해 재고를 최소화하면 평상시에는 효율적이지만 충격이 왔을 때 취약해질 수 있습니다.",
      "셋째, 지역별 생산, 복수 공급처, 핵심 부품 내재화는 비용이 들더라도 리스크를 줄이는 전략이 됩니다."
    ],
    closeKo: "따라서 자동차 산업을 볼 때는 판매량만이 아니라 부품 조달 구조와 위기 대응 능력도 함께 봐야 합니다.",
    leadEn: "A car is built only when thousands of parts arrive at the right time. A shortage of one small component can stop an entire production line.",
    pointsEn: [
      "First, stable supply of chips, batteries, and other key parts shapes production plans.",
      "Second, very lean inventory is efficient in normal times but fragile during shocks.",
      "Third, regional production, multiple suppliers, and internal control of key parts can reduce risk."
    ],
    closeEn: "The auto industry should be understood through supply structure and resilience, not only through sales volume.",
    point: "자동차 회사의 힘은 얼마나 많이 파느냐뿐 아니라 공급 충격을 얼마나 버티느냐에서도 드러납니다.",
    sources: []
  },
  {
    id: "ai-data-quality",
    topic: "AI",
    titleKo: "AI의 품질은 모델보다 데이터와 평가에서 갈린다",
    titleEn: "AI quality depends on data and evaluation, not only the model",
    leadKo: "AI를 이야기할 때 모델 이름이나 크기만 보기는 쉽습니다. 하지만 실제 품질은 어떤 데이터로 만들고 어떻게 평가하는지에서 크게 갈립니다.",
    pointsKo: [
      "첫째, 데이터가 한쪽으로 치우치면 모델의 답도 특정 방향으로 기울 수 있습니다.",
      "둘째, 평가 기준이 모호하면 좋아 보이는 답과 실제로 유용한 답을 구분하기 어렵습니다.",
      "셋째, 업무에 쓰려면 정확도뿐 아니라 설명 가능성, 보안, 반복 사용 시 안정성까지 확인해야 합니다."
    ],
    closeKo: "그래서 AI 도입을 설명할 때는 어떤 모델인가보다 무엇으로 검증했고 어떤 실패를 막을 것인가를 함께 말해야 합니다.",
    leadEn: "It is easy to focus on model names or model size. In practice, quality depends heavily on data and evaluation.",
    pointsEn: [
      "First, biased data can push model outputs in a biased direction.",
      "Second, vague evaluation makes it hard to separate answers that look good from answers that are actually useful.",
      "Third, real work requires checks for explainability, security, and stability over repeated use."
    ],
    closeEn: "A strong AI explanation should cover how the system is tested and what failures it is designed to prevent.",
    point: "AI의 실력은 모델 자체보다 데이터 품질과 평가 기준이 함께 만들습니다.",
    sources: makeSource("NIST AI RMF", "https://www.nist.gov/itl/ai-risk-management-framework")
  },
  {
    id: "ai-workflow",
    topic: "AI",
    titleKo: "AI 자동화는 일을 없애기보다 일의 순서를 바꾼다",
    titleEn: "AI automation changes the order of work before it removes work",
    leadKo: "AI 자동화를 두고 일자리가 바로 사라진다고만 보면 변화의 핵심을 놓칠 수 있습니다. 먼저 바뀌는 것은 사람이 하는 일의 순서와 역할입니다.",
    pointsKo: [
      "첫째, 자료 수집, 초안 작성, 분류처럼 반복적이고 시간이 오래 걸리는 단계가 빨라집니다.",
      "둘째, 사람은 결과를 검토하고 맥락을 판단하며 예외 상황을 처리하는 쪽으로 이동합니다.",
      "셋째, 조직은 업무를 AI에게 맡길 부분과 사람이 책임질 부분을 명확히 나누어야 품질을 유지할 수 있습니다."
    ],
    closeKo: "따라서 AI 자동화의 핵심 질문은 사람을 대체하느냐가 아니라 어떤 단계에서 사람의 판단을 더 가치 있게 쓸 것인가입니다.",
    leadEn: "AI automation is often described as job replacement, but the first change is usually the order of work.",
    pointsEn: [
      "First, repetitive steps such as gathering information, drafting, and classification become faster.",
      "Second, people move toward reviewing outputs, judging context, and handling exceptions.",
      "Third, organizations need clear boundaries between what AI handles and what humans remain responsible for."
    ],
    closeEn: "The central question is not only whether AI replaces people, but where human judgment becomes more valuable.",
    point: "AI 자동화는 사람의 역할을 없애기 전에 반복 작업과 판단 작업의 위치를 다시 배치합니다.",
    sources: []
  },
  {
    id: "ai-agent",
    topic: "AI",
    titleKo: "AI 에이전트는 답변보다 실행 관리가 더 중요하다",
    titleEn: "AI agents need execution control more than better answers",
    leadKo: "AI 에이전트는 질문에 답하는 도구를 넘어 여러 단계를 스스로 진행하는 도구를 뜻합니다. 그래서 좋은 답변 능력만으로는 충분하지 않습니다.",
    pointsKo: [
      "첫째, 에이전트는 검색, 작성, 저장, 실행 같은 행동을 이어 붙이기 때문에 실수의 영향 범위가 커질 수 있습니다.",
      "둘째, 목표가 모호하면 빠르게 움직일수록 잘못된 방향으로 많은 일을 처리할 위험이 있습니다.",
      "셋째, 권한, 중간 확인, 로그 기록을 설계해야 사람이 결과를 추적하고 멈출 수 있습니다."
    ],
    closeKo: "결국 에이전트의 핵심은 똑똑한 답변보다 안전하게 실행하고 검토 가능한 과정을 남기는 능력입니다.",
    leadEn: "An AI agent goes beyond answering a question. It can move through multiple steps and take actions, so answer quality alone is not enough.",
    pointsEn: [
      "First, agents combine actions such as searching, writing, saving, and executing, which can expand the impact of mistakes.",
      "Second, if the goal is vague, faster execution can simply create more wrong work.",
      "Third, permissions, checkpoints, and logs are needed so people can track and stop the process."
    ],
    closeEn: "The key value of agents is not only intelligence. It is safe execution with a process that can be reviewed.",
    point: "AI 에이전트는 답을 잘하는 도구가 아니라 실행 과정을 통제할 수 있어야 쓸모가 커집니다.",
    sources: makeSource("NIST AI RMF", "https://www.nist.gov/itl/ai-risk-management-framework")
  },
  {
    id: "real-estate-ai-valuation",
    topic: "부동산 + AI",
    titleKo: "AI 부동산 평가는 가격을 맞히기보다 비교 기준을 넓힌다",
    titleEn: "AI property valuation expands comparison, not just prediction",
    leadKo: "AI로 부동산 가격을 평가한다는 말은 단순히 미래 가격을 맞힌다는 뜻이 아닙니다. 더 많은 비교 기준을 빠르게 정리한다는 의미에 가깝습니다.",
    pointsKo: [
      "첫째, 거래 사례, 면적, 연식, 교통, 학군 같은 변수를 함께 보며 사람이 놓치기 쉬운 패턴을 찾을 수 있습니다.",
      "둘째, 하지만 수리 상태, 층별 체감, 조망, 소음처럼 현장성이 강한 요소는 데이터만으로 정확히 반영하기 어렵습니다.",
      "셋째, 따라서 AI 평가는 최종 판단이 아니라 후보를 좁히고 질문을 만드는 도구로 쓰는 편이 안전합니다."
    ],
    closeKo: "좋은 설명은 AI가 가격을 맞힌다가 아니라, 비교 범위를 넓히고 사람이 확인할 지점을 선명하게 만든다고 말하는 것입니다.",
    leadEn: "AI property valuation is not simply about predicting the future price. It is about organizing more comparison points faster.",
    pointsEn: [
      "First, AI can compare transactions, size, age, transit, and school access to find patterns people may miss.",
      "Second, physical condition, floor experience, view, and noise are difficult to capture fully in data.",
      "Third, AI valuation is safer as a tool for narrowing options and creating better questions."
    ],
    closeEn: "The better explanation is that AI expands comparison and clarifies what people should verify.",
    point: "AI 부동산 평가는 결론을 대신 내리기보다 비교와 검증의 출발점을 넓혀 줍니다.",
    sources: makeSource("NIST AI RMF", "https://www.nist.gov/itl/ai-risk-management-framework")
  },
  {
    id: "real-estate-ai-maintenance",
    topic: "부동산 + AI",
    titleKo: "AI 건물 관리는 고장 후 수리에서 고장 전 관리로 이동한다",
    titleEn: "AI building management shifts maintenance from repair to prevention",
    leadKo: "건물 관리는 문제가 생긴 뒤 고치는 일로만 보이기 쉽습니다. 하지만 센서와 AI가 결합되면 고장이 나기 전 징후를 읽는 관리로 바뀔 수 있습니다.",
    pointsKo: [
      "첫째, 전력 사용, 온도, 진동, 출입 패턴 같은 데이터는 설비 이상을 일찍 발견하는 단서가 됩니다.",
      "둘째, 예방 정비는 갑작스러운 중단을 줄이고 입주자의 불편과 운영 비용을 낮출 수 있습니다.",
      "셋째, 개인정보와 보안 문제가 생길 수 있으므로 어떤 데이터를 모으고 누가 볼 수 있는지 기준이 필요합니다."
    ],
    closeKo: "따라서 AI 건물 관리는 비용 절감 기술이면서 동시에 신뢰와 데이터 거버넌스를 요구하는 운영 방식입니다.",
    leadEn: "Building management is often seen as fixing problems after they appear. With sensors and AI, it can shift toward detecting signs before failure.",
    pointsEn: [
      "First, data from energy use, temperature, vibration, and access patterns can reveal early warnings.",
      "Second, preventive maintenance can reduce downtime, tenant inconvenience, and operating costs.",
      "Third, privacy and security rules are needed because building data can be sensitive."
    ],
    closeEn: "AI building management is both a cost tool and an operating model that requires trust and data governance.",
    point: "AI 건물 관리는 고장을 잘 고치는 능력보다 고장 전 신호를 읽는 능력으로 가치가 커집니다.",
    sources: []
  },
  {
    id: "auto-ai-maintenance",
    topic: "자동차 + AI",
    titleKo: "AI 정비는 운전 습관과 부품 상태를 함께 읽는다",
    titleEn: "AI maintenance reads driving habits and component condition together",
    leadKo: "자동차 정비는 정해진 주기에 맞춰 부품을 바꾸는 방식에서 데이터 기반 관리로 이동하고 있습니다.",
    pointsKo: [
      "첫째, 같은 주행거리라도 급가속, 도심 정체, 기온, 적재량에 따라 부품 마모 속도는 달라집니다.",
      "둘째, 차량 센서 데이터는 이상 신호를 조기에 발견해 큰 고장을 막는 데 도움을 줄 수 있습니다.",
      "셋째, 운전자에게 필요한 것은 복잡한 데이터가 아니라 언제, 왜 점검해야 하는지 이해할 수 있는 알림입니다."
    ],
    closeKo: "AI 정비의 가치는 정비소를 줄이는 데만 있는 것이 아니라 운전자가 더 예측 가능한 관리 결정을 하게 만드는 데 있습니다.",
    leadEn: "Vehicle maintenance is moving from fixed schedules toward data-based management.",
    pointsEn: [
      "First, the same mileage can create different wear depending on acceleration, traffic, temperature, and load.",
      "Second, sensor data can identify warning signs before they become major failures.",
      "Third, drivers need clear alerts that explain when and why inspection is needed, not raw data."
    ],
    closeEn: "The value of AI maintenance is helping drivers make more predictable decisions.",
    point: "AI 정비는 주행거리 하나보다 운전 조건과 부품 신호를 함께 읽을 때 강해집니다.",
    sources: makeSource("NHTSA Vehicle Safety Technology", "https://www.nhtsa.gov/technology-innovation/vehicle-safety-technology")
  },
  {
    id: "auto-ai-safety",
    topic: "자동차 + AI",
    titleKo: "자율주행의 핵심은 완전 자동보다 예외 상황 처리다",
    titleEn: "Autonomous driving depends on handling edge cases, not only automation",
    leadKo: "자율주행을 설명할 때 완전히 사람이 필요 없는 차를 먼저 떠올리기 쉽습니다. 하지만 기술의 핵심 난점은 드문 예외 상황을 안전하게 처리하는 데 있습니다.",
    pointsKo: [
      "첫째, 평범한 차선 유지와 속도 조절은 비교적 예측 가능하지만 공사 구간, 악천후, 갑작스러운 보행자는 훨씬 어렵습니다.",
      "둘째, 센서와 AI 판단이 틀릴 수 있으므로 시스템은 실패 가능성을 전제로 설계되어야 합니다.",
      "셋째, 책임과 규칙이 분명해야 사고가 났을 때 기술, 운전자, 제조사의 역할을 판단할 수 있습니다."
    ],
    closeKo: "그래서 자율주행은 자동화 수준보다 예외를 만나도 안전하게 멈추고 설명할 수 있는지가 중요합니다.",
    leadEn: "Autonomous driving is often imagined as a car that needs no person. The harder problem is handling rare edge cases safely.",
    pointsEn: [
      "First, lane keeping and speed control are more predictable than construction zones, bad weather, or sudden pedestrians.",
      "Second, sensors and AI decisions can fail, so the system must be designed with failure in mind.",
      "Third, clear rules are needed to define responsibility among technology, drivers, and manufacturers."
    ],
    closeEn: "The key question is whether the system can stop safely and explain its behavior when exceptions appear.",
    point: "자율주행의 실력은 평범한 도로보다 예외 상황에서 안전하게 실패하는 능력에서 드러납니다.",
    sources: makeSource("NHTSA Automated Vehicles", "https://www.nhtsa.gov/technology-innovation/automated-vehicles-safety")
  },
  {
    id: "ai-industry-productivity",
    topic: "AI + 산업",
    titleKo: "산업 AI는 화려한 답변보다 병목을 줄일 때 돈이 된다",
    titleEn: "Industrial AI creates value when it reduces bottlenecks",
    leadKo: "산업 현장에서 AI의 가치는 멋진 대화 능력보다 병목을 줄이는 데서 더 분명하게 나타납니다.",
    pointsKo: [
      "첫째, 생산, 물류, 고객 응대 중 어디에서 시간이 가장 많이 막히는지 알아야 AI 적용 지점이 보입니다.",
      "둘째, 작은 자동화라도 반복 횟수가 많고 오류 비용이 큰 단계라면 효과가 빠르게 커질 수 있습니다.",
      "셋째, 현장 데이터가 정리되어 있지 않으면 좋은 모델을 가져와도 실제 개선으로 이어지기 어렵습니다."
    ],
    closeKo: "따라서 산업 AI는 기술 도입 이야기가 아니라 병목 정의, 데이터 정리, 성과 측정을 함께 설계하는 운영 문제입니다.",
    leadEn: "In industry, AI value is clearer when it reduces bottlenecks rather than when it produces impressive text.",
    pointsEn: [
      "First, the right use case appears when a company knows where time is blocked in production, logistics, or customer service.",
      "Second, even small automation can have large value when the task repeats often and errors are costly.",
      "Third, if operational data is messy, a strong model may not create real improvement."
    ],
    closeEn: "Industrial AI is an operating problem that connects bottleneck definition, data readiness, and performance measurement.",
    point: "산업 AI는 가장 막힌 단계를 정확히 줄일 때 실제 생산성이 됩니다.",
    sources: makeSource("NIST AI RMF", "https://www.nist.gov/itl/ai-risk-management-framework")
  },
  {
    id: "ai-industry-trust",
    topic: "AI + 산업",
    titleKo: "AI 도입의 속도는 기술보다 신뢰 설계가 정한다",
    titleEn: "AI adoption speed depends on trust design",
    leadKo: "기업이 AI를 도입할 때 기술이 가능하다는 사실만으로 충분하지 않습니다. 사람들이 그 결과를 믿고 사용할 수 있어야 실제 업무가 바뀝니다.",
    pointsKo: [
      "첫째, 사용자는 AI가 왜 그런 추천을 했는지 최소한의 근거를 이해해야 합니다.",
      "둘째, 틀렸을 때 누가 확인하고 어떻게 수정할지 정해져 있어야 현장에서 불안이 줄어듭니다.",
      "셋째, 성과 지표가 없으면 AI가 편해 보이는지와 실제로 좋아졌는지를 구분하기 어렵습니다."
    ],
    closeKo: "그래서 AI 도입은 모델 선택만이 아니라 설명, 책임, 측정 기준을 함께 만드는 신뢰 설계입니다.",
    leadEn: "When companies adopt AI, technical possibility is not enough. People need to trust the output enough to use it in real work.",
    pointsEn: [
      "First, users need at least a basic reason for the recommendation.",
      "Second, teams need a process for checking and correcting wrong outputs.",
      "Third, without metrics, it is hard to know whether AI only feels convenient or actually improves performance."
    ],
    closeEn: "AI adoption is a trust design problem that includes explanation, responsibility, and measurement.",
    point: "AI 도입의 성공은 모델 성능뿐 아니라 사람이 믿고 고칠 수 있는 구조에서 결정됩니다.",
    sources: makeSource("NIST AI RMF", "https://www.nist.gov/itl/ai-risk-management-framework")
  }
];

const SPEAKING_LENSES = [
  {
    id: "core",
    titleKo: (theme) => theme.titleKo,
    titleEn: (theme) => theme.titleEn,
    bodyKo: (theme) => `${theme.leadKo} ${theme.pointsKo.join(" ")} ${theme.closeKo}`,
    bodyEn: (theme) => `${theme.leadEn} ${theme.pointsEn.join(" ")} ${theme.closeEn}`
  },
  {
    id: "tradeoff",
    titleKo: (theme) => `${theme.titleKo}: 기회와 부담`,
    titleEn: (theme) => `${theme.titleEn}: opportunity and burden`,
    bodyKo: (theme) => `${theme.leadKo} 기회는 분명합니다. ${theme.pointsKo[0]} 하지만 부담도 같이 봐야 합니다. ${theme.pointsKo[1]} 마지막 판단 기준은 실행 가능성입니다. ${theme.pointsKo[2]} ${theme.closeKo}`,
    bodyEn: (theme) => `${theme.leadEn} The opportunity is clear. ${theme.pointsEn[0]} But the burden matters too. ${theme.pointsEn[1]} The final test is practical execution. ${theme.pointsEn[2]} ${theme.closeEn}`
  },
  {
    id: "explain",
    titleKo: (theme) => `${theme.titleKo}: 1분 설명용 정리`,
    titleEn: (theme) => `${theme.titleEn}: a one-minute explanation`,
    bodyKo: (theme) => `이 주제는 세 단계로 말하면 이해하기 쉽습니다. 배경은 이것입니다. ${theme.leadKo} 변화의 이유는 ${theme.pointsKo[0]} 영향은 ${theme.pointsKo[1]} 그래서 판단할 때 남겨야 할 기준은 ${theme.pointsKo[2]} ${theme.closeKo}`,
    bodyEn: (theme) => `This topic is easy to explain in three steps. The background is simple: ${theme.leadEn} The reason for change is this: ${theme.pointsEn[0]} The impact is this: ${theme.pointsEn[1]} The judgment standard is this: ${theme.pointsEn[2]} ${theme.closeEn}`
  }
];

function enrichSpeakingBodyKo(body, theme) {
  return `${body} 1분 동안 설명할 때는 이 내용을 외우려 하기보다 흐름으로 잡는 편이 좋습니다. 먼저 왜 이 주제가 중요해졌는지 배경을 말하고, 그다음 ${theme.pointsKo[0].replace(/^첫째,\s*/, "")} 이어서 ${theme.pointsKo[1].replace(/^둘째,\s*/, "")} 마지막으로 ${theme.pointsKo[2].replace(/^셋째,\s*/, "")} 이렇게 말하면 단순한 정보 나열이 아니라 원인, 영향, 판단 기준이 이어지는 설명이 됩니다.`;
}

function enrichSpeakingBodyEn(body, theme) {
  return `${body} For a one-minute explanation, do not try to memorize every detail. Start with why the topic matters, then connect the cause, the impact, and the judgment standard. In this case, the useful flow is: ${theme.pointsEn[0].replace(/^First,\s*/, "")} Then add: ${theme.pointsEn[1].replace(/^Second,\s*/, "")} Finally, close with: ${theme.pointsEn[2].replace(/^Third,\s*/, "")} That structure turns the topic into a clear explanation instead of a list of facts.`;
}

function makeGeneratedSpeakingArticle(date, usedKeys = new Set()) {
  const seed = dateSeed(date);
  const targetTopic = speakingTopicForDate(date);
  const byTopic = rotate(SPEAKING_THEMES.filter((theme) => theme.topic === targetTopic), seed);
  const allThemes = rotate(SPEAKING_THEMES, seed);
  const candidates = byTopic.length ? byTopic.concat(allThemes) : allThemes;
  const lenses = rotate(SPEAKING_LENSES, seed);

  for (const theme of candidates) {
    for (const lens of lenses) {
      const titleKo = lens.titleKo(theme);
      const titleEn = lens.titleEn(theme);
      const keys = [theme.id, titleKo, titleEn].map(normalizeKey).filter(Boolean);
      if (keys.some((key) => usedKeys.has(key))) continue;
      return {
        id: `speaking-${SPEAKING_GENERATION_VERSION}-${date}-${theme.id}-${lens.id}`,
        topic: theme.topic,
        titleKo,
        bodyKo: enrichSpeakingBodyKo(lens.bodyKo(theme), theme),
        titleEn,
        bodyEn: enrichSpeakingBodyEn(lens.bodyEn(theme), theme),
        point: theme.point,
        steps: [
          "배경: 이 주제가 왜 지금 중요해졌는지 한 문장으로 말하기",
          "핵심: 원인, 영향, 한계를 각각 짧게 연결하기",
          "판단: 내가 기억할 기준이나 적용 사례로 마무리하기"
        ],
        questions: [
          "이 주제에서 사람들이 가장 쉽게 오해하는 부분은 무엇일까?",
          "내 생활이나 일과 연결하면 어떤 예시로 설명할 수 있을까?"
        ],
        sources: theme.sources || []
      };
    }
  }

  const theme = candidates[0] || SPEAKING_THEMES[0];
  const lens = lenses[0] || SPEAKING_LENSES[0];
  return {
    id: `speaking-${SPEAKING_GENERATION_VERSION}-${date}-${theme.id}-${lens.id}-refresh`,
    topic: theme.topic,
    titleKo: `${lens.titleKo(theme)} (${date.slice(5).replace("-", ".")} 관점)`,
    bodyKo: enrichSpeakingBodyKo(lens.bodyKo(theme), theme),
    titleEn: `${lens.titleEn(theme)} (${date.slice(5).replace("-", ".")} view)`,
    bodyEn: enrichSpeakingBodyEn(lens.bodyEn(theme), theme),
    point: theme.point,
    steps: [
      "배경을 한 문장으로 정리하기",
      "핵심 근거 세 가지를 순서대로 말하기",
      "내 예시나 판단 기준으로 끝내기"
    ],
    questions: [
      "이 설명을 더 구체적으로 만들 사례는 무엇일까?",
      "반대 관점에서 보면 어떤 한계가 있을까?"
    ],
    sources: theme.sources || []
  };
}

const CARE_GENERATION_VERSION = "relationship-variety-v2";

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

const CARE_MORE_ITEMS = [
  {
    id: "rest-protection",
    label: "휴식",
    title: "상대가 쉬는 시간을 죄책감 없이 지켜주기",
    action: "피곤해 보이는 날에는 더 오래 붙잡기보다 '오늘은 푹 쉬어, 내일 얘기해도 좋아'처럼 쉬어도 관계가 안전하다는 신호를 주세요.",
    why: "사랑은 계속 반응하게 만드는 것이 아니라 안심하고 회복할 공간을 주는 쪽에서도 느껴집니다.",
    practice: "오늘 상대가 피곤해 보이면 질문을 줄이고 쉬라는 말을 먼저 건네기",
    example: "오늘은 답장 천천히 해도 돼. 네가 쉬는 게 더 중요해.",
    avoid: "서운함을 확인받기 위해 쉬는 사람에게 계속 대답을 요구하지 않기"
  },
  {
    id: "public-respect",
    label: "존중",
    title: "사람들 앞에서 상대를 곤란하게 만들지 않기",
    action: "농담이라도 상대의 실수, 외모, 가족, 돈 문제를 공개적으로 꺼내지 마세요. 둘만 있을 때도 조심할 주제는 사람들 앞에서 더 조심해야 합니다.",
    why: "센스 있는 사람은 분위기를 띄우면서도 사랑하는 사람의 체면을 지켜 줍니다.",
    practice: "오늘은 사람들 앞에서 상대를 높여 주는 말 한 가지 준비하기",
    example: "이거는 네가 더 잘 알아. 네가 설명해 주면 좋겠다.",
    avoid: "웃기려고 상대를 소재로 쓰지 않기"
  },
  {
    id: "choice-memory",
    label: "기억",
    title: "상대가 고른 것을 다음번 선택에 반영하기",
    action: "상대가 전에 좋아한 자리, 음료 온도, 영화 장르, 산책 속도를 기억했다가 다음 선택에 조용히 반영해 보세요.",
    why: "기억은 말로 하는 사랑보다 더 오래 남는 증거가 될 때가 많습니다.",
    practice: "최근 상대가 좋다고 한 선택 하나를 메모하고 다음 약속에 반영하기",
    example: "저번에 창가 자리 좋아했지? 오늘도 그쪽으로 잡아볼까?",
    avoid: "내가 편한 방식만 반복하면서 상대 취향을 잊지 않기"
  },
  {
    id: "money-comfort",
    label: "배려",
    title: "돈 이야기를 어색하지 않게 편안하게 만들기",
    action: "데이트 비용은 자존심 싸움으로 만들지 말고 상황에 맞춰 자연스럽게 나누거나 번갈아 부담하세요. 상대가 부담스러워 보이면 선택지를 조정하는 것도 배려입니다.",
    why: "연인 사이의 돈 문제는 금액보다 배려받고 있다는 느낌에서 편안해집니다.",
    practice: "비싼 선택지를 내기 전에 가벼운 선택지도 함께 제안하기",
    example: "오늘은 가볍게 먹고 산책할까, 아니면 제대로 먹고 내가 예약해볼까?",
    avoid: "상대의 경제 상황을 비교하거나 장난처럼 평가하지 않기"
  },
  {
    id: "emotional-naming",
    label: "공감",
    title: "상대 감정을 대신 결론 내리지 말고 이름 붙여 확인하기",
    action: "상대가 속상한 이야기를 할 때 '그래서 네가 화난 거지?'라고 단정하기보다 '속상함이 더 컸어, 아니면 서운함이 더 컸어?'처럼 확인해 주세요.",
    why: "감정을 맞히려는 태도보다 확인하려는 태도가 더 안전하게 느껴집니다.",
    practice: "상대 감정을 단정하는 문장을 질문으로 바꿔 말하기",
    example: "그때 제일 힘들었던 게 무시당한 느낌이었어?",
    avoid: "상대보다 먼저 감정의 정답을 정하지 않기"
  },
  {
    id: "future-note",
    label: "안정감",
    title: "관계의 다음 장면을 작게 예고하기",
    action: "헤어질 때 '다음엔 네가 말한 그 카페 가보자'처럼 다음 만남의 작은 힌트를 남겨 주세요. 거창한 약속보다 이어짐의 감각이 중요합니다.",
    why: "상대는 지금의 즐거움뿐 아니라 관계가 이어진다는 안정감에서 사랑을 느낍니다.",
    practice: "오늘 대화에서 나온 다음 행동 하나를 기억해두기",
    example: "아까 말한 전시, 다음 주에 같이 보러 가자.",
    avoid: "기분 좋을 때만 약속하고 실제로는 챙기지 않는 패턴 만들지 않기"
  },
  {
    id: "family-boundary",
    label: "경계",
    title: "가족과 친구 이야기를 존중의 영역으로 다루기",
    action: "상대의 가족이나 친구에 대한 이야기는 내 판단을 바로 얹기보다 먼저 들어주세요. 조언이 필요해 보여도 관계의 맥락은 상대가 더 잘 압니다.",
    why: "가까운 사람을 함부로 평가받는 느낌은 관계 안의 안전감을 빠르게 떨어뜨립니다.",
    practice: "상대 주변 사람 이야기에 평가보다 질문 하나를 먼저 하기",
    example: "그 사람이 너한테 어떤 의미인지 먼저 듣고 싶어.",
    avoid: "상대가 사랑하는 사람을 내 기준으로 쉽게 깎아내리지 않기"
  },
  {
    id: "silent-prep",
    label: "준비",
    title: "상대가 말하기 전에 필요한 것을 작게 준비하기",
    action: "오래 걸을 날에는 물을 챙기고, 추운 날에는 실내 동선을 생각하고, 배고플 시간에는 대기 적은 장소를 찾아두세요.",
    why: "여자들이 말하는 센스 있는 행동은 대개 거창함보다 불편을 미리 줄이는 준비에서 나옵니다.",
    practice: "다음 약속 전 날씨, 이동, 식사 타이밍을 한 번 점검하기",
    example: "오늘 좀 걸을 것 같아서 물 하나 더 챙겼어.",
    avoid: "준비해놓고 생색내거나 칭찬을 강요하지 않기"
  },
  {
    id: "repair-after-conflict",
    label: "회복",
    title: "다툰 뒤 어색함을 방치하지 않기",
    action: "다툰 뒤 시간이 지나도 아무 일 없던 척만 하지 말고 '아까 내 말이 거칠었어. 다시 말하고 싶어'처럼 관계를 회복하는 말을 먼저 꺼내세요.",
    why: "사랑은 갈등을 피하는 능력보다 다시 연결하려는 태도에서 더 크게 느껴집니다.",
    practice: "갈등 후 24시간 안에 인정, 설명, 다음 행동을 짧게 말하기",
    example: "내가 방어적으로 말했어. 네가 서운했을 것 같아.",
    avoid: "침묵으로 상대가 먼저 풀어주길 기다리지 않기"
  },
  {
    id: "attention-to-detail",
    label: "관찰",
    title: "상대의 컨디션 변화를 작은 단서로 알아차리기",
    action: "말수가 줄었는지, 걷는 속도가 느려졌는지, 표정이 평소와 다른지 관찰해 보세요. 바로 캐묻기보다 쉬운 질문으로 문을 여는 것이 좋습니다.",
    why: "자세히 봐주는 사람 곁에서는 설명하지 않아도 이해받는 느낌이 생깁니다.",
    practice: "오늘 상대의 말투, 표정, 에너지 중 하나를 조용히 살피기",
    example: "오늘 평소보다 조용한데, 그냥 피곤한 날이야?",
    avoid: "관찰을 통제나 추궁으로 바꾸지 않기"
  },
  {
    id: "celebrate-effort",
    label: "응원",
    title: "성과보다 준비한 과정을 먼저 축하하기",
    action: "결과가 나오기 전에도 상대가 준비한 시간과 버틴 마음을 인정해 주세요. 잘됐는지보다 애썼다는 사실을 먼저 말하면 부담이 줄어듭니다.",
    why: "사람은 성공했을 때만 사랑받는다고 느끼면 관계 안에서도 긴장하게 됩니다.",
    practice: "상대의 결과를 묻기 전에 준비 과정에 대한 인정 한마디 하기",
    example: "결과도 궁금하지만, 그동안 준비한 게 진짜 대단했어.",
    avoid: "결과 중심 질문으로 상대를 평가받는 기분 들게 하지 않기"
  },
  {
    id: "share-comfort",
    label: "동행",
    title: "힘든 일을 해결보다 동행으로 받아주기",
    action: "상대가 힘든 문제를 말할 때 바로 해결하려 들기보다 '내가 옆에 있을게'라는 메시지를 먼저 주세요. 해결책은 그다음에 물어봐도 늦지 않습니다.",
    why: "받는 것에 익숙했던 사람이 주는 사랑으로 바뀌려면 상대의 외로움을 줄이는 연습이 필요합니다.",
    practice: "조언 전에 '내가 뭘 해주면 좋을까?'라고 묻기",
    example: "지금은 해결책보다 그냥 같이 있어주는 게 더 필요해?",
    avoid: "상대의 감정을 과제처럼 빨리 처리하려 하지 않기"
  }
];

const CARE_MODES = [
  {
    id: "base",
    title: (base) => base.title,
    action: (base) => base.action,
    practice: (base) => base.practice
  },
  {
    id: "sentence",
    title: (base) => `${base.title}를 말로 남기기`,
    action: (base) => `${base.action} 가능하면 마음을 짐작만 하지 말고 짧은 문장으로 표현해 주세요.`,
    practice: (base) => base.example ? `오늘 쓸 문장: "${base.example}"` : base.practice
  },
  {
    id: "beforehand",
    title: (base) => `${base.title}를 미리 준비하기`,
    action: (base) => `${base.action} 중요한 점은 상대가 불편해진 뒤 수습하는 것이 아니라 불편이 생기기 전에 작게 줄이는 것입니다.`,
    practice: (base) => base.practice
  }
];

function normalizeCareBase(item, index) {
  if (Array.isArray(item)) {
    return {
      id: item[0] || `legacy-${index + 1}`,
      category: item[0] || "care",
      label: item[1] || "배려",
      title: item[2],
      action: item[3],
      why: item[4],
      practice: item[5],
      example: "",
      avoid: ""
    };
  }
  return {
    category: item.id,
    ...item
  };
}

function careCatalog() {
  const bases = CARE_ITEMS.concat(CARE_MORE_ITEMS).map(normalizeCareBase);
  return bases.flatMap((base, index) => CARE_MODES.map((mode) => ({
    id: `care-${CARE_GENERATION_VERSION}-${base.id}-${mode.id}`,
    baseKey: base.id || `base-${index + 1}`,
    category: base.category || base.id,
    label: base.label || "배려",
    title: mode.title(base),
    action: mode.action(base),
    why: base.why,
    practice: mode.practice(base),
    example: base.example || "",
    avoid: base.avoid || ""
  })));
}

function makeGeneratedCare(date, count, usedKeys) {
  const seed = dateSeed(date);
  const catalog = rotate(careCatalog(), seed);
  const picked = [];
  const pickedIds = new Set();
  const pickedBases = new Set();
  const pickedLabels = new Set();

  for (const item of catalog) {
    if (picked.length >= count) break;
    const keys = [item.id, item.baseKey, item.title].map(normalizeKey).filter(Boolean);
    if (keys.some((key) => usedKeys.has(key) || pickedIds.has(key))) continue;
    if (pickedBases.has(item.baseKey)) continue;
    if (pickedLabels.has(item.label)) continue;
    picked.push(item);
    keys.forEach((key) => pickedIds.add(key));
    pickedBases.add(item.baseKey);
    pickedLabels.add(item.label);
  }

  for (const item of catalog) {
    if (picked.length >= count) break;
    const keys = [item.id, item.baseKey, item.title].map(normalizeKey).filter(Boolean);
    if (keys.some((key) => usedKeys.has(key) || pickedIds.has(key))) continue;
    if (pickedBases.has(item.baseKey)) continue;
    picked.push(item);
    keys.forEach((key) => pickedIds.add(key));
    pickedBases.add(item.baseKey);
  }

  return picked;
}

module.exports = {
  makeGeneratedKnowledge,
  KNOWLEDGE_GENERATION_VERSION,
  makeGeneratedEnglish,
  makeGeneratedSpeakingArticle,
  SPEAKING_GENERATION_VERSION,
  makeGeneratedCare,
  CARE_GENERATION_VERSION,
  lookupEnglishWord,
  lookupExampleTranslation
};
