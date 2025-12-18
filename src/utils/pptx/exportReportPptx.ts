import PptxGenJS from "pptxgenjs";
import { fetchImageBuffer } from "../exporters/fetchImage";
import { arrayBufferToBase64 } from "./arrayBufferToBase64";

type Col = { key: string; label?: string };
type Row = Record<string, any>;

const cleanText = (html: string) =>
  (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

const extractImageUrls = (html: string): string[] => {
  const urls: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html))) {
    urls.push(match[1]);
  }
  return urls;
};

export async function exportReportPptx({
  name = "Report",
  meta,
  columns = [],
  rows = [],
  synopsis,
}: {
  name?: string;
  meta?: any;
  columns?: Col[];
  rows?: Row[];
  synopsis?: { kpis?: any[]; chapters?: any[]; literature?: any[] };
}) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  /* ---------------- TITLE SLIDE ---------------- */
  {
    const slide = pptx.addSlide();
    slide.addText(name, { x: 0.6, y: 0.7, fontSize: 40, bold: true });
    if (meta?.totalPapers != null) {
      slide.addText(`Total Papers: ${meta.totalPapers}`, {
        x: 0.6,
        y: 1.6,
        fontSize: 18,
      });
    }
  }

  /* ---------------- CHAPTER SLIDES (WITH IMAGES) ---------------- */
  if (synopsis?.chapters?.length) {
    for (const ch of synopsis.chapters) {
      const slide = pptx.addSlide();

      slide.addText(ch.title || "Chapter", {
        x: 0.5,
        y: 0.4,
        fontSize: 24,
        bold: true,
      });

      // 1️⃣ Extract images BEFORE cleaning HTML
      const imageUrls = extractImageUrls(ch.body_html || "");
      console.log("Images:", imageUrls);

      // 2️⃣ Add text
      slide.addText(cleanText(ch.body_html || ""), {
        x: 0.5,
        y: 1.0,
        w: 7.5,
        h: 5.5,
        fontSize: 16,
        wrap: true,
      });

      // 3️⃣ Fetch + embed images (SEQUENTIALLY + AWAITED)
      const SLIDE_HEIGHT = 7.5;

      for (const url of imageUrls) {
        try {
          const buffer = await fetchImageBuffer(url);
          if (!buffer) continue;

          const base64 = arrayBufferToBase64(buffer);

          const mime = url.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg';

          slide.addImage({
            data: `data:${mime};base64,${base64}`,
            x: 8.2,
            y: (SLIDE_HEIGHT - 3.0) / 2,
            w: 3.0,
            h: 2.2,
          });

          imgY += 2.4;
        } catch (err) {
          console.warn('PPT image skipped:', url, err);
        }
      }


    }
  }

  /* ---------------- SAVE FILE (ONLY AFTER EVERYTHING) ---------------- */
  await pptx.writeFile({
    fileName: `${name.replace(/[^A-Za-z0-9._-]+/g, "_")}.pptx`,
  });
}
