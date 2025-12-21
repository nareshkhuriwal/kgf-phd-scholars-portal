import {
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { fetchImageBuffer } from "./fetchImage";

export async function htmlToDocxParagraphs(html) {
  if (!html) return [];

  const container = document.createElement("div");
  container.innerHTML = html;

  const blocks = [];

  for (const node of container.childNodes) {
    /* -----------------------------
       TEXT NODE
    ----------------------------- */
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push(
          new Paragraph({
            children: [new TextRun(text)],
            spacing: { after: 200 },
          })
        );
      }
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const tag = node.tagName.toLowerCase();

    /* -----------------------------
       HEADINGS
    ----------------------------- */
    if (tag === "h1" || tag === "h2") {
      blocks.push(
        new Paragraph({
          text: node.innerText.trim(),
          heading: HeadingLevel.HEADING_1,
          alignment:
            node.style.textAlign === "center"
              ? AlignmentType.CENTER
              : undefined,
          spacing: { after: 300 },
        })
      );
      continue;
    }

    /* -----------------------------
       PARAGRAPH
    ----------------------------- */
    if (tag === "p") {
      const runs = parseInline(node);
      if (runs.length) {
        blocks.push(
          new Paragraph({
            children: runs,
            spacing: { after: 200 },
          })
        );
      }
      continue;
    }

    /* -----------------------------
       TABLE (figure > table OR table)
    ----------------------------- */
    if (tag === "table" || (tag === "figure" && node.querySelector("table"))) {
      const tableEl = tag === "table" ? node : node.querySelector("table");
      if (!tableEl) continue;

      const rows = [];

      tableEl.querySelectorAll("tr").forEach((tr) => {
        const cells = [];

        tr.querySelectorAll("th, td").forEach((td) => {
          const cellText = td.innerText?.trim() || " ";

          cells.push(
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun(cellText)],
                }),
              ],
            })
          );
        });

        if (cells.length) {
          rows.push(new TableRow({ children: cells }));
        }
      });

      if (rows.length) {
        blocks.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          })
        );
      }

      continue;
    }

    /* -----------------------------
       IMAGE (IMG OR FIGURE)
    ----------------------------- */
    if (tag === "img" || tag === "figure") {
      const img = tag === "img" ? node : node.querySelector("img");
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
  }

  return blocks;
}

/* -----------------------------
   INLINE TEXT PARSER
----------------------------- */
function parseInline(node) {
  const runs = [];

  node.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const txt = n.textContent;
      if (txt?.trim()) {
        runs.push(new TextRun(txt));
      }
    }

    if (n.nodeType === Node.ELEMENT_NODE) {
      if (n.tagName === "STRONG") {
        runs.push(new TextRun({ text: n.innerText, bold: true }));
      }

      if (n.tagName === "EM") {
        runs.push(new TextRun({ text: n.innerText, italics: true }));
      }
    }
  });

  return runs;
}
