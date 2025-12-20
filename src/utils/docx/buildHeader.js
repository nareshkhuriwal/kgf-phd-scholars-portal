// src/exporters/buildHeader.js

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

export default function buildHeader(titleText) {
  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0 },
          bottom: { style: BorderStyle.NONE, size: 0 },
          left: { style: BorderStyle.NONE, size: 0 },
          right: { style: BorderStyle.NONE, size: 0 },
          insideHorizontal: { style: BorderStyle.NONE, size: 0 },
          insideVertical: { style: BorderStyle.NONE, size: 0 },
        },
        rows: [
          new TableRow({
            children: [
              // Left cell - Title
              new TableCell({
                width: { size: 85, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0 },
                  bottom: { 
                    style: BorderStyle.SINGLE, 
                    size: 24, 
                    color: "999999" 
                  },
                  left: { style: BorderStyle.NONE, size: 0 },
                  right: { style: BorderStyle.NONE, size: 0 },
                },
                verticalAlign: VerticalAlign.BOTTOM,
                margins: {
                  top: 0,
                  bottom: 200,
                  left: 0,
                  right: 0,
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0 },
                    children: [
                      new TextRun({
                        text: titleText,
                        bold: true,
                        size: 26,
                        color: "808080",
                        font: "Calibri",
                      }),
                    ],
                  }),
                ],
              }),

              // Right cell - "SET" without background
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0 },
                  bottom: { 
                    style: BorderStyle.SINGLE, 
                    size: 24, 
                    color: "999999" 
                  },
                  left: { 
                    style: BorderStyle.SINGLE, 
                    size: 24, 
                    color: "999999" 
                  },
                  right: { style: BorderStyle.NONE, size: 0 },
                },
                verticalAlign: VerticalAlign.BOTTOM,
                // Background removed
                margins: {
                  top: 0,
                  bottom: 200,
                  left: 100,
                  right: 0,
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0 },
                    children: [
                      new TextRun({
                        text: "SET",
                        bold: true,
                        size: 26,
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