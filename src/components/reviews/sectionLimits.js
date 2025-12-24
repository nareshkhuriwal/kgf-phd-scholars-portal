// src/components/reviews/sectionLimits.js

export const SECTION_LIMITS = {
  // Anchor section (as confirmed by you)
  'Literature Review': {
    minWords: 150,
    minChars: 1000,
  },

  // Concise problem definition
  'Key Issue': {
    minWords: 50,
    minChars: 300,
  },

  // Methodology requires explanation, but shorter than full review
  'Solution Approach / Methodology used': {
    minWords: 60,
    minChars: 400,
  },

  // Comparable depth to methodology
  'Related Work': {
    minWords: 60,
    minChars: 400,
  },

  // Mostly descriptive
  'Input Parameters used': {
    minWords: 40,
    minChars: 250,
  },

  // Infrastructure/tools summary
  'Hardware / Software / Technology Used': {
    minWords: 60,
    minChars: 400,
  },

  // Outcomes and evaluation
  'Results': {
    minWords: 60,
    minChars: 400,
  },

  // Strengths summary
  'Key advantages': {
    minWords: 60,
    minChars: 400,
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
    minWords: 30,
    minChars: 150,
  },
};
