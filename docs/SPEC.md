# Tajweed Rule Specification (Phase 0)

**Riwāyah:** Ḥafṣ ʿan ʿĀṣim, ṭarīq al-Shāṭibiyyah (see ASSUMPTIONS A-001).

This document is the human- and scholar-readable formalization of the tajweed
rules **as written** in the two classical source poems:

- **Tuḥfat al-Aṭfāl** (تحفة الأطفال) — Sulaymān al-Jamzūrī, 1198 AH.
  Citation target: `docs/sources/tuhfah.md` (61 numbered lines).
- **al-Muqaddimah al-Jazariyyah** (المقدمة الجزرية) — Ibn al-Jazarī, d. 833 AH.
  Citation target: `docs/sources/jazariyyah.md` (108 numbered lines).

Every rule below carries its citation as `tuhfah:N` / `jazariyyah:N` referring to
those files' line numbers. The engine's rule data (`src/rules/`) is required to
stay in sync with this document: a test walks both and fails on any rule id,
trigger set, or citation that disagrees.

Notation: **NS** = nūn sākinah (نْ, or nūn with no ḥarakah, or tanwīn — see §1
preamble); letters given in Arabic with Buckwalter-free plain names.

---

## 0. Input policy: what the engine may and may not read

The Uthmani encoding mixes four kinds of signs. The engine's honesty depends on
distinguishing them (see project brief: "derive, never read hints").

| class | examples | policy |
|---|---|---|
| Base letters & vocalization | letters, fatḥah/ḍammah/kasrah, sukūn (U+0652), shaddah (U+0651), tanwīn (U+064B–U+064D), dagger alif (U+0670), hamzah sign (U+0654, incl. seated on tatweel), hamzat-waṣl letter ٱ (U+0671), small wāw/yāʾ/nūn (U+06E5/U+06E6/U+06E7/U+06E8 — rasm-omitted letters restored small) | **May read.** This is the text itself; the classical rules presuppose it. |
| Orthographic silence/length marks | small high rounded zero ۟ (U+06DF, letter never pronounced), small low sīn, small high seen, empty-centre marks (U+06EA–U+06ED range where orthographic), small wāw/yāʾ ۥ/ۦ (U+06E5/U+06E6, ṣilah) | **May read, with documentation.** These encode rasm/orthography facts (which written letters are recited) that the tajweed poems assume as given — they are *not* tajweed-rule outcomes. Each such codepoint's treatment is documented in the tokenizer table. |
| Rule-outcome hints | small high mīm ۢ (U+06E2)/low mīm ۭ (U+06ED) as iqlāb/ikhfāʾ signs; **maddah ٓ (U+0653)** — its corpus count (5,376) ≈ muttaṣil+munfaṣil+lāzim sites (5,317): it is the long-madd outcome marker; the sequential-vs-stacked tanwīn convention (U+08F0–U+08F2 open forms, absent from Tanzil); absence-of-sukūn convention on idghām/ikhfāʾ-affected letters | **Must not read for derivation.** These encode the *answers* (iqlāb, ikhfāʾ/idghām, madd length). Test oracle only. |
| Structure | ayah markers, waqf signs (ۖ ۗ ۚ ۛ ۜ ۩ etc.), spaces | **May read.** Tokenized as first-class objects; waqf signs feed the stop model, never rule derivation in continuation mode. |

One necessary nuance: Tanzil marks idghām/iqlāb contexts partly by *omitting*
sukūn on the affected nūn/mīm and by tanwīn-form choice. The engine therefore
treats "nūn with no diacritic" as nūn sākinah **by position** (a consonant with
no ḥarakah is sākin), and treats all tanwīn forms identically. It must never
branch on stacked-vs-open tanwīn form or on presence of U+06E2. The
sync test greps the rule data for the forbidden codepoints.

---

## 1. Aḥkām al-nūn al-sākinah wa-l-tanwīn — أحكام النون الساكنة والتنوين

Preamble (tuhfah:6, jazariyyah:64): the nūn sākinah and tanwīn take four
rulings. **Tanwīn is phonologically a nūn sākinah** appended to the word-final
vowel; all four rules below trigger identically off tanwīn (all three written
forms). NS = word-internal نْ, word-final نْ before a following word, or tanwīn.

### 1.1 `izhar-halqi` — الإظهار الحلقي — Iẓhār Ḥalqī — "clear pronunciation (throat letters)"

