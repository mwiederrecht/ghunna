/** Phase 2: the waqf (stop) model — stop-only rules, modes, stopAt. */
import { describe, expect, it } from "vitest";
import { annotate } from "../src/engine.js";
import type { RuleId } from "../src/annotation.js";

const rulesOf = (anns: ReturnType<typeof annotate>) => anns.map((a) => a.rule);

describe("stop mode: waqf tail rules (tuhfah:41, 45; jazariyyah:38)", () => {
  it("madd ʿāriḍ lil-sukūn: نَسْتَعِينُ stopped", () => {
    const anns = annotate("إِيَّاكَ نَسْتَعِينُ", { mode: "stop" });
    expect(rulesOf(anns)).toContain("madd-arid-lissukun");
    // and its ṭabīʿī is upgraded, not duplicated
    const onYa = anns.filter((a) => a.range[0] >= 14);
    expect(onYa.filter((a) => a.rule === "madd-tabii")).toHaveLength(0);
  });
  it("madd ʿāriḍ via tāʾ marbūṭah: ٱلصَّلَوٰةَ stopped (…ṣalāh)", () => {
    expect(rulesOf(annotate("ٱلصَّلَوٰةَ", { mode: "stop" }))).toContain("madd-arid-lissukun");
  });
  it("qalqalah kubrā: stopping on ٱلْحَقِّ and on قَرِيبٌ", () => {
    expect(rulesOf(annotate("بِٱلْحَقِّ", { mode: "stop" }))).toContain("qalqalah-kubra");
    const q = annotate("قَرِيبٌ", { mode: "stop" });
    expect(rulesOf(q)).toContain("qalqalah-kubra");
    expect(rulesOf(q)).toContain("madd-arid-lissukun"); // qarīb: yāʾ before the bāʾ
  });
  it("madd ʿiwaḍ on tanwīn fatḥ: عَلِيمًا and هُدًى stopped", () => {
    expect(rulesOf(annotate("عَلِيمًا", { mode: "stop" }))).toContain("madd-iwad");
    expect(rulesOf(annotate("هُدًى", { mode: "stop" }))).toContain("madd-iwad");
  });
  it("no ʿiwaḍ on tāʾ marbūṭah tanwīn: رَحْمَةً stops as ha", () => {
    expect(rulesOf(annotate("رَحْمَةً", { mode: "stop" }))).not.toContain("madd-iwad");
  });
  it("madd līn: قُرَيْشٍ stopped", () => {
    expect(rulesOf(annotate("لِإِيلَٰفِ قُرَيْشٍ", { mode: "stop" }))).toContain("madd-lin");
  });
  it("silent-in-waṣl alif surfaces at stop: أَنَا۠", () => {
    const stop = annotate("أَنَا۠", { mode: "stop" });
    expect(rulesOf(stop)).toContain("madd-tabii");
    expect(rulesOf(stop)).not.toContain("silent");
    const wasl = annotate("أَنَا۠");
    expect(rulesOf(wasl)).toContain("silent");
    expect(rulesOf(wasl)).not.toContain("madd-tabii");
  });
  it("word ending in a madd letter keeps ṭabīʿī at stop: نُوحِيهَا", () => {
    const anns = annotate("نُوحِيهَا", { mode: "stop" });
    expect(rulesOf(anns)).not.toContain("madd-arid-lissukun");
    expect(anns.filter((a) => a.rule === "madd-tabii").length).toBeGreaterThanOrEqual(2);
  });
});

describe("stopAt: mid-text stop severs cross-boundary rules", () => {
  it("idghām dies across a stop: مَن يَقُولُ with stopAt 0", () => {
    const anns = annotate("مَن يَقُولُ", { stopAt: 0 });
    expect(rulesOf(anns)).not.toContain("idgham-bighunnah");
  });
  it("munfaṣil dies across a stop: بِمَآ أُنزِلَ with stopAt 0", () => {
    const anns = annotate("بِمَآ أُنزِلَ", { stopAt: 0 });
    expect(rulesOf(anns)).not.toContain("madd-munfasil");
  });
  it("iẓhār shafawī target unaffected mid-word", () => {
    const anns = annotate("هُمْ فِيهَا", { stopAt: 0 });
    expect(rulesOf(anns)).not.toContain("izhar-shafawi"); // مْ has nothing to relate to across the stop
  });
});

