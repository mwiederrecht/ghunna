/**
 * Rule unit tests built from the classical texts' own worked examples
 * (tuhfah/jazariyyah cite most of these words themselves).
 */
import { describe, expect, it } from "vitest";
import { annotate } from "../src/engine.js";
import type { RuleId } from "../src/annotation.js";

/** assert that annotating `text` yields `rule` with the trigger substring covering `over` */
function expectRule(text: string, rule: RuleId, over?: string) {
  const anns = annotate(text);
  const hits = anns.filter((a) => a.rule === rule);
  expect(hits, `${rule} in "${text}": got ${anns.map((a) => a.rule).join(", ")}`).not.toHaveLength(0);
  if (over) {
    const cps = [...text];
    const covered = hits.some((a) => cps.slice(a.range[0], a.range[1]).join("").includes(over) ||
      over.includes(cps.slice(a.range[0], a.range[1]).join("")));
    expect(covered, `${rule} span should relate to "${over}"`).toBe(true);
  }
  return hits;
}

function expectNoRule(text: string, rule: RuleId) {
  const anns = annotate(text);
  expect(anns.filter((a) => a.rule === rule)).toHaveLength(0);
}

describe("nūn sākinah & tanwīn family (tuhfah:6–16)", () => {
  it("iẓhār ḥalqī: أَنْعَمْتَ (nūn before ع)", () => {
    expectRule("أَنْعَمْتَ", "izhar-halqi");
  });
  it("iẓhār ḥalqī fires for tanwīn too: عَلِيمٌ حَكِيمٌ", () => {
    expectRule("عَلِيمٌ حَكِيمٌ", "izhar-halqi");
  });
  it("idghām bi-ghunnah across words: مَن يَقُولُ", () => {
    expectRule("مَن يَقُولُ", "idgham-bighunnah");
  });
  it("iẓhār muṭlaq in one word: ٱلدُّنْيَا، صِنْوَانٌ (tuhfah:11)", () => {
    expectRule("ٱلدُّنْيَا", "izhar-mutlaq");
    expectRule("صِنْوَانٌ خَلَقَ", "izhar-mutlaq");
    expectNoRule("ٱلدُّنْيَا", "idgham-bighunnah");
  });
  it("idghām bilā ghunnah: مِن رَّبِّهِمْ", () => {
    expectRule("مِن رَّبِّهِمْ", "idgham-bila-ghunnah");
  });
  it("iqlāb: مِنۢ بَعْدِ: derived from ن+ب, not from the mīm hint", () => {
    // the hint mark is stripped here on purpose: derivation must still fire
    expectRule("مِن بَعْدِ", "iqlab");
  });
  it("ikhfāʾ: مِن قَبْلُ (nūn before ق of the fifteen)", () => {
    expectRule("مِن قَبْلُ", "ikhfa-haqiqi");
  });
  it("tanwīn before hamzat waṣl takes no NS rule: عَادًا ٱلْأُولَىٰ", () => {
    const anns = annotate("عَادًا ٱلْأُولَىٰ");
    const ns: RuleId[] = ["izhar-halqi", "idgham-bighunnah", "idgham-bila-ghunnah", "iqlab", "ikhfa-haqiqi"];
    expect(anns.filter((a) => ns.includes(a.rule))).toHaveLength(0);
  });
});

describe("mīm sākinah family (tuhfah:18–23)", () => {
  it("ikhfāʾ shafawī: تَرْمِيهِم بِحِجَارَةٍ", () => {
    expectRule("تَرْمِيهِم بِحِجَارَةٍ", "ikhfa-shafawi");
  });
  it("idghām shafawī: لَهُم مَّا", () => {
    expectRule("لَهُم مَّا", "idgham-shafawi");
  });
  it("iẓhār shafawī: هُمْ فِيهَا (with the و/ف caution)", () => {
    expectRule("هُمْ فِيهَا", "izhar-shafawi");
  });
});

describe("ghunnah mushaddadah (tuhfah:17)", () => {
  it("fires on نّ and مّ: إِنَّ، ثُمَّ", () => {
    expectRule("إِنَّ", "ghunnah-mushaddadah");
    expectRule("ثُمَّ", "ghunnah-mushaddadah");
  });
  it("does not double-fire inside an idghām target: مَن يَقُولُ has no extra ghunnah", () => {
    expectNoRule("مَن يَعْمَلْ", "ghunnah-mushaddadah");
  });
});

