// ============================================================================
// CalmChain Contextual Support Level Classifier (Frontend Utility)
// Evaluates intent, negation, severity, educational context, spelling variations,
// and multi-turn context across Levels 1, 2, and 3.
// Returns:
// {
//   level: 1 | 2 | 3,
//   emotion: "calm" | "warning" | "danger",
//   reason: string,
//   confidence: number (0.0 to 1.0),
//   signals: string[],
//   requiresImmediateSupport: boolean
// }
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

export function isEducationalOrIdiomaticNonCrisis(text) {
  const lower = text.toLowerCase();

  if (
    /\bkill\s+(-9|-15|\d+|a\s+process|the\s+process|process|task|command|terminal|session)\b/i.test(lower) ||
    /\b(killall|pkill|taskkill)\b/i.test(lower) ||
    lower.includes("kill the application") ||
    lower.includes("kill the container") ||
    lower.includes("how do i kill a process") ||
    lower.includes("how to kill a process")
  ) {
    return true;
  }

  if (
    lower.includes("to kill a mockingbird") ||
    lower.includes("kill a mocking bird") ||
    lower.includes("kill bill") ||
    lower.includes("licensed to kill")
  ) {
    return true;
  }

  if (
    /\b(killing\s+time|kill\s+time|time\s+to\s+kill)\b/i.test(lower) ||
    lower.includes("kill two birds") ||
    lower.includes("killing two birds") ||
    /\b(feet|back|shoes|heat|bug|headache|cramps|exercise)\s+(is|are)\s+killing\s+me\b/i.test(lower) ||
    lower.includes("killing me with laughter") ||
    lower.includes("dressed to kill")
  ) {
    return true;
  }

  if (
    /\b(boss|parents|mom|dad|teacher|coach)\s+(will|is\s+going\s+to|gonna)\s+kill\s+me\b/i.test(lower) &&
    !lower.includes("myself")
  ) {
    return true;
  }

  return false;
}