describe("startFresh: utterance-start rules", () => {
  it("hamzat waṣl pronounced at start, with the start vowel derived (jazariyyah:100–102)", () => {
    const fresh = annotate("ٱلْحَمْدُ لِلَّهِ", { startFresh: true });
    const startWasl = fresh.find((a) => a.rule === "hamzat-wasl" && a.range[0] === 0);
    expect(startWasl?.derivation).toContain("fatḥah"); // definite article
    const verb = annotate("ٱهْدِنَا", { startFresh: true }).find((a) => a.rule === "hamzat-wasl");
    expect(verb?.derivation).toContain("kasrah");
    const damma = annotate("ٱنظُرْ", { startFresh: true }).find((a) => a.rule === "hamzat-wasl");
    expect(damma?.derivation).toContain("ḍammah");
    const noun = annotate("ٱسْمُهُ", { startFresh: true }).find((a) => a.rule === "hamzat-wasl");
    expect(noun?.derivation).toContain("seven listed nouns");
    // in flowing recitation it stays a silent-waṣl span
    const flowing = annotate("ٱلْحَمْدُ لِلَّهِ");
    expect(flowing.find((a) => a.rule === "hamzat-wasl" && a.range[0] === 0)?.derivation).toContain("silent");
  });
  it("word-initial shaddah dropped at start: مَّا يَوَدُّ", () => {
    const fresh = annotate("مَّا يَوَدُّ", { startFresh: true });
    expect(fresh.filter((a) => a.rule === "ghunnah-mushaddadah" && a.range[0] === 0)).toHaveLength(0);
    const flowing = annotate("مَّا يَوَدُّ");
    expect(flowing.filter((a) => a.rule === "ghunnah-mushaddadah" && a.range[0] === 0)).toHaveLength(1);
  });
});

describe("both mode", () => {
  it("labels mode-exclusive annotations: نَسْتَعِينُ", () => {
    const anns = annotate("نَسْتَعِينُ", { mode: "both" });
    const arid = anns.find((a) => a.rule === "madd-arid-lissukun");
    const tabii = anns.find((a) => a.rule === "madd-tabii");
    expect(arid?.appliesIn).toBe("waqf");
    expect(tabii?.appliesIn).toBe("wasl");
  });
  it("shared annotations carry no appliesIn: مِن رَّبِّهِمْ", () => {
    const anns = annotate("مِن رَّبِّهِمْ", { mode: "both" });
    const idgham = anns.find((a) => a.rule === "idgham-bila-ghunnah");
    expect(idgham?.appliesIn).toBeUndefined();
  });
});

describe("waqf marks data layer", () => {
  it("returns the sakt mark at 75:27 and sajdah at 32:15", async () => {
    const { getWaqfMarks } = await import("../src/waqf.js");
    const m = getWaqfMarks(75, 27);
    expect(m.some((x) => x.kind === "sakt" && x.afterWord === 1)).toBe(true);
    expect(getWaqfMarks(32, 15).some((x) => x.kind === "sajdah")).toBe(true);
    expect(getWaqfMarks(1, 1)).toEqual([]);
  });
  it("sakt marks in the data agree with the riwayah sakt sites", async () => {
    const { getWaqfMarks } = await import("../src/waqf.js");
    const { HAFS_SAKT_SITES } = await import("../src/riwayah.js");
    for (const s of HAFS_SAKT_SITES) {
      const marks = getWaqfMarks(s.surah, s.ayah);
      expect(
        marks.some((m) => m.kind === "sakt" && m.afterWord === s.afterWord),
        `${s.surah}:${s.ayah} afterWord ${s.afterWord}`
      ).toBe(true);
    }
  });
});

describe("rawm & ishmam (jazariyyah:103-104)", () => {
  it("damma at stop: rawm + ishmam permitted", () => {
    const anns = annotate("نَسْتَعِينُ", { mode: "stop" });
    expect(anns.some((a) => a.rule === "rawm")).toBe(true);
    expect(anns.some((a) => a.rule === "ishmam")).toBe(true);
  });
  it("kasra at stop: rawm only", () => {
    const anns = annotate("ٱلرَّحِيمِ", { mode: "stop" });
    expect(anns.some((a) => a.rule === "rawm")).toBe(true);
    expect(anns.some((a) => a.rule === "ishmam")).toBe(false);
  });
  it("fatha at stop: neither", () => {
    const anns = annotate("ٱلْعَٰلَمِينَ قَالَ", { mode: "stop", stopAt: 1 });
    expect(anns.some((a) => a.rule === "rawm")).toBe(false);
  });
  it("the unique in-flow ishmam word (12:11) via its mark", () => {
    const anns = annotate("تَأْمَ۫نَّا");
    expect(anns.some((a) => a.rule === "ishmam")).toBe(true);
  });
});

describe("dad/zha contact & ra takrir", () => {
  it("bayan lazim at the poem's own sites", () => {
    expect(annotate("أَنقَضَ ظَهْرَكَ").some((a) => a.rule === "bayan-dad-zha")).toBe(true);
    expect(annotate("يَعَضُّ ٱلظَّالِمُ").some((a) => a.rule === "bayan-dad-zha")).toBe(true);
    expect(annotate("ظَلَمُوا ضَلَّ").some((a) => a.rule === "bayan-dad-zha")).toBe(false); // not adjacent
  });
  it("doubled ra gets the takrir-suppression note", () => {
    expect(annotate("مِن رَّبِّهِمْ").some((a) => a.rule === "ra-takrir")).toBe(true);
    expect(annotate("رَحْمَةٌ").some((a) => a.rule === "ra-takrir")).toBe(false);
  });
});
