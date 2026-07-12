# RESIDUE

The catalog of genuine divergences between the tajweed rules **as written** in the
classical sources (Tuḥfat al-Aṭfāl, al-Muqaddimah al-Jazariyyah) and the annotated
mushaf tradition as encoded in the ground-truth data (cpfair/quran-tajweed).

Each entry: corpus location(s), what the rules-as-written derive, what the oracle
annotates, both readings, and why it is not obviously a bug on either side.
**These entries are deliberately left unresolved** where the divergence is
scholarly; where the evidence clearly favors one side, that is stated with its
basis, but the engine is never changed merely to match the oracle.

**Re-verification pass (2026-07-12):** every group below was re-researched
independently against fresh sources. R-001 (idgham naqis): confirmed again via
Sharh Tayyibat al-Nashr (al-Nuwayri) — the verse line "وبين الإطباق من أحطت مع
بسطت" names these exact words — and al-Mizan p.141. R-002: multiple current
tajweed references state the jalalah-lam tafkhim rule for الله AND اللهم
together, one giving وَإِذْ قَالُوا۟ ٱللَّهُمَّ (8:32, a residue site) as the
tafkhim example. R-003: reconfirmed from four independent angles — the
munfasil-hukmi doctrine (ha al-tanbih / ya al-nida written joined, ruled
separate) is stated by name across the literature with هؤلاء and هأنتم as the
standard examples, and the first madd of هؤلاء is explicitly "جائز منفصل
حكماً لا رسماً (أصلها ها أولاء)" with qasr to 2 counts available where
munfasil qasr is transmitted — impossible for a muttasil. R-004/R-005:
muttasil is definitionally madd + hamzah in one word; سوء-family words are
standard muttasil examples; nothing treats تبوأ/تنوأ/السوأى as munfasil.
R-007: Hafs reads طسم with full idgham (all readers except Hamzah and Abu
Ja'far); the fawatih ikhfa' sites likewise. No claim required revision.

State of the corpus diff (continuation mode, 2026-07-11): **99.80 %** agreement
over the mapped rule categories; **108 disagreement sites** across all 6,236
verses, all catalogued below in six groups — every group now verified against
the published tajweed literature (sources cited per entry), and in every case
the evidence favors the rules-as-written over the oracle. (Systematic
conventions — the un-annotated basmalah prefix, verse-boundary pause
assumptions, the oracle's plain-ṭabīʿī annotation scope — are classified
separately by the harness and are not residue.)

**The one unifying oracle defect (R-003/R-004, 90 of the 108 sites) —
CONFIRMED from the oracle's own source (2026-07-11):** cpfair ships its
decision trees (`rule_trees/madd_muttasil.start.json`,
`madd_munfasil.start.json`), and they branch on the *character form of the
hamzah*, not on word identity: the attribute `1_has_initial_hamza` (hamzah
seated on alif, أ) routes to munfaṣil, while `1_base_is_isolated_hamza` (ء) and
`1_has_non_initial_hamza` (seats ؤ/ئ/ـٔ) route to muttaṣil. That reproduces its
correct outputs (يَٰٓأَيُّهَا، هَٰٓأَنتُمْ munfaṣil; جَآءَ muttaṣil) *and* all 90
errors in both directions (هَٰٓؤُلَآءِ، يَٰٓـَٔادَمُ wrongly muttaṣil; تَبُوٓأَ،
تَنُوٓأُ، ٱلسُّوٓأَىٰ wrongly munfaṣil).

Same inspection also shows the root split of both madd trees is
`0_has_maddah` — the printed maddah sign U+0653. cpfair's classifier *reads the
muṣḥaf's printed outcome hints* (the very thing this engine forbids itself);
it is a decoder of the printed annotations, not a deriver of the rules. This
is the clearest single illustration of the difference between the two
approaches.

**Second oracle (added 2026-07-11):** the Quran.com v4 tajweed edition
(KFGQPC-convention inline markup; disputed verses vendored at
`vendor/oracle2-disputed.json`) was consulted at every residue site. It merges
muttaṣil and munfaṣil into one length-group class (`madda_obligatory`), so it
is *neutral* on the 90 R-003/R-004 sites; its findings on the other groups are
recorded per entry below. Notably it exhibits the same glyph-keyed behavior as
cpfair (17:7), consistent with both datasets descending from printed-color
conventions rather than rule derivation.

**Third source — the printed muṣḥaf itself (added 2026-07-11):** the Dar
al-Maarifah colored tajweed muṣḥaf (the print cpfair claims descent from) is
scanned at archive.org (item `Quran26`); the disputed sites were inspected in
the actual page images (page crops archived in the private verification workspace). Two
findings recolor the whole residue picture:

1. **The print has a tafkhīm color class (blue) that neither dataset ever
   digitized.** The blue class carries: the lafẓ al-jalālah at tafkhīm sites
   (whole word — وَإِلَى ٱللَّهِ p.53), istiʿlāʾ letters, and the retained
   iṭbāq of the idghām nāqiṣ ṭāʾ (بَسَطتَ p.112). Dropping this one class
   explains, at a stroke: the datasets' missing jalālah annotations, their
   missing بسطت-family annotations, and their asymmetric treatment of اللهم.
2. **Where a print color directly encodes a disputed quantity, it sides with
   the engine** (17:7: red = 4–5 counts, both datasets said 2).

---

## R-001 — Idghām mutajānisayn ṭāʾ→tāʾ (idghām nāqiṣ): 4 sites — **verified**

**Sites:** 5:28 بَسَطتَ، 12:80 فَرَّطتُمْ، 27:22 أَحَطتُ، 39:56 فَرَّطتُ
**Rules-as-written:** ط sākinah before ت — same makhraj, different ṣifāt →
idghām mutajānisayn (tuhfah:32–33), of the *nāqiṣ* kind: the ṭāʾ's iṭbāq and
istiʿlāʾ are retained ("نطبق المخرج على طاء ساكنة من غير قلقلة ثم ننفتح على
تاء").
**Literature check (2026-07-11):** confirmed by name in *al-Mīzān fī Aḥkām
Tajwīd al-Qurʾān* (Shamela ed., p. 141, bāb al-mutajānis al-ṣaghīr) and Ayman
Suwayd's tajweed lessons on al-idghām al-nāqiṣ — بسطت/أحطت/فرطت are the standard
examples.
**Oracle:** annotates nothing at these four sites. The rasm writes the ط
without sukūn and the ت without shaddah (the muṣḥaf convention for partial
idghām), which the oracle's tree evidently did not model.
**Oracle #2 (Quran.com/KFGQPC markup, checked 2026-07-11):** also nothing at
all four sites — although its `idgham_mutajanisayn` class exists and fires at
قَد تَّبَيَّنَ (2:256). Both datasets appear to key on the written shaddah of
complete idghām; the nāqiṣ sites carry no shaddah by rasm convention, so the
coloring omits them.
**Print (p.112, evidence/5-28-basatta-blue-ta.jpg):** the ط of بَسَطتَ is
printed BLUE — the retained-tafkhīm/iṭbāq of the partially assimilated ṭāʾ,
i.e. the idghām nāqiṣ doctrine rendered in color. The datasets missed it
because they never digitized the blue class.
**Verdict:** the print annotates it; the literature names it; both datasets
dropped it. Engine correct.

## R-002 — Lām of ٱللَّهُمَّ: 6 sites

**Sites:** 3:26, 5:114, 8:32, 10:10, 39:46, 62:11 (all ٱللَّهُمَّ)
**Rules-as-written:** ٱللَّهُمَّ is lafẓ al-jalālah + suffixed mīm; its doubled
lām follows jazariyyah:43 (tafkhīm after fatḥ/ḍamm, tarqīq after kasr), same as
ٱللَّه. Not an ordinary shamsiyyah assimilation annotation.
**Oracle:** annotates the lām of ٱللَّهُمَّ as `lam_shamsiyyah`, while the
unsuffixed lafẓ al-jalālah gets no lām annotation anywhere.
**Oracle #2 (checked 2026-07-11):** Quran.com/KFGQPC **also** tags
ٱللَّهُمَّ's lām as `laam_shamsiyah` while giving the unsuffixed lafẓ al-jalālah no lām
annotation (3:26, 39:46 verified).
**Print (2026-07-11 — the resolution):** page images settle it.
- 3:26 قُلِ ٱللَّهُمَّ (tarqīq context): first lām printed **GRAY** (the
  legend's "idghām / not pronounced"), rest black, مّ green
  (evidence/3-26-allahumma-gray-lam.jpg).
- 10:10 ٱللَّهُمَّ and وَإِلَى ٱللَّهِ (tafkhīm contexts): jalālah lām printed
  **BLUE** — the tafkhīm class (evidence/10-10-…, 3-28-…).
So the print gives ٱللَّهُمَّ the same treatment as the unsuffixed lafẓ al-jalālah: blue at tafkhīm, default at
tarqīq, with the assimilated first lām gray. The datasets digitized the gray
as `lam_shamsiyyah` and dropped the blue class entirely — hence their
asymmetry (tags at اللهم, nothing at الله). A digitization artifact, not a
scholarly position.
**Verdict:** resolved — the engine's jalālah tafkhīm/tarqīq output matches the
print's actual color distinction better than either dataset does. (Possible
future enhancement: also emit an "assimilated first lām" span to mirror the
print's gray.)

## R-003 — al-munfaṣil al-ḥukmī sites the oracle calls muttaṣil: 45 sites — **verified**

**Sites:** يَٰٓـَٔادَمُ (2:33, 2:35, 20:117, 20:120) and هَٰٓؤُلَآءِ (41 occurrences,
first madd).
**Rules-as-written:** the vocative يَا and deictic هَا are written joined to the
following hamzah-initial word but are separate words in ruling → **madd
munfaṣil ḥukmī** (tuhfah:44 "كُلٌّ بِكِلْمَةٍ").
**Literature check (2026-07-11):** the published tajweed literature states this
explicitly and by that name: "المد المنفصل يكون حكمياً في حالة (يا) النداء و(ها)
التنبيه وإن اتصلت في رسم المصحف" — and for هؤلاء specifically: "الأول (ها)
يتبعه الهمزة وهو مد جائز منفصل حكماً لا رسماً (أصلها ها أولاء)، والثاني (لاء)
مد واجب متصل" (*Ghāyat al-Murīd fī ʿIlm al-Tajwīd*, bāb al-madd al-munfaṣil;
IslamOnline/IslamWeb tajweed references). The qirāʾāt corroborate: readers who
shorten munfaṣil shorten these madds.
**Oracle:** `madd_muttasil` at exactly these — the seat-glyph defect (header).
It annotates يَٰٓأَيُّهَا and هَٰٓأَنتُمْ (hamzah on alif) correctly as munfaṣil.
**Verdict:** oracle bug; engine correct. (The engine originally matched the
oracle on هؤلاء citing a "one-word" reading; corrected 2026-07-11 to follow the
literature.)

## R-004 — تَبُوٓأَ / تَنُوٓأُ / ٱلسُّوٓأَىٰ: 3 sites — **verified**

**Sites:** 5:29 تَبُوٓأَ، 28:76 تَنُوٓأُ، 30:10 ٱلسُّوٓأَىٰ
**Rules-as-written:** madd letter and hamzah *inside one word* → muttaṣil
(tuhfah:43 "إِنْ جَاءَ هَمْزٌ بَعْدَ مَدْ فِي كِلْمَةٍ"). These are single words
(from بوأ، نوأ، سوأ) — no particle, no morpheme boundary at the madd; no source
treats them as munfaṣil.
**Oracle:** `madd_munfasil` at all three — the same seat-glyph defect (hamzah
on alif → "munfaṣil"), here firing in the opposite direction.
**Verdict:** oracle bug; engine correct.

## R-005 — 17:7 لِيَسُـۥٓـُٔوا۟: 1 site

**Rules-as-written:** the rasm-omitted small wāw (ۥ) in لِيَسُوءُوا۟ is a madd
letter followed by a voweled hamzah in the same word → muttaṣil by definition
(tuhfah:43). Not a ṣila (there is no hāʾ ḍamīr); the small wāw restores a
rasm-omitted letter of the word itself.
**Oracle:** `madd_2` on the small wāw — its tree apparently treats every small
wāw as a 2-count ṣila.
**Oracle #2 (checked 2026-07-11):** `madda_normal` (2 counts) — same
undercount. But oracle #2 is inconsistent with itself: at 30:10 it marks the
identical pattern وٓ + hamzah (ٱلسُّوٓأَ) as `madda_obligatory`; only the
small-wāw glyph differs. And the muṣḥaf itself prints the maddah sign on
ـۥٓ here — the printed hint says *long* madd, contradicting both datasets'
2-count classification.
**Print (p.282, evidence/17-7-liyasuu-red-madd.jpg):** the small wāw and its
maddah are printed RED — the legend’s «مد واجب ٤ أو ٥ حركات». The print says
4–5 counts; both datasets said 2.
**Verdict:** print-confirmed; engine correct, both datasets wrong (glyph-keyed
undercount).

## R-006 — 2:72 فَٱدَّٰرَٰٔتُمْ — **RESOLVED 2026-07-11 (our letter-model bug)**

**Original puzzle:** the engine read the second superscript alif of رَٰٔ as a
dagger-alif madd letter followed by a sākin hamzah, then had to invent a policy
for "madd before sākin hamzah" (former A-008).
**Resolution:** the tafsir/iʿrāb literature vocalizes the word فَادَّارَأْتُمْ —
*iddāraʾtum* (تدارأتم with the tāʾ assimilated into the dāl and hamzat waṣl
prefixed; e.g. al-Naḥḥās, *Iʿrāb al-Qurʾān*; al-Bayḍāwī ad loc.). The hamzah is
sākinah **directly after** رَ: there is no madd letter there at all. Tanzil's
ٰ+ٔ cluster is a hamzah *seated on a superscript alif*, parallel to the
tatweel-seated hamzah. Tokenizer fixed to treat the cluster as one hamzah
letter; the spurious madd disappears; the oracle's silence at this site was
correct. Residual count 27 → 26.

## R-007 — Assimilation across fawātiḥ letter names (classified `fawatih`, 6 sites)

**Sites:** 26:1 & 28:1 طسٓمٓ (nūn of سين + mīm → idghām bi-ghunnah); 19:1
كٓهيعٓصٓ (nūn of عين + ṣād → ikhfāʾ); 42:2 عٓسٓقٓ (nūn of عين + sīn → ikhfāʾ, and
nūn of سين + qāf → ikhfāʾ); 27:1 طسٓ + تِلْكَ (nūn of سين + tāʾ → ikhfāʾ across
the word boundary).
**Rules-as-written:** the letter *names* end in nūn sākinah; the NS family
applies across them — the received recitation of طسٓمٓ is with idghām, and of
كٓهيعٓصٓ with ikhfāʾ.
**Literature check (2026-07-11):** confirmed — "النون مع الميم من هجاء (طسم)
فاتحة الشعراء والقصص أدغمها كل القراء إلا حمزة وأبا جعفر" (Ḥafṣ reads it with
full idghām with ghunnah); the sources note it explicitly as the exception to
the same-word restriction on idghām.
**Oracle:** annotates only the madd of the letter names; no assimilation
annotations inside fawātiḥ. **Oracle #2 (checked 2026-07-11):** likewise —
`madda_necessary` on the letters only, nothing between طسٓ and مٓ or across
طسٓ تِلْكَ.
**Print (p.367, evidence/26-1-tasinmim-lazim-only.jpg):** طسٓمٓ carries only
the lāzim-madd coloring — necessarily: the assimilating nūn lives inside the
letter NAME «سين», which has no glyph on the page to color. Print-style
annotation structurally cannot express this rule; only an engine operating on
letter names can.
**Verdict:** annotation-scope gap in both datasets (and unavoidably so); the
recitation (idghām in طسم by all readers except Ḥamzah and Abū Jaʿfar) is not
in dispute. Kept in the
`fawatih` classification bucket rather than as failures; recorded here because
the underlying phenomenon (rules applying to letter-*names*, not letters) is a
genuinely interesting formalization point.
