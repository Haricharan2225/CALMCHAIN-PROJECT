// ============================================================================
// Unit Tests for CalmChain Contextual Support Level Classifier
// Tests all prompt-specified human-language expressions, negations, and safeguards.
// ============================================================================

const assert = require("assert");
const { assessSupportLevel } = require("../classifier");

const testCases = [
  // --------------------------------------------------------------------------
  // USER PROMPT SPECIFIED LEVEL 1 EXAMPLES
  // --------------------------------------------------------------------------
  { text: "I feel good today", expectedLevel: 1, label: "L1: 'I feel good today'" },
  { text: "I am happy", expectedLevel: 1, label: "L1: 'I am happy'" },
  { text: "I feel calm", expectedLevel: 1, label: "L1: 'I feel calm'" },
  { text: "I am doing okay", expectedLevel: 1, label: "L1: 'I am doing okay'" },
  { text: "I am feeling relaxed", expectedLevel: 1, label: "L1: 'I am feeling relaxed'" },
  { text: "I had a nice day", expectedLevel: 1, label: "L1: 'I had a nice day'" },
  { text: "I'm excited about tomorrow", expectedLevel: 1, label: "L1: 'I\'m excited about tomorrow'" },
  { text: "I feel better now", expectedLevel: 1, label: "L1: 'I feel better now'" },
  { text: "I am grateful", expectedLevel: 1, label: "L1: 'I am grateful'" },
  { text: "I am fine", expectedLevel: 1, label: "L1: 'I am fine'" },
  { text: "Hi there!", expectedLevel: 1, label: "L1: Simple greeting" },
  { text: "Can we talk about my homework?", expectedLevel: 1, label: "L1: Homework/study discussion" },

  // --------------------------------------------------------------------------
  // USER PROMPT SPECIFIED LEVEL 2 EXAMPLES
  // --------------------------------------------------------------------------
  { text: "I am stressed", expectedLevel: 2, label: "L2: 'I am stressed'" },
  { text: "I feel anxious", expectedLevel: 2, label: "L2: 'I feel anxious'" },
  { text: "I am worried about my exams", expectedLevel: 2, label: "L2: 'I am worried about my exams'" },
  { text: "I feel lonely", expectedLevel: 2, label: "L2: 'I feel lonely'" },
  { text: "I can't stop overthinking", expectedLevel: 2, label: "L2: 'I can\'t stop overthinking'" },
  { text: "I had a breakup and I'm hurt", expectedLevel: 2, label: "L2: 'I had a breakup and I\'m hurt'" },
  { text: "I feel sad", expectedLevel: 2, label: "L2: 'I feel sad'" },
  { text: "I am frustrated", expectedLevel: 2, label: "L2: 'I am frustrated'" },
  { text: "I feel overwhelmed", expectedLevel: 2, label: "L2: 'I feel overwhelmed'" },
  { text: "I can't sleep because of tension", expectedLevel: 2, label: "L2: 'I can\'t sleep because of tension'" },
  { text: "I am scared about my future", expectedLevel: 2, label: "L2: 'I am scared about my future'" },
  { text: "I feel like crying", expectedLevel: 2, label: "L2: 'I feel like crying'" },
  { text: "Everything feels too much", expectedLevel: 2, label: "L2: 'Everything feels too much'" },
  { text: "I am angry with everyone", expectedLevel: 2, label: "L2: 'I am angry with everyone'" },

  // --------------------------------------------------------------------------
  // USER PROMPT SPECIFIED LEVEL 3 SAFETY EXAMPLES
  // --------------------------------------------------------------------------
  { text: "I want to kill myself", expectedLevel: 3, label: "L3: 'I want to kill myself'" },
  { text: "I want to end my life", expectedLevel: 3, label: "L3: 'I want to end my life'" },
  { text: "I don't want to live anymore", expectedLevel: 3, label: "L3: 'I don\'t want to live anymore'" },
  { text: "I might hurt myself", expectedLevel: 3, label: "L3: 'I might hurt myself'" },
  { text: "I am going to kill myself", expectedLevel: 3, label: "L3: 'I am going to kill myself'" },
  { text: "I have a plan to end my life", expectedLevel: 3, label: "L3: 'I have a plan to end my life'" },
  { text: "I want to die", expectedLevel: 3, label: "L3: 'I want to die'" },
  { text: "I can't keep myself safe", expectedLevel: 3, label: "L3: 'I can\'t keep myself safe'" },
  { text: "I am thinking about suicide", expectedLevel: 3, label: "L3: 'I am thinking about suicide'" },
  { text: "Breakup && die", expectedLevel: 3, label: "L3: 'Breakup && die'" },

  // --------------------------------------------------------------------------
  // CONTEXTUAL SAFEGUARDS: NEGATIONS & AMBIGUOUS KEYWORDS
  // --------------------------------------------------------------------------
  {
    text: "I don't want to hurt myself, I just feel stressed.",
    expectedLevel: 2, // Stress is present (L2), but self-harm is negated (not L3!)
    label: "Negation: 'don't want to hurt myself' with stress"
  },
  {
    text: "I do not want to die, I just need to talk to someone.",
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
    text: "I was playing a video game where my character dies.",
    expectedLevel: 1,
    label: "Contextual: gaming reference"
  },
  {
    text: "I had a peaceful morning, but I have a plan to end my life tonight.",
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
    console.error(`[FAIL] #${idx + 1} (${tc.label}): Expected Level ${tc.expectedLevel}, got Level ${result.level} (Reason: ${result.reason})`);
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
