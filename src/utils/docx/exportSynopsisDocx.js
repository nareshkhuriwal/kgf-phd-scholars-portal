// src/exporters/synopsisDocx.js
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";

import { saveAs } from "file-saver";
import { htmlToDocxParagraphs } from "./../exporters/htmlToDocx.js";
import { ImageRun } from "docx";
import { fetchImageBuffer } from "./../exporters/fetchImage.js";
import buildHeader from "./buildHeader.js";
import { buildArabicFooter } from "./buildFooter.js";

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function isIntroductionChapter(title = "") {
  const t = title.toLowerCase().trim();
  const keys = ["introduction", "intro"];
  return keys.some(
    k => t === k || t.startsWith(k) || t.includes(` ${k}`) || t.includes(`${k} `)
  );
}

async function appendLiterature(docChildren, literature) {
  if (!literature?.length) return;

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

    paras.forEach(p => docChildren.push(p));
  }

  // Page break after literature
  docChildren.push(new Paragraph({ pageBreakBefore: true }));
}

/* ---------------------------------------------------------
   TITLE PAGE BUILDER
--------------------------------------------------------- */

async function buildTitlePage(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  const blocks = [];

  for (const node of container.childNodes) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    if (node.tagName === "H2") {
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

    if (node.tagName === "FIGURE") {
      const img = node.querySelector("img");
      const src = img?.getAttribute("src");

      if (src) {
        const buffer = await fetchImageBuffer(src);
        if (buffer) {
          blocks.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 300, after: 300 },
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
      continue;
    }

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

/* ---------------------------------------------------------
   MAIN EXPORT FUNCTION
--------------------------------------------------------- */

export async function exportSynopsisDocx(synopsisData) {
  const {
    name = "Synopsis",
    kpis = [],
    literature = [],
    chapters = [],
    headerFooter = {},
  } = synopsisData || {};

  const {
    headerTitle = name,
    headerRight = "SET",
    footerLeft = "Poornima University, Jaipur",
    footerCenter = new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  } = headerFooter;

  const docChildren = [];

  /* -------- DOCUMENT TITLE -------- */
  docChildren.push(
    new Paragraph({
      text: name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  /* -------- KPIs -------- */
  if (kpis.length) {
    docChildren.push(
      new Paragraph({
        text: "Summary",
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      })
    );

    kpis.forEach(k =>
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${k.label}: `, bold: true }),
            new TextRun(String(k.value ?? "")),
          ],
          spacing: { after: 120 },
        })
      )
    );
  }

  /* -------- CHAPTERS + CONDITIONAL LITERATURE -------- */
  let literatureInserted = false;

  if (chapters.length) {
    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      const title = ch.title || "";

      // TITLE PAGE
      if (title.trim().toUpperCase() === "TITLE PAGE") {
        const blocks = await buildTitlePage(ch.body_html || "");
        blocks.forEach(p => docChildren.push(p));
        docChildren.push(new Paragraph({ pageBreakBefore: true }));
        continue;
      }

      // CHAPTER CONTENT
      const paras = await htmlToDocxParagraphs(ch.body_html || ch.body || "");
      paras.forEach(p => docChildren.push(p));

      // INSERT LITERATURE AFTER INTRODUCTION
      if (!literatureInserted && isIntroductionChapter(title)) {
        await appendLiterature(docChildren, literature);
        literatureInserted = true;
      }

      if (i < chapters.length - 1) {
        docChildren.push(new Paragraph({ pageBreakBefore: true }));
      }
    }
  }

  /* -------- FALLBACK: NO INTRODUCTION -------- */
  if (!literatureInserted) {
    await appendLiterature(docChildren, literature);
  }

  /* -------- FINAL DOCUMENT -------- */
  const doc = new Document({
    sections: [
      {
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
