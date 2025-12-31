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
  // indent: {
  //   firstLine: INCH_TO_TWIP(
  //     DOCUMENT_FORMATTING.paragraph.firstLineIndentInch
  //   ),
  // },
};

const HEADING_RUN = (level) => ({
  font: DOCUMENT_FORMATTING.font.family,
  bold: true,
  size: PT_TO_HALF_POINTS(
    DOCUMENT_FORMATTING.font.heading[level]
  ),
});

/* ---------------------------------------------------------
   TITLE PAGE DOCX BUILDER (NEW)
--------------------------------------------------------- */
export function normalizeHtmlForDocx(html = "") {
  if (!html) return "";

  // 1️⃣ Protect block-level elements (IMG, FIGURE, TABLE)
  const protectedBlocks = [];
  html = html.replace(
    /<(img|figure|table)[\s\S]*?>/gi,
    (match) => {
      const key = `__BLOCK_${protectedBlocks.length}__`;
      protectedBlocks.push(match);
      return key;
    }
  );

  // 2️⃣ Your existing logic (unchanged)
  html = html
    // Wrap loose text blocks into paragraphs
    .replace(/(^|\n)\s*([A-Za-z])/g, '<p>$2')
    .replace(/\n\s*\n+/g, '</p><p>')
    .replace(/<\/p>\s*<p>/g, '</p><p>')

    // Strong-only lines (signature blocks)
    .replace(
      /(^|\n)\s*<strong>([^<]+)<\/strong>\s*(?=\n|$)/g,
      '<p><strong>$2</strong></p>'
    )

    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')

    // Ensure wrapper
    .replace(/^(?!<p|<h|<ul|<ol|<table|<figure)/i, '<p>')
    .replace(/(?<!<\/p>)$/i, '</p>');

  // 3️⃣ Restore protected blocks
  protectedBlocks.forEach((block, i) => {
    html = html.replace(`__BLOCK_${i}__`, block);
  });

  return html;
}




//container.innerHTML = normalizeHtmlForDocx(html);


export async function buildTitlePageDocx(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  // container.innerHTML = normalizeHtmlForDocx(html);

  const getText = (selector) =>
    container.querySelector(selector)?.innerText?.trim() || "";

  const strongs = Array.from(container.querySelectorAll("strong"))
    .map((el) => el.innerText.trim())
    .filter(Boolean);

  const imgSrc = container.querySelector("img")?.getAttribute("src");

  const title = getText("h2");
  const scholar =
    container.innerText.match(/by\s+(.*)\s+\(/)?.[1] || "";
  const regNo =
    container.innerText.match(/\(([^)]+)\)/)?.[1] || "";

  const supervisor = {
    name: strongs.find((t) => t.startsWith("Dr.")) || "",
    department: strongs.find((t) => t.includes("Department")) || "",
    school: strongs.find((t) => t.includes("School")) || "",
    university: strongs.find((t) => t.includes("University")) || "",
  };

  const date = strongs.find((t) => /\d{4}$/.test(t)) || "";

  const blocks = [];

  /* ---------------- TITLE ---------------- */
  blocks.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `“${title}”`,
          bold: true,
          size: 32,
          font: DOCUMENT_FORMATTING.font.family,
        }),
      ],
    })
  );

  /* ---------------- DEGREE BLOCK ---------------- */
  const degreeLines = [
    "A Synopsis Submitted in partial fulfillment for the award of degree of",
    "Doctor of Philosophy",
    "in",
    "Department of Engineering & Technology",
    `by ${scholar}`,
    `(${regNo})`,
  ];

  degreeLines.forEach((line) => {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: line,
            ...BODY_RUN,
            bold: line === "Doctor of Philosophy",
          }),
        ],
      })
    );
  });

  /* ---------------- LOGO ---------------- */
  if (imgSrc) {
    const buffer = await fetchImageBuffer(imgSrc);
    if (buffer) {
      blocks.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
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

  /* ---------------- SUPERVISOR ---------------- */
  blocks.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 200 },
      children: [
        new TextRun({
          text: "Under the supervision of",
          ...BODY_RUN,
          bold: true,
        }),
      ],
    })
  );

  [
    supervisor.name,
    supervisor.department,
    supervisor.school,
    supervisor.university,
    date,
  ].forEach((line) => {
    if (!line) return;
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: line,
            ...BODY_RUN,
            bold: line === supervisor.name,
          }),
        ],
      })
    );
  });

  return blocks;
}

