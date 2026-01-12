/**
 * Phrase patterns for detecting teaching/explanation moments
 * in dev stream transcripts.
 *
 * Customize these based on your speaking style!
 */

export const TEACHING_PATTERNS = {
  // High confidence explanation starters (+3 score)
  highConfidence: [
    // Concept explanations
    "so what we're doing here is",
    "the reason for this is",
    "let me explain",
    "basically what's happening",
    "the key insight is",
    "here's the trick",
    "the important thing to understand",
    "what this does is",
    "the way this works is",
    "so the idea is",
    "here's why this matters",
    "the cool thing about this",
    "what's interesting here is",
    "the pattern here is",

    // Teaching mode
    "let me show you",
    "watch what happens when",
    "notice how",
    "pay attention to",
    "the thing to remember is",
    "keep in mind that",
  ],

  // Process narration (+1.5 score)
  mediumConfidence: [
    "first we need to",
    "next step is",
    "now we're going to",
    "let's see if this works",
    "okay so",
    "alright so",
    "the problem is",
    "the solution is",
    "what I'm thinking is",
    "my approach here is",
    "so now we",
    "and then we",
    "from here we",
    "at this point",
  ],

  // Realization/discovery moments (+4 score - high value!)
  realizationMoments: [
    "oh that's why",
    "ah I see",
    "wait that means",
    "oh interesting",
    "that's the issue",
    "found it",
    "there we go",
    "that's it",
    "boom",
    "perfect",
    "nice",
    "let's go",
    "there it is",
    "got it",
    "yes",
    "finally",
    "that worked",
  ],

  // Technical term indicators (+1 score when combined)
  technicalTerms: [
    "function",
    "component",
    "api",
    "endpoint",
    "database",
    "query",
    "hook",
    "state",
    "async",
    "promise",
    "typescript",
    "interface",
    "type",
    "import",
    "export",
    "module",
    "package",
    "dependency",
    "error",
    "debug",
  ],
};

// Scoring weights
export const SCORE_WEIGHTS = {
  highConfidence: 3.0,
  mediumConfidence: 1.5,
  realizationMoments: 4.0,
  technicalTerms: 0.5,
  longExplanation: 1.0,      // >30 words
  veryLongExplanation: 1.5,  // >50 words
  questionAnswer: 1.0,       // Contains ? and .
};

// Motion detection thresholds
export const MOTION_CONFIG = {
  sceneChangeThreshold: 0.1,    // FFmpeg scene detection sensitivity
  highActivityDensity: 0.5,     // Changes per second for "high"
  mediumActivityDensity: 0.2,   // Changes per second for "medium"
  windowSize: 10,               // Analysis window in seconds
  minActivityDuration: 3,       // Minimum seconds to count
};

// Signal fusion weights
export const FUSION_WEIGHTS = {
  transcript: 2.0,   // Explanations most valuable
  motion: 1.5,       // Active coding valuable
  audio: 1.0,        // Supporting signal
};

// Clip type classification thresholds
export const CLIP_TYPE_THRESHOLDS = {
  explanation: { transcript: 5, motion: 3 },      // High speech, low motion
  buildMoment: { transcript: 3, motion: 7 },      // Low speech, high motion
  demo: { transcript: 3, motion: 5 },             // Both present
  ahaMoment: { realizationScore: 4 },             // Realization pattern
};