describe("lām rules (tuhfah:24–29, jazariyyah:43)", () => {
  it("qamariyyah: ٱلْقَمَرِ", () => {
    expectRule("ٱلْقَمَرِ", "lam-qamariyyah");
  });
  it("shamsiyyah: ٱلشَّمْسِ", () => {
    expectRule("ٱلشَّمْسِ", "lam-shamsiyyah");
  });
  it("iftaʿala verb is NOT an article: ٱلْتَقَى", () => {
    expectNoRule("ٱلْتَقَى", "lam-shamsiyyah");
    expectNoRule("ٱلْتَقَى", "lam-qamariyyah");
  });
  it("alif-less article after li-: لِلنَّاسِ", () => {
    expectRule("لِلنَّاسِ", "lam-shamsiyyah");
  });
  it("jalālah tafkhīm after fatḥah/start, tarqīq after kasrah (jazariyyah:43)", () => {
    expectRule("نَصْرُ ٱللَّهِ", "lam-jalalah-tafkhim");
    expectRule("ٱلْحَمْدُ لِلَّهِ", "lam-jalalah-tarqiq"); // alif-less form: the لِ kasrah governs
    expectNoRule("ٱلْحَمْدُ لِلَّهِ", "lam-jalalah-tafkhim");
    expectRule("وَلِلَّهِ ٱلْأَسْمَآءُ".replace("آ",String.fromCharCode(0x627,0x653)), "lam-jalalah-tarqiq");
    expectRule("بِسْمِ ٱللَّهِ", "lam-jalalah-tarqiq");
    expectNoRule("بِسْمِ ٱللَّهِ", "lam-shamsiyyah");
  });
});

describe("adjacent-consonant idghām (tuhfah:30–34)", () => {
  it("mithlayn: اِذْهَب بِّكِتَٰبِى?: use قَد دَّخَلُوا۟ pattern", () => {
    expectRule("قَد دَّخَلُوا۟", "idgham-mithlayn");
  });
  it("mutajānisayn: قَد تَّبَيَّنَ (د→ت)", () => {
    expectRule("قَد تَّبَيَّنَ", "idgham-mutajanisayn");
  });
  it("mutajānisayn nāqiṣ: بَسَطتَ (ط→ت): RESIDUE R-001", () => {
    expectRule("بَسَطتَ", "idgham-mutajanisayn");
  });
  it("mutaqāribayn: قُل رَّبِّ (ل→ر)", () => {
    expectRule("قُل رَّبِّ", "idgham-mutaqaribayn");
  });
  it("article lām is NOT mutaqāribayn: ٱلرَّحْمَٰنِ", () => {
    expectNoRule("ٱلرَّحْمَٰنِ", "idgham-mutaqaribayn");
  });
});

describe("qalqalah (jazariyyah:23, 38)", () => {
  it("ṣughrā on sākin قطب جد letters mid-flow: قَدْ أَفْلَحَ", () => {
    expectRule("قَدْ أَفْلَحَ", "qalqalah-sughra");
  });
  it("no qalqalah on an assimilated letter: قَد تَّبَيَّنَ", () => {
    expectNoRule("قَد تَّبَيَّنَ", "qalqalah-sughra");
  });
  it("no qalqalah on voweled letters: قَلَم", () => {
    expectNoRule("قَلَمٌ وَرَقٌ", "qalqalah-sughra");
  });
});

describe("madd family (tuhfah:35–57)", () => {
  it("ṭabīʿī: قَالَ (alif after fatḥah)", () => {
    expectRule("قَالَ", "madd-tabii");
  });
  it("muttaṣil: جَآءَ (hamzah after madd, one word)", () => {
    expectRule("جَآءَ", "madd-muttasil");
  });
  it("munfaṣil: يَٰٓأَيُّهَا (the classical example) and بِمَآ أُنزِلَ", () => {
    expectRule("يَٰٓأَيُّهَا", "madd-munfasil");
    expectRule("بِمَآ أُنزِلَ", "madd-munfasil");
  });
  it("هؤلاء: first madd is munfasil hukmi (ha + ulai), second muttasil", () => {
    const anns = annotate("هَٰٓؤُلَآءِ");
    expect(anns.filter((a) => a.rule === "madd-munfasil")).toHaveLength(1);
    expect(anns.filter((a) => a.rule === "madd-muttasil")).toHaveLength(1);
  });
  it("badal: ءَامَنُوا۟ (hamzah precedes the madd)", () => {
    expectRule("ءَامَنُوا۟", "madd-badal");
  });
  it("lāzim kalimī muthaqqal: ٱلضَّآلِّينَ", () => {
    expectRule("وَلَا ٱلضَّآلِّينَ", "madd-lazim-kalimi-muthaqqal");
  });
  it("lāzim ḥarfī: الٓمٓ (lām muthaqqal into mīm, mīm mukhaffaf)", () => {
    const anns = annotate("الٓمٓ");
    expect(anns.some((a) => a.rule === "madd-lazim-harfi-muthaqqal")).toBe(true);
    expect(anns.some((a) => a.rule === "madd-lazim-harfi-mukhaffaf")).toBe(true);
  });
  it("fawātiḥ two-count names: طه", () => {
    const anns = annotate("طه");
    expect(anns.filter((a) => a.rule === "madd-tabii")).toHaveLength(2);
  });
  it("madd elides before hamzat waṣl: فِى ٱلْأَرْضِ", () => {
    const anns = annotate("فِى ٱلْأَرْضِ");
    expect(anns.filter((a) => a.rule.startsWith("madd") && a.range[0] < 3)).toHaveLength(0);
  });
  it("līn is not madd: خَوْفٌ، شَىْءٍ", () => {
    expectNoRule("خَوْفٌ", "madd-tabii");
    expectNoRule("شَىْءٍ قَدِيرٌ", "madd-muttasil");
  });
});

