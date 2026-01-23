import * as XLSX from "xlsx-js-style";
import { htmlToExcelText } from "../exporters/htmlToExcelText";

type Column = { key: string; label?: string };

const META_KEYS = new Set(["paper_id", "doi", "authors", "title", "year", "category"]);

const THEME = {
  fontName: "Times New Roman",
  fontSize: 14,
  headerFill: "F2F2F2",
  borderColor: "",
  headerRowHpt: 26,
  baseRowHpt: 20,
  perLineHpt: 15,
  maxRowHpt: 200,     // safety cap
  minColWch: 12,
  maxColWch: 60,
  textIndent: 1,      // left spacing
};

function borderThin() {
  const c = { rgb: THEME.borderColor };
  return {
    top: { style: "thin", color: c },
    bottom: { style: "thin", color: c },
    left: { style: "thin", color: c },
    right: { style: "thin", color: c },
  } as const;
}

function isNumericLike(v: any): boolean {
  if (v == null || v === "") return true;
  if (typeof v === "number") return true;
  if (typeof v !== "string") return false;
  return /^-?\d+(\.\d+)?$/.test(v.trim());
}

function detectNumericColumns(columns: Column[], rows: any[]) {
  // look at first N non-empty values to decide alignment
  const N = 50;
  const out: Record<string, boolean> = {};

  for (const col of columns) {
    let checked = 0;
    let ok = true;

    for (let i = 0; i < rows.length && checked < N; i++) {
      const v = rows[i]?.[col.key];
      if (v == null || v === "") continue;
      checked++;
      if (!isNumericLike(v)) {
        ok = false;
        break;
      }
    }
    out[col.key] = ok && checked > 0;
  }
  return out;
}

/**
 * Better width calculation:
 * - uses sample of rows to avoid being skewed
 * - uses longest *line* (split by newlines)
 * - caps to professional range
 */
function computeColumnWidths(columns: Column[], ordered: any[]) {
  const maxRowsScan = Math.min(ordered.length, 200);

  return columns.map((col) => {
    const header = col.label || col.key;
    const lengths: number[] = [header.length];

    for (let i = 0; i < maxRowsScan; i++) {
      const v = ordered[i]?.[header]; // NOTE: ordered uses label as key
      if (typeof v !== "string") continue;

      // use longest visible line
      const longest = v
        .split(/\r\n|\n/)
        .reduce((m, line) => Math.max(m, line.length), 0);

      lengths.push(longest);
    }

    lengths.sort((a, b) => a - b);

    // Use 90th percentile to avoid one crazy outlier forcing huge columns
    const p90 = lengths[Math.floor(lengths.length * 0.9)] ?? header.length;

    // Heuristic bump for long-text columns (keeps them readable)
    const bumped = p90 > 80 ? 55 : p90 > 50 ? 45 : p90 + 2;

    const wch = Math.min(Math.max(bumped, THEME.minColWch), THEME.maxColWch);
    return { wch };
  });
}

/**
 * Estimate how many lines Excel will render after wrapping,
 * based on column width (wch) + text length.
 */
function estimateWrappedLines(text: string, colWch: number) {
  if (!text) return 1;

  // effective chars per line (small padding)
  const effective = Math.max(8, colWch - 2);

  const rawLines = text.split(/\r\n|\n/);
  let total = 0;

  for (const l of rawLines) {
    const len = l.length || 1;
    total += Math.ceil(len / effective);
  }

  return Math.max(1, total);
}

function applyRowHeights(ws: XLSX.WorkSheet) {
  const ref = ws["!ref"] || "A1:A1";
  const range = XLSX.utils.decode_range(ref);

  ws["!rows"] = ws["!rows"] || [];
  ws["!rows"][0] = { hpt: THEME.headerRowHpt }; // header

  const cols = (ws["!cols"] || []) as Array<{ wch?: number }>;

  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    let maxLines = 1;

    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell || typeof cell.v !== "string") continue;

      const wch = cols[C]?.wch ?? THEME.minColWch;
      const lines = estimateWrappedLines(String(cell.v), wch);
      maxLines = Math.max(maxLines, lines);
    }

    const hpt = Math.min(
      THEME.maxRowHpt,
      Math.max(THEME.baseRowHpt, maxLines * THEME.perLineHpt)
    );

    ws["!rows"][R] = { hpt };
  }
}

function ensureCellsInRange(ws: XLSX.WorkSheet) {
  const ref = ws["!ref"] || "A1:A1";
  const range = XLSX.utils.decode_range(ref);

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
    }
  }
}

function applyStyles(ws: XLSX.WorkSheet, columns: Column[], numericByKey: Record<string, boolean>) {
  const ref = ws["!ref"] || "A1:A1";
  const range = XLSX.utils.decode_range(ref);

  const b = borderThin();

  // Map column index -> original key (to decide numeric alignment)
  const colKeyByIndex: string[] = columns.map((c) => c.key);

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;

      const isHeader = R === range.s.r;
      const colKey = colKeyByIndex[C] || "";
      const isNumericCol = numericByKey[colKey] === true;

      if (isHeader) {
        cell.s = {
          font: { name: THEME.fontName, sz: THEME.fontSize, bold: true },
          fill: { patternType: "solid", fgColor: { rgb: THEME.headerFill } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: b,
        };
      } else {
        cell.s = {
          font: { name: THEME.fontName, sz: THEME.fontSize },
          alignment: {
            horizontal: isNumericCol ? "center" : "left",
            vertical: "top",
            wrapText: true,
            indent: isNumericCol ? 0 : THEME.textIndent,
          },
          border: b,
        };
      }
    }
  }
}

function addSheetUX(ws: XLSX.WorkSheet) {
  // AutoFilter makes it feel “professional”
  if (ws["!ref"]) {
    ws["!autofilter"] = { ref: ws["!ref"] };
  }

  // Freeze top row (works in most Excel versions with SheetJS)
  (ws as any)["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
    topLeftCell: "A2",
    activePane: "bottomLeft",
    state: "frozen",
  };
}

export function exportDatasetToExcel(params: {
  name: string;
  template?: string;
  columns: Column[];
  rows: any[];
}) {
  const { name, template, columns, rows } = params;

  // Build ordered objects with visible headers as keys
  const ordered = rows.map((r) => {
    const obj: Record<string, any> = {};
    for (const c of columns) {
      const header = c.label || c.key;
      let val = r?.[c.key];

      if (val == null || val === "") {
        obj[header] = "";
        continue;
      }

      if (!META_KEYS.has(c.key)) {
        val = htmlToExcelText(String(val));
      }

      obj[header] = val;
    }
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(ordered);

  // 1) Auto width (better heuristic)
  ws["!cols"] = computeColumnWidths(columns, ordered);

  // 2) Create empty cells so borders apply everywhere inside used range
  ensureCellsInRange(ws);

  // 3) Styles: font, alignment, wrap, borders, header fill
  const numericByKey = detectNumericColumns(columns, rows);
  applyStyles(ws, columns, numericByKey);

  // 4) Row height that accounts for wrapping (fixes overlap)
  applyRowHeights(ws);

  // 5) Professional UX
  addSheetUX(ws);

  const wb = XLSX.utils.book_new();
  const sheetName = String(template || "Report").toUpperCase().slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const safeName = String(name || "Report").replace(/[^A-Za-z0-9._-]+/g, "_");
  XLSX.writeFile(wb, `${safeName}.xlsx`);
}
