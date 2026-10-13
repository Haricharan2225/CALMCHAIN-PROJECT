// ============================================================================
// CalmChain Contextual Support Level Classifier Unit Test Suite
// Covers Levels 1, 2, and 3, non-crisis idioms, slang, negations,
// and sticky de-escalation safeguards.
// ============================================================================

const { assessSupportLevel } = require("../classifier");

const testCases = [
  // --------------------------------------------------------------------------
  // LEVEL 1 — CALM SUPPORT EXAMPLES
  // --------------------------------------------------------------------------
  { text: "I feel good today", expectedLevel: 1, label: "L1: 'I feel good today'" },
  { text: "I am happy", expectedLevel: 1, label: "L1: 'I am happy'" },
  { text: "I feel calm", expectedLevel: 1, label: "L1: 'I feel calm'" },
  { text: "I am doing okay", expectedLevel: 1, label: "L1: 'I am doing okay'" },
  { text: "I am feeling relaxed", expectedLevel: 1, label: "L1: 'I am feeling relaxed'" },
  { text: "I had a nice day", expectedLevel: 1, label: "L1: 'I had a nice day'" },
  { text: "I'm excited about tomorrow", expectedLevel: 1, label: "L1: 'I'm excited about tomorrow'" },
  { text: "I feel better now", expectedLevel: 1, label: "L1: 'I feel better now'" },
  { text: "I am grateful for my friends", expectedLevel: 1, label: "L1: 'I am grateful'" },
  { text: "I am fine, thank you", expectedLevel: 1, label: "L1: 'I am fine'" },
  { text: "Hello! How does CalmChain work?", expectedLevel: 1, label: "L1: Simple greeting" },
  { text: "I was studying biology for 2 hours today.", expectedLevel: 1, label: "L1: Homework/study discussion" },

  // --------------------------------------------------------------------------
  // LEVEL 2 — GUIDED SUPPORT / ELEVATED DISTRESS EXAMPLES
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
  // LEVEL 3 — PRIORITY SAFETY SIGNALS
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
  { text: "I want to hurt myself", expectedLevel: 3, label: "L3: 'I want to hurt myself'" },

  // --------------------------------------------------------------------------
  // CONTEXTUAL SAFEGUARDS: NEGATIONS & THIRD-PERSON
  // --------------------------------------------------------------------------
  {
    text: "I don't want to hurt myself, I just feel stressed.",
    expectedLevel: 2,
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
    expectedLevel: 2,
    label: "Third-person: 'My friend wants to die'"
  },
  {
    text: "I was playing a video game where my character dies.",
    expectedLevel: 1,
    label: "Contextual: gaming reference"
  },
  {
    text: "I had a peaceful morning, but I have a plan to end my life tonight.",
    expectedLevel: 3,
    label: "Mixed-severity: high-risk override"
  },

  // --------------------------------------------------------------------------
  // RULE 5: EDUCATIONAL & IDIOMATIC NON-CRISIS USES OF "KILL"
  // --------------------------------------------------------------------------
  {
    text: "How do I kill a process in Linux terminal?",
    expectedLevel: 1,
    label: "Educational/Terminal: 'kill a process'"
  },
  {
    text: "We are reading To Kill a Mockingbird in class today.",
    expectedLevel: 1,
    label: "Literature: 'To Kill a Mockingbird'"
  },
  {
    text: "I walked 10 miles and my feet are killing me.",
    expectedLevel: 1,
    label: "Idiom: 'feet are killing me'"
  },
  {
    text: "I was just killing time at the coffee shop.",
    expectedLevel: 1,
    label: "Idiom: 'killing time'"
  },
  {
    text: "My boss is going to kill me if I miss the bus.",
    expectedLevel: 1,
    label: "Hyperbole: 'boss is going to kill me'"
  },

  // --------------------------------------------------------------------------
  // RULE 6: SLANG & SPELLING VARIATIONS FOR CRISIS
  // --------------------------------------------------------------------------
  {
    text: "i feel so overwhelmed i wanna kms tonight",
    expectedLevel: 3,
    label: "Slang crisis: 'wanna kms'"
  },
  {
    text: "i am having dark thoughts of suicde",
    expectedLevel: 3,
    label: "Typo crisis: 'suicde'"
  },
  {
    text: "i just wanna die right now",
    expectedLevel: 3,
    label: "Slang crisis: 'wanna die'"
  },
  {
    text: "i am planning to end my lyf tonight",
    expectedLevel: 3,
    label: "Spelling variant crisis: 'end my lyf'"
  },

  // --------------------------------------------------------------------------
  // RULE 9: STICKY DE-ESCALATION SAFEGUARD
  // --------------------------------------------------------------------------
  {
    text: "ok",
    previousLevel: 3,
    expectedLevel: 3,
    label: "Sticky Safeguard: prior L3 followed by short 'ok'"
  },
  {
    text: "I called 14416 and I feel much better now, I am safe with my family.",
    previousLevel: 3,
    expectedLevel: 1,
    label: "Verified De-escalation: explicitly safe with helpline and family"
  }
];

let passed = 0;
let failed = 0;

console.log("==============================================================");
console.log(" Running CalmChain Support Level Classifier Unit Tests");
console.log("==============================================================");

testCases.forEach((tc, idx) => {
  const result = assessSupportLevel(tc.text, "calm", [], tc.previousLevel || 1);
  const levelMatch = result.level === tc.expectedLevel;

  // Validate module return contract:
  const hasConfidence = typeof result.confidence === "number" && result.confidence >= 0 && result.confidence <= 1;
  const hasSignals = Array.isArray(result.signals);
  const hasImmediateSupportFlag = typeof result.requiresImmediateSupport === "boolean";
  const immediateSupportCorrect = result.requiresImmediateSupport === (result.level === 3);

  const ok = levelMatch && hasConfidence && hasSignals && hasImmediateSupportFlag && immediateSupportCorrect;

  if (ok) {
    passed++;
    console.log(`[PASS] #${idx + 1} (${tc.label}): Level ${result.level} (conf: ${result.confidence}, immSupp: ${result.requiresImmediateSupport})`);
  } else {
    failed++;
    console.error(`[FAIL] #${idx + 1} (${tc.label}): Expected Level ${tc.expectedLevel}, got Level ${result.level} (Reason: ${result.reason}, conf: ${result.confidence})`);
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
