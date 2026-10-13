// ============================================================================
// Unit Tests for CalmChain Contextual Support Level Classifier
// ============================================================================

const assert = require("assert");
const { assessSupportLevel } = require("../classifier");

const testCases = [
  // --------------------------------------------------------------------------
  // LEVEL 1 — CALM SUPPORT: GREEN + WHITE
  // --------------------------------------------------------------------------
  { text: "Hi", expectedLevel: 1, label: "Simple greeting" },
  { text: "Hello there", expectedLevel: 1, label: "Standard greeting" },
  { text: "I'm feeling good today.", expectedLevel: 1, label: "Positive state" },
  { text: "I am relaxed and happy.", expectedLevel: 1, label: "Relaxed state" },
  { text: "I had a normal day at college.", expectedLevel: 1, label: "Normal day" },
  { text: "I'm a little tired after class.", expectedLevel: 1, label: "Mild tiredness" },
  { text: "Can you help me focus on my studies?", expectedLevel: 1, label: "Focus request" },
  { text: "I have some homework to finish tonight.", expectedLevel: 1, label: "Homework talk" },
  { text: "I want a breathing exercise.", expectedLevel: 1, label: "Wellness tool request" },
  { text: "I feel slightly stressed about exams tomorrow.", expectedLevel: 1, label: "Mild ordinary exam stress" },
  { text: "I feel nervous about my presentation.", expectedLevel: 1, label: "Mild presentation nerves" },
  { text: "I am bored and want to chat.", expectedLevel: 1, label: "Boredom" },

  // --------------------------------------------------------------------------
  // LEVEL 2 — GUIDED SUPPORT: YELLOW + WHITE
  // --------------------------------------------------------------------------
  { text: "I feel very stressed.", expectedLevel: 2, label: "Elevated stress" },
  { text: "I'm overwhelmed with everything.", expectedLevel: 2, label: "Overwhelmed state" },
  { text: "I can't stop overthinking about my future.", expectedLevel: 2, label: "Persistent overthinking" },
  { text: "I'm feeling lonely and isolated.", expectedLevel: 2, label: "Loneliness" },
  { text: "I'm having frequent panic feelings.", expectedLevel: 2, label: "Panic sensations" },
  { text: "I feel hopeless about my situation.", expectedLevel: 2, label: "Hopelessness" },
  { text: "I'm crying a lot lately.", expectedLevel: 2, label: "Frequent crying" },
  { text: "I feel emotionally exhausted.", expectedLevel: 2, label: "Emotional burnout" },
  { text: "I feel worthless.", expectedLevel: 2, label: "Feelings of worthlessness" },
  { text: "Nobody understands me.", expectedLevel: 2, label: "Perceived isolation" },
  { text: "I can't sleep because of anxiety.", expectedLevel: 2, label: "Anxiety sleep disruption" },
  { text: "I feel like giving up on my studies.", expectedLevel: 2, label: "Giving up on studies" },
  { text: "I've been feeling very low for several days.", expectedLevel: 2, label: "Prolonged low mood" },

  // --------------------------------------------------------------------------
  // LEVEL 3 — PRIORITY SUPPORT: RED + WHITE
  // --------------------------------------------------------------------------
  { text: "I want to kill myself.", expectedLevel: 3, label: "Explicit suicide intent" },
  { text: "I'm going to end my life.", expectedLevel: 3, label: "Explicit end of life plan" },
  { text: "I am planning to suicide.", expectedLevel: 3, label: "Planning suicide" },
  { text: "I want to hurt myself right now.", expectedLevel: 3, label: "Imminent self-harm" },
  { text: "I have a plan to end my life.", expectedLevel: 3, label: "Concrete suicide plan" },
  { text: "I might act on these thoughts tonight.", expectedLevel: 3, label: "Imminent timeline" },
  { text: "I have taken pills to hurt myself.", expectedLevel: 3, label: "Self-harm act executed" },
  { text: "I am about to hurt someone.", expectedLevel: 3, label: "Imminent violence" },
  { text: "Someone is threatening to seriously hurt me right now.", expectedLevel: 3, label: "Immediate external threat" },
  { text: "I cannot keep myself safe right now.", expectedLevel: 3, label: "Inability to maintain safety" },
  { text: "I have the means with me and I might use them.", expectedLevel: 3, label: "Access to lethal means" },
  { text: "Breakup && die", expectedLevel: 3, label: "Breakup & die crisis slang" },

  // --------------------------------------------------------------------------
  // CRITICAL SAFEGUARDS: NEGATION & CONTEXT
  // --------------------------------------------------------------------------
  {
    text: "I don't want to hurt myself, I just feel stressed.",
    expectedLevel: 1, // Negated L3, mild stress -> not L3!
    label: "Negation: 'don't want to hurt myself'"
  },
  {
    text: "I do not want to die, I just need advice.",
    expectedLevel: 1,
    label: "Negation: 'do not want to die'"
  },
  {
    text: "I never thought about suicide.",
    expectedLevel: 1,
    label: "Negation: 'never thought about suicide'"
  },
  {
    text: "My friend wants to die and I am worried about him.",
    expectedLevel: 2, // Third-person discussion -> Level 2 guided support, not user crisis
    label: "Third-person: 'My friend wants to die'"
  },
  {
    text: "I had a peaceful day with friends, but I want to end my life tonight.",
    expectedLevel: 3, // High risk must not be overridden by peaceful phrase
    label: "Mixed-severity: high-risk override"
  }
];

let passed = 0;
let failed = 0;

console.log("==============================================================");
console.log(" Running CalmChain Support Level Classifier Unit Tests");
console.log("==============================================================");

testCases.forEach((tc, idx) => {
  const result = assessSupportLevel(tc.text);
  const ok = result.level === tc.expectedLevel;

  if (ok) {
    passed++;
    console.log(`[PASS] #${idx + 1} (${tc.label}): Level ${result.level} matched expected Level ${tc.expectedLevel}`);
  } else {
    failed++;
    console.error(`[FAIL] #${idx + 1} (${tc.label}): Got Level ${result.level} (emotion: ${result.emotion}), expected Level ${tc.expectedLevel}`);
    console.error(`       Text: "${tc.text}"`);
    console.error(`       Reason: ${result.reason}`);
  }
});

console.log("--------------------------------------------------------------");
console.log(`Total: ${testCases.length} | Passed: ${passed} | Failed: ${failed}`);
console.log("==============================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All CalmChain classifier tests passed successfully!");
}
