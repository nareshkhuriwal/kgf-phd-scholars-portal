/* =========================================================
   GLOBAL DOCUMENT FORMATTING CONFIG
   Used by: DOCX / PDF / Preview
========================================================= */

export const DOCUMENT_FORMATTING = {
  font: {
    family: "Times New Roman",
    bodySizePt: 12,
    heading: {
      h1: 14,
      h2: 13,
      h3: 12,
    },
  },

  paragraph: {
    alignment: "JUSTIFIED",
    lineSpacing: 1.5,          // 1.5 line spacing
    firstLineIndentInch: 0.5,  // First-line indent
    spacingBeforePt: 0,
    spacingAfterPt: 0,
  },

  page: {
    marginInch: {
      top: 1.5,
      bottom: 1.25,
      left: 1.25,
      right: 1.25,
    },
    headerDistanceInch: 0.75,
    footerDistanceInch: 0.75,
  },
};
