import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import { htmlToDocxParagraphs } from "./../exporters/htmlToDocx.js";
import { fetchImageBuffer } from "./../exporters/fetchImage.js";
import buildHeader from "./buildHeader.js";
import { buildArabicFooter } from "./buildFooter.js";
import { DOCUMENT_FORMATTING } from "../../config/documentFormatting.config.js";

/* ---------------------------------------------------------
   DOCX UNIT HELPERS
--------------------------------------------------------- */

const PT_TO_HALF_POINTS = (pt) => pt * 2;
const INCH_TO_TWIP = (inch) => inch * 1440;

/* ---------------------------------------------------------
   DERIVED GLOBAL DOCX STYLES (FROM CONFIG)
--------------------------------------------------------- */

const BODY_RUN = {
  font: DOCUMENT_FORMATTING.font.family,
  size: PT_TO_HALF_POINTS(DOCUMENT_FORMATTING.font.bodySizePt),
};

const BODY_PARAGRAPH = {
  alignment: AlignmentType[DOCUMENT_FORMATTING.paragraph.alignment],
  spacing: {
    line: DOCUMENT_FORMATTING.paragraph.lineSpacing === 1.5 ? 360 : 240,
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

const HEADING_PARAGRAPH = {
  spacing: {
    before: 240,
    after: 120,
  },
};

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function hasMeaningfulContent(html = "") {
  if (!html) return false;
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

function isIntroductionChapter(title = "") {
  const t = title.toLowerCase().trim();
  return t === "introduction" || t.startsWith("introduction");
}

function pushPageBreakIfNeeded(children) {
  const last = children[children.length - 1];
  if (!last?.options?.pageBreakBefore) {
    children.push(new Paragraph({ pageBreakBefore: true }));
  }
}

function normalizeParagraph(p) {
  p.options = { ...p.options, ...BODY_PARAGRAPH };
  p.root?.forEach(run => {
    run.options = { ...run.options, ...BODY_RUN };
  });
  return p;
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
          alignment: AlignmentType.CENTER,
          spacing: { after: 500 },
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
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, ...BODY_RUN })],
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
      ...HEADING_PARAGRAPH,
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
    paras.forEach(p => children.push(normalizeParagraph(p)));
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

  const children = [];
  let literatureInserted = false;

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: name,
          ...HEADING_RUN("h1"),
        }),
      ],
    })
  );

  for (const ch of chapters) {
    const title = ch.title || "";
    const body = ch.body_html || ch.body || "";

    if (title.toUpperCase() === "TITLE PAGE") {
      const blocks = await buildTitlePage(body);
      blocks.forEach(b => children.push(b));
      pushPageBreakIfNeeded(children);
      continue;
    }

    if (!hasMeaningfulContent(body)) continue;

    const paras = await htmlToDocxParagraphs(body);
    paras.forEach(p => children.push(normalizeParagraph(p)));

    if (!literatureInserted && isIntroductionChapter(title)) {
      pushPageBreakIfNeeded(children);
      await appendLiterature(children, literature);
      pushPageBreakIfNeeded(children);
      literatureInserted = true;
    } else {
      pushPageBreakIfNeeded(children);
    }
  }

  if (!literatureInserted) {
    pushPageBreakIfNeeded(children);
    await appendLiterature(children, literature);
  }

  if (children.at(-1)?.options?.pageBreakBefore) {
    children.pop();
  }

  const doc = new Document({
    sections: [
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
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${name}.docx`);
}
