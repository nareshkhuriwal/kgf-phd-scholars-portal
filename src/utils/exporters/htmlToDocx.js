import {
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { fetchImageBuffer } from "./fetchImage";
import { DOCUMENT_FORMATTING } from "../../config/documentFormatting.config.js";

/* ---------------------------------------------------------
   DOCX UNIT HELPERS
--------------------------------------------------------- */

const PT_TO_HALF_POINTS = (pt) => pt * 2;
const INCH_TO_TWIP = (inch) => inch * 1440;

/* ---------------------------------------------------------
   DERIVED GLOBAL STYLES (FROM CONFIG)
--------------------------------------------------------- */

const BODY_RUN = {
  font: DOCUMENT_FORMATTING.font.family,
  size: PT_TO_HALF_POINTS(DOCUMENT_FORMATTING.font.bodySizePt),
};

const BODY_PARAGRAPH = {
  alignment: AlignmentType[DOCUMENT_FORMATTING.paragraph.alignment],
  spacing: {
    line:
      DOCUMENT_FORMATTING.paragraph.lineSpacing === 1.5
        ? 360
        : 240,
    before: DOCUMENT_FORMATTING.paragraph.spacingBeforePt,
    after: DOCUMENT_FORMATTING.paragraph.spacingAfterPt,
  },
  indent: {
    firstLine: INCH_TO_TWIP(
      DOCUMENT_FORMATTING.paragraph.firstLineIndentInch
    ),
  },
};

const HEADING_RUN = (level) => ({
  font: DOCUMENT_FORMATTING.font.family,
  bold: true,
  size: PT_TO_HALF_POINTS(
    DOCUMENT_FORMATTING.font.heading[level]
  ),
});

/* ---------------------------------------------------------
   MAIN HTML → DOCX PARSER
--------------------------------------------------------- */

export async function htmlToDocxParagraphs(html) {
  if (!html) return [];

  const container = document.createElement("div");
  container.innerHTML = html;

  const blocks = [];

  for (const node of container.childNodes) {

    /* -----------------------------
       TEXT NODE
    ----------------------------- */
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push(
          new Paragraph({
            ...BODY_PARAGRAPH,
            children: [
              new TextRun({
                text,
                ...BODY_RUN,
              }),
            ],
          })
        );
      }
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const tag = node.tagName.toLowerCase();

    /* -----------------------------
       HEADINGS (H1 / H2 / H3)
    ----------------------------- */
    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const level = tag === "h1" ? "h1" : tag === "h2" ? "h2" : "h3";

      blocks.push(
        new Paragraph({
          alignment:
            node.style.textAlign === "center"
              ? AlignmentType.CENTER
              : AlignmentType.LEFT,
          spacing: {
            before: 240,
            after: 120,
          },
          children: [
            new TextRun({
              text: node.innerText.trim(),
              ...HEADING_RUN(level),
            }),
          ],
        })
      );
      continue;
    }

    /* -----------------------------
       PARAGRAPH
    ----------------------------- */
    if (tag === "p") {
      const runs = parseInline(node);
      if (runs.length) {
        blocks.push(
          new Paragraph({
            ...BODY_PARAGRAPH,
            children: runs,
          })
        );
      }
      continue;
    }

    /* -----------------------------
       TABLE
    ----------------------------- */
    if (tag === "table" || (tag === "figure" && node.querySelector("table"))) {
      const tableEl = tag === "table" ? node : node.querySelector("table");
      if (!tableEl) continue;

      const rows = [];

      tableEl.querySelectorAll("tr").forEach((tr) => {
        const cells = [];

        tr.querySelectorAll("th, td").forEach((td) => {
          const cellText = td.innerText?.trim() || " ";

          cells.push(
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  ...BODY_PARAGRAPH,
                  indent: undefined, // No first-line indent in tables
                  children: [
                    new TextRun({
                      text: cellText,
                      ...BODY_RUN,
                    }),
                  ],
                }),
              ],
            })
          );
        });

        if (cells.length) {
          rows.push(new TableRow({ children: cells }));
        }
      });

      if (rows.length) {
        blocks.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          })
        );
      }
      continue;
    }

    /* -----------------------------
       IMAGE
    ----------------------------- */
    if (tag === "img" || tag === "figure") {
      const img = tag === "img" ? node : node.querySelector("img");
      const src = img?.getAttribute("src");

      if (src) {
        const buffer = await fetchImageBuffer(src);
        if (buffer) {
          blocks.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 240, after: 240 },
              children: [
                new ImageRun({
                  data: new Uint8Array(buffer),
                  transformation: {
                    width: 160,
                    height: 160,
                  },
                }),
              ],
            })
          );
        }
      }
      continue;
    }
  }

  return blocks;
}

/* ---------------------------------------------------------
   INLINE TEXT PARSER
--------------------------------------------------------- */

function parseInline(node) {
  const runs = [];

  node.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const txt = n.textContent;
      if (txt?.trim()) {
        runs.push(
          new TextRun({
            text: txt,
            ...BODY_RUN,
          })
        );
      }
    }

    if (n.nodeType === Node.ELEMENT_NODE) {
      if (n.tagName === "STRONG") {
        runs.push(
          new TextRun({
            text: n.innerText,
            bold: true,
            ...BODY_RUN,
          })
        );
      }

      if (n.tagName === "EM") {
        runs.push(
          new TextRun({
            text: n.innerText,
            italics: true,
            ...BODY_RUN,
          })
        );
      }
    }
  });

  return runs;
}
