// src/exporters/synopsisDocx.js
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { cleanRich } from "../text/cleanRich";
import { paragraphsFromText } from "./textBlocks";

/**
 * synopsisData shape (from your preview endpoint):
 * {
 *   name, outline: [...],
 *   kpis: [{label,value}],
 *   // plus you might attach:
 *   literature: [{ title, reviewHtml }],   // body content per paper
 *   chapters:   [{ title, bodyHtml }]      // body only
 * }
 */
export async function exportSynopsisDocx(synopsisData) {
  const {
    name = "Synopsis",
    kpis = [],
    literature = [], // [{title, reviewHtml}]
    chapters = [],   // [{title, bodyHtml}]
  } = synopsisData || {};

  const docChildren = [];

  // Title
  docChildren.push(
    new Paragraph({
      text: name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // KPIs
  if (kpis.length) {
    docChildren.push(
      new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2, spacing: { after: 120 } })
    );
    kpis.forEach(k =>
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${k.label}: `, bold: true }),
            new TextRun(String(k.value ?? "")),
          ],
          spacing: { after: 60 },
        })
      )
    );
  }

  // Literature Review
  if (literature.length) {
    docChildren.push(
      new Paragraph({ text: "Literature Review", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } })
    );

    literature.forEach((item, idx) => {
      if (item.title) {
        docChildren.push(
          new Paragraph({
            text: item.title,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: idx === 0 ? 0 : 180, after: 90 },
          })
        );
      }
      const cleanBody = cleanRich(item.reviewHtml || item.body_html || "");
      paragraphsFromText(cleanBody, { spacing: { after: 120 } }).forEach(p => docChildren.push(p));
    });
  }

  // Chapters (body only)
  if (chapters.length) {
    docChildren.push(
      new Paragraph({ text: "Chapters", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } })
    );

    chapters.forEach((ch, idx) => {
      if (ch.title) {
        docChildren.push(
          new Paragraph({
            text: ch.title,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: idx === 0 ? 0 : 180, after: 90 },
          })
        );
      }
      const cleanBody = cleanRich(ch.body_html || ch.body || "");
      paragraphsFromText(cleanBody, { spacing: { after: 120 } }).forEach(p => docChildren.push(p));
    });
  }

  const doc = new Document({
    sections: [{ properties: {}, children: docChildren }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${name || "Synopsis"}.docx`);
}
