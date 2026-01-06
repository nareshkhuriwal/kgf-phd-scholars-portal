/* =========================================================
   GLOBAL DOCUMENT FORMATTING CONFIG
   Journal-safe (IEEE / Springer / Elsevier compatible)
========================================================= */

export const DOCUMENT_FORMATTING = {
  font: {
    family: "Times New Roman",

    bodySizePt: 12,

    title: {
      sizePt: 14,              // Journal standard
      spacingAfterPt: 36,
    },

    heading: {
      h1: 14,
      h2: 13,
      h3: 12,
      spacingBeforePt: 24,
      spacingAfterPt: 12,
    },
  },

  paragraph: {
    alignment: "JUSTIFIED",
    lineSpacing: 1.5,
    firstLineIndentInch: 0.5,
    spacingBeforePt: 0,
    spacingAfterPt: 6,
  },

  page: {
    marginInch: {
      top: 1.25,        // ✅ journal-safe
      bottom: 1.25,
      left: 1.25,
      right: 1.25,
    },
  },

  column: {
    single: {
      count: 1,
    },
    double: {
      count: 2,
      spaceInch: 0.25,  // ✅ column gap standard
    },
  },
};
