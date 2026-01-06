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

/* ───────── Helpers ───────── */
const inchToTwip = (inch) => inch * 1440;
const ptToHalfPt = (pt) => pt * 2;
const ptToTwip = (pt) => pt * 20;

const pageMargins = {
  top: inchToTwip(DOCUMENT_FORMATTING.page.marginInch.top),
  bottom: inchToTwip(DOCUMENT_FORMATTING.page.marginInch.bottom),
  left: inchToTwip(DOCUMENT_FORMATTING.page.marginInch.left),
  right: inchToTwip(DOCUMENT_FORMATTING.page.marginInch.right),
};

export async function exportPaperDocx(paper, layout = "double") {
  if (!paper) return;

  /* =====================================================
     SECTION 1 — TITLE (SINGLE COLUMN)
  ===================================================== */

  const titleSection = {
    properties: {
      type: SectionType.CONTINUOUS,
      page: { margin: pageMargins },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          after: ptToTwip(DOCUMENT_FORMATTING.font.title.spacingAfterPt),
        },
        children: [
          new TextRun({
            text: paper.title,
            bold: true,
            font: DOCUMENT_FORMATTING.font.family,
            size: ptToHalfPt(DOCUMENT_FORMATTING.font.title.sizePt),
            color: "000000",
          }),
        ],
      }),
    ],
  };

  /* =====================================================
     SECTION 2 — BODY (COLUMN CONTROLLED)
  ===================================================== */

  const bodyChildren = [];

  for (const section of paper.sections || []) {
    // Section heading
    bodyChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          before: ptToTwip(
            DOCUMENT_FORMATTING.font.heading.spacingBeforePt
          ),
          after: ptToTwip(
            DOCUMENT_FORMATTING.font.heading.spacingAfterPt
          ),
        },
        children: [
          new TextRun({
            text: section.section_title,
            bold: true,
            font: DOCUMENT_FORMATTING.font.family,
            size: ptToHalfPt(DOCUMENT_FORMATTING.font.heading.h1),
            color: "000000",
          }),
        ],
      })
    );

    if (section.body_html) {
      const paras = await htmlToDocxParagraphs(section.body_html, {
        justified: true,
        firstLineIndent:
          DOCUMENT_FORMATTING.paragraph.firstLineIndentInch,
        lineSpacing: DOCUMENT_FORMATTING.paragraph.lineSpacing,
        spacingAfterPt:
          DOCUMENT_FORMATTING.paragraph.spacingAfterPt,
        fontFamily: DOCUMENT_FORMATTING.font.family,
        fontSizePt: DOCUMENT_FORMATTING.font.bodySizePt,
      });

      bodyChildren.push(...paras);
    }
  }

  const bodySection = {
    properties: {
      type: SectionType.CONTINUOUS,
      column:
        layout === "double"
          ? {
              count: 2,
              space: inchToTwip(
                DOCUMENT_FORMATTING.column.double.spaceInch
              ),
            }
          : { count: 1 },
      page: { margin: pageMargins },
    },
    children: bodyChildren,
  };

  /* =====================================================
     CREATE DOCUMENT
  ===================================================== */

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: DOCUMENT_FORMATTING.font.family,
            size: ptToHalfPt(DOCUMENT_FORMATTING.font.bodySizePt),
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
