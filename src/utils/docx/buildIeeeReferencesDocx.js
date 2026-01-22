import { Paragraph, TextRun, AlignmentType } from "docx";

const PT_TO_HALF_POINTS = (pt) => Math.round(pt * 2);
const INCH_TO_TWIP = (inch) => Math.round(inch * 1440);

export function buildIeeeReferencesDocx({
  html,
  fontFamily,
  fontSizePt,
  lineSpacing,
  startIndex = 1,
}) {
  if (!html) return [];

  const container = document.createElement("div");
  container.innerHTML = html;

  const nodes = [...container.querySelectorAll("p, li")];
  let index = startIndex;
  const blocks = [];

  nodes.forEach((node) => {
    const text = node.innerText?.trim();
    if (!text) return;

    const labelWidthInch = 0.35; // IEEE standard width for [n]

    blocks.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,

        spacing: {
          line: lineSpacing === 1.5 ? 360 : 240,
          after: 120,
        },

        // indent: {
        //   left: INCH_TO_TWIP(labelWidthInch),
        //   hanging: INCH_TO_TWIP(labelWidthInch),
        // },

        children: [
          // --- Number label ---
          new TextRun({
            text: `[${index}] `,
            font: fontFamily,
            size: PT_TO_HALF_POINTS(fontSizePt),
          }),

          // --- Reference text ---
          new TextRun({
            text,
            font: fontFamily,
            size: PT_TO_HALF_POINTS(fontSizePt),
          }),
        ],
      })
    );

    index++;
  });

  return blocks;
}
