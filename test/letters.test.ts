import { describe, expect, it } from "vitest";
import { describeLetter, LETTER_PROFILES } from "../src/letters.js";

describe("letter profiles (jazariyyah:9-25)", () => {
  it("covers all 29 letters with makhraj + sifat + citations", () => {
    expect(LETTER_PROFILES.size).toBe(29);
    for (const p of LETTER_PROFILES.values()) {
      expect(p.makhraj.citation.lines.length).toBeGreaterThan(0);
      expect(p.sifat.length).toBeGreaterThanOrEqual(5);
    }
  });
  it("sad: whispered, flowing, elevated, pressed, whistling", () => {
    const ids = describeLetter("ص").sifat.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["hams", "rakhawah", "istila", "itbaq", "safir"]));
  });
  it("ra: voiced, in-between, deflection + trill", () => {
    const ids = describeLetter("ر").sifat.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["jahr", "bayniyyah", "inhiraf", "takrir", "idhlaq"]));
  });
  it("qalqalah letters carry the qalqalah sifa (قطب جد)", () => {
    for (const c of ["ق", "ط", "ب", "ج", "د"]) {
      expect(describeLetter(c).sifat.some((s) => s.id === "qalqalah"), c).toBe(true);
    }
  });
  it("mnemonic sets are internally consistent", () => {
    const hams = new Set([..."فحثهشخصسكت"]);
    for (const [c, p] of LETTER_PROFILES) {
      if (c === "ا") continue; // madd letter, no hams/jahr contrast issue
      const hasHams = p.sifat.some((s) => s.id === "hams");
      expect(hasHams, c).toBe(hams.has(c));
    }
  });
  it("resolves seats and small forms; throws on unknown", () => {
    expect(describeLetter("أ").name.transliteration).toBe("hamzah");
    expect(describeLetter("ة").name.transliteration).toBe("hāʾ");
    expect(describeLetter("ٰ").name.transliteration).toBe("alif");
    expect(() => describeLetter("x")).toThrow(RangeError);
  });
});
