/**
 * Convert an OKLCH color string to a sRGB hex string ("#rrggbb").
 *
 * Background: BlockCategory.color is stored as "oklch(L C H)" because the
 * editor uses Tailwind's color-mix in oklch. @react-pdf/renderer only
 * understands named/hex/rgb colors though, so we convert before passing the
 * string to PDF styles. Any input we can't parse falls through to a neutral
 * gray.
 *
 * Conversion path: oklch → oklab → linear sRGB → gamma-corrected sRGB → hex.
 * Reference: https://www.w3.org/TR/css-color-4/#color-conversion-code
 */

const OKLCH_RE = /^oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+(-?[0-9.]+)/i;
const NEUTRAL_HEX = "#9ca3af";

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function linearToSrgb(c: number) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function toHex(channel: number) {
  const v = Math.round(clamp01(channel) * 255);
  return v.toString(16).padStart(2, "0");
}

export function oklchToHex(input: string | null | undefined): string {
  if (!input) return NEUTRAL_HEX;
  const trimmed = input.trim();
  // Already hex — let it pass through (with leading # added if missing).
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return trimmed;

  const m = OKLCH_RE.exec(trimmed);
  if (!m) return NEUTRAL_HEX;

  const L = parseFloat(m[1]);
  const C = parseFloat(m[2]);
  const H = parseFloat(m[3]);
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → linear sRGB (matrix from CSS Color 4 spec)
  const lp = L + 0.3963377774 * a + 0.2158037573 * b;
  const mp = L - 0.1055613458 * a - 0.0638541728 * b;
  const sp = L - 0.0894841775 * a - 1.291485548 * b;
  const lin_l = lp * lp * lp;
  const lin_m = mp * mp * mp;
  const lin_s = sp * sp * sp;

  const r_lin =
    4.0767416621 * lin_l - 3.3077115913 * lin_m + 0.2309699292 * lin_s;
  const g_lin =
    -1.2684380046 * lin_l + 2.6097574011 * lin_m - 0.3413193965 * lin_s;
  const b_lin =
    -0.0041960863 * lin_l - 0.7034186147 * lin_m + 1.707614701 * lin_s;

  return (
    "#" + toHex(linearToSrgb(r_lin)) + toHex(linearToSrgb(g_lin)) +
    toHex(linearToSrgb(b_lin))
  );
}

/**
 * Apply an alpha (0–1) to a color string, returning an "rgba(...)" string
 * suitable for @react-pdf. Input may be hex or oklch — both are normalized
 * via oklchToHex first.
 */
export function withAlpha(color: string | null | undefined, alpha: number): string {
  const hex = oklchToHex(color);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const bl = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${bl}, ${alpha.toFixed(3)})`;
}
