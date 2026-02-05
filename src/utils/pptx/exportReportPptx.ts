import PptxGenJS from "pptxgenjs";
import {
  PPT_THEMES,
  DEFAULT_PPT_THEME,
  PptTheme,
} from "../../config/pptThemes.config";
import { applyHeader, applyFooter } from "./pptxThemeHelpers";
import { extractImageUrls } from "./extractImages";
import { arrayBufferToBase64 } from "./arrayBufferToBase64";
import { fetchImageBuffer } from "./../exporters/fetchImage";

/* ---------------------------------------------------------
 * Theme Resolver
 * --------------------------------------------------------- */
const resolveTheme = (key?: string): PptTheme =>
  PPT_THEMES[key as keyof typeof PPT_THEMES] ??
  PPT_THEMES[DEFAULT_PPT_THEME];

/* ---------------------------------------------------------
 * HTML Parser
 * --------------------------------------------------------- */
function parseHtml(html: string): HTMLElement {
  return new DOMParser().parseFromString(html || "", "text/html").body;
}


function addFullSlideTable(slide, rows, theme) {
  const topY = theme.header.barHeight + 1.1;
  const footerPad = 0.7;

  const availableHeight =
    theme.slide.height - topY - footerPad;

  const rowCount = rows.length;
  const colCount = rows[0].length;

  const rowHeight = Math.min(0.32, availableHeight / rowCount);

  const colWidth =
    (theme.slide.width - theme.slide.margin * 2) / colCount;

  slide.addTable(rows, {
    x: theme.slide.margin,
    y: topY,
    w: theme.slide.width - theme.slide.margin * 2,

    colW: Array(colCount).fill(colWidth),
    rowH: rows.map((_, i) =>
      i === 0 ? rowHeight * 1.8 : rowHeight
    ),

    fontSize: 9,
    align: "center",
    valign: "middle",

    wrap: true,           // 🔑 header wrapping allowed
    autoPage: false,

    border: {
      type: "solid",
      pt: 0.5,
      color: "cccccc",
    },
  });
}


/* ---------------------------------------------------------
 * PPTX Exporter
 * --------------------------------------------------------- */