export function assessSupportLevel(text, clientEmotion = "calm", conversationHistory = [], previousLevel = 1) {
  if (!text || typeof text !== "string") {
    return {
      level: 1,
      emotion: "calm",
      reason: "empty_text",
      confidence: 0.99,
      signals: ["empty_input"],
      requiresImmediateSupport: false
    };
  }

  const raw = text.trim();
  const lower = raw.toLowerCase();
  const tokens = lower.replace(/[^\w\s']/g, " ").split(/\s+/).filter(Boolean);

  const isIdiomaticNonCrisis = isEducationalOrIdiomaticNonCrisis(raw);

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
    "better off dead",
    "done with living"
  ];

  for (const phrase of explicitLossOfLifePhrases) {
    if (lower.includes(phrase)) {
      if (isThirdPersonOrQuoted(raw, phrase)) {
        return {
          level: 2,
          emotion: "warning",
          reason: `third_person_crisis_discussion: "${phrase}"`,
          confidence: 0.88,
          signals: ["third_person_concern", phrase],
          requiresImmediateSupport: false
        };
      }
      return {
        level: 3,
        emotion: "danger",
        reason: `urgent_safety_signal: "${phrase}"`,
        confidence: 0.98,
        signals: ["explicit_loss_of_life", phrase],
        requiresImmediateSupport: true
      };
    }
  }

  const crisisSlangAndSpellingVariants = [
    "kms",
    "wanna kms",
    "wanna die",
    "wan2 die",
    "want 2 die",
    "k1ll myslf",
    "k1ll myself",
    "kill myslf",
    "k!ll myself",
    "k*ll myself",
    "suicde",
    "suicdal",
    "sucide",
    "sucidal",
    "suiside",
    "end my lyf",
    "end my life",
    "slit my wrists",
    "hang myslf"
  ];

  if (!isIdiomaticNonCrisis) {
    for (const slang of crisisSlangAndSpellingVariants) {
      const slangRegex = new RegExp(`\\b${slang.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (slangRegex.test(lower)) {
        const matchIdx = lower.indexOf(slang);
        const charSlice = lower.slice(0, matchIdx).trim();
        const tokenIndex = charSlice ? charSlice.split(/\s+/).length : 0;

        if (!isNegated(tokens, tokenIndex)) {
          if (isThirdPersonOrQuoted(raw, slang)) {
            return {
              level: 2,
              emotion: "warning",
              reason: `third_person_crisis_discussion: "${slang}"`,
              confidence: 0.87,
              signals: ["third_person_slang_crisis", slang],
              requiresImmediateSupport: false
            };
          }
          return {
            level: 3,
            emotion: "danger",
            reason: `urgent_crisis_slang_signal: "${slang}"`,
            confidence: 0.97,
            signals: ["slang_or_spelling_crisis", slang],
            requiresImmediateSupport: true
          };
        }
      }
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
    "want to hurt myself",
    "going to hurt myself",
    "gonna hurt myself",
    "plan to hurt myself",
    "planning to hurt myself",
    "about to hurt myself",
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

  if (!isIdiomaticNonCrisis) {
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
            reason: `third_person_crisis_discussion: "${phrase}"`,
            confidence: 0.88,
            signals: ["third_person_crisis", phrase],
            requiresImmediateSupport: false
          };
        }

        return {
          level: 3,
          emotion: "danger",
          reason: `urgent_safety_signal: "${phrase}"`,
          confidence: 0.99,
          signals: ["urgent_safety_signal", phrase],
          requiresImmediateSupport: true
        };
      }
    }
  }

  // STICKY DE-ESCALATION SAFEGUARD
  const effectivePreviousLevel = Number(previousLevel) || 1;
  if (effectivePreviousLevel === 3) {
    const isHarmlessOrPositive =
      /\b(hi|hello|hey|good\s+morning|good\s+evening|howdy|greetings|happy|glad|good|great|fine|doing\s+well|calm|relaxed|peaceful|wonderful|what\s+is|how\s+to|explain)\b/i.test(lower);

    const explicitDeescalation =
      isHarmlessOrPositive ||
      /\b(am\s+safe\s+now|feel\s+much\s+better\s+now|crisis\s+has\s+passed|called\s+(14416|112|the\s+helpline)|with\s+a\s+friend\s+now|family\s+is\s+with\s+me|feeling\s+safe\s+now)\b/i.test(lower);

    if (!explicitDeescalation && /^(ok|okay|k|yes|yeah|yep|no|nope|hmm|wait)\b/i.test(lower) && raw.length < 20) {
      return {
        level: 3,
        emotion: "danger",
        reason: "sticky_safety_safeguard: prior level 3 crisis awaiting verified de-escalation",
        confidence: 0.91,
        signals: ["prior_level_3_continuity", "unverified_safety_status"],
        requiresImmediateSupport: true
      };
    }
  }

  // LEVEL 2 — GUIDED / ELEVATED SUPPORT SIGNALS
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
    "severe depression",
    "rejected from",
    "job interview",
    "feeling like an absolute failure",
    "feel like a failure",
    "feeling like a failure",
    "like an absolute failure",
    "failed my midterm",
    "failed my exam",
    "failed an exam",
    "failed my",
    "fought with my",
    "fought with",
    "cope with days like this",
    "how do i even cope",
    "how do i cope",
    "today was exhausting"
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
          reason: `guided_support_signal: "${phrase}"`,
          confidence: 0.92,
          signals: ["elevated_emotional_distress", phrase],
          requiresImmediateSupport: false
        };
      }
    }
  }

  const highDistressTokens = [
    "hopeless", "worthless", "overwhelmed", "unbearable", "devastated",
    "lonely", "anxious", "stressed", "heartbroken", "depressed", "frustrated",
    "rejection", "rejected", "failure", "exhausting", "exhausted"
  ];
  for (const token of highDistressTokens) {
    const tokenIdx = tokens.indexOf(token);
    if (tokenIdx !== -1 && !isNegated(tokens, tokenIdx)) {
      return {
        level: 2,
        emotion: "warning",
        reason: `high_distress_term: "${token}"`,
        confidence: 0.85,
        signals: ["high_distress_token", token],
        requiresImmediateSupport: false
      };
    }
  }

  if (clientEmotion === "danger") {
    return {
      level: 3,
      emotion: "danger",
      reason: "client_danger_flag",
      confidence: 0.80,
      signals: ["client_danger_biometric"],
      requiresImmediateSupport: true
    };
  }
  if (clientEmotion === "warning") {
    return {
      level: 2,
      emotion: "warning",
      reason: "client_warning_flag",
      confidence: 0.80,
      signals: ["client_warning_biometric"],
      requiresImmediateSupport: false
    };
  }

  if (effectivePreviousLevel === 2 && raw.length < 15 && /^(k|ok|okay|yeah|yes|no|hmm)\b/i.test(lower)) {
    return {
      level: 2,
      emotion: "warning",
      reason: "sticky_guided_support_safeguard: maintaining attentive level 2 presence",
      confidence: 0.82,
      signals: ["prior_level_2_continuity"],
      requiresImmediateSupport: false
    };
  }

  return {
    level: 1,
    emotion: "calm",
    reason: isIdiomaticNonCrisis ? "idiomatic_or_educational_non_crisis" : "normal_conversation",
    confidence: isIdiomaticNonCrisis ? 0.95 : 0.90,
    signals: isIdiomaticNonCrisis ? ["non_crisis_idiom"] : ["everyday_conversation"],
    requiresImmediateSupport: false
  };
}
