// src/exporters/synopsisDocx.js
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
  Header,
  Footer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageNumber,
} from "docx";

import { saveAs } from "file-saver";
import { htmlToDocxParagraphs } from "./../exporters/htmlToDocx.js";
import { ImageRun } from "docx";
import { fetchImageBuffer } from "./../exporters/fetchImage.js";
import buildHeader from "./buildHeader.js";
import { buildArabicFooter, buildRomanFooter } from "./buildFooter.js";

/**
 * Build DOCX paragraphs for TITLE PAGE only
 * (layout-driven, not generic HTML parsing)
 */

function isIntroductionChapter(title = "") {
  const normalized = title.toLowerCase().trim();

  const INTRO_KEYWORDS = [
    "introduction",
    "intro",
  ];

  return INTRO_KEYWORDS.some(k =>
    normalized === k ||
    normalized.startsWith(k) ||
    normalized.includes(` ${k}`) ||
    normalized.includes(`${k} `)
  );
}


async function buildTitlePage(html) {
  console.log('Building title page for DOCX export');
  const container = document.createElement("div");
  container.innerHTML = html;

  const blocks = [];

  for (const node of container.childNodes) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const tag = node.tagName;

    // -----------------------------
    // MAIN TITLE
    // -----------------------------
    if (tag === "H2") {
      blocks.push(
        new Paragraph({
          text: node.innerText.trim(),
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 500 },
        })
      );
      continue;
    }

    // -----------------------------
    // IMAGE (LOGO / QR / SEAL)
    // -----------------------------
    if (tag === "FIGURE") {
      const img = node.querySelector("img");
      const src = img?.getAttribute("src");

      if (src) {
        const buffer = await fetchImageBuffer(src);

        if (buffer) {
          const imageData = new Uint8Array(buffer);

          blocks.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 300, after: 300 },
              children: [
                new ImageRun({
                  data: imageData,
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

    // -----------------------------
    // NORMAL CENTERED TEXT
    // -----------------------------
    const text = node.textContent?.trim();
    if (!text) continue;

    blocks.push(
      new Paragraph({
        text,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  return blocks;
}

export async function exportSynopsisDocx(synopsisData) {
  const {
    name = "Synopsis",
    kpis = [],
    literature = [],
    chapters = [],
    headerFooter = {},
  } = synopsisData || {};

  // Extract header/footer settings with defaults
  const {
    headerTitle = name,
    headerRight = "SET",
    footerLeft = "Poornima University, Jaipur",
    footerCenter = new Date().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  } = headerFooter;

  const docChildren = [];

  // ----------------------------
  // DOCUMENT TITLE
  // ----------------------------
  docChildren.push(
    new Paragraph({
      text: name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // ----------------------------
  // KPIs
  // ----------------------------
  if (kpis.length) {
    docChildren.push(
      new Paragraph({
        text: "Summary",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      })
    );

    for (const k of kpis) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${k.label}: `, bold: true }),
            new TextRun(String(k.value ?? "")),
          ],
          spacing: { after: 120 },
        })
      );
    }
  }

  // ----------------------------
  // CHAPTERS (Literature after Introduction)
  // ----------------------------
  if (chapters.length) {
    for (let idx = 0; idx < chapters.length; idx++) {
      const ch = chapters[idx];
      const normalizedTitle = ch.title?.trim().toUpperCase();

      // 🟢 TITLE PAGE
      if (normalizedTitle === "TITLE PAGE") {
        const titleBlocks = await buildTitlePage(ch.body_html || "");
        titleBlocks.forEach((p) => docChildren.push(p));
        docChildren.push(new Paragraph({ pageBreakBefore: true }));
        continue;
      }

      // 🟡 INTRODUCTION
      // 🟡 INTRODUCTION (robust match)
      if (isIntroductionChapter(ch.title)) {
        const introParas = await htmlToDocxParagraphs(ch.body_html || "");
        introParas.forEach((p) => docChildren.push(p));

        // -------- INSERT LITERATURE REVIEW HERE --------
        if (literature.length) {
          docChildren.push(
            new Paragraph({
              text: "Literature Review",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 200 },
            })
          );

          for (let i = 0; i < literature.length; i++) {
            const item = literature[i];

            if (item.title || item.authors || item.year) {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: [item.title, item.authors, item.year]
                        .filter(Boolean)
                        .join(" • "),
                      bold: true,
                    }),
                  ],
                  spacing: { before: i === 0 ? 120 : 240, after: 120 },
                })
              );
            }

            const paras = await htmlToDocxParagraphs(
              item.html ||
              item.reviewHtml ||
              item.body_html ||
              item.text ||
              ""
            );

            paras.forEach((p) => docChildren.push(p));
          }

          // Page break after literature
          docChildren.push(new Paragraph({ pageBreakBefore: true }));
        }

        continue;
      }


      // 🟡 ALL OTHER CHAPTERS
      const paras = await htmlToDocxParagraphs(ch.body_html || ch.body || "");
      paras.forEach((p) => docChildren.push(p));

      if (idx < chapters.length - 1) {
        docChildren.push(new Paragraph({ pageBreakBefore: true }));
      }
    }
  }

  // ----------------------------
  // FINALIZE DOC
  // ----------------------------
  const doc = new Document({
    sections: [
      {
        properties: {},
        headers: {
          default: buildHeader(headerTitle, headerRight),
        },
        footers: {
          default: buildArabicFooter(footerLeft, footerCenter),
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${name || "Synopsis"}.docx`);
}