describe("structural rules", () => {
  it("hamzat waṣl: ٱهْدِنَا", () => {
    expectRule("ٱهْدِنَا", "hamzat-wasl");
  });
  it("silent letters: قَالُوا۟ trailing alif", () => {
    expectRule("قَالُوا۟", "silent");
  });
  it("sakt blocks idghām: مَنْ ۜ رَاقٍ (75:27) via riwāyah data", () => {
    const anns = annotate("وَقِيلَ مَنْ رَاقٍ", { saktAfterWord: [1] });
    expect(anns.some((a) => a.rule === "sakt")).toBe(true);
    expect(anns.filter((a) => a.rule === "idgham-bila-ghunnah")).toHaveLength(0);
  });
  it("every annotation carries derivation + citation", () => {
    for (const a of annotate("مِن رَّبِّهِمْ وَأُو۟لَٰٓئِكَ")) {
      expect(a.derivation.length).toBeGreaterThan(10);
      expect(a.citation.lines.length).toBeGreaterThan(0);
      expect(["tuhfah", "jazariyyah"]).toContain(a.citation.text);
    }
  });
});

describe("tafkhim & tarqiq (jazariyyah:21, 40-42)", () => {
  it("istila letters are always heavy", () => {
    const anns = annotate("خَلَقَ");
    expect(anns.filter((a) => a.rule === "tafkhim-istila")).toHaveLength(2); // خ ق
  });
  it("ra voweled: fatha/damma heavy, kasra light", () => {
    expectRule("رَحْمَةٌ", "ra-tafkhim");
    expectRule("رِزْقٌ", "ra-tarqiq");
    expectRule("قُرُونٌ", "ra-tafkhim");
  });
  it("ra sakinah after original kasra is light: فِرْعَوْنَ", () => {
    expectRule("فِرْعَوْنَ", "ra-tarqiq");
  });
  it("ra sakinah after fatha is heavy: مَرْيَمَ", () => {
    expectRule("مَرْيَمَ", "ra-tafkhim");
  });
  it("ra sakinah after wasl kasrah (not original) is heavy: ٱرْجِعُوٓا۟", () => {
    const anns = annotate("ٱرْجِعُوٓا۟", { startFresh: true });
    expect(anns.some((a) => a.rule === "ra-tafkhim")).toBe(true);
    expect(anns.some((a) => a.rule === "ra-tarqiq")).toBe(false);
  });
  it("istila letter after ra-sakin-after-kasra makes it heavy: قِرْطَاسٌ", () => {
    expectRule("قِرْطَاسٍ", "ra-tafkhim");
  });
  it("the firq khilaf is flagged (jaz:42): فِرْقٍ", () => {
    const hit = annotate("فِرْقٍ").find((a) => a.rule.startsWith("ra-"));
    expect(hit?.confidence).toBe("flagged");
  });
  it("waqf ra: light after ya sakinah (خَبِيرٌ stopped), heavy after alif (ٱلنَّارُ stopped)", () => {
    const light = annotate("خَبِيرٌ", { mode: "stop" }).filter((a) => a.rule.startsWith("ra-"));
    expect(light.some((a) => a.rule === "ra-tarqiq")).toBe(true);
    const heavy = annotate("ٱلنَّارُ", { mode: "stop" }).filter((a) => a.rule.startsWith("ra-"));
    expect(heavy.some((a) => a.rule === "ra-tafkhim")).toBe(true);
  });
  it("waqf ra: the misr khilaf is flagged", () => {
    const hit = annotate("مِصْرَ", { mode: "stop" }).find((a) => a.rule.startsWith("ra-"));
    expect(hit?.rule).toBe("ra-tafkhim");
    expect(hit?.confidence).toBe("flagged");
  });
});
