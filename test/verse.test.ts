import { describe, expect, it } from "vitest";
import { annotateVerse, getVerseText } from "../src/verse.js";

describe("annotateVerse", () => {
  it("annotates ayat al-kursi (2:255)", () => {
    const r = annotateVerse(2, 255);
    expect(r.text).toContain("ٱلل");
    expect(r.annotations.length).toBeGreaterThan(20);
    expect(r.riwayah).toBe("hafs-shatibiyyah");
    for (const a of r.annotations) {
      expect(a.range[0]).toBeLessThan(a.range[1]);
      expect(a.range[1]).toBeLessThanOrEqual([...r.text].length);
    }
  });
  it("applies riwayah sakt data automatically: 75:27 has sakt, no idgham", () => {
    const r = annotateVerse(75, 27);
    expect(r.annotations.some((a) => a.rule === "sakt")).toBe(true);
    expect(r.annotations.filter((a) => a.rule === "idgham-bila-ghunnah")).toHaveLength(0);
  });
  it("fails loudly on nonexistent verses", () => {
    expect(() => annotateVerse(2, 287)).toThrow(RangeError);
    expect(() => annotateVerse(115, 1)).toThrow(RangeError);
    expect(() => getVerseText(0, 0)).toThrow(RangeError);
  });
  it("covers first and last verses", () => {
    expect(annotateVerse(1, 1).annotations.length).toBeGreaterThan(3);
    expect(annotateVerse(114, 6).annotations.length).toBeGreaterThan(2);
  });
});
