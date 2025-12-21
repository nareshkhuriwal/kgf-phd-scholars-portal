// src/exporters/synopsisDocx.js
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
  ImageRun,
} from "docx";

import { saveAs } from "file-saver";
import { htmlToDocxParagraphs } from "./../exporters/htmlToDocx.js";
import { fetchImageBuffer } from "./../exporters/fetchImage.js";
import buildHeader from "./buildHeader.js";
import { buildArabicFooter } from "./buildFooter.js";

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function hasMeaningfulContent(html = "") {
  if (!html) return false;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, "")
    .trim();
  return text.length > 0;
}

function isIntroductionChapter(title = "") {
  const t = title.toLowerCase().trim();
  const keys = ["introduction", "intro"];
  return keys.some(
    k =>
      t === k ||
      t.startsWith(k) ||
      t.includes(` ${k}`) ||
      t.includes(`${k} `)
  );
}

function pushPageBreakIfNeeded(children) {
  if (!children.length) return;
  const last = children[children.length - 1];
  if (last?.options?.pageBreakBefore) return;
  children.push(new Paragraph({ pageBreakBefore: true }));
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
   LITERATURE BUILDER (CONTINUOUS, NO BLANK PAGES)
--------------------------------------------------------- */

async function appendLiterature(docChildren, literature) {
  if (!Array.isArray(literature) || literature.length === 0) return;

  docChildren.push(
    new Paragraph({
      text: "Literature Review",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 },
    })
  );

  for (const item of literature) {
    const html =
      item.html ||
      item.reviewHtml ||
      item.body_html ||
      item.text ||
      "";

    if (!hasMeaningfulContent(html)) continue;

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
          spacing: { before: 240, after: 120 },
        })
      );
    }

    const paras = await htmlToDocxParagraphs(html);
    paras.forEach(p => docChildren.push(p));
  }
}

/* ---------------------------------------------------------
   MAIN EXPORT
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

  /* -------- CHAPTERS -------- */
  let literatureInserted = false;

  for (const ch of chapters) {
    const title = ch.title || "";
    const body = ch.body_html || ch.body || "";

    // TITLE PAGE
    if (title.trim().toUpperCase() === "TITLE PAGE") {
      if (hasMeaningfulContent(body)) {
        const blocks = await buildTitlePage(body);
        blocks.forEach(p => docChildren.push(p));
        pushPageBreakIfNeeded(docChildren);
      }
      continue;
    }

    if (!hasMeaningfulContent(body)) continue;

    const paras = await htmlToDocxParagraphs(body);
    if (!paras.length) continue;

    paras.forEach(p => docChildren.push(p));

    if (!literatureInserted && isIntroductionChapter(title)) {
      pushPageBreakIfNeeded(docChildren);
      await appendLiterature(docChildren, literature);
      pushPageBreakIfNeeded(docChildren);
      literatureInserted = true;
    } else {
      pushPageBreakIfNeeded(docChildren);
    }
  }

  /* -------- FALLBACK LITERATURE -------- */
  if (!literatureInserted) {
    pushPageBreakIfNeeded(docChildren);
    await appendLiterature(docChildren, literature);
  }

  /* -------- REMOVE TRAILING PAGE BREAK -------- */
  const last = docChildren[docChildren.length - 1];
  if (last?.options?.pageBreakBefore) {
    docChildren.pop();
  }

  /* -------- FINAL DOC -------- */
  const doc = new Document({
    sections: [
      {
        headers: { default: buildHeader(headerTitle, headerRight) },
        footers: { default: buildArabicFooter(footerLeft, footerCenter) },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${name || "Synopsis"}.docx`);
}
