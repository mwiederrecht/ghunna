import { describe, expect, it } from "vitest";
import {
  isLinLetter, isMaddLetter, isSakin, tokenize, TokenizeError,
} from "../src/tokenizer.js";
import {
  ALEF, DAGGER_ALIF, HAMZA, HAMZAT_WASL, LAM, MEEM, NOON, SEEN, SMALL_YEH, WAW, YEH,
} from "../src/chars.js";

const L = (text: string, w = 0) => tokenize(text).words[w]!.letters;

describe("tokenize: structure", () => {
  it("splits words on spaces with codepoint-ranged spans", () => {
    const t = tokenize("بِسْمِ ٱللَّهِ");
    expect(t.words).toHaveLength(2);
    expect(t.words[0]!.start).toBe(0);
    expect(t.words[0]!.end).toBe(6);
    expect(t.words[1]!.start).toBe(7);
    expect([...t.text].slice(t.words[1]!.start, t.words[1]!.end).join("")).toBe("ٱللَّهِ");
  });

  it("reads letters with marks: بِسْمِ = b-i, s-sukūn, m-i", () => {
    const l = L("بِسْمِ");
    expect(l).toHaveLength(3);
    expect(l[0]!.vowel).toBe("kasra");
    expect(l[1]!.base).toBe(SEEN);
    expect(l[1]!.sukun).toBe(true);
    expect(l[2]!.base).toBe(MEEM);
  });

  it("flags shaddah and keeps hamzat waṣl as a base letter", () => {
    const l = L("ٱللَّهِ");
    expect(l[0]!.base).toBe(HAMZAT_WASL);
    expect(isSakin(l[1]!)).toBe(true); // bare first lām
    expect(l[2]!.shadda).toBe(true);
  });

  it("reads all three tanwīn forms", () => {
    expect(L("عَلِيمٌ")[3]!.tanwin).toBe("damm");
    expect(L("هُدًى")[1]!.tanwin).toBe("fath");
    expect(L("يَوْمَئِذٍ")[4]!.tanwin).toBe("kasr");
  });

  it("treats tatweel + hamza-above as a hamza letter (canonical drift form)", () => {
    // exact corpus sequence (NOT NFC — normalization would reorder the marks):
    // ل ِ ل ْ [ـ ٔ] َ ا خ ِ ر َ ة ِ
    const word = "لِلْـَٔاخِرَةِ";
    const l = L(word);
    const hamza = l.find((x) => x.base === HAMZA);
    expect(hamza).toBeDefined();
    expect(hamza!.end - hamza!.start).toBe(3); // tatweel + hamza mark + fatḥah
    expect(hamza!.vowel).toBe("fatha");
  });

  it("treats dagger alif as a base letter: ٱلرَّحْمَٰنِ", () => {
    const l = L("ٱلرَّحْمَٰنِ");
    const dagger = l.find((x) => x.base === DAGGER_ALIF);
    expect(dagger).toBeDefined();
  });

  it("records silent marks: قَالُوا۟ trailing alif is silent-always", () => {
    const l = L("قَالُوا۟");
    expect(l[l.length - 1]!.base).toBe(ALEF);
    expect(l[l.length - 1]!.silent).toBe("always");
  });

  it("records silent-in-waṣl: أَنَا۠", () => {
    const l = L("أَنَا۠");
    expect(l[l.length - 1]!.silent).toBe("wasl");
  });

  it("keeps hint marks out of rule-readable fields but inside spans", () => {
    const l = L("أَنۢبِئْهُم"); // iqlāb site with small high mīm hint
    const noon = l.find((x) => x.base === NOON)!;
    expect(noon.hints.length).toBe(1);
    expect(noon.ortho.length).toBe(0);
    // span covers the hint mark
    expect(noon.end - noon.start).toBe(2);
  });

  it("tokenizes the hamza-on-superscript-alif word (2:72 = فَادَّارَأْتُمْ)", () => {
    const l = L("فَٱدَّٰرَٰٔتُمْ");
    // the second ٰ is the hamza's SEAT, not a madd letter (iddāraʾtum)
    expect(l.filter((x) => x.base === HAMZA)).toHaveLength(1);
    expect(l.filter((x) => x.base === DAGGER_ALIF)).toHaveLength(1);
    const hamzaIdx = l.findIndex((x) => x.base === HAMZA);
    expect(isMaddLetter(l, hamzaIdx)).toBe(false);
  });

  it("tokenizes ṣila small letters as base letters", () => {
    const l = L("بِهِۦ");
    expect(l[l.length - 1]!.base).toBe(SMALL_YEH);
  });

  it("handles waqf marks in the marked text variant as standalone signs", () => {
    const t = tokenize("كَلَّا ۖ بَلْ ۜ رَانَ");
    expect(t.words).toHaveLength(3);
    expect(t.signs).toHaveLength(2);
    expect(t.signs[1]!.afterWord).toBe(1); // sakt after بَلْ
  });

  it("fails loudly on unknown codepoints", () => {
    expect(() => tokenize("abc")).toThrow(TokenizeError);
    expect(() => tokenize("بَـx")).toThrow(TokenizeError);
  });

  it("fails loudly on a mark with no base", () => {
    expect(() => tokenize("ِبسم")).toThrow(TokenizeError);
  });

  it("fails loudly on empty input", () => {
    expect(() => tokenize("")).toThrow(TokenizeError);
    expect(() => tokenize("   ")).toThrow(TokenizeError);
  });
});

