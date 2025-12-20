// src/exporters/buildDocument.js

import { 
  Document, 
  PageNumber, 
  Footer, 
  Header, 
  Paragraph, 
  TextRun, 
  TabStopType, 
  BorderStyle,
  AlignmentType 
} from "docx";

// Create footer for Roman numerals (Section 1)
export function buildRomanFooter() {
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
            text: "Poornima University, Jaipur",
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun("\t"),
          new TextRun({
            text: "December, 2055",
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
export function buildArabicFooter() {
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
            text: "Poornima University, Jaipur",
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun("\t"),
          new TextRun({
            text: "December, 2055",
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


export default function buildFooter() {
  return new Footer({
    children: [
      // ───────── top separator line ─────────
      new Paragraph({
        spacing: { 
          before: 0,
          after: 100
        },
        border: {
          top: {
            style: BorderStyle.THICK,  // changed from SINGLE to THICK
            size: 24,  // significantly increased (was 12)
            color: "D6B27C",
          },
        },
      }),
      // ───────── single-line footer with tabs ─────────
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
            text: "Poornima University, Jaipur",
            size: 20,
            color: "999999",
            font: "Calibri",
          }),
          new TextRun("\t"),
          new TextRun({
            text: "December, 2055",
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