import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import { htmlToDocxParagraphs } from "../exporters/htmlToDocx.js";
import { fetchImageBuffer } from "../exporters/fetchImage.js";
import buildHeader from "./buildHeader.js";
import { buildArabicFooter } from "./buildFooter.js";
import { DOCUMENT_FORMATTING } from "../../config/documentFormatting.config.js";

/* ---------------------------------------------------------
   UNIT HELPERS
--------------------------------------------------------- */

const PT_TO_HALF_POINTS = (pt) => pt * 2;
const INCH_TO_TWIP = (inch) => inch * 1440;

/* ---------------------------------------------------------
   STYLES
--------------------------------------------------------- */

const BODY_RUN = {
  font: DOCUMENT_FORMATTING.font.family,
  size: PT_TO_HALF_POINTS(DOCUMENT_FORMATTING.font.bodySizePt),
};

const HEADING_RUN = (level) => ({
  font: DOCUMENT_FORMATTING.font.family,
  bold: true,
  size: PT_TO_HALF_POINTS(DOCUMENT_FORMATTING.font.heading[level]),
});

const BODY_PARAGRAPH = {
  alignment: AlignmentType[DOCUMENT_FORMATTING.paragraph.alignment],
  spacing: {
    line: DOCUMENT_FORMATTING.paragraph.lineSpacing === 1.5 ? 360 : 240,
    before: DOCUMENT_FORMATTING.paragraph.spacingBeforePt,
    after: DOCUMENT_FORMATTING.paragraph.spacingAfterPt,
  },
};

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function hasMeaningfulContent(html = "") {
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

function isIntroduction(title = "") {
  const t = title.toLowerCase();
  return t === "introduction" || t.startsWith("introduction");
}

/* ---------------------------------------------------------
   TITLE PAGE BUILDER
--------------------------------------------------------- */

async function buildTitlePage(html) {
  const container = document.createElement("div");
  container.innerHTML = html;

  const blocks = [];

  // for (const node of container.childNodes) {
  //   if (node.nodeType !== Node.ELEMENT_NODE) continue;

  for (const node of container.childNodes) {

  /* -----------------------------
     TEXT NODE (IMPORTANT FIX)
  ----------------------------- */
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();

    if (text) {
      blocks.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
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

    /* TITLE */
    if (node.tagName === "H2") {
      blocks.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [
            new TextRun({
              text: node.innerText.trim(),
              ...HEADING_RUN("h1"),
            }),
          ],
        })
      );
      continue;
    }

    /* IMAGE */
    if (node.tagName === "IMG" || node.tagName === "FIGURE") {
      const img = node.tagName === "IMG" ? node : node.querySelector("img");
      const src = img?.getAttribute("src");

      if (src) {
        const buffer = await fetchImageBuffer(src);
        if (buffer) {
          blocks.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 400 },
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

    /* CENTER TEXT */
    const text = node.textContent?.trim();
    if (!text) continue;

    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text,
            ...BODY_RUN,
            bold: node.tagName === "STRONG",
          }),
        ],
      })
    );
  }

  return blocks;
}

/* ---------------------------------------------------------
   LITERATURE BUILDER
--------------------------------------------------------- */

async function appendLiterature(children, literature) {
  if (!literature?.length) return;

  children.push(
    new Paragraph({
      spacing: { before: 300, after: 200 },
      children: [
        new TextRun({
          text: "REVIEW OF LITERATURE",
          ...HEADING_RUN("h2"),
        }),
      ],
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
      children.push(
        new Paragraph({
          ...BODY_PARAGRAPH,
          children: [
            new TextRun({
              text: [item.title, item.authors, item.year]
                .filter(Boolean)
                .join(" • "),
              ...BODY_RUN,
              bold: true,
            }),
          ],
        })
      );
    }

    const paras = await htmlToDocxParagraphs(html);
    paras.forEach(p => children.push(p));
  }
}

/* ---------------------------------------------------------
   MAIN EXPORT
--------------------------------------------------------- */

export async function exportSynopsisDocx(data) {
  const {
    name = "Synopsis",
    chapters = [],
    literature = [],
    headerFooter = {},
  } = data || {};

  const {
    headerTitle = name,
    headerRight = "SET",
    footerLeft = "Poornima University, Jaipur",
    footerCenter = new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  } = headerFooter;

  /* -------------------------------
     SECTION CONTENT BUCKETS
  -------------------------------- */

  const titlePageChildren = [];
  const bodyChildren = [];

  let literatureInserted = false;

  /* -------------------------------
     CHAPTER LOOP
  -------------------------------- */

  for (const ch of chapters) {
    const title = ch.title || "";
    const body = ch.body_html || ch.body || "";

    /* TITLE PAGE */
    if (title.toUpperCase() === "TITLE PAGE") {
      const blocks = await buildTitlePage(body);
      blocks.forEach(b => titlePageChildren.push(b));
      continue;
    }

    if (!hasMeaningfulContent(body)) continue;

    /* CHAPTER CONTENT */
    const paras = await htmlToDocxParagraphs(body);
    paras.forEach(p => bodyChildren.push(p));

    /* INSERT LITERATURE AFTER INTRO */
    if (!literatureInserted && isIntroduction(title)) {
      bodyChildren.push(new Paragraph({ pageBreakBefore: true }));
      await appendLiterature(bodyChildren, literature);
      literatureInserted = true;
    }

    bodyChildren.push(new Paragraph({ pageBreakBefore: true }));
  }

  if (!literatureInserted && literature.length) {
    bodyChildren.push(new Paragraph({ pageBreakBefore: true }));
    await appendLiterature(bodyChildren, literature);
  }

  /* CLEAN TRAILING PAGE BREAK */
  if (bodyChildren.at(-1)?.options?.pageBreakBefore) {
    bodyChildren.pop();
  }

  /* -------------------------------
     DOCUMENT WITH SECTIONS
  -------------------------------- */

  const doc = new Document({
    sections: [
      /* TITLE PAGE (NO HEADER / FOOTER) */
      {
        properties: {
          page: {
            margin: {
              top: INCH_TO_TWIP(1.5),
              bottom: INCH_TO_TWIP(1.5),
              left: INCH_TO_TWIP(1.25),
              right: INCH_TO_TWIP(1.25),
            },
          },
        },
        children: titlePageChildren,
      },

      /* MAIN CONTENT */
      {
        properties: {
          page: {
            margin: {
              top: INCH_TO_TWIP(DOCUMENT_FORMATTING.page.marginInch.top),
              bottom: INCH_TO_TWIP(DOCUMENT_FORMATTING.page.marginInch.bottom),
              left: INCH_TO_TWIP(DOCUMENT_FORMATTING.page.marginInch.left),
              right: INCH_TO_TWIP(DOCUMENT_FORMATTING.page.marginInch.right),
              header: INCH_TO_TWIP(DOCUMENT_FORMATTING.page.headerDistanceInch),
              footer: INCH_TO_TWIP(DOCUMENT_FORMATTING.page.footerDistanceInch),
            },
          },
        },
        headers: { default: buildHeader(headerTitle, headerRight) },
        footers: { default: buildArabicFooter(footerLeft, footerCenter) },
        children: bodyChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${name}.docx`);
}
