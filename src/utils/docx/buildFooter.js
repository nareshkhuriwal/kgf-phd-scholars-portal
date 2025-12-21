// src/exporters/buildFooter.js

import { 
  PageNumber, 
  Footer, 
  Paragraph, 
  TextRun, 
  TabStopType, 
  BorderStyle,
} from "docx";

// Create footer for Roman numerals (Section 1)
export function buildRomanFooter(footerLeft = "Poornima University, Jaipur", footerCenter = "December 2025") {
  return new Footer({
    children: [
      new Paragraph({
        spacing: { before: 0, after: 100 },
        border: {
          top: {
            style: BorderStyle.THICK,
            size: 24,
            color: "D6B27C",
          },
        },
      }),
      new Paragraph({
        spacing: { before: 100, after: 100 },
        tabStops: [
          { type: TabStopType.CENTER, position: 4680 },
          { type: TabStopType.RIGHT, position: 9360 },
        ],
        children: [
          new TextRun({
            text: footerLeft,
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun("\t"),
          new TextRun({
            text: footerCenter,
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun("\t"),
          new TextRun({
            text: "Page ",
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

// Create footer for Arabic numerals (Section 2)
export function buildArabicFooter(footerLeft = "Poornima University, Jaipur", footerCenter = "December 2025") {
  return new Footer({
    children: [
      new Paragraph({
        spacing: { before: 0, after: 100 },
        border: {
          top: {
            style: BorderStyle.THICK,
            size: 24,
            color: "D6B27C",
          },
        },
      }),
      new Paragraph({
        spacing: { before: 100, after: 100 },
        tabStops: [
          { type: TabStopType.CENTER, position: 4680 },
          { type: TabStopType.RIGHT, position: 9360 },
        ],
        children: [
          new TextRun({
            text: footerLeft,
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun("\t"),
          new TextRun({
            text: footerCenter,
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun("\t"),
          new TextRun({
            text: "Page ",
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

// Default footer builder
export default function buildFooter(footerLeft = "Poornima University, Jaipur", footerCenter = "December 2025") {
  return new Footer({
    children: [
      new Paragraph({
        spacing: { 
          before: 0,
          after: 100
        },
        border: {
          top: {
            style: BorderStyle.THICK,
            size: 24,
            color: "D6B27C",
          },
        },
      }),
      new Paragraph({
        spacing: { 
          before: 100,
          after: 100
        },
        tabStops: [
          {
            type: TabStopType.CENTER,
            position: 4680,
          },
          {
            type: TabStopType.RIGHT,
            position: 9360,
          },
        ],
        children: [
          new TextRun({
            text: footerLeft,
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun("\t"),
          new TextRun({
            text: footerCenter,
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun("\t"),
          new TextRun({
            text: "Page ",
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}