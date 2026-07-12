# ghunna

> *Ghunna (غُنّة) is the nasal resonance at the heart of tajweed — the sound the rules keep returning to.*

Ask for a verse, get its tajweed rules — **derived, not looked up**.

```ts
import { annotateVerse } from "ghunna";

const { text, annotations } = annotateVerse(2, 255); // Āyat al-Kursī

// each annotation:
// {
//   rule: "iqlab",
//   name: { arabic: "الإقلاب", transliteration: "iqlāb", english: "conversion to mīm" },
//   range: [17, 22],                       // codepoint range into `text`
//   trigger: { letters: "نۢ", description: "conversion to mīm" },
//   derivation: "nūn sākinah/tanwīn followed by ب → the nūn is converted to a concealed mīm with ghunnah",
//   citation: { text: "tuhfah", lines: [13] },   // line 13 of Tuḥfat al-Aṭfāl
//   waqfDependent: false,
//   confidence: "certain",
// }
```

A pure-TypeScript derivation engine for classical tajweed — riwāyat **Ḥafṣ ʿan
ʿĀṣim**, ṭarīq al-Shāṭibiyyah. Zero runtime dependencies; identical in browser
and Node; ESM + CJS.

## Why this library is different

**1. It derives every rule from letter and diacritic context alone.** The
Uthmani encoding embeds pronunciation *hints* (the small mīm at iqlāb sites,
the maddah on long madds). This engine never reads them — they are used only to
*test* it. The rules are implemented **as written** in the two canonical
teaching poems, cited down to the line:

- *Tuḥfat al-Aṭfāl* (al-Jamzūrī, 1198 AH) — `docs/sources/tuhfah.md`
- *al-Muqaddimah al-Jazariyyah* (Ibn al-Jazarī, d. 833 AH) — `docs/sources/jazariyyah.md`

**2. It models stopping (waqf) — no existing tool does.** Some rules exist only
at a pause (madd ʿāriḍ lil-sukūn, qalqalah kubrā, madd ʿiwaḍ); others die
across one (idghām, madd munfaṣil). Precomputed tajweed datasets bake in one
pause assumption; this engine makes it a parameter:

```ts
annotateVerse(1, 7, { mode: "stop" });          // waqf at verse end
annotateVerse(2, 255, { mode: "both" });        // annotations labelled appliesIn: "wasl" | "waqf"
annotateVerse(36, 52, { stopAt: 5 });           // recitation-tutor: stop after word 5
annotateVerse(1, 2, { startFresh: true });      // starting here: hamzat al-waṣl start-vowel derived
```

**3. It is verified against the annotated-mushaf tradition — and the
disagreements are catalogued, not hidden.** The engine's output is compared
over all 6,236 verses against
[cpfair/quran-tajweed](https://github.com/cpfair/quran-tajweed) (CC-BY 4.0,
derived from the Dar al-Maarifah tajweed muṣḥaf):

| | continuation mode | stop mode (oracle's pause frame) |
|---|---|---|
| agreement over mapped categories | **99.80 %** | **99.82 %** |
| disagreement sites (whole Qur'an) | 108 | 108 |

Every disagreement site is classified into six groups in
[RESIDUE.md](./RESIDUE.md), each **verified against the published tajweed
literature** — and in all six, the evidence favors the rules-as-written over
the dataset. 90 of the 108 sites reduce to a single defect in the dataset's
madd classifier (it branches on the hamzah's seat glyph instead of word
identity, so it misfiles هَٰٓؤُلَآءِ and يَٰٓـَٔادَمُ as muttaṣil and تَبُوٓأَ as
munfaṣil); the rest are its missing ط→ت idghām nāqiṣ (بَسَطتَ), the اللهم lām,
a ṣila-classifier undercount at 17:7, and unannotated fawātiḥ assimilation
(طسٓمٓ with idghām). Adopted policies on open questions are logged in
[ASSUMPTIONS.md](./ASSUMPTIONS.md). The diff harness ships in
`tools/diff-harness.ts`.

## Install & use

```sh
npm install ghunna
```

```ts
// full package (bundled Qur'an text, ~730 KB ESM):
import { annotateVerse, getVerseText } from "ghunna";

// corpus-free core (~34 KB): bring your own Tanzil-Uthmani-encoded text
import { annotate, tokenize, RULE_META } from "ghunna/core";

annotate("مِن رَّبِّهِمْ");  // → [{ rule: "idgham-bila-ghunnah", … }]
```

Also exported: the tokenizer (letters, words, codepoint-ranged spans), the full
rule metadata table (`RULE_META` — names, citations, derivation templates), and
the riwāyah parameter set (`HAFS_SHATIBIYYAH`, including the four transmitted
sakt sites, which the engine applies as data — they are not derivable and not
read from any hint).

## Input contract

- Vocalized Uthmani Arabic in the **Tanzil Uthmani encoding** (bundled corpus
  is exactly that). Combining-mark order is preserved — do **not** NFC-normalize.
- Unknown codepoints, marks without a base letter, or empty input **throw**
  (`TokenizeError`). This is the Qur'an; the engine never guesses silently.
  Ambiguous derivations are emitted with `confidence: "flagged"`.

## Rule coverage (Ḥafṣ, continuation + stop)

nūn sākinah & tanwīn (iẓhār ḥalqī, idghām ±ghunnah, iẓhār muṭlaq, iqlāb, ikhfāʾ)
· mīm sākinah (ikhfāʾ/idghām/iẓhār shafawī) · ghunnah mushaddadah · lām
qamariyyah/shamsiyyah (incl. لِلْـ, وَلَلـ, ءَآلـ forms; iftaʿala-verb exclusion)
· lām al-jalālah tafkhīm/tarqīq · idghām mithlayn/mutajānisayn/mutaqāribayn ·
qalqalah ṣughrā/kubrā · madd ṭabīʿī, badal, muttaṣil, munfaṣil, ʿāriḍ lil-sukūn,
līn, ʿiwaḍ, lāzim (kalimī/ḥarfī × muthaqqal/mukhaffaf, ʿayn wajhān flagged) with
aqwā-al-maddayn precedence · fawātiḥ letter-name model incl. cross-name
assimilation · hamzat al-waṣl (silent in flow; start-vowel rules when starting)
· orthographic silence · sakt.

## Project documents

- [docs/SPEC.md](./docs/SPEC.md) — the rule specification with poem-line
  citations (the scholar-facing artifact; test-enforced sync with the engine)
- [ASSUMPTIONS.md](./ASSUMPTIONS.md) — every adopted policy on an open question
- [RESIDUE.md](./RESIDUE.md) — the 27 catalogued divergences from the oracle
- `reports/diff.md`, `reports/diff-waqf.md` — full corpus diff reports

## Data & licenses

- Engine code: MIT.
- Qur'an text: [Tanzil](https://tanzil.net) Uthmani (carried intact, per Tanzil
  terms; attribution embedded in the corpus module).
- Ground truth (test-time only, not shipped):
  [cpfair/quran-tajweed](https://github.com/cpfair/quran-tajweed), CC-BY 4.0.
- Poem texts: Arabic Wikisource (CC BY-SA).

## Status

Phase 1 (core rules) + Phase 2 (waqf model) complete and corpus-verified.
Planned: Warsh ʿan Nāfiʿ as a parameter set + farsh table (the architecture
separates uṣūl from farsh from day one).