describe("madd-letter detection (vowel agreement)", () => {
  const maddAt = (word: string, base: number) => {
    const l = L(word);
    return l.map((x, i) => (x.base === base && isMaddLetter(l, i) ? i : -1)).filter((i) => i >= 0);
  };

  it("alif after fatḥah is madd: قَالُوا۟", () => {
    const l = L("قَالُوا۟");
    expect(isMaddLetter(l, 1)).toBe(true); // ا after قَ
    expect(isMaddLetter(l, 3)).toBe(true); // و after لُ
  });

  it("wāw after ḍammah, yāʾ after kasrah: نُوحِيهَا", () => {
    expect(maddAt("نُوحِيهَا", WAW)).toHaveLength(1);
    expect(maddAt("نُوحِيهَا", YEH)).toHaveLength(1);
    expect(maddAt("نُوحِيهَا", ALEF)).toHaveLength(1);
  });

  it("wāw after fatḥah is NOT madd (līn): خَوْفٌ", () => {
    const l = L("خَوْفٌ");
    expect(isMaddLetter(l, 1)).toBe(false);
    expect(isLinLetter(l, 1)).toBe(true);
  });

  it("bare līn without explicit sukūn: عَصَوا۟", () => {
    const l = L("عَصَوا۟");
    const wi = l.findIndex((x) => x.base === WAW);
    expect(isMaddLetter(l, wi)).toBe(false);
    expect(isLinLetter(l, wi)).toBe(true);
  });

  it("dagger alif over a seat: عَلَىٰ (seat skipped, dagger is madd)", () => {
    const l = L("عَلَىٰ");
    const di = l.findIndex((x) => x.base === DAGGER_ALIF);
    expect(isMaddLetter(l, di)).toBe(true);
  });

  it("wāw seat before dagger is not līn/madd: ٱلصَّلَوٰةَ", () => {
    const l = L("ٱلصَّلَوٰةَ");
    const wi = l.findIndex((x) => x.base === WAW);
    expect(isMaddLetter(l, wi)).toBe(false);
    expect(isLinLetter(l, wi)).toBe(false);
    const di = l.findIndex((x) => x.base === DAGGER_ALIF);
    expect(isMaddLetter(l, di)).toBe(true);
  });

  it("tanwīn seat ى is not madd: هُدًى", () => {
    const l = L("هُدًى");
    expect(isMaddLetter(l, 2)).toBe(false);
  });

  it("vocalized wāw/yāʾ are consonants: وَلَدٌ", () => {
    const l = L("وَلَدٌ");
    expect(isMaddLetter(l, 0)).toBe(false);
  });

  it("ṣila letters are madd: بِهِۦ / لَهُۥ", () => {
    const a = L("بِهِۦ");
    expect(isMaddLetter(a, a.length - 1)).toBe(true);
    const b = L("لَهُۥ");
    expect(isMaddLetter(b, b.length - 1)).toBe(true);
  });
});