/* ---------------------------------------------------------
   MAIN HTML → DOCX PARSER (UNCHANGED)
--------------------------------------------------------- */

export async function htmlToDocxParagraphs(html, options = {}) {
  if (!html) return [];

  const container = document.createElement("div");
  // container.innerHTML = html;
  container.innerHTML = normalizeHtmlForDocx(html);

  const EFFECTIVE_BODY_PARAGRAPH = {
    ...BODY_PARAGRAPH,
    ...(options.noFirstLineIndent && {
      indent: { firstLine: 0, left: 0, right: 0 },
    }),
    ...(options.forceJustified && {
      alignment: AlignmentType.JUSTIFIED,
    }),
  };


  const blocks = [];

  for (const node of container.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push(
          new Paragraph({
            ...EFFECTIVE_BODY_PARAGRAPH,
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

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const level = tag === "h1" ? "h1" : tag === "h2" ? "h2" : "h3";

      blocks.push(
        new Paragraph({
          alignment:
            node.style.textAlign === "center"
              ? AlignmentType.CENTER
              : AlignmentType.LEFT,
          spacing: { before: 240, after: 240 },
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

    /* -------- STRONG AS BLOCK HEADING (TIMELINE FIX) -------- */
    if (tag === "strong" && node.innerText.trim()) {
      blocks.push(
        new Paragraph({
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: node.innerText.trim(),
              bold: true,
              ...BODY_RUN,
            }),
          ],
        })
      );
      continue;
    }


    if (tag === "p") {
      const runs = parseInline(node);
      if (runs.length) {
        blocks.push(
          new Paragraph({
            ...EFFECTIVE_BODY_PARAGRAPH,
            children: runs,
          })
        );
      }
      continue;
    }

    /* -------- LIST HANDLING -------- */
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(node.querySelectorAll("li"));

      items.forEach(li => {
        const text = li.innerText.trim();
        if (!text) return;

        blocks.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 120, after: 120, line: 360 },
            children: [
              new TextRun({
                text: `• ${text}`,
                ...BODY_RUN,
              }),
            ],
          })
        );
      });

      continue;
    }


    if (tag === "table" || (tag === "figure" && node.querySelector("table"))) {
      const tableEl = tag === "table" ? node : node.querySelector("table");
      if (!tableEl) continue;

      const rows = [];

      tableEl.querySelectorAll("tr").forEach((tr) => {
        const cells = [];

        tr.querySelectorAll("th, td").forEach((td) => {
          cells.push(
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  ...BODY_PARAGRAPH,
                  indent: undefined,
                  children: [
                    new TextRun({
                      text: td.innerText?.trim() || " ",
                      ...BODY_RUN,
                    }),
                  ],
                }),
              ],
            })
          );
        });

        rows.push(new TableRow({ children: cells }));
      });

      blocks.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        })
      );
      continue;
    }

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
                  transformation: { width: 160, height: 160 },
                }),
              ],
            })
          );
        }
      }
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

    /* TEXT */
    if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) {
      runs.push(
        new TextRun({
          text: n.textContent,
          ...BODY_RUN,
        })
      );
    }

    /* STRONG */
    if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "STRONG") {
      runs.push(
        new TextRun({
          text: n.innerText,
          bold: true,
          ...BODY_RUN,
        })
      );
    }

    /* EMPHASIS */
    if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "EM") {
      runs.push(
        new TextRun({
          text: n.innerText,
          italics: true,
          ...BODY_RUN,
        })
      );
    }

    /* SPAN (NEW – IMPORTANT) */
    if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "SPAN") {
      const isBold = n.querySelector("strong") !== null;

      runs.push(
        new TextRun({
          text: n.innerText,
          bold: isBold,
          ...BODY_RUN,
        })
      );
    }
  });

  return runs;
}
