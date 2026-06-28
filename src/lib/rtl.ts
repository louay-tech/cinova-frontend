// Detect Arabic / Hebrew / other RTL scripts in a chunk of text.
const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u0780-\u07BF\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

export function isRtlText(text: string): boolean {
  if (!text) return false;
  // Sample only the first chunk for speed.
  const sample = text.slice(0, 4000);
  const rtlChars = sample.match(/[\u0590-\u08FF\uFB1D-\uFEFF]/g)?.length ?? 0;
  const latinChars = sample.match(/[A-Za-z]/g)?.length ?? 0;
  if (rtlChars === 0) return false;
  // Treat as RTL if RTL chars dominate over Latin letters.
  return rtlChars > latinChars;
}

export { RTL_RE };
