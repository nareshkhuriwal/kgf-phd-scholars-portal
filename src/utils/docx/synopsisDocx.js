// src/utils/docx/synopsisDocx.js
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { cleanRich } from "../text/cleanRich";

const para = (text = '') =>
  new Paragraph({ children: [new TextRun(String(text))] });

const h2 = (text) =>
  new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { after: 200 } });

const h3 = (text) =>
  new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 100, after: 100 } });

export async function downloadSynopsisDocx(data, filename = 'Synopsis.docx') {
  const docChildren = [];

  // Title
  docChildren.push(
    new Paragraph({
      text: data?.name || 'Synopsis Report',
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 },
    })
  );

  // KPIs (optional)
  if (Array.isArray(data?.kpis) && data.kpis.length) {
    docChildren.push(h2('Summary'));
    data.kpis.forEach(k => docChildren.push(para(`${k.label}: ${k.value}`)));
  }

  // Chapters
  if (Array.isArray(data?.chapters) && data.chapters.length) {
    docChildren.push(h2('Chapters'));
    data.chapters.forEach(ch => {
      if (ch.title) docChildren.push(h3(ch.title));
      if (ch.body_html)  docChildren.push(para(cleanRich(ch.body_html)));
      docChildren.push(new Paragraph({ text: '' })); // spacer
    });
  }

  // Literature Review
  if (Array.isArray(data?.literature) && data.literature.length) {
    docChildren.push(h2('Literature Review'));
    data.literature.forEach(item => {
      const head = [item.title, item.authors, item.year]
        .filter(Boolean).join(' • ');
      if (head) docChildren.push(h3(head));
      if (item.text) docChildren.push(para(cleanRich(item.text)));
      docChildren.push(new Paragraph({ text: '' }));
    });
  }

  const doc = new Document({ sections: [{ properties: {}, children: docChildren }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
