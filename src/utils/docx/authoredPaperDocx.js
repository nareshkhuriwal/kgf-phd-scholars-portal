import { Document, Packer, Paragraph } from 'docx';
import { saveAs } from 'file-saver';
import { htmlToDocxParagraphs } from './../exporters/htmlToDocx';

export async function exportPaperDocx(paper) {
  const paragraphs = await htmlToDocxParagraphs(paper.body_html);

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: paper.title, heading: 'Heading1' }),
        ...paragraphs
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${paper.title || 'paper'}.docx`);
}