- **Trigger:** NS followed by one of the six throat letters
  ء ه ع ح غ خ (tuhfah:8 lists them in order; jazariyyah:65 "فعند حرف الحلق أظهر").
- **Context:** next pronounced letter, same word or across word boundary.
- **Span:** the NS (or tanwīn) + the throat letter.
- **Outcome:** nūn pronounced clearly, no ghunnah extension.
- **Waqf-dependent:** no.
- **Citation:** tuhfah:7–8, jazariyyah:64–65.

### 1.2 `idgham-bighunnah` — الإدغام بغنة — Idghām bi-Ghunnah — "merging with nasalization"

- **Trigger:** NS followed by one of ي ن م و (yanmū ينمو, tuhfah:10) —
  **across a word boundary only** (tuhfah:11 "إلا إذا كانا بكلمة",
  jazariyyah:66 "إلا بكلمة كدنيا").
- **Span:** the NS/tanwīn + the following (typically shaddah-marked) letter.
- **Outcome:** nūn assimilates into the next letter; ghunnah retained (2 counts).
- **Waqf-dependent:** no (but the trigger dies if one stops between the words —
  the stop model handles this in Phase 2).
- **Citation:** tuhfah:9–11, jazariyyah:66.

### 1.3 `izhar-mutlaq` — الإظهار المطلق — Iẓhār Muṭlaq — "absolute clarity (same-word exception)"

- **Trigger:** NS followed by و or ي **within the same word**. Exactly four
  corpus words: دنيا، صنوان، قنوان، بنيان (tuhfah:11 gives دنيا, صنوان).
- **Span:** the nūn + the wāw/yāʾ.
- **Outcome:** no idghām — clear nūn (distinguishes e.g. دُنْيَا from what
  idghām would produce).
- **Waqf-dependent:** no.
- **Citation:** tuhfah:11, jazariyyah:66.
- **Oracle note:** cpfair has no category for this (expected: absence of any
  idghām annotation there). Our engine emits it; excluded from the diff.

### 1.4 `idgham-bila-ghunnah` — الإدغام بلا غنة — Idghām bilā Ghunnah — "merging without nasalization"

- **Trigger:** NS followed by ل or ر (tuhfah:12, jazariyyah:65 "وادغم في اللام
  والرا لا بغنة"), across word boundary (NS before ل/ر in one word does not
  occur in the corpus except the special نۨ in 21:88? — no: that is iqlāb-like
  small nūn; verify in diffs).
- **Span:** NS/tanwīn + following letter.
- **Outcome:** full assimilation, no ghunnah.
- **Waqf-dependent:** no.
- **Citation:** tuhfah:12, jazariyyah:65.
- **Known Ḥafṣ exception:** the sakt on نْ in مَنْ رَاقٍ (75:27) blocks idghām
  (ṭarīq-dependent; Shāṭibiyyah: sakt → iẓhār). Logged as expected diff/residue
  candidate; the sakt is marked in the text with ۜ (U+06DC) — a structure sign
  we may read. See ASSUMPTIONS A-006.

### 1.5 `iqlab` — الإقلاب — Iqlāb — "conversion (to mīm)"

- **Trigger:** NS followed by ب (tuhfah:13, jazariyyah:67).
- **Span:** NS/tanwīn + the بـ.
- **Outcome:** nūn → mīm with ghunnah and ikhfāʾ of the mīm.
- **Waqf-dependent:** no.
- **Citation:** tuhfah:13, jazariyyah:67.
- **Derivation constraint:** must fire from the letter context alone; the text's
  small high mīm at these sites is oracle-only confirmation.

### 1.6 `ikhfa-haqiqi` — الإخفاء الحقيقي — Ikhfāʾ Ḥaqīqī — "concealment"

- **Trigger:** NS followed by any of the remaining **fifteen** letters, given by
  the mnemonic couplet (tuhfah:15–16): صف ذا ثنا كم جاد شخص قد سما دم طيبا زد في
  تقى ضع ظالما → ص ذ ث ك ج ش ق س د ط ز ف ت ض ظ.
- **Span:** NS/tanwīn + following letter.
- **Outcome:** nūn concealed with ghunnah (2 counts), articulation prepared at
  the following letter's makhraj.
- **Waqf-dependent:** no.
- **Citation:** tuhfah:14–16, jazariyyah:67.

**Family precedence:** the five triggers partition the alphabet — at most one
fires per NS. Completeness invariant (engine-checked): every NS in the corpus
matches exactly one of §1.1–§1.6.

---

## 2. `ghunnah-mushaddadah` — غنة الميم والنون المشددتين — Ghunnah of doubled mīm/nūn

- **Trigger:** مّ or نّ (mīm or nūn bearing shaddah), anywhere (tuhfah:17
  "وغن ميما ثم نونا شددا", jazariyyah:61 "وأظهر الغنة من نون ومن ميم إذا ما شددا").
- **Span:** the shaddah-bearing letter.
- **Outcome:** obligatory ghunnah, 2 counts.
- **Waqf-dependent:** no (applies even at stop).
- **Citation:** tuhfah:17, jazariyyah:61.
- **Interaction:** where idghām bi-ghunnah (§1.2) or shafawī (§3.2) produces a
  doubled mīm/nūn, the mushaddadah ghunnah is *why* the merged form carries
  ghunnah; the engine emits the idghām span only (precedence: idghām rules
  consume their result letter; standalone ghunnah fires only when not already
  inside an idghām/iqlāb/ikhfāʾ span). Verified empirically against oracle's
  `ghunnah` category.

---

## 3. Aḥkām al-mīm al-sākinah — أحكام الميم الساكنة

Preamble (tuhfah:18–19): mīm sākinah before any letter except the līn-context
alif; three rulings.

### 3.1 `ikhfa-shafawi` — الإخفاء الشفوي — Ikhfāʾ Shafawī — "labial concealment"

- **Trigger:** مْ followed by ب (tuhfah:20, jazariyyah:62 — Jazarī notes it is
  "على المختار من أهل الأداء", the preferred of two transmitted treatments).
- **Span:** the mīm + the bāʾ.
- **Outcome:** mīm concealed with ghunnah.
- **Waqf-dependent:** no.
- **Citation:** tuhfah:19–20, jazariyyah:62.

### 3.2 `idgham-shafawi` — الإدغام الشفوي — Idghām Shafawī (mithlayn ṣaghīr)

- **Trigger:** مْ followed by م (tuhfah:21).
- **Span:** mīm + mīm (with its ḥarakah/shaddah).
- **Outcome:** full merge with ghunnah.
- **Waqf-dependent:** no.
- **Citation:** tuhfah:21.

### 3.3 `izhar-shafawi` — الإظهار الشفوي — Iẓhār Shafawī

- **Trigger:** مْ followed by any letter other than ب and م (tuhfah:22);
  extra care before و and ف (tuhfah:23, jazariyyah:63) — same outcome,
  flagged in the explanation text.
- **Span:** the mīm + following letter.
- **Outcome:** clear mīm.
- **Waqf-dependent:** no.
- **Citation:** tuhfah:22–23, jazariyyah:63.
- **Oracle note:** cpfair has no iẓhār shafawī category; ours is emitted,
  excluded from diff.

---

## 4. Lām rules — اللامات

### 4.1 `lam-qamariyyah` — اللام القمرية — Lām Qamariyyah — "moon lām (clear)"

- **Trigger:** the lām of the definite article (ال / ٱل) followed by one of the
  fourteen letters of ابغ حجك وخف عقيمه (tuhfah:25):
  ا ب غ ح ج ك و خ ف ع ق ي م ه.
- **Span:** the lām (which carries sukūn).
- **Outcome:** lām pronounced clearly.
- **Waqf-dependent:** no.
- **Citation:** tuhfah:24–25, 28.
- **Derivation note:** "lām of al-" is identified structurally: word-initial
  ٱ/ا + ل, including after prefixes (و، ف، ب، ك، لل). The engine derives this
  from morphology-free letter context: hamzat waṣl + lām at word start. The
  lil- (لِلّ...) form drops the alif — handled as its own pattern.

### 4.2 `lam-shamsiyyah` — اللام الشمسية — Lām Shamsiyyah — "sun lām (assimilated)"

- **Trigger:** the lām of the definite article followed by one of the fourteen
  letters of the couplet (tuhfah:27): ط ث ص ر ت ض ذ ن د س ظ ز ش ل.
