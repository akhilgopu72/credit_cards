import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

/**
 * CardMax "Obsidian Architect" Design System
 *
 * Philosophy: Tonal Depth over Structural Lines.
 * Organization through whitespace, surface value shifts, and ghost borders.
 * Color accents (#3fff8b green, #6e9bff blue) are luminous data highlights
 * on a near-black obsidian foundation.
 */

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // ─── Obsidian Surface Stack ─────────────────────────
        // Treat the interface as layered semi-matte obsidian
        surface: {
          50: { value: "#adaaaa" },  // on-surface-variant (muted text)
          100: { value: "#767575" }, // outline (subtle text)
          200: { value: "#484847" }, // outline-variant (ghost borders)
          300: { value: "#2c2c2c" }, // surface-bright (hover/active)
          400: { value: "#262626" }, // surface-container-highest
          500: { value: "#201f1f" }, // surface-container-high
          600: { value: "#1a1919" }, // surface-container (cards)
          700: { value: "#131313" }, // surface-container-low
          800: { value: "#0e0e0e" }, // surface (page bg)
          900: { value: "#080808" }, // deeper void
          950: { value: "#000000" }, // surface-container-lowest (recessed)
        },

        // ─── Green Accent — Rewards & Positive Values ───────
        // "Secondary" in Obsidian spec: #3fff8b
        success: {
          50: { value: "#e3ffe4" },
          100: { value: "#b0ffc0" },
          200: { value: "#6eff99" },
          300: { value: "#3fff8b" },
          400: { value: "#24f07e" },
          500: { value: "#00d964" },
          600: { value: "#006d35" },
          700: { value: "#005d2c" },
          800: { value: "#004820" },
          900: { value: "#003316" },
          950: { value: "#001a0b" },
        },

        // ─── Blue Accent — Brand & Secondary Data ───────────
        // "Tertiary" in Obsidian spec: #6e9bff
        brand: {
          50: { value: "#e8f0ff" },
          100: { value: "#c5d9ff" },
          200: { value: "#8eafff" },
          300: { value: "#77a1ff" },
          400: { value: "#6e9bff" },
          500: { value: "#5580e6" },
          600: { value: "#2778fe" },
          700: { value: "#003580" },
          800: { value: "#001d4e" },
          900: { value: "#00163d" },
          950: { value: "#000c22" },
        },

        // ─── Accent — Same as success for reward highlights ─
        accent: {
          50: { value: "#e3ffe4" },
          100: { value: "#b0ffc0" },
          200: { value: "#6eff99" },
          300: { value: "#3fff8b" },
          400: { value: "#24f07e" },
          500: { value: "#00d964" },
          600: { value: "#006d35" },
          700: { value: "#005d2c" },
          800: { value: "#004820" },
          900: { value: "#003316" },
          950: { value: "#001a0b" },
        },

        // ─── Danger / Error ─────────────────────────────────
        danger: {
          50: { value: "#ffe5e4" },
          100: { value: "#ffc8c6" },
          200: { value: "#ffa8a3" },
          300: { value: "#ff716c" },
          400: { value: "#d7383b" },
          500: { value: "#c0282b" },
          600: { value: "#9f0519" },
          700: { value: "#7a0413" },
          800: { value: "#55020d" },
          900: { value: "#490006" },
          950: { value: "#2a0004" },
        },
      },
      fonts: {
        heading: {
          value: "var(--font-manrope), 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        body: {
          value: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      },
      radii: {
        card: { value: "0.375rem" },   // Sharp professional corners (6px)
        button: { value: "0.75rem" },  // Pill-shaped buttons (12px)
        input: { value: "0.25rem" },   // Subtle input rounding
        badge: { value: "9999px" },    // Full capsule pills
      },
      letterSpacings: {
        tighter: { value: "-0.04em" },
        tight: { value: "-0.02em" },
      },
      shadows: {
        // Ambient glow — mimics soft bounce-light
        card: {
          value: "0 20px 40px 0 rgba(255, 255, 255, 0.04)",
        },
        cardHover: {
          value: "0 20px 40px 0 rgba(255, 255, 255, 0.08)",
        },
        sidebar: {
          value: "none",
        },
        // Glass effect for modals/dropdowns
        glass: {
          value: "0 20px 40px 0 rgba(0, 0, 0, 0.5)",
        },
      },
    },
    semanticTokens: {
      colors: {
        // ─── Brand (Blue Accent) ────────────────────────────
        "brand.solid": {
          value: "{colors.brand.400}",
        },
        "brand.contrast": {
          value: "{colors.brand.900}",
        },
        "brand.fg": {
          value: "{colors.brand.400}",
        },
        "brand.muted": {
          value: "{colors.brand.800}",
        },
        "brand.subtle": {
          value: "{colors.brand.900}",
        },
        "brand.emphasized": {
          value: "{colors.brand.300}",
        },

        // ─── Accent (Green Rewards) ─────────────────────────
        "accent.solid": {
          value: "{colors.accent.300}",
        },
        "accent.contrast": {
          value: "{colors.accent.900}",
        },
        "accent.fg": {
          value: "{colors.accent.300}",
        },
        "accent.muted": {
          value: "{colors.accent.800}",
        },
        "accent.subtle": {
          value: "{colors.accent.900}",
        },

        // ─── Success (Green — same as accent) ───────────────
        "success.solid": {
          value: "{colors.success.300}",
        },
        "success.fg": {
          value: "{colors.success.300}",
        },
        "success.muted": {
          value: "{colors.success.800}",
        },
        "success.subtle": {
          value: "{colors.success.900}",
        },

        // ─── Danger ─────────────────────────────────────────
        "danger.solid": {
          value: "{colors.danger.300}",
        },
        "danger.fg": {
          value: "{colors.danger.300}",
        },
        "danger.muted": {
          value: "{colors.danger.700}",
        },
        "danger.subtle": {
          value: "{colors.danger.800}",
        },

        // ─── Backgrounds (Obsidian Surface Stack) ───────────
        "bg.page": {
          value: "{colors.surface.800}",     // #0e0e0e — the void
        },
        "bg.surface": {
          value: "{colors.surface.600}",     // #1a1919 — cards/panels
        },
        "bg.sidebar": {
          value: "{colors.surface.800}",     // #0e0e0e — same as page
        },
        "bg.subtle": {
          value: "{colors.surface.500}",     // #201f1f — elevated
        },
        "bg.muted": {
          value: "{colors.surface.400}",     // #262626 — highest surface
        },
        "bg.active": {
          value: "{colors.surface.300}",     // #2c2c2c — hover/active
        },

        // ─── Borders (Ghost Borders) ────────────────────────
        "border.default": {
          value: "rgba(255, 255, 255, 0.08)",
        },
        "border.muted": {
          value: "rgba(255, 255, 255, 0.04)",
        },
        "border.accent": {
          value: "{colors.brand.400}",
        },
        "border.ghost": {
          value: "rgba(72, 72, 71, 0.15)",
        },

        // ─── Foreground ─────────────────────────────────────
        "fg.default": {
          value: "#ffffff",
        },
        "fg.muted": {
          value: "{colors.surface.50}",      // #adaaaa
        },
        "fg.subtle": {
          value: "{colors.surface.100}",     // #767575
        },
        "fg.inverted": {
          value: "{colors.surface.800}",     // #0e0e0e
        },

        // ─── Issuer Colors (lightened for dark backgrounds) ─
        "issuer.chase": {
          value: "#5b9bd5",
        },
        "issuer.amex": {
          value: "#6db3f0",
        },
        "issuer.capital_one": {
          value: "#e87670",
        },
        "issuer.citi": {
          value: "#5b8fb5",
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      bg: "bg.page",
      color: "fg.default",
    },
    // Manrope headline letter-spacing
    "h1, h2, h3, h4, h5, h6": {
      fontFamily: "heading",
      letterSpacing: "-0.02em",
    },
  },
});

export const system = createSystem(defaultConfig, config);
