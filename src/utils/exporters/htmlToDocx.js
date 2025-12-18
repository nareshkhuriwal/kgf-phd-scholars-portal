import {
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    ImageRun,
} from "docx";
import { fetchImageBuffer } from "./fetchImage";

export async function htmlToDocxParagraphs(html) {
    if (!html) return [];

    const container = document.createElement("div");
    container.innerHTML = html;

    const blocks = [];

    for (const node of container.childNodes) {
        // -----------------------------
        // TEXT NODE
        // -----------------------------
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) {
                blocks.push(
                    new Paragraph({
                        children: [new TextRun(text)],
                        spacing: { after: 200 },
                    })
                );
            }
            continue;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        const tag = node.tagName.toLowerCase();

        // -----------------------------
        // HEADINGS
        // -----------------------------
        if (tag === "h1" || tag === "h2") {
            blocks.push(
                new Paragraph({
                    text: node.innerText,
                    heading: HeadingLevel.HEADING_1,
                    alignment:
                        node.style.textAlign === "center"
                            ? AlignmentType.CENTER
                            : undefined,
                    spacing: { after: 300 },
                })
            );
            continue;
        }

        // -----------------------------
        // PARAGRAPH
        // -----------------------------
        if (tag === "p") {
            blocks.push(
                new Paragraph({
                    children: parseInline(node),
                    spacing: { after: 200 },
                })
            );
            continue;
        }

        // -----------------------------
        // IMAGE (IMG OR FIGURE)
        // -----------------------------
        if (tag === "img" || tag === "figure") {
            const img =
                tag === "img" ? node : node.querySelector("img");

            const src = img?.getAttribute("src");

            if (src) {
                const buffer = await fetchImageBuffer(src);

                if (buffer) {
                    const imageData = new Uint8Array(buffer); // ✅ REQUIRED

                    blocks.push(
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 300, after: 300 },
                            children: [
                                new ImageRun({
                                    data: imageData,
                                    transformation: {
                                        width: 160,
                                        height: 160,
                                    },
                                }),
                            ],
                        })
                    );
                }
            }
            continue;
        }
    }

    return blocks;
}

function parseInline(node) {
    const runs = [];

    node.childNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
            runs.push(new TextRun(n.textContent));
        }

        if (
            n.nodeType === Node.ELEMENT_NODE &&
            n.tagName === "STRONG"
        ) {
            runs.push(
                new TextRun({
                    text: n.innerText,
                    bold: true,
                })
            );
        }
    });

    return runs;
}
