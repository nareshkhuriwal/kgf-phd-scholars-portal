// utils/pptx/exportReportPptx.ts
import PptxGenJS from "pptxgenjs";

type Col = { key: string; label?: string };
type Row = Record<string, any>;

export async function exportReportPptx({
  name = "Report",
  meta,
  columns = [],
  rows = [],
  synopsis, // { kpis:[], chapters:[], literature:[] } optional
}: {
  name?: string;
  meta?: any;
  columns?: Col[];
  rows?: Row[];
  synopsis?: { kpis?: any[]; chapters?: any[]; literature?: any[] };
}) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  // Title slide
  {
    const s = pptx.addSlide();
    s.addText(name, { x:0.6, y:0.7, fontSize: 40, bold:true });
    if (meta?.totalPapers != null) {
      s.addText(`Total Papers: ${meta.totalPapers}`, { x:0.6, y:1.6, fontSize: 18 });
    }
  }

  // Dataset table (ROL)
  if (columns.length && rows.length) {
    const s = pptx.addSlide();
    s.addText("Review of Literature (ROL)", { x:0.5, y:0.4, fontSize: 24, bold:true });

    const header = columns.map(c => c.label || c.key);
    const data = rows.map(r => columns.map(c => (r[c.key] ?? "").toString()));

    s.addTable([header, ...data], {
      x:0.5, y:1.0, w:12.3, fontSize: 12,
      border: { type: "solid", pt: 1, color: "CFCFCF" },
      fill: { color: "FFFFFF" },
      colW: Array(columns.length).fill(12.3 / Math.max(1, columns.length)),
      // style header row:
      rowH: 0.35,
      autoPage: true,           // auto-continues on new slides
      autoPageRepeatHeader: true
    });
  }

  // Synopsis slides
  if (synopsis?.kpis?.length || synopsis?.chapters?.length || synopsis?.literature?.length) {
    const clean = (s: string) =>
      (s || "").replace(/&nbsp;/g, " ").replace(/<br\s*\/?>/gi, "\n")
               .replace(/<\/p>\s*<p>/gi, "\n\n").replace(/<\/?[^>]+>/g, "").trim();

    if (synopsis.kpis?.length) {
      const s = pptx.addSlide();
      s.addText("Summary", { x:0.5, y:0.4, fontSize: 24, bold:true });
      let y = 1.0;
      synopsis.kpis.forEach(k => {
        s.addText(`${k.label}: ${k.value}`, { x:0.7, y, fontSize: 18 });
        y += 0.4;
      });
    }

    if (synopsis.chapters?.length) {
      synopsis.chapters.forEach(ch => {
        const s = pptx.addSlide();
        s.addText(ch.title || "Chapter", { x:0.5, y:0.4, fontSize: 24, bold:true });
        s.addText(clean(ch.body_html || ""), { x:0.5, y:1.0, w:12.3, h:5.8, fontSize: 16, wrap: true });
      });
    }

    if (synopsis.literature?.length) {
      const s = pptx.addSlide();
      s.addText("Literature Review", { x:0.5, y:0.4, fontSize: 24, bold:true });

      const bullets = synopsis.literature.map(i => {
        const head = [i.title, i.authors, i.year].filter(Boolean).join(" • ");
        return `${head}\n${clean(i.text || "")}`;
      });

      s.addText(bullets.join("\n"), { x:0.7, y:1.0, w:12.0, h:6.0, fontSize: 16, bullet: true, lineSpacing: 20 });
    }
  }

  await pptx.writeFile({ fileName: `${name.replace(/[^A-Za-z0-9._-]+/g, "_") || "Report"}.pptx` });
}
