// ============================================================================
// CalmChain Contextual Support Level Classifier (Frontend Utility)
// Evaluates intent, negation, severity, and context across Levels 1, 2, and 3.
// ============================================================================

export function isNegated(tokens, matchStartIndex) {
  const negationWords = new Set([
    "don't", "dont", "do not", "not", "never", "no", "won't", "wont",
    "cannot", "cant", "can't", "haven't", "havent", "ain't", "aint",
    "hardly", "stopped", "quit", "no longer"
  ]);

  const windowStart = Math.max(0, matchStartIndex - 4);
  for (let i = windowStart; i < matchStartIndex; i++) {
    if (negationWords.has(tokens[i])) {
      return true;
    }
  }
  return false;
}

export function isThirdPersonOrQuoted(text, matchedPhrase) {
  const lower = text.toLowerCase();

  if (
    (lower.startsWith('"') && lower.endsWith('"')) ||
    lower.includes("song called") ||
    lower.includes("lyrics say") ||
    lower.includes("book about") ||
    lower.includes("article about") ||
    lower.includes("statistics on") ||
    lower.includes("what is the definition of")
  ) {
    return true;
  }

  const thirdPersonSubjectRegex = /\b(he|she|they|my friend|my cousin|my brother|my sister|my classmate|my friend's|someone else|a friend)\s+(wants to|is going to|is planning to|plans to|threatened to|said|told me)\b/i;

  if (matchedPhrase) {
    const idx = lower.indexOf(matchedPhrase);
    if (idx !== -1) {
      const priorText = lower.slice(Math.max(0, idx - 60), idx + matchedPhrase.length);
      if (thirdPersonSubjectRegex.test(priorText)) {
        return true;
      }
    }
  }
  if (thirdPersonSubjectRegex.test(lower)) {
    return true;
  }

  return false;
}

export function assessSupportLevel(text, clientEmotion = "calm") {
  if (!text || typeof text !== "string") {
    return { level: 1, emotion: "calm", reason: "empty_text" };
  }

  const raw = text.trim();
  const lower = raw.toLowerCase();
  const tokens = lower.replace(/[^\w\s']/g, " ").split(/\s+/).filter(Boolean);

  // LEVEL 3 — PRIORITY SAFETY SIGNALS
  const explicitLossOfLifePhrases = [
    "don't want to live anymore",
    "dont want to live anymore",
    "do not want to live anymore",
    "don't want to live",
    "dont want to live",
    "do not want to live",
    "cannot live anymore",
    "can't live anymore",
    "cant live anymore",
    "no reason to live anymore",
    "no reason to live",
    "better off dead"
  ];

  for (const phrase of explicitLossOfLifePhrases) {
    if (lower.includes(phrase)) {
      if (isThirdPersonOrQuoted(raw, phrase)) {
        return {
          level: 2,
          emotion: "warning",
          reason: `third_person_crisis_discussion: "${phrase}"`
        };
      }
      return {
        level: 3,
        emotion: "danger",
        reason: `urgent_safety_signal: "${phrase}"`
      };
    }
  }

  const level3Phrases = [
    "want to kill myself",
    "going to kill myself",
    "wants to kill himself",
    "wants to kill herself",
    "wants to kill themselves",
    "going to end my life",
    "want to end my life",
    "planning to suicide",
    "plan to suicide",
    "thinking about suicide",
    "thought about suicide",
    "thoughts of suicide",
    "suicide plan",
    "have a plan to end my life",
    "might hurt myself",
    "hurt myself right now",
    "plan to end my life",
    "act on these thoughts tonight",
    "taken pills to hurt myself",
    "injured myself and need help",
    "about to hurt someone",
    "threatening to seriously hurt me",
    "immediate danger",
    "cannot keep myself safe",
    "can't keep myself safe",
    "cant keep myself safe",
    "have the means with me",
    "breakup && die",
    "breakup and die",
    "kill myself",
    "end my life",
    "ending my life",
    "suicide",
    "sucide",
    "want to die",
    "wants to die",
    "slit my wrists",
    "hang myself",
    "overdose to die"
  ];

  for (const phrase of level3Phrases) {
    const phraseIndex = lower.indexOf(phrase);
    if (phraseIndex !== -1) {
      const charSlice = lower.slice(0, phraseIndex).trim();
      const tokenIndex = charSlice ? charSlice.split(/\s+/).length : 0;

      if (isNegated(tokens, tokenIndex)) {
        continue;
      }

      if (isThirdPersonOrQuoted(raw, phrase)) {
        return {
          level: 2,
          emotion: "warning",
          reason: `third_person_crisis_discussion: "${phrase}"`
        };
      }

      return {
        level: 3,
        emotion: "danger",
        reason: `urgent_safety_signal: "${phrase}"`
      };
    }
  }

  // LEVEL 2 — GUIDED SUPPORT / ELEVATED DISTRESS SIGNALS
  const level2Phrases = [
    "very stressed",
    "am stressed",
    "feel stressed",
    "feeling stressed",
    "so stressed",
    "feel anxious",
    "am anxious",
    "feeling anxious",
    "worried about my exams",
    "worried about exams",
    "exam stress",
    "test anxiety",
    "can't stop overthinking",
    "cannot stop overthinking",
    "stop overthinking",
    "had a breakup",
    "went through a breakup",
    "breakup and i'm hurt",
    "breakup and im hurt",
    "heartbroken",
    "feel sad",
    "feeling sad",
    "am sad",
    "am frustrated",
    "feel frustrated",
    "feeling frustrated",
    "feel overwhelmed",
    "feeling overwhelmed",
    "am overwhelmed",
    "can't sleep because of tension",
    "cannot sleep because of tension",
    "can't sleep because of anxiety",
    "cannot sleep because of anxiety",
    "insomnia from stress",
    "scared about my future",
    "scared of my future",
    "scared about the future",
    "feel like crying",
    "feels like crying",
    "want to cry",
    "crying a lot",
    "everything feels too much",
    "feels like too much",
    "too much to handle",
    "am angry with everyone",
    "angry with everyone",
    "frequent panic feelings",
    "hopeless about my situation",
    "crying a lot lately",
    "emotionally exhausted",
    "feel worthless",
    "feeling worthless",
    "nobody understands me",
    "under too much pressure",
    "giving up on my studies",
    "giving up on studies",
    "struggling to manage my emotions",
    "very low for several days",
    "isolated and need support",
    "difficulty coping with my problems",
    "panic attack",
    "severe anxiety",
    "intense panic",
    "crying constantly",
    "feeling lonely",
    "feel lonely",
    "am lonely",
    "so lonely",
    "isolated",
    "can't cope anymore",
    "cannot cope anymore",
    "constant worry",
    "depressed for weeks",
    "severe depression"
  ];

  for (const phrase of level2Phrases) {
    const phraseIndex = lower.indexOf(phrase);
    if (phraseIndex !== -1) {
      const charSlice = lower.slice(0, phraseIndex).trim();
      const tokenIndex = charSlice ? charSlice.split(/\s+/).length : 0;

      if (!isNegated(tokens, tokenIndex)) {
        return {
          level: 2,
          emotion: "warning",
          reason: `guided_support_signal: "${phrase}"`
        };
      }
    }
  }

  const highDistressTokens = [
    "hopeless", "worthless", "overwhelmed", "unbearable", "devastated",
    "lonely", "anxious", "stressed", "heartbroken", "depressed", "frustrated"
  ];
  for (const token of highDistressTokens) {
    const tokenIdx = tokens.indexOf(token);
    if (tokenIdx !== -1 && !isNegated(tokens, tokenIdx)) {
      return {
        level: 2,
        emotion: "warning",
        reason: `high_distress_term: "${token}"`
      };
    }
  }

  if (clientEmotion === "danger") {
    return { level: 3, emotion: "danger", reason: "client_danger_flag" };
  }
  if (clientEmotion === "warning") {
    return { level: 2, emotion: "warning", reason: "client_warning_flag" };
  }

  return {
    level: 1,
    emotion: "calm",
    reason: "normal_conversation"
  };
}
