// src/components/reviews/sectionLimits.js

export const SECTION_LIMITS = {
  // Anchor section (as confirmed by you)
  'Literature Review': {
    minWords: 150,
    minChars: 1000,
  },

  // Concise problem definition
  'Key Issue': {
    minWords: 100,
    minChars: 600,
  },

  // Methodology requires explanation, but shorter than full review
  'Solution Approach / Methodology used': {
    minWords: 120,
    minChars: 800,
  },

  // Comparable depth to methodology
  'Related Work': {
    minWords: 120,
    minChars: 800,
  },

  // Mostly descriptive
  'Input Parameters used': {
    minWords: 80,
    minChars: 500,
  },

  // Infrastructure/tools summary
  'Hardware / Software / Technology Used': {
    minWords: 60,
    minChars: 400,
  },

  // Outcomes and evaluation
  'Results': {
    minWords: 120,
    minChars: 800,
  },

  // Strengths summary
  'Key advantages': {
    minWords: 80,
    minChars: 500,
  },

  // Critical but brief
  'Limitations': {
    minWords: 60,
    minChars: 400,
  },

  // Explanatory citation notes (not bibliography)
  'Citations': {
    minWords: 40,
    minChars: 200,
  },

  // Reviewer-style notes
  'Remarks': {
    minWords: 60,
    minChars: 300,
  },
};
