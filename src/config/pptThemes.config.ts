export const DEFAULT_PPT_THEME = "poornima";
export const THESIS_TITLE = "Adaptive Strategies in Fault-Tolerant Quantum Computation";

export type PptTheme = {
  name: string;
  variant: "strip" | "titleBar";

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
    segments: { width: number; color: string }[];
    showLogo: boolean;
    logoWidth: number;
  };

  footer: {
    show: boolean;
    leftText: string;
    rightPageNumber: boolean;
  };

  layout: {
    titleTopGap: number;
    underlineGap: number;
    bodyTopGap: number;
    footerGap: number;
    imageGap: number;
  };
};

export const PPT_THEMES: Record<string, PptTheme> = {
  adaptiveSynopsis: {
    name: "Adaptive Synopsis (Poornima University)",
    variant: "titleBar",

    slide: { width: 13.33, height: 7.5, margin: 0.6 },

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

    layout: {
      titleTopGap: 0.65,
      underlineGap: 0.35,
      bodyTopGap: 0.45,
      footerGap: 0.9,
      imageGap: 0.4,
    },
  },

  poornima: {
    name: "Poornima University (Branded)",
    variant: "strip",

    slide: { width: 13.33, height: 7.5, margin: 0.6 },

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

    layout: {
      titleTopGap: 0.6,
      underlineGap: 0.35,
      bodyTopGap: 0.45,
      footerGap: 0.85,
      imageGap: 0.4,
    },
  },

  minimal: {
    name: "Minimal Academic",
    variant: "strip",

    slide: { width: 13.33, height: 7.5, margin: 0.6 },

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

    layout: {
      titleTopGap: 0.5,
      underlineGap: 0.3,
      bodyTopGap: 0.4,
      footerGap: 0.7,
      imageGap: 0.35,
    },
  },
};
