import {
  Header,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  VerticalAlign,
} from "docx";

/**
 * Academic thesis header
 * - Non-overlapping
 * - Word-safe
 * - Header height locked
 * - Works with header distance >= 0.7 inch
 */
export default function buildHeader(
  titleText = "Report Title",
  rightText = "SET"
) {
  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },

        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },

        rows: [
          new TableRow({
            /* 🔒 LOCK HEADER HEIGHT (CRITICAL) */
            height: {
              value: 520,      // ~0.36 inch
              rule: "atLeast", // prevents Word collapsing row
            },

            children: [
              /* =====================================================
                 LEFT CELL — DOCUMENT TITLE
              ===================================================== */
              new TableCell({
                width: { size: 85, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,

                borders: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 24,
                    color: "999999",
                  },
                },

                margins: {
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                },

                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,

                    /* ❗ NO paragraph spacing inflation */
                    spacing: {
                      before: 0,
                      after: 0,
                    },

                    children: [
                      new TextRun({
                        text: titleText,
                        bold: true,
                        size: 24, // 13pt
                        color: "808080",
                        font: "Calibri",
                      }),
                    ],
                  }),
                ],
              }),

              /* =====================================================
                 RIGHT CELL — SHORT LABEL (SET)
              ===================================================== */
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,

                borders: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 24,
                    color: "999999",
                  },
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 24,
                    color: "999999",
                  },
                },

                margins: {
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                },

                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,

                    spacing: {
                      before: 0,
                      after: 0,
                    },

                    children: [
                      new TextRun({
                        text: rightText,
                        bold: true,
                        size: 24, // 13pt
                        color: "808080",
                        font: "Calibri",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
