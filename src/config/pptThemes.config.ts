export const DEFAULT_PPT_THEME = "poornima";

export type PptTheme = {
    name: string;
    variant: "strip" | "titleBar"; // 👈 ADD THIS

    slide: {
        width: number;
        height: number;
        margin: number;
    };

    colors: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        muted: string;
        footer: string;
    };

    fonts: {
        title: number;
        subtitle: number;
        body: number;
        footer: number;
    };

    header: {
        barHeight: number;
        segments: {
            width: number; // must sum to 1.0
            color: string;
        }[];
        showLogo: boolean;
        logoWidth: number;
    };

    footer: {
        show: boolean;
        leftText: string;
        rightPageNumber: boolean;
    };
};

export const PPT_THEMES: Record<string, PptTheme> = {
    /* ======================================================
     * DEFAULT — EXACT PhD SYNOPSIS THEME (from uploaded PPT)
     * ====================================================== */
    adaptiveSynopsis: {
        name: "Adaptive Synopsis (Poornima University)",
        variant: "titleBar", // ✅ IMPORTANT


        slide: {
            width: 13.33,
            height: 7.5,
            margin: 0.6,
        },

        colors: {
            primary: "#1F3A68",
            secondary: "#6BA7C8",
            accent: "#D6B27C",
            text: "#000000",
            muted: "#666666",
            footer: "#1F3A68",
        },

        fonts: {
            title: 34,
            subtitle: 18,
            body: 16,
            footer: 10,
        },

        header: {
            barHeight: 0.28,
            segments: [
                { width: 0.45, color: "#1F3A68" },
                { width: 0.35, color: "#6BA7C8" },
                { width: 0.20, color: "#B0B5BB" },
            ],
            showLogo: true,
            logoWidth: 1.4,
        },

        footer: {
            show: true,
            leftText: "Poornima University, Jaipur | PhD Synopsis Presentation",
            rightPageNumber: true,
        },
    },

    /* ======================================================
     * BRANDED — POORNIMA UNIVERSITY (REUSABLE)
     * ====================================================== */
    poornima: {
        name: "Poornima University (Branded)",
        variant: "strip",

        slide: {
            width: 13.33,
            height: 7.5,
            margin: 0.6,
        },

        colors: {
            primary: "#1F3A68",
            secondary: "#4BA3C7",
            accent: "#D6B27C",
            text: "#000000",
            muted: "#666666",
            footer: "#1F3A68",
        },

        fonts: {
            title: 32,
            subtitle: 18,
            body: 16,
            footer: 10,
        },

        header: {
            barHeight: 0.25,
            segments: [
                { width: 0.5, color: "#1F3A68" },
                { width: 0.3, color: "#4BA3C7" },
                { width: 0.2, color: "#B0B5BB" },
            ],
            showLogo: true,
            logoWidth: 1.3,
        },

        footer: {
            show: true,
            leftText: "Poornima University, Jaipur",
            rightPageNumber: true,
        },
    },

    /* ======================================================
     * NEUTRAL — MINIMAL ACADEMIC
     * ====================================================== */
    minimal: {
        name: "Minimal Academic",
        variant: "strip"
        ,
        slide: {
            width: 13.33,
            height: 7.5,
            margin: 0.6,
        },

        colors: {
            primary: "#000000",
            secondary: "#555555",
            accent: "#DDDDDD",
            text: "#000000",
            muted: "#777777",
            footer: "#555555",
        },

        fonts: {
            title: 28,
            subtitle: 16,
            body: 14,
            footer: 9,
        },

        header: {
            barHeight: 0,
            segments: [],
            showLogo: false,
            logoWidth: 0,
        },

        footer: {
            show: true,
            leftText: "",
            rightPageNumber: true,
        },
    },
};
