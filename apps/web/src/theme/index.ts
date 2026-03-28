import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#e8eef6" },
          100: { value: "#c5d4e8" },
          200: { value: "#9fb8d9" },
          300: { value: "#789cc9" },
          400: { value: "#5b87be" },
          500: { value: "#3e72b3" },
          600: { value: "#3565a3" },
          700: { value: "#2a5490" },
          800: { value: "#1f447d" },
          900: { value: "#1a365d" },
          950: { value: "#0f1f38" },
        },
        accent: {
          50: { value: "#fdf8eb" },
          100: { value: "#f9edd0" },
          200: { value: "#f3dba1" },
          300: { value: "#edc872" },
          400: { value: "#e6b543" },
          500: { value: "#d69e2e" },
          600: { value: "#b88420" },
          700: { value: "#996b17" },
          800: { value: "#7a520f" },
          900: { value: "#5c3c08" },
          950: { value: "#3d2705" },
        },
        success: {
          50: { value: "#ecfdf5" },
          100: { value: "#d1fae5" },
          200: { value: "#a7f3d0" },
          300: { value: "#6ee7b7" },
          400: { value: "#34d399" },
          500: { value: "#10b981" },
          600: { value: "#059669" },
          700: { value: "#047857" },
          800: { value: "#065f46" },
          900: { value: "#064e3b" },
          950: { value: "#022c22" },
        },
        danger: {
          50: { value: "#fef2f2" },
          100: { value: "#fee2e2" },
          200: { value: "#fecaca" },
          300: { value: "#fca5a5" },
          400: { value: "#f87171" },
          500: { value: "#ef4444" },
          600: { value: "#dc2626" },
          700: { value: "#b91c1c" },
          800: { value: "#991b1b" },
          900: { value: "#7f1d1d" },
          950: { value: "#450a0a" },
        },
        surface: {
          50: { value: "#fafbfc" },
          100: { value: "#f4f6f8" },
          200: { value: "#e9ecef" },
          300: { value: "#dee2e6" },
          400: { value: "#ced4da" },
          500: { value: "#adb5bd" },
          600: { value: "#868e96" },
          700: { value: "#495057" },
          800: { value: "#343a40" },
          900: { value: "#212529" },
          950: { value: "#0d1117" },
        },
      },
      fonts: {
        heading: {
          value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        body: {
          value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      },
      radii: {
        card: { value: "12px" },
        button: { value: "8px" },
        input: { value: "8px" },
        badge: { value: "6px" },
      },
      shadows: {
        card: {
          value: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        },
        cardHover: {
          value: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)",
        },
        sidebar: {
          value: "2px 0 8px rgba(0, 0, 0, 0.04)",
        },
      },
    },
    semanticTokens: {
      colors: {
        "brand.solid": {
          value: { base: "{colors.brand.800}", _dark: "{colors.brand.300}" },
        },
        "brand.contrast": {
          value: { base: "white", _dark: "{colors.brand.950}" },
        },
        "brand.fg": {
          value: { base: "{colors.brand.800}", _dark: "{colors.brand.200}" },
        },
        "brand.muted": {
          value: { base: "{colors.brand.100}", _dark: "{colors.brand.900}" },
        },
        "brand.subtle": {
          value: { base: "{colors.brand.50}", _dark: "{colors.brand.950}" },
        },
        "brand.emphasized": {
          value: { base: "{colors.brand.600}", _dark: "{colors.brand.400}" },
        },

        "accent.solid": {
          value: { base: "{colors.accent.500}", _dark: "{colors.accent.400}" },
        },
        "accent.contrast": {
          value: { base: "white", _dark: "{colors.accent.950}" },
        },
        "accent.fg": {
          value: { base: "{colors.accent.700}", _dark: "{colors.accent.200}" },
        },
        "accent.muted": {
          value: { base: "{colors.accent.100}", _dark: "{colors.accent.900}" },
        },
        "accent.subtle": {
          value: { base: "{colors.accent.50}", _dark: "{colors.accent.950}" },
        },

        "success.solid": {
          value: { base: "{colors.success.600}", _dark: "{colors.success.400}" },
        },
        "success.fg": {
          value: { base: "{colors.success.700}", _dark: "{colors.success.300}" },
        },
        "success.muted": {
          value: { base: "{colors.success.100}", _dark: "{colors.success.900}" },
        },
        "success.subtle": {
          value: { base: "{colors.success.50}", _dark: "{colors.success.950}" },
        },

        "danger.solid": {
          value: { base: "{colors.danger.600}", _dark: "{colors.danger.400}" },
        },
        "danger.fg": {
          value: { base: "{colors.danger.700}", _dark: "{colors.danger.300}" },
        },
        "danger.muted": {
          value: { base: "{colors.danger.100}", _dark: "{colors.danger.900}" },
        },
        "danger.subtle": {
          value: { base: "{colors.danger.50}", _dark: "{colors.danger.950}" },
        },

        "bg.page": {
          value: { base: "{colors.surface.50}", _dark: "{colors.surface.950}" },
        },
        "bg.surface": {
          value: { base: "white", _dark: "{colors.surface.900}" },
        },
        "bg.sidebar": {
          value: { base: "{colors.brand.900}", _dark: "{colors.surface.900}" },
        },
        "bg.subtle": {
          value: { base: "{colors.surface.100}", _dark: "{colors.surface.800}" },
        },
        "bg.muted": {
          value: { base: "{colors.surface.200}", _dark: "{colors.surface.700}" },
        },

        "border.default": {
          value: { base: "{colors.surface.200}", _dark: "{colors.surface.700}" },
        },
        "border.muted": {
          value: { base: "{colors.surface.100}", _dark: "{colors.surface.800}" },
        },
        "border.accent": {
          value: { base: "{colors.accent.300}", _dark: "{colors.accent.700}" },
        },

        "fg.default": {
          value: { base: "{colors.surface.900}", _dark: "{colors.surface.50}" },
        },
        "fg.muted": {
          value: { base: "{colors.surface.600}", _dark: "{colors.surface.400}" },
        },
        "fg.subtle": {
          value: { base: "{colors.surface.500}", _dark: "{colors.surface.500}" },
        },
        "fg.inverted": {
          value: { base: "white", _dark: "{colors.surface.900}" },
        },

        "issuer.chase": {
          value: { base: "#003087", _dark: "#5b9bd5" },
        },
        "issuer.amex": {
          value: { base: "#006fcf", _dark: "#6db3f0" },
        },
        "issuer.capital_one": {
          value: { base: "#d03027", _dark: "#e87670" },
        },
        "issuer.citi": {
          value: { base: "#003b70", _dark: "#5b8fb5" },
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      bg: "bg.page",
      color: "fg.default",
    },
  },
});

export const system = createSystem(defaultConfig, config);
