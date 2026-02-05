// src/utils/pptx/exportReportPptx.ts
import PptxGenJS from "pptxgenjs";
import {
  PPT_THEMES,
  DEFAULT_PPT_THEME,
  PptTheme,
} from "../../config/pptThemes.config";
import { applyHeader, applyFooter } from "./pptxThemeHelpers";

/* ---------------------------------------------------------
 * Helpers
 * --------------------------------------------------------- */

const cleanText = (html: string) =>
  (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

/* ---------------------------------------------------------
 * Theme Resolver
 * --------------------------------------------------------- */

const resolveTheme = (key?: string): PptTheme =>
  PPT_THEMES[key as keyof typeof PPT_THEMES] ??
  PPT_THEMES[DEFAULT_PPT_THEME];

/* ---------------------------------------------------------
 * PPTX Exporter
 * --------------------------------------------------------- */

export async function exportReportPptx({
  name = "Report",
  synopsis,
  themeKey,
}: {
  name?: string;
  synopsis?: { chapters?: any[] };
  themeKey?: keyof typeof PPT_THEMES;
}) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  const theme = resolveTheme(themeKey);
  let pageNum = 1;

  /* =====================================================
   * TITLE SLIDE
   * ===================================================== */
  {
    const slide = pptx.addSlide();
    slide.background = { fill: "#FFFFFF" };

    applyHeader(slide, theme, {
      title: name,
      section: "OVERVIEW",
    });

    slide.addText("PhD Synopsis Presentation", {
      x: theme.slide.margin,
      y: theme.header.barHeight + 1.3,
      fontSize: 18,
      color: theme.colors.secondary,
    });

    applyFooter(slide, theme, pageNum++);
  }

  /* =====================================================
   * CONTENT SLIDES
   * ===================================================== */
  for (const ch of synopsis?.chapters || []) {
    const slide = pptx.addSlide();
    slide.background = { fill: "#FFFFFF" };

    // Header stays constant
    applyHeader(slide, theme, {
      title: name,
      section: ch.section?.toUpperCase() || "",
    });

    /* -------------------------------
     * Chapter title (MATCH REFERENCE)
     * ------------------------------- */

    const chapterTitleY =
      theme.variant === "titleBar"
        ? 1.05               // ✅ more space below header
        : theme.header.barHeight + 0.45;

    slide.addText(ch.title || "Section", {
      x: theme.slide.margin,
      y: chapterTitleY,
      fontSize: 30,          // ✅ professional (not oversized)
      bold: true,
      color: theme.colors.primary,
      align: "left",
    });

    /* -------------------------------
     * Underline (LIGHT + CLOSE)
     * ------------------------------- */

    const underlineY = chapterTitleY + 0.38;

    slide.addShape("rect", {
      x: theme.slide.margin,
      y: underlineY,
      w: theme.slide.width - theme.slide.margin * 2,
      h: 0.04,
      fill: { color: "#D6DEE9" }, // ✅ lighter, professional
      line: { width: 0 },
    });

    /* -------------------------------
     * Body content (TOP-LEFT)
     * ------------------------------- */

    slide.addText(cleanText(ch.body_html || ""), {
      x: theme.slide.margin,
      y: underlineY + 0.30,   // ✅ tight but readable
      w: theme.slide.width - theme.slide.margin * 2,
      h: theme.slide.height - underlineY - 1.4,
      fontSize: 18,           // ✅ readable academic size
      wrap: true,
      color: theme.colors.text,
      align: "left",
    });

    applyFooter(slide, theme, pageNum++);
  }

  /* =====================================================
   * SAVE
   * ===================================================== */

  await pptx.writeFile({
    fileName: `${name.replace(/[^A-Za-z0-9._-]+/g, "_")}.pptx`,
  });
}