export async function exportReportPptx({
  name = "Report",
  fileName = "Report",
  synopsis,
  themeKey,
}: {
  name?: string;
  fileName?: string;
  synopsis?: { chapters?: any[] };
  themeKey?: keyof typeof PPT_THEMES;
}) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  const theme = resolveTheme(themeKey);
  let pageNum = 1;

  console.log("Exporting PPTX with theme:", synopsis);

  /* ================= TITLE SLIDE ================= */
  // {
  //   const slide = pptx.addSlide();
  //   slide.background = { fill: "#FFFFFF" };

  //   applyHeader(slide, theme, { title: name, section: "OVERVIEW" });

  //   slide.addText("PhD Synopsis Presentation", {
  //     x: theme.slide.margin,
  //     y: theme.header.barHeight + 1.3,
  //     fontSize: 18,
  //     color: theme.colors.secondary,
  //   });

  //   applyFooter(slide, theme, pageNum++);
  // }

  /* ================= CONTENT SLIDES ================= */
  for (const ch of synopsis?.chapters || []) {
    const slide = pptx.addSlide();
    slide.background = { fill: "#FFFFFF" };

    applyHeader(slide, theme, {
      title: name,
      section: ch.chapter_section?.toUpperCase() || "",
    });

    /* ---------- Title ---------- */
    const titleY =
      theme.variant === "titleBar"
        ? 1.05
        : theme.header.barHeight + 0.45;

    slide.addText(ch.title || "Section", {
      x: theme.slide.margin,
      y: titleY,
      fontSize: 30,
      bold: true,
      color: theme.colors.primary,
    });

    const underlineY = titleY + 0.38;
    slide.addShape("rect", {
      x: theme.slide.margin,
      y: underlineY,
      w: theme.slide.width - theme.slide.margin * 2,
      h: 0.04,
      fill: { color: "#D6DEE9" },
    });

    // const body = parseHtml(ch.body_html || "");
    // const text = body.textContent?.trim() || "";

    const body = parseHtml(ch.body_html || "");
    // CLONE body for text processing (🔑 IMPORTANT)
    const textBody = body.cloneNode(true) as HTMLElement;


    // Remove headings
    textBody.querySelectorAll("h1,h2,h3").forEach(h => h.remove());

    // Remove tables ONLY from text clone
    textBody.querySelectorAll("table").forEach(t => t.remove());

    // Extract text safely
    const text = textBody.textContent?.trim() || "";



    const imageUrls = extractImageUrls(ch.body_html || "");

    // let cursorY = underlineY + 0.35;
    // let cursorY = underlineY + theme.layout.bodyTopGap;
    let cursorY = underlineY + (text ? theme.layout.bodyTopGap : 0.45);


    const footerPadding = 0.8;
    const availableHeight =
      theme.slide.height - cursorY - footerPadding;

    /* ---------- TEXT ---------- */
    if (text) {
      slide.addText(text, {
        x: theme.slide.margin,
        y: cursorY,
        w: theme.slide.width - theme.slide.margin * 2,
        h: theme.slide.height - cursorY - footerPadding,

        fontSize: theme.fonts.body,
        color: theme.colors.text,

        align: "left",        // 🔑 force horizontal left
        valign: "top",        // 🔑 force vertical top
        wrap: true,
        bullet: false,        // 🔑 CRITICAL: stop PPT auto-indent
      });

      cursorY += 1.3;
    }

    /* ---------- IMAGES (FIXED HEIGHT LOGIC) ---------- */
    if (imageUrls.length) {
      const remainingHeight =
        theme.slide.height - cursorY - footerPadding;

      const imageHeight =
        text
          ? remainingHeight / imageUrls.length
          : availableHeight; // 🔑 full slide if image-only

      for (const url of imageUrls) {
        const buffer = await fetchImageBuffer(url);
        if (!buffer) continue;

        const base64 = arrayBufferToBase64(buffer);
        const mime =
          url.endsWith(".jpg") || url.endsWith(".jpeg")
            ? "image/jpeg"
            : "image/png";

        slide.addImage({
          data: `data:${mime};base64,${base64}`,
          x: theme.slide.margin,
          y: cursorY,
          w: theme.slide.width - theme.slide.margin * 2,
          h: imageHeight,
          sizing: { type: "contain" }, // 🔑 critical
        });

        cursorY += imageHeight + 0.15;
      }
    }

    /* ---------- TABLES ---------- */
    body.querySelectorAll("table").forEach((table) => {
      const rows = Array.from(table.rows).map((r) =>
        Array.from(r.cells).map((c) => c.innerText.trim())
      );

      // If table exists, force new slide
      if (rows.length) {
        const tableTop = underlineY + 0.55;
        const footerPad = 0.7;

        const availableHeight =
          theme.slide.height - tableTop - footerPad;

        const rowCount = rows.length;
        const colCount = rows[0].length;

        const rowHeight = Math.min(0.32, availableHeight / rowCount);
        const colWidth =
          (theme.slide.width - theme.slide.margin * 2) / colCount;

        slide.addTable(rows, {
          x: theme.slide.margin,
          y: tableTop,
          w: theme.slide.width - theme.slide.margin * 2,

          colW: Array(colCount).fill(colWidth),
          rowH: rows.map((_, i) =>
            i === 0 ? rowHeight * 1.8 : rowHeight
          ),

          fontSize: 9,
          wrap: true,
          align: "center",
          valign: "middle",
          autoPage: false,
          border: { type: "solid", pt: 0.5, color: "cccccc" },
        });
      }


    });

    applyFooter(slide, theme, pageNum++);
  }

  /* ================= SAVE ================= */
  await pptx.writeFile({
    fileName: `${fileName.replace(/[^A-Za-z0-9._-]+/g, "_")}.pptx`,
  });
}
