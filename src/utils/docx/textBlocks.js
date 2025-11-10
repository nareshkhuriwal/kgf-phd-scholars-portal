// src/utils/docx/textBlocks.js
import { Paragraph, TextRun } from "docx";

/**
 * Build a Paragraph that preserves single `\n` as line breaks.
 * The first line is a TextRun; subsequent lines are TextRuns with break: 1.
 */
export function paragraphWithLineBreaks(text, paragraphOpts = {}) {
  const parts = String(text ?? "").split("\n");
  const runs = [];

  parts.forEach((segment, idx) => {
    if (idx === 0) {
      runs.push(new TextRun({ text: segment ?? "" }));
    } else {
      runs.push(new TextRun({ text: segment ?? "", break: 1 }));
    }
  });

  return new Paragraph({ children: runs, ...paragraphOpts });
}

/**
 * Split text by double-newline into multiple paragraphs.
 * Single `\n` inside each block becomes line breaks via paragraphWithLineBreaks.
 */
export function paragraphsFromText(text, paragraphOpts = {}) {
  const blocks = String(text ?? "").split(/\n{2,}/g);
  return blocks.map(block => paragraphWithLineBreaks(block, paragraphOpts));
}
