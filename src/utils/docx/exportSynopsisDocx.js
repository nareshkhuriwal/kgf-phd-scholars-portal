// src/exporters/synopsisDocx.js
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
  Header,
  Footer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageNumber,
} from "docx";


import { saveAs } from "file-saver";
import { htmlToDocxParagraphs } from "./../exporters/htmlToDocx.js";
import { ImageRun } from "docx";
import { fetchImageBuffer } from "./../exporters/fetchImage.js"; // adjust path if needed
import buildHeader from "./buildHeader.js";
import {buildArabicFooter, buildRomanFooter} from "./buildFooter.js";

/**
 * Build DOCX paragraphs for TITLE PAGE only
 * (layout-driven, not generic HTML parsing)
 */
async function buildTitlePage(html) {
  console.log('Building title page for DOCX export');
  const container = document.createElement("div");
  container.innerHTML = html;

  const blocks = [];

  for (const node of container.childNodes) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const tag = node.tagName;

    console.log('Title page node:', tag);

    // -----------------------------
    // MAIN TITLE
    // -----------------------------
    if (tag === "H2") {
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

    // -----------------------------
    // IMAGE (LOGO / QR / SEAL)
    // -----------------------------
    console.log('Title page image node:', node);
    // -----------------------------
    // IMAGE (LOGO / QR / SEAL)
    // -----------------------------
    if (tag === "FIGURE") {
      const img = node.querySelector("img");
      const src = img?.getAttribute("src");

      console.log("Extracted image src:", src);

      if (src) {
        const buffer = await fetchImageBuffer(src);

        if (buffer) {
          const imageData = new Uint8Array(buffer); // ✅ REQUIRED

          blocks.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 300, after: 300 },
              children: [
                new ImageRun({
                  data: imageData,
                  transformation: {
                    width: 160,
                    height: 160,
                  },
                }),
              ],
            })
          );
        }

      }
      continue;
    }


    // -----------------------------
    // NORMAL CENTERED TEXT
    // -----------------------------
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


export async function exportSynopsisDocx(synopsisData) {
  const {
    name = "Synopsis",
    kpis = [],
    literature = [],
    chapters = [],
  } = synopsisData || {};

  const docChildren = [];

  // ----------------------------
  // DOCUMENT TITLE (report name)
  // ----------------------------
  docChildren.push(
    new Paragraph({
      text: name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // ----------------------------
  // KPIs
  // ----------------------------
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

  // ----------------------------
  // LITERATURE REVIEW
  // ----------------------------
  if (literature.length) {
    docChildren.push(
      new Paragraph({
        text: "Literature Review",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );

    for (let idx = 0; idx < literature.length; idx++) {
      const item = literature[idx];

      if (item.title) {
        docChildren.push(
          new Paragraph({
            text: item.title,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: idx === 0 ? 0 : 240, after: 120 },
          })
        );
      }

      const paras_old = await htmlToDocxParagraphs(
        item.reviewHtml || item.body_html || ""
      );
      const paras = await htmlToDocxParagraphs(
        item.html || item.reviewHtml || item.body_html || item.text || ""
      );

      paras.forEach((p) => docChildren.push(p));
    }
  }

  // ----------------------------
  // CHAPTERS
  // ----------------------------
  // ----------------------------
  // CHAPTERS (CONTENT ONLY — NO NAMES)
  // ----------------------------
  if (chapters.length) {
    for (let idx = 0; idx < chapters.length; idx++) {
      const ch = chapters[idx];
      const normalizedTitle = ch.title?.trim().toUpperCase();

      // 🟢 TITLE PAGE: custom layout
      if (normalizedTitle === "TITLE PAGE") {
        const titleBlocks = await buildTitlePage(ch.body_html || "");
        titleBlocks.forEach((p) => docChildren.push(p));

        // Page break after title page
        docChildren.push(new Paragraph({ pageBreakBefore: true }));
        continue;
      }

      // 🟡 ALL OTHER CHAPTERS:
      // → content only
      // → NO chapter heading
      const paras = await htmlToDocxParagraphs(
        ch.body_html || ch.body || ""
      );
      paras.forEach((p) => docChildren.push(p));

      // Page break between chapters (except last)
      if (idx < chapters.length - 1) {
        docChildren.push(new Paragraph({ pageBreakBefore: true }));
      }
    }
  }


  // ----------------------------
  // FINALIZE DOC
  // ----------------------------
  // const doc = new Document({
  //   sections: [{ properties: {}, children: docChildren }],
  // });

  const doc = new Document({
  sections: [
    {
      properties: {},
      headers: {
        default: buildHeader(
          "Adaptive Quantum Error Suppression Strategies for NISQ Devices" || name
        ),
      },
      footers: {
        default: buildArabicFooter(),
      },
      children: docChildren,
    },
  ],
});

  // const doc = new Document({
  //   sections: [
  //     {
  //       properties: {
  //         pageNumberStart: 1,
  //         pageNumberFormatType: "lowerRoman", // Use string instead: i, ii, iii, iv, v
  //       },
  //       headers: {
  //         default: buildHeader("Adaptive Quantum Error Suppression Strategies for NISQ Devices" || name),
  //       },
  //       footers: {
  //         default: buildRomanFooter(),
  //       },
  //       children: [
  //         // First 5 pages content here
  //         // Add your paragraphs, tables, etc.
  //       ],
  //     },
  //     {
  //       properties: {
  //         pageNumberStart: 1, // Restart numbering at 1
  //         pageNumberFormatType: "decimal", // Use string instead: 1, 2, 3...
  //       },
  //       headers: {
  //         default: buildHeader("Adaptive Quantum Error Suppression Strategies for NISQ Devices" || name),
  //       },
  //       footers: {
  //         default: buildArabicFooter(),
  //       },
  //       children: [
  //         // Remaining pages content here (page 6 onwards)
  //       ],
  //     },
  //   ],
  // });



  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${name || "Synopsis"}.docx`);
}
