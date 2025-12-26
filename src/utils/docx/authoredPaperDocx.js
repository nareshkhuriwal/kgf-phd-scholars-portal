// utils/docx/authoredPaperDocx.js
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { htmlToDocxParagraphs } from '../exporters/htmlToDocx';

export async function exportPaperDocx(paper) {
  if (!paper) return;

  const children = [];

  // ── Paper Title ─────────────────────────────
  if (paper.title) {
    children.push(
      new Paragraph({
        text: paper.title,
        alignment: 'center',
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      })
    );
  }

  // ── Sections ────────────────────────────────
  for (const section of paper.sections || []) {
    // Section Heading
    children.push(
      new Paragraph({
        text: section.section_title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 },
      })
    );

    // Section Content
    if (section.body_html) {
      const sectionParas = await htmlToDocxParagraphs(section.body_html);
      children.push(...sectionParas);
    }
  }

  // ── Create DOCX ─────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${paper.title || 'paper'}.docx`);
}
