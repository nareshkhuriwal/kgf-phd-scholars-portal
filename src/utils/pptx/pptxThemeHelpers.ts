// src/utils/pptx/pptxThemeHelpers.ts
import { PptTheme } from "../../config/pptThemes.config";

/* =====================================================
 * HEADER
 * ===================================================== */

export function applyHeader(
    slide: any,
    theme: PptTheme,
    options?: {
        title?: string;
        section?: string;
    }
) {
    const slideWidth = theme.slide.width;

    /* ===========================
     * TITLE BAR VARIANT
     * =========================== */
    if (theme.variant === "titleBar") {
        const barHeight = 0.6;

        // Header background
        slide.addShape("rect", {
            x: 0,
            y: 0,
            w: slideWidth,
            h: barHeight,
            fill: { color: theme.colors.primary },
            line: { type: "none" },
        });

        /* ---- Vertical centering math ---- */
        const titleFontSize = 14;
        const titleBoxHeight = 0.28;
        const textY = (barHeight - titleBoxHeight) / 2;

        // Left title
        if (options?.title) {
            slide.addText(options.title, {
                x: theme.slide.margin,
                y: textY,
                w: slideWidth - theme.slide.margin * 2 - 2.5,
                h: titleBoxHeight,
                fontSize: titleFontSize,
                bold: true,
                color: "#FFFFFF",
                align: "left",
            });
        }

        // Right section
        if (options?.section) {
            slide.addText(options.section, {
                x: slideWidth - theme.slide.margin - 2.3,
                y: textY,
                w: 2.3,
                h: titleBoxHeight,
                fontSize: 12,
                bold: true,
                color: "#FFFFFF",
                align: "right",
            });
        }

        // Bottom accent line
        slide.addShape("rect", {
            x: 0,
            y: barHeight,
            w: slideWidth,
            h: 0.03,
            fill: { color: theme.colors.secondary },
            line: { type: "none" },
        });

        return;
    }

    /* ===========================
     * STRIP VARIANT
     * =========================== */
    let x = 0;
    for (const seg of theme.header.segments) {
        slide.addShape("rect", {
            x,
            y: 0,
            w: slideWidth * seg.width,
            h: theme.header.barHeight,
            fill: { color: seg.color },
            line: { type: "none" },
        });
        x += slideWidth * seg.width;
    }
}

/* =====================================================
 * FOOTER
 * ===================================================== */

export function applyFooter(
    slide: any,
    theme: PptTheme,
    pageNum: number
) {
    if (!theme.footer.show) return;

    const footerHeight = 0.45;
    const footerY = theme.slide.height - footerHeight;

    /* ---- Light version of header color ---- */
    const footerBg = lightenColor(theme.colors.primary, 0.92);

    // Footer background (NO BORDER)
    slide.addShape("rect", {
        x: 0,
        y: footerY,
        w: theme.slide.width,
        h: footerHeight,
        fill: { color: footerBg },
        line: { type: "none" },
    });

    /* ---- Vertical centering math ---- */
    const footerFontSize = theme.fonts.footer;
    const textBoxHeight = 0.22;
    const textY = footerY + (footerHeight - textBoxHeight) / 2;

    // Left footer text
    slide.addText(theme.footer.leftText, {
        x: theme.slide.margin,
        y: textY,
        w: theme.slide.width / 2,
        h: textBoxHeight,
        fontSize: footerFontSize,
        color: theme.colors.footer,
        align: "left",
    });

    // Page number (right)
    if (theme.footer.rightPageNumber) {
        slide.addText(String(pageNum), {
            x: theme.slide.width - theme.slide.margin - 1,
            y: textY,
            w: 1,
            h: textBoxHeight,
            fontSize: footerFontSize,
            color: theme.colors.footer,
            align: "right",
        });
    }
}

/* =====================================================
 * COLOR UTILITY
 * ===================================================== */

function lightenColor(hex: string, factor: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const toHex = (v: number) =>
        Math.round(v).toString(16).padStart(2, "0");

    return (
        "#" +
        toHex(r + (255 - r) * factor) +
        toHex(g + (255 - g) * factor) +
        toHex(b + (255 - b) * factor)
    );
}
