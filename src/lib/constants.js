// Data constants extracted from historywrite.html (lines 859–1202)
// These will be imported by components

export const ESSAY_TYPES = {
  SAQ: 'saq',
  LEQ: 'leq',
  DBQ: 'dbq'
}

// Block templates will be defined here
// Extract from HTML lines 860-911
export const BLOCK_TEMPLATES = {
  saq: (prompt, parts = 3) => [],
  leq: (prompt) => [],
  dbq: (prompt, sources = []) => []
}

// Essay block prompts extracted from HTML lines 913-1020
export const ESSAY_BLOCKS_PROMPTS = []

// Thesis judge bank from HTML lines 1022-1038
export const THESIS_JUDGE_BANK = []

// Evidence bank from HTML lines 1040-1051
export const EVIDENCE_BANK = []

// Block Blast MCQ bank from HTML lines 1053+
export const BB_QUESTIONS = []

// Story lessons data from HTML lines 1088-1202
export const STORY_LESSONS = []

// Skill types and progression
export const SKILL_TYPES = {
  THESIS: 'thesis',
  EVIDENCE: 'evidence',
  REASONING: 'reasoning',
  COMPLEXITY: 'complexity',
  ANALYSIS: 'analysis'
}

// Default gamification stats
export function getDefaultStats() {
  return {
    level: 1,
    xp: 0,
    streaks: {},
    mastery: {},
    essays_completed: 0
  }
}