- **Span:** the (unpronounced) lām + the shaddah-bearing following letter.
- **Outcome:** lām fully assimilated; following letter doubled.
- **Waqf-dependent:** no.
- **Citation:** tuhfah:26–28.

### 4.3 `lam-fil` — لام الفعل — Lām al-Fiʿl — "verb lām (clear)"

- **Trigger:** lām sākinah in a verb (e.g. قُلْ، قُلْنَا، الْتَقَى), always iẓhār
  (tuhfah:29) — except before ل/ر where mithlayn/mutaqāribayn idghām applies
  (قُل رَّبِّ — see §5).
- **Span:** the lām + following letter.
- **Outcome:** clear lām.
- **Waqf-dependent:** no.
- **Citation:** tuhfah:29.
- **Derivation note:** verbhood is morphological; the engine cannot know it.
  Implemented as: lām sākinah *not* part of a definite article and not before
  ل/ر → iẓhār (which is the default anyway). Emitted only in explanations mode;
  never diffed. Documented limitation.

### 4.4 `lam-jalalah-tafkhim` / `lam-jalalah-tarqiq` — لام لفظ الجلالة — the lām of الله

- **Trigger:** the word الله (lafẓ al-jalālah). Preceded by fatḥah or ḍammah →
  **tafkhīm** (heavy); preceded by kasrah → **tarqīq** (light)
  (jazariyyah:43 "وفخم اللام من اسم الله عن فتح او ضم كعبد الله").
- **Span:** the doubled lām + hāʾ.
- **Waqf-dependent:** no (start-context at basmalah etc.: preceding-vowel rule
  applies to the connected prior vowel; standalone start → tafkhīm).
- **Citation:** jazariyyah:43.
- **Oracle note:** not a cpfair category; emitted, excluded from diff.

---

## 4b. Tafkhīm & tarqīq — التفخيم والترقيق

The printed tajweed muṣḥaf carries this family as its blue color class; no
digital dataset has ever encoded it (RESIDUE, third-source findings). Two
algorithmic members ship (the jalālah lām is §4.4):

### 4b.1 `tafkhim-istila` — تفخيم حروف الاستعلاء

- **Trigger:** any pronounced occurrence of the seven istiʿlāʾ letters
  خ ص ض غ ط ق ظ (jazariyyah:21 "خص ضغط قظ").
- **Span:** the letter. **Waqf-dependent:** no.
- **Citation:** jazariyyah:21, 44.
- Grades of tafkhīm (aqwā at fatḥah+alif … adnā at kasrah) are an explanation
  concern, not separate rules.

### 4b.2 `ra-tafkhim` / `ra-tarqiq` — أحكام الراء

Jazariyyah:40–42. Ḥafṣ ruling implemented:

| rāʾ state | ruling |
|---|---|
| fatḥah / ḍammah (or tanwīn fatḥ/ḍamm) | tafkhīm |
| kasrah (or tanwīn kasr) | tarqīq (jaz:40 "ورقق الراء إذا ما كسرت") |
| sākinah after fatḥah/ḍammah | tafkhīm |
| sākinah after hamzat al-waṣl (kasrah not original — ٱرْجِعُوا) | tafkhīm (jaz:41) |
| sākinah after original kasrah | tarqīq (jaz:40) |
| … unless an unseparated istiʿlāʾ letter follows in the word (قِرْطَاس) | tafkhīm (jaz:41) |
| … istiʿlāʾ letter follows but is itself kasrah-ed — فِرْقٍ only | khilāf (jaz:42) → tarqīq, `flagged` |
| the imālah rāʾ (11:41) | tarqīq |
| **at waqf** (stop-mode): yāʾ sākinah or kasrah before | tarqīq (خَبِير) |
| **at waqf**: intervening sākin istiʿlāʾ after kasrah (مِصْر، ٱلْقِطْر) | khilāf → tafkhīm, `flagged` |
| **at waqf**: otherwise | tafkhīm (ٱلنَّار، ٱلْأُمُور) |

- **Span:** the rāʾ. **Oracle mapping:** none (our-only — no dataset has this).

### 4b.3 `ra-takrir` — إخفاء تكرير الراء

Doubled rāʾ (رّ): the letter's natural trill (ṣifat al-takrīr, jazariyyah:25)
must be *concealed* — one tongue contact, not a roll (jazariyyah:42
"وأخف تكريرا إذا تشدد"). Span: the rāʾ. Our-only.

