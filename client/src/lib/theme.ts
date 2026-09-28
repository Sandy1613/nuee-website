// Runtime-themeable design system. Three admin-picked colors (background,
// text, accent) are expanded into the full set of CSS custom properties that
// tailwind.config.ts's charcoal/ivory/gold tokens read from, so every
// existing `bg-gold`, `text-ivory/60`, etc. class in the app re-colors
// automatically — no component needs to know theming exists.

export interface ThemeColors {
  background: string; // hex, maps to the "charcoal" family
  text: string; // hex, maps to the "ivory" family
  accent: string; // hex, maps to the "gold" family
}

export interface ThemeFonts {
  heading: string; // font family name (Google Fonts, or a system font)
  body: string; // font family name (Google Fonts, or a system font)
}

interface FontOption {
  name: string;
  fallback: string;
  /** "system" fonts ship with the OS/browser and are never fetched from Google Fonts. */
  type?: "system";
}

export interface SiteTheme {
  colors: ThemeColors;
  fonts: ThemeFonts;
}

export const DEFAULT_THEME: SiteTheme = {
  colors: {
    background: "#1b1917",
    text: "#f6f1e7",
    accent: "#b6903f",
  },
  fonts: {
    heading: "Playfair Display",
    body: "Inter",
  },
};

export const HEADING_FONTS: FontOption[] = [
  { name: "Playfair Display", fallback: "serif" },
  { name: "Cormorant Garamond", fallback: "serif" },
  { name: "Fraunces", fallback: "serif" },
  { name: "Lora", fallback: "serif" },
  { name: "EB Garamond", fallback: "serif" },
  { name: "Libre Caslon Text", fallback: "serif" },
  { name: "Poppins", fallback: "sans-serif" },
  { name: "Times New Roman", fallback: "serif", type: "system" },
];

export const BODY_FONTS: FontOption[] = [
  { name: "Inter", fallback: "system-ui, sans-serif" },
  { name: "Manrope", fallback: "system-ui, sans-serif" },
  { name: "Work Sans", fallback: "system-ui, sans-serif" },
  { name: "Outfit", fallback: "system-ui, sans-serif" },
  { name: "Jost", fallback: "system-ui, sans-serif" },
  { name: "Karla", fallback: "system-ui, sans-serif" },
  { name: "Poppins", fallback: "sans-serif" },
  { name: "Times New Roman", fallback: "serif", type: "system" },
];

// ---- Color math (hex <-> HSL) ----------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function adjust(hex: string, { l = 0, s = 0 }: { l?: number; s?: number }): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, sat, light] = rgbToHsl(r, g, b);
  const newS = Math.min(100, Math.max(0, sat + s));
  const newL = Math.min(100, Math.max(0, light + l));
  const [nr, ng, nb] = hslToRgb(h, newS, newL);
  return rgbToHex(nr, ng, nb);
}

export function hexToRgbTriplet(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
}

/** Expands the 3 picked colors into every CSS variable the design system uses. */
export function deriveThemeVariables(colors: ThemeColors): Record<string, string> {
  const { background, text, accent } = colors;
  return {
    "--color-charcoal": hexToRgbTriplet(background),
    "--color-charcoal-light": hexToRgbTriplet(adjust(background, { l: 8 })),
    "--color-charcoal-deep": hexToRgbTriplet(adjust(background, { l: -6 })),
    "--color-ivory": hexToRgbTriplet(text),
    "--color-ivory-soft": hexToRgbTriplet(adjust(text, { l: -3 })),
    "--color-ivory-dim": hexToRgbTriplet(adjust(text, { l: -13 })),
    "--color-gold": hexToRgbTriplet(accent),
    "--color-gold-light": hexToRgbTriplet(adjust(accent, { l: 15 })),
    "--color-gold-muted": hexToRgbTriplet(adjust(accent, { l: -8, s: -20 })),
    "--color-gold-deep": hexToRgbTriplet(adjust(accent, { l: -12 })),
  };
}

function fontFamilyValue(name: string, fallback: string) {
  return `'${name}', ${fallback}`;
}

export function applyTheme(theme: SiteTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = deriveThemeVariables(theme.colors);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  const heading = HEADING_FONTS.find((f) => f.name === theme.fonts.heading) ?? HEADING_FONTS[0];
  const body = BODY_FONTS.find((f) => f.name === theme.fonts.body) ?? BODY_FONTS[0];
  root.style.setProperty("--font-display", fontFamilyValue(heading.name, heading.fallback));
  root.style.setProperty("--font-sans", fontFamilyValue(body.name, body.fallback));

  if (heading.type !== "system") loadGoogleFont(heading.name);
  if (body.type !== "system") loadGoogleFont(body.name);
}

const loadedFonts = new Set<string>();

export function loadGoogleFont(name: string) {
  if (loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:ital,wght@0,400;0,500;0,600;0,700&display=swap`;
  document.head.appendChild(link);
}

export function parseThemeConfig(raw: string | undefined): SiteTheme {
  if (!raw) return DEFAULT_THEME;
  try {
    const parsed = JSON.parse(raw);
    return {
      colors: { ...DEFAULT_THEME.colors, ...parsed.colors },
      fonts: { ...DEFAULT_THEME.fonts, ...parsed.fonts },
    };
  } catch {
    return DEFAULT_THEME;
  }
}
