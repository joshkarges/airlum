/**
 * Best-effort parse of pasted receipt text (one line per item, price at end).
 * Used for manual paste, Tesseract OCR output, and quick manual entry.
 * Collapses whitespace on each line so OCR noise is tolerated.
 */
export function parseLooseReceiptText(text: string): {
  description: string;
  amount: number;
}[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const out: { description: string; amount: number }[] = [];
  const re = /^(.+?)\s+[$]?\s*(\d[\d,]*\.\d{2})\s*$/;
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      const amount = parseFloat(m[2].replace(/,/g, ""));
      const description = m[1].trim();
      if (Number.isFinite(amount) && description) {
        out.push({ description, amount });
      }
    }
  }
  return out;
}