## 4c. `bayan-dad-zha` — بيان الضاد والظاء

When ض and ظ meet (adjacent pronounced letters, either order), distinguishing
them is obligatory — no merging (jazariyyah:59 "وإن تلاقيا البيان لازم", with
the poem's own sites أَنقَضَ ظَهْرَكَ and يَعَضُّ ٱلظَّالِمُ). Span: both letters.
Our-only. (The bāb's larger content — jazariyyah:51–58's complete inventory of
every ẓāʾ-word in the Qurʾān — is explanation material, not a trigger rule.)

## 4d′. `waqf-ta-maftuha` — الوقف على التاء المفتوحة

Jazariyyah:93–99 inventories the feminine words whose tāʾ the rasm writes open
(ت, not ة): رحمت، نعمت، امرأت، سنت، لعنت، معصيت، كلمت، بقيت، قرت، فطرت، شجرت،
جنت، ابنت. Stopping on them keeps the **tāʾ** sound (رَحْمَتْ, not رَحْمَه). The
rasm itself selects the sites — the engine matches the word skeletons (guarding
against ordinary verb tāʾs) and emits the note in stop mode. Our-only.

## 4d. `rawm` / `ishmam` — الروم والإشمام (stop-mode options)

Jazariyyah:103–104: stopping with the full vowel is prohibited; the transmitted
options are rawm (a weakened third of the vowel — permitted at ḍammah and
kasrah) and ishmām (soundless lip-rounding after the sukūn — ḍammah only);
neither at fatḥah. Emitted in stop mode on the stopped-upon letter as
*permitted options*, waqf-dependent. The unique in-flow ishmām site تَأْمَ۫نَّا
(12:11, marked ۫ in the text) is emitted in all modes. Our-only.

## 4e. Meaning-based stops — الوقف والابتداء (transmitted data, not derived)

Jazariyyah:72–77 classifies stops by *meaning* (tāmm / kāfī / ḥasan / qabīḥ) —
"وهي لما تم فإن لم يوجد تعلق أو كان معنى فابتدي". **No honest letter-level
derivation exists**: the classification depends on syntax and sense. The
library therefore ships this layer as what it classically is — a transmitted
judgment list: the muṣḥaf committee's waqf marks (ۘ lāzim، ۗ preferred stop،
ۚ permitted، ۖ continue preferred، ۙ forbidden، ۛ muʿānaqah)، exposed via
`getWaqfMarks(surah, ayah)` with per-mark semantics and never used for rule
derivation. This is the same policy as the sakt sites (A-006): where the
tradition transmits a list rather than a rule, the library carries the list
and says so.

## 5. Idghām of adjacent consonants — المثلان والمتجانسان والمتقاربان

Definitions (tuhfah:30–34): two adjacent letters, first sākin ("ṣaghīr"), are

- **`idgham-mithlayn`** — same makhraj and ṣifāt (identical letters), e.g.
  اذْهَب بِّ، يُدْرِككُّم. Excludes madd-letter cases (وْ+و after ḍammah, يْ+ي
  after kasrah keep the madd — standard fiqh of the rule) and mīm+mīm
  (= §3.2 shafawī). Citation: tuhfah:30, 33; jazariyyah:49–50.
- **`idgham-mutajanisayn`** — same makhraj, different ṣifāt. Ḥafṣ set:
  ت/ط، ط/ت، ت/د، د/ت، ذ/ظ، ث/ذ، ب/م (اركب مَّعَنَا). Citation: tuhfah:32–33;
  jazariyyah:49–50 (worked examples in 50).
- **`idgham-mutaqaribayn`** — close makhraj/ṣifāt. Ḥafṣ set: ل/ر (قُل رَّبِّ)،
  ق/ك (نَخْلُقكُّمْ — jazariyyah:45 notes the khilāf; Ḥafṣ: idghām). Citation:
  tuhfah:31, 33; jazariyyah:45, 49.
- **Span:** first (sākin) letter + second letter.
- **Waqf-dependent:** no (dies across a stop; Phase 2).
- **Oracle mapping:** `idghaam_mutajaanisain`, `idghaam_mutaqaaribain`; mithlayn
  expected under those or unannotated — determined empirically (A-003).

---

## 6. `qalqalah` — القلقلة

