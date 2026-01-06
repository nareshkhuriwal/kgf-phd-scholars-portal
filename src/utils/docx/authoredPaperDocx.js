import {
  Document,
  Packer,
  Paragraph,
  AlignmentType,
  SectionType,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";

import { htmlToDocxParagraphs } from "../exporters/htmlToDocx";
import { DOCUMENT_FORMATTING } from "../../config/paperDocumentFormating";
import { buildIeeeReferencesDocx } from "./buildIeeeReferencesDocx";

/* =====================================================
   SAFE CONVERSIONS (NO NaN EVER)
===================================================== */

const ptToHalfPt = (pt) =>
  Number.isFinite(pt) ? Math.round(pt * 2) : 24;

const inchToTwip = (inch) =>
  Number.isFinite(inch) ? Math.round(inch * 1440) : 1440;

const stripHtml = (html = "") =>
  html.replace(/<[^>]+>/g, "").trim();

/* =====================================================
   PAGE MARGINS
===================================================== */

const PAGE_MARGINS = {
  top: inchToTwip(DOCUMENT_FORMATTING.page.marginInch.top),
  bottom: inchToTwip(DOCUMENT_FORMATTING.page.marginInch.bottom),
  left: inchToTwip(DOCUMENT_FORMATTING.page.marginInch.left),
  right: inchToTwip(DOCUMENT_FORMATTING.page.marginInch.right),
};

/* =====================================================
   EXPORT FUNCTION
===================================================== */

export async function exportPaperDocx(paper, layout = "double") {
  if (!paper) return;

  /* ================= TITLE (SINGLE COLUMN) ================= */

  const titleSection = {
    properties: {
      type: SectionType.CONTINUOUS,
      page: { margin: PAGE_MARGINS },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          after: ptToHalfPt(
            DOCUMENT_FORMATTING.font.title.spacingAfterPt
          ),
        },
        children: [
          new TextRun({
            text: paper.title || "",
            bold: true,
            font: DOCUMENT_FORMATTING.font.family,
            size: ptToHalfPt(
              DOCUMENT_FORMATTING.font.title.sizePt
            ),
            color: "000000",
          }),
          // ✅ EXPLICIT SPACER PARAGRAPH (THIS FIXES IT)
          new Paragraph({
            spacing: {
              before: 240,
              after: 240,
            },
            children: [],
          }),

        ],
      }),
    ],
  };

  /* ================= BODY (1 OR 2 COLUMNS) ================= */

  const bodyChildren = [];

  for (const section of paper.sections || []) {
  const isReferences =
    section.section_key === "references" ||
    section.section_title?.toLowerCase() === "references";

  /* ---------- SECTION HEADING ---------- */
  bodyChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: section.section_title,
          bold: true,
          font: DOCUMENT_FORMATTING.font.family,
          size: DOCUMENT_FORMATTING.font.heading.h1 * 2,
        }),
      ],
    })
  );

  /* ---------- SECTION BODY ---------- */
  if (!section.body_html) continue;

  if (isReferences) {
    const refs = buildIeeeReferencesDocx({
      html: section.body_html,
      fontFamily: DOCUMENT_FORMATTING.font.family,
      fontSizePt: DOCUMENT_FORMATTING.font.bodySizePt,
      lineSpacing: DOCUMENT_FORMATTING.paragraph.lineSpacing,
    });

    bodyChildren.push(...refs);
  } else {
    const paras = await htmlToDocxParagraphs(
      section.body_html,
      {
        forceJustified: true,
        noFirstLineIndent: false,
      }
    );
    bodyChildren.push(...paras);
  }
}


  const columnConfig =
    layout === "double"
      ? {
          count: DOCUMENT_FORMATTING.column.double.count,
          space: inchToTwip(
            DOCUMENT_FORMATTING.column.double.spaceInch
          ),
        }
      : {
          count: DOCUMENT_FORMATTING.column.single.count,
        };

  const bodySection = {
    properties: {
      type: SectionType.CONTINUOUS,
      column: columnConfig,
      page: { margin: PAGE_MARGINS },
    },
    children: bodyChildren,
  };

  /* ================= CREATE DOCUMENT ================= */

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: DOCUMENT_FORMATTING.font.family,
            size: ptToHalfPt(
              DOCUMENT_FORMATTING.font.bodySizePt
            ),
          },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
          },
        },
      },
    },
    sections: [titleSection, bodySection],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${paper.title || "paper"}.docx`);
}