- **Letters:** ق ط ب ج د (jazariyyah:23 "قلقلة قطب جد").
- **`qalqalah-sughra`** — the letter is sākin mid-flow (jazariyyah:38
  "وبينن مقلقلا إن سكنا"). Span: the sākin letter. Waqf-dependent: no.
- **`qalqalah-kubra`** — the letter ends a word at an actual stop (sukūn
  ʿāriḍ or aṣlī at waqf), stronger bounce (jazariyyah:38 "وإن يكن في الوقف كان
  أبينا"). Phase 2 (stop mode) only. A shaddah-bearing final letter at stop
  (أشد qalqalah, e.g. الحقّ) is the strongest sub-grade — same rule id, noted in
  explanation.
- **Citation:** jazariyyah:23, 38.

---

## 7. Madd — المد

Madd letters (tuhfah:39–40): ا preceded by fatḥah; و sākinah preceded by
ḍammah; ي sākinah preceded by kasrah ("واي" in نُوحِيهَا). Dagger alif (U+0670)
and ṣila wāw/yāʾ (U+06E5/U+06E6 after hāʾ ḍamīr) are madd-letter spellings.
Līn letters (tuhfah:41): و/ي sākinah after fatḥah.

Grades (Shāṭibiyyah values — A-001):

### 7.1 `madd-tabii` — المد الطبيعي/الأصلي — 2 counts
No hamz/sukūn cause attached (tuhfah:35–37). Includes the ḥarfī 2-count
fawātiḥ letters of حي طهر (tuhfah:55–56) and ṣila ṣughrā (hāʾ ḍamīr + ۥ/ۦ not
followed by hamzah — classified here; some taxonomies name it separately).
Citation: tuhfah:35–37, 39–40, 55–56.

### 7.2 `madd-muttasil` — المد الواجب المتصل — 4–5 counts
Madd letter + hamzah **in the same word** (tuhfah:43, jazariyyah:70). Span:
madd letter + hamzah. Citation: tuhfah:42–43, jazariyyah:70.

### 7.3 `madd-munfasil` — المد الجائز المنفصل — 4–5 counts
Madd letter at word end + hamzah starting the next word (tuhfah:44,
jazariyyah:71). Includes ṣila kubrā (hāʾ ḍamīr ṣila + hamzah). Word-boundary
definition is the rule's essence. Citation: tuhfah:42, 44; jazariyyah:71.

### 7.4 `madd-arid-lissukun` — المد العارض للسكون — 2/4/6 counts, **stop-only**
Madd (or līn → `madd-lin`) letter followed by the verse/stop-final letter whose
sukūn arises from stopping (tuhfah:45, jazariyyah:71). Phase 2. Citation:
tuhfah:41, 45; jazariyyah:71.

### 7.5 `madd-badal` — مد البدل — 2 counts
Hamzah *precedes* the madd letter (آمَنُوا، إِيمَانًا) with no other cause
(tuhfah:46). Citation: tuhfah:46.

### 7.6 `madd-lazim` — المد اللازم — 6 counts, four kinds
Sukūn aṣlī (fixed in both waṣl and waqf) after the madd letter (tuhfah:47).

- `madd-lazim-kalimi-muthaqqal` — in a word, followed by shaddah (الضَّالِّينَ).
- `madd-lazim-kalimi-mukhaffaf` — in a word, plain sukūn (آلْآنَ, twice in Yūnus).
- `madd-lazim-harfi-muthaqqal` / `madd-lazim-harfi-mukhaffaf` — in the fawātiḥ letters whose
  names are three letters with medial madd (tuhfah:51–53), the eight of
  كم عسل نقص; muthaqqal when the ending assimilates into the next letter
  (الٓمّٓ lām-mīm), mukhaffaf otherwise. **ʿAyn (عٓ)** in كهيعص/حم عسق may take
  4 or 6 (tuhfah:54 "وعين ذو وجهين والطول أخص") — engine emits 6 (ṭūl,
  "more proper"), records the wajhān in the explanation.

Citation: tuhfah:47–57, jazariyyah:69.

### 7.7 `madd-iwad` — مد العوض — 2 counts, **stop-only**
Stopping on tanwīn fatḥ replaces the tanwīn with an alif of two counts
(نَارًا → nārā). No ʿiwaḍ on tāʾ marbūṭah (رَحْمَةً stops as رَحْمَه). Citation:
the waqf-on-ḥarakah principle, jazariyyah:103.

### Precedence — أقوى المدين
When two causes coincide on one madd letter, the stronger governs (classical
maxim; implied by the grade system):
`lazim > muttasil > arid > munfasil > badal > tabii`.
Engine encodes this as explicit rule priority; exactly one madd annotation per
madd letter.

---

## 8. `hamzat-wasl` — همزة الوصل

- **Trigger:** the letter ٱ (U+0671) — connective hamzah, written but silent in
  connected speech (jazariyyah:100–102 govern its vowel when *starting* there).
- **Continuation mode:** span = the ٱ; outcome "not pronounced (waṣl)".
- **Start mode (Phase 2):** pronounced with ḍammah if the verb's third letter
  is ḍammah-marked; kasrah otherwise for verbs; nouns per the seven listed
  nouns + al- pattern (jazariyyah:101–102).
- **Citation:** jazariyyah:100–102.
- **Oracle mapping:** `hamzat_wasl`.

---

## 9. `silent` — orthographically silent letters

Not a tajweed rule in the poems — a rasm/orthography layer the poems presuppose
(cf. jazariyyah:7–8 on rasm knowledge). Letters written but unrecited: alif
al-jamāʿah's trailing alif (قَالُوا۟), alif after tanwīn fatḥ seat, the ا of
مِا۟ئَة, و of أُو۟لَٰٓئِكَ, etc. In the Tanzil encoding these carry U+06DF ۟
(small high rounded zero) or U+06E0. Policy per §0: orthographic signs may be
read. Emitted as `silent` spans for renderer parity with the oracle's `silent`
category.

---

## 10. Rules the oracle annotates that we must reproduce — mapping table

Observed annotation counts from the oracle JSON (60,057 total). Note the JSON's
actual ids differ from its README (`idghaam_mutajanisayn`, not
`idghaam_mutajaanisain`).

| cpfair id | count | our id(s) |
|---|---|---|
| `hamzat_wasl` | 13,252 | `hamzat-wasl` |
| `madd_2` | 9,028 | `madd-tabii` (+ `madd-badal`? empirical — both 2 counts) |
| `ikhfa` | 5,301 | `ikhfa-haqiqi` |
| `ghunnah` | 4,946 | `ghunnah-mushaddadah` (scope verified empirically) |
| `madd_246` | 4,543 | `madd-arid-lissukun`, `madd-lin` (waqf-dependent — expect systematic verse-end diffs in continuation mode) |
| `silent` | 4,174 | `silent` |
| `idghaam_ghunnah` | 3,933 | `idgham-bighunnah` |
| `qalqalah` | 3,834 | `qalqalah-sughra` (+ kubrā at verse ends — waqf category) |
| `madd_munfasil` | 3,172 | `madd-munfasil` |
| `lam_shamsiyyah` | 2,733 | `lam-shamsiyyah` |
| `madd_muttasil` | 1,997 | `madd-muttasil` |
| `idghaam_no_ghunnah` | 1,035 | `idgham-bila-ghunnah` |
| `idghaam_shafawi` | 832 | `idgham-shafawi` |
| `iqlab` | 562 | `iqlab` |
| `ikhfa_shafawi` | 496 | `ikhfa-shafawi` |
| `madd_6` | 148 | `madd-lazim-*` |
| `idghaam_mutajanisayn` | 58 | `idgham-mutajanisayn` |
| `idghaam_mutaqaribayn` | 13 | `idgham-mutaqaribayn` (+ `idgham-mithlayn`? empirical) |

Our-only rules (excluded from diff): `izhar-halqi`, `izhar-mutlaq`,
`izhar-shafawi`, `lam-qamariyyah`, `lam-fil`, `lam-jalalah-*`,
`idgham-mithlayn` (pending empirical check), `sakt`.

---

## 11. Engine-checked invariants derived from this spec

1. NS-family partition: every nūn sākinah/tanwīn matches exactly one of §1.
2. Mīm-family partition: every mīm sākinah matches exactly one of §3.
3. Lām of al-: every detected definite-article lām is qamariyyah xor shamsiyyah,
   and the 14+14 letter sets are disjoint and exhaust the alphabet.
4. Madd uniqueness: exactly one madd rule per madd letter (precedence §7).
5. No rule reads a forbidden codepoint (§0) — enforced by static test on rule
   data.
