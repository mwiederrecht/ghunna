/**
 * The rule interpreter: tokenized verse → Annotation[].
 *
 * Continuation (waṣl) mode. Every derivation reads only permitted signs
 * (SPEC §0): letter identities, ḥarakāt, shaddah, sukūn (explicit or
 * positional), tanwīn, silence marks, and word boundaries. Hint marks
 * (iqlāb mīm, maddah) are never consulted.
 *
 * Rule *metadata* (names, citations, derivation text) lives in rules/meta.ts;
 * letter classes live in chars.ts; this module is the pattern logic.
 */
import type { Annotation, RuleId } from "./annotation.js";
import { RULE_META } from "./rules/meta.js";
import {
  AIN, ALEF, ALEF_MAKSURA, BEH, DAGGER_ALIF, DAL, FEH, HAH, HAMZA_FAMILY,
  HAMZAT_WASL, HEH, IKHFA_LETTERS, KAF, LAM, LAM_REH, MEEM, NOON,
  QAF, QALQALAH_LETTERS, QAMARI_LETTERS, REH, SAD, SEEN, SHAMSI_LETTERS,
  DAD, IMALA, ISHMAM, ISTILA_LETTERS, SEEN_SUBST_HIGH, TAH, TEH, THEH, THAL,
  THROAT_LETTERS, WAW, WAW_HAMZA, YANMU, YEH, ZAH,
} from "./chars.js";
import {
  isLinLetter, isMaddLetter, isSakin, tokenize,
  type Letter, type TokenizedVerse, type Word,
} from "./tokenizer.js";

export interface AnnotateOptions {
  /** Word indices after which a transmitted sakt occurs (riwāyah data). */
  saktAfterWord?: readonly number[];
  /**
   * Recitation mode:
   *  - "continue" (default): the text flows into what follows: no stop at end
   *  - "stop": the reciter stops at the end of the text (waqf rules at the
   *    final word: madd ʿāriḍ, madd līn, qalqalah kubrā, madd ʿiwaḍ, …)
   *  - "both": union of both runs; annotations exclusive to one mode carry
   *    `appliesIn: "wasl" | "waqf"`.
   */
  mode?: "continue" | "stop" | "both";
  /** Stop after this word index (recitation-tutor use): waqf rules at that
   *  word, resumption (start) rules at the next. */
  stopAt?: number;
  /** Treat the beginning of the text as an utterance start (hamzat al-waṣl is
   *  pronounced, an initial shaddah from cross-verse idghām is dropped). */
  startFresh?: boolean;
}

interface PassConfig {
  stops: ReadonlySet<number>; // stop after word i
  startFresh: boolean;
  sakt: ReadonlySet<number>;
}

export class DerivationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DerivationError";
  }
}

// ---------- fawātiḥ (muqaṭṭaʿāt) letter names ----------

/**
 * Names of the fourteen fawātiḥ letters (tuhfah:53–57).
 * madd: "none" (alif), "two" (two-letter names حي طهر), "six" (كم عسل نقص),
 * "ayn" (wajhān 4/6: līn, tuhfah:54).
 * final: the name's closing consonant (drives assimilation across names).
 */
const HARF_NAMES: ReadonlyMap<number, { madd: "none" | "two" | "six" | "ayn"; final: number | null }> = new Map([
  [ALEF, { madd: "none", final: null }], // ألف: ends with ف but no madd section
  [LAM, { madd: "six", final: MEEM }], // لام
  [MEEM, { madd: "six", final: MEEM }], // ميم
  [SAD, { madd: "six", final: DAL }], // صاد
  [REH, { madd: "two", final: null }], // را
  [KAF, { madd: "six", final: FEH }], // كاف
  [HEH, { madd: "two", final: null }], // ها
  [YEH, { madd: "two", final: null }], // يا
  [AIN, { madd: "ayn", final: NOON }], // عين
  [TAH, { madd: "two", final: null }], // طا
  [SEEN, { madd: "six", final: NOON }], // سين
  [HAH, { madd: "two", final: null }], // حا
  [QAF, { madd: "six", final: FEH }], // قاف
  [NOON, { madd: "six", final: NOON }], // نون
]);

/** A word is a fawātiḥ word iff every letter is bare of vocalization. */
function isMuqattaat(w: Word): boolean {
  return w.letters.every(
    (l) => l.vowel === null && l.tanwin === null && !l.shadda && !l.sukun && l.silent === null
  ) && w.letters.every((l) => HARF_NAMES.has(l.base));
}

// ---------- letter-stream helpers ----------

interface Pos {
  letter: Letter;
  word: number; // word index
  idx: number; // index within word
}

function flatten(verse: TokenizedVerse): Pos[] {
  const out: Pos[] = [];
  for (const w of verse.words)
    for (let i = 0; i < w.letters.length; i++) out.push({ letter: w.letters[i]!, word: w.index, idx: i });
  return out;
}

/** Is this letter pronounced in connected recitation? */
function isPronounced(p: Pos, verse: TokenizedVerse): boolean {
  const l = p.letter;
  if (l.silent !== null) return false; // both silent-always and silent-in-waṣl
  if (l.base === HAMZAT_WASL) return false; // connected speech drops it
  // bare seat letters: ا/ى/و with no vocalization that are not madd letters
  const letters = verse.words[p.word]!.letters;
  if (
    (l.base === ALEF || l.base === ALEF_MAKSURA || l.base === WAW) &&
    l.vowel === null && l.tanwin === null && !l.shadda && !l.sukun &&
    !isMaddLetter(letters, p.idx)
  ) {
    return false;
  }
  return true;
}

const sliceText = (verse: TokenizedVerse, start: number, end: number) =>
  [...verse.text].slice(start, end).join("");

// ---------- the annotator ----------

export function annotateTokens(verse: TokenizedVerse, opts: AnnotateOptions = {}): Annotation[] {
  const mode = opts.mode ?? "continue";
  const sakt = new Set(opts.saktAfterWord ?? []);
  const baseStops = new Set(opts.stopAt !== undefined ? [opts.stopAt] : []);
  const startFresh = opts.startFresh ?? false;
  const lastWord = verse.words.length - 1;

  if (mode === "both") {
    const wasl = runPass(verse, { stops: baseStops, startFresh, sakt });
    const waqf = runPass(verse, { stops: new Set([...baseStops, lastWord]), startFresh, sakt });
    return mergeModes(wasl, waqf);
  }
  const stops = mode === "stop" ? new Set([...baseStops, lastWord]) : baseStops;
  return runPass(verse, { stops, startFresh, sakt });
}

/** Merge continuation- and stop-run annotations, labelling mode-exclusive ones. */
function mergeModes(wasl: Annotation[], waqf: Annotation[]): Annotation[] {
  const key = (a: Annotation) => `${a.rule}:${a.range[0]}:${a.range[1]}`;
  const waqfKeys = new Map(waqf.map((a) => [key(a), a]));
  const out: Annotation[] = [];
  const seen = new Set<string>();
  for (const a of wasl) {
    const k = key(a);
    seen.add(k);
    if (waqfKeys.has(k)) out.push(a);
    else out.push({ ...a, appliesIn: "wasl" });
  }
  for (const a of waqf) {
    if (!seen.has(key(a))) out.push({ ...a, appliesIn: "waqf" });
  }
  out.sort((x, y) => x.range[0] - y.range[0] || x.range[1] - y.range[1]);
  return out;
}

function runPass(verse: TokenizedVerse, cfg: PassConfig): Annotation[] {
  const flat = flatten(verse);
  const anns: Annotation[] = [];
  const { stops, startFresh, sakt } = cfg;

  /** Is a stop boundary crossed between word a and word b (a < b)? */
  const stopBetween = (a: number, b: number): boolean => {
    for (let w = a; w < b; w++) if (stops.has(w)) return true;
    return false;
  };
  /** Is this word the start of an utterance (fresh start or right after a stop)? */
  const isUtteranceStart = (w: number): boolean =>
    (w === 0 && startFresh) || (w > 0 && stops.has(w - 1));

  /** Letters consumed as the *first* member of an adjacent-idghām pair :
   *  suppresses qalqalah on the assimilated letter. */
  const idghamConsumed = new Set<Letter>();
  /** Definite-article lāms: owned by the lām rules, excluded from the
   *  adjacent-consonant idghām pass (ٱلرَّحْمَٰن is shamsiyyah, not mutaqāribayn). */
  const articleLams = new Set<Letter>();
  /** Shaddah letters that are the target of an NS/mīm idghām span :
   *  suppresses the standalone ghunnah-mushaddadah annotation. */
  const idghamTarget = new Set<Letter>();

  const nextPronounced = (fi: number): Pos | null => {
    const from = flat[fi]!.word;
    for (let j = fi + 1; j < flat.length; j++) {
      const q = flat[j]!;
      if (q.word > from && stopBetween(from, q.word)) return null; // a stop severs the connection
      if (isPronounced(q, verse)) return q;
    }
    return null;
  };
  /** First letter (pronounced or not) after fi, with word info. */
  const nextLetter = (fi: number): Pos | null => (fi + 1 < flat.length ? flat[fi + 1]! : null);

  const emit = (
    rule: RuleId,
    range: [number, number],
    triggerLetters: string,
    nextChar: string | null,
    confidence: "certain" | "flagged" = "certain"
  ) => {
    const meta = RULE_META[rule];
    anns.push({
      rule,
      name: meta.name,
      range,
      trigger: { letters: triggerLetters, description: meta.name.english },
      derivation: meta.derivation
        .replace("{t}", triggerLetters)
        .replace("{n}", nextChar ?? "?"),
      citation: meta.citation,
      waqfDependent: meta.waqfDependent,
      confidence,
    });
  };

  const ch = (l: Letter) => sliceText(verse, l.start, l.end);
  const baseCh = (l: Letter) => String.fromCodePoint(l.base);

  // ---- pass 0: fawātiḥ words ----
  const muqattaatWords = new Set<number>();
  for (const w of verse.words) if (isMuqattaat(w)) muqattaatWords.add(w.index);

  for (const wIdx of muqattaatWords) {
    const w = verse.words[wIdx]!;
    for (let i = 0; i < w.letters.length; i++) {
      const l = w.letters[i]!;
      const info = HARF_NAMES.get(l.base)!;
      const range: [number, number] = [l.start, l.end];
      // the letter following this name (next name in word, or next word's start)
      const nextL = i + 1 < w.letters.length ? w.letters[i + 1]! : null;
      if (info.madd === "two") {
        emit("madd-tabii", range, ch(l), null);
      } else if (info.madd === "six" || info.madd === "ayn") {
        // muthaqqal iff the name's final assimilates into the following name's
        // first letter (لام+ميم mithlayn; سين نون+ميم NS-idghām)
        let muthaqqal = false;
        if (nextL !== null && info.final !== null) {
          if (info.final === nextL.base) muthaqqal = true; // mithlayn (الٓمّٓ)
          else if (info.final === NOON && YANMU.has(nextL.base)) muthaqqal = true; // طسٓمّٓ
        }
        if (info.madd === "ayn") {
          // wajhān 4/6 (tuhfah:54): emitted as lāzim with flag in derivation
          emit("madd-lazim-harfi-mukhaffaf", range, ch(l), null, "flagged");
        } else {
          emit(muthaqqal ? "madd-lazim-harfi-muthaqqal" : "madd-lazim-harfi-mukhaffaf", range, ch(l), null);
        }
      }
      // assimilation between letter names (نْ + م → idghām bi-ghunnah, etc.)
      if (info.final === NOON) {
        const nb = nextL ?? (wIdx + 1 < verse.words.length ? verse.words[wIdx + 1]!.letters[0]! : null);
        if (nb !== null) {
          if (YANMU.has(nb.base) && nextL !== null) {
            // within the fawātiḥ word (طسٓمٓ): idghām with ghunnah
            emit("idgham-bighunnah", [l.start, nb.end], ch(l), baseCh(nb));
          } else if (nextL === null && nb.base === WAW) {
            // نٓ وَٱلْقَلَمِ / يسٓ وَٱلْقُرْءَانِ: Ḥafṣ: iẓhār (izhar mutlaq)
            emit("izhar-mutlaq", [l.start, l.end], ch(l), baseCh(nb));
          } else if (IKHFA_LETTERS.has(nb.base)) {
            // كهيعص (ن + ص), حم عسق (ن + س): ikhfāʾ
            emit("ikhfa-haqiqi", [l.start, nb.end], ch(l), baseCh(nb));
          }
        }
      }
    }
  }

  // ---- main letter scan ----
  for (let fi = 0; fi < flat.length; fi++) {
    const p = flat[fi]!;
    const l = p.letter;
    const w = verse.words[p.word]!;
    if (muqattaatWords.has(p.word)) continue; // handled in pass 0

    // --- hamzat waṣl / silent ---
    if (l.base === HAMZAT_WASL) {
      if (p.idx === 0 && isUtteranceStart(p.word)) {
        // starting at the waṣl hamzah: it is pronounced; derive its vowel
        // (jazariyyah:100–102)
        const sv = startWaslVowel(w);
        anns.push({
          rule: "hamzat-wasl",
          name: RULE_META["hamzat-wasl"].name,
          range: [l.start, l.end],
          trigger: { letters: ch(l), description: RULE_META["hamzat-wasl"].name.english },
          derivation: `starting at hamzat al-waṣl: pronounced with ${sv.vowel}: ${sv.why}`,
          citation: { text: "jazariyyah", lines: [100, 101, 102] },
          waqfDependent: true,
          confidence: sv.confidence,
        });
      } else {
        emit("hamzat-wasl", [l.start, l.end], ch(l), null);
      }
    }
    if (l.silent === "always") {
      emit("silent", [l.start, l.end], ch(l), null);
    }
    // silent === "wasl" (أَنَا۠): silent in continuation, surfaces as an alif at
    // a stop on its word (the waqf tail emits the madd there instead)
    if (l.silent === "wasl" && !stops.has(p.word)) {
      emit("silent", [l.start, l.end], ch(l), null);
    }

    // the seen-substitution ṣād (يَبْصُۜطُ 2:245, بَصْۜطَةً 7:69): the written ṣād
    // is not recited (a sīn is): annotated as silent, flagged
    if (l.ortho.includes(SEEN_SUBST_HIGH)) {
      emit("silent", [l.start, l.end], ch(l), null, "flagged");
    }

    // the unique in-flow ishmām word تَأْمَ۫نَّا (12:11): marked in the text
    if (l.ortho.includes(ISHMAM)) {
      emit("ishmam", [l.start, l.end], ch(l), null);
    }

    // bare seat wāw before a dagger alif (ٱلصَّلَوٰةَ) is written but silent
    if (
      l.base === WAW && l.vowel === null && l.tanwin === null && !l.shadda &&
      !l.sukun && l.silent === null &&
      p.idx + 1 < w.letters.length && w.letters[p.idx + 1]!.base === DAGGER_ALIF
    ) {
      emit("silent", [l.start, l.end], ch(l), null);
    }

    // --- nūn sākinah & tanwīn family ---
    const isNS = l.base === NOON && isSakin(l) && l.silent === null;
    const hasTanwin = l.tanwin !== null;
    if (isNS || hasTanwin) {
      const np = nextPronounced(fi);
      const nl = nextLetter(fi);
      // junction vocalization: NS/tanwīn immediately before hamzat waṣl gets a
      // helping vowel: no NS rule fires
      const beforeWasl = nl !== null && nl.letter.base === HAMZAT_WASL && nl.letter.silent === null
        ? true
        : np !== null && np.word !== p.word &&
          verse.words[np.word]!.letters[0]!.base === HAMZAT_WASL;
      // (the second clause guards tanwīn + ٱلْ where the wasl is word-initial)
      if (np === null) {
        // verse-final NS (continuation mode treats verse end as continuing to
        // nothing): no rule fires; Phase 2 handles stops
      } else if (beforeWasl && hasTanwin) {
        // عَادًا ٱلْأُولَىٰ: tanwīn nūn takes a kasrah at the junction
      } else {
        const nb = np.letter.base;
        const sameWord = np.word === p.word;
        const saktBetween = !sameWord && sakt.has(p.word);
        const start = l.start;
        const end = np.letter.end;
        if (saktBetween) {
          emit("sakt", [l.start, l.end], ch(l), baseCh(np.letter));
        } else if (THROAT_LETTERS.has(nb) || HAMZA_FAMILY.has(nb)) {
          emit("izhar-halqi", [start, end], ch(l), baseCh(np.letter));
        } else if (YANMU.has(nb)) {
          if (sameWord) {
            emit("izhar-mutlaq", [start, end], ch(l), baseCh(np.letter));
          } else {
            emit("idgham-bighunnah", [start, end], ch(l), baseCh(np.letter));
            idghamTarget.add(np.letter);
          }
        } else if (LAM_REH.has(nb)) {
          emit("idgham-bila-ghunnah", [start, end], ch(l), baseCh(np.letter));
          idghamTarget.add(np.letter);
        } else if (nb === BEH) {
          emit("iqlab", [start, end], ch(l), baseCh(np.letter));
        } else if (IKHFA_LETTERS.has(nb)) {
          emit("ikhfa-haqiqi", [start, end], ch(l), baseCh(np.letter));
        } else {
          throw new DerivationError(
            `NS-family: no rule for nūn/tanwīn before ${baseCh(np.letter)} at cp ${l.start}`
          );
        }
      }
    }

    // --- mīm sākinah family ---
    if (l.base === MEEM && isSakin(l) && !hasTanwin && l.silent === null) {
      const np = nextPronounced(fi);
      if (np !== null) {
        const nb = np.letter.base;
        const range: [number, number] = [l.start, np.letter.end];
        if (nb === BEH) {
          emit("ikhfa-shafawi", range, ch(l), baseCh(np.letter));
        } else if (nb === MEEM) {
          emit("idgham-shafawi", range, ch(l), baseCh(np.letter));
          idghamTarget.add(np.letter);
        } else {
          emit("izhar-shafawi", range, ch(l), baseCh(np.letter));
        }
      }
    }

    // --- lām of the definite article ---
    if (l.base === LAM && p.idx > 0 && isSakinOrBare(l) && !l.shadda) {
      const prev = w.letters[p.idx - 1]!;
      // article shapes: ٱل (incl. after prefixes وَ فَ بِ كَ, via the waṣl), and
      // the alif-less لِلْ… form where the article lām directly follows the
      // preposition lām (لِلنَّاسِ; the first lām may carry a shaddah from a
      // preceding idghām: لِّلنَّاسِ).
      const isArticle =
        prev.base === HAMZAT_WASL ||
        // alif-less forms: لِلنَّاسِ (li- prefix), وَلَلدَّارُ (emphatic la-),
        // and the istifhām contraction ءَآلذَّكَرَيْنِ (plain alif seat)
        (prev.base === LAM && (prev.vowel === "kasra" || prev.vowel === "fatha")) ||
        (prev.base === ALEF && prev.vowel === null);
      if (isArticle) {
        const nl = p.idx + 1 < w.letters.length ? w.letters[p.idx + 1]! : null;
        if (nl !== null) {
          // lafẓ al-jalālah (ٱللَّه): the doubled lām is owned by the jalālah
          // rule, not annotated as shamsiyyah (mushaf convention)
          const isJalalah =
            nl.base === LAM && nl.shadda &&
            p.idx + 2 < w.letters.length && w.letters[p.idx + 2]!.base === HEH;
          if (isJalalah) {
            articleLams.add(l); // still an article lām: not mutaqāribayn
          } else if (SHAMSI_LETTERS.has(nl.base) && nl.shadda) {
            // true article assimilation always writes the shaddah; a sun letter
            // WITHOUT shaddah after ٱلْ is an iftaʿala verb (ٱلْتَقَى), not the
            // definite article
            emit("lam-shamsiyyah", [l.start, nl.end], ch(l), baseCh(nl));
            articleLams.add(l);
          } else if ((QAMARI_LETTERS.has(nl.base) || HAMZA_FAMILY.has(nl.base)) && l.sukun) {
            // the article's qamarī lām carries an explicit sukūn
            emit("lam-qamariyyah", [l.start, l.end], ch(l), baseCh(nl));
            articleLams.add(l);
          }
          // otherwise: not the definite article (verb lām etc.): no emission
        }
      }
    }

    // --- lafẓ al-jalālah ---
    if (
      l.base === LAM && l.shadda &&
      p.idx >= 1 && w.letters[p.idx - 1]!.base === LAM &&
      p.idx + 1 < w.letters.length && w.letters[p.idx + 1]!.base === HEH
    ) {
      // ... لـلّـه: find the governing preceding vowel (may cross words)
      const heh = w.letters[p.idx + 1]!;
      const isFinalHeh = p.idx + 2 === w.letters.length ||
        w.letters.slice(p.idx + 2).every((x) => x.silent !== null || x.base === DAGGER_ALIF ||
          x.base === MEEM /* ٱللَّهُمَّ */ || x.vowel !== null);
      if (isFinalHeh) {
        // governing vowel: the ḥarakah immediately before the jalālah lām.
        // In the ٱللَّه form the preceding bare article-lām and the hamzat
        // waṣl are transparent; in the alif-less لِلَّهِ/وَلِلَّهِ form the
        // preposition lām itself carries the deciding kasrah.
        let gv: "fatha" | "damma" | "kasra" | null = null;
        for (let j = fi - 1; j >= 0; j--) {
          const q = flat[j]!.letter;
          if (j === fi - 1 && q.base === LAM && q.vowel === null && q.tanwin === null && !q.shadda) continue; // bare article lām
          if (q.base === HAMZAT_WASL) continue;
          if (q.vowel !== null) { gv = q.vowel; break; }
          if (q.tanwin !== null) { gv = q.tanwin === "kasr" ? "kasra" : q.tanwin === "damm" ? "damma" : "fatha"; break; }
          if (isPronounced(flat[j]!, verse)) break; // pronounced but vowel-less (sākin): start fresh: tafkhīm
        }
        const rule: RuleId = gv === "kasra" ? "lam-jalalah-tarqiq" : "lam-jalalah-tafkhim";
        emit(rule, [w.letters[p.idx - 1]!.start, heh.end], sliceText(verse, w.letters[p.idx - 1]!.start, heh.end), null);
      }
    }

    // --- ghunnah mushaddadah ---
    if (
      (l.base === MEEM || l.base === NOON) && l.shadda && !idghamTarget.has(l) &&
      // a word-initial shaddah (from cross-verse idghām) is dropped when
      // starting there: recite the single letter, no ghunnah
      !(p.idx === 0 && isUtteranceStart(p.word))
    ) {
      emit("ghunnah-mushaddadah", [l.start, l.end], ch(l), null);
    }

    // --- adjacent-consonant idghām (mithlayn / mutajānisayn / mutaqāribayn) ---
    if (isPronounced(p, verse) && isSakin(l) && !l.shadda && l.tanwin === null && l.silent === null) {
      const np = nextPronounced(fi);
      if (np !== null && !(sakt.has(p.word) && np.word !== p.word)) {
        const a = l.base, b = np.letter.base;
        const range: [number, number] = [l.start, np.letter.end];
        const pair = `${a},${b}`;
        // skip pairs owned by other families
        const nsOwned = a === NOON; // NS family handles all nūn cases
        const mimOwned = a === MEEM;
        const isMaddL = isMaddLetter(w.letters, p.idx);
        if (!nsOwned && !mimOwned && !isMaddL && !articleLams.has(l)) {
          if (a === b) {
            emit("idgham-mithlayn", range, ch(l), baseCh(np.letter));
            idghamConsumed.add(l);
          } else if (MUTAJANIS_PAIRS.has(pair)) {
            emit("idgham-mutajanisayn", range, ch(l), baseCh(np.letter));
            idghamConsumed.add(l);
          } else if (MUTAQARIB_PAIRS.has(pair)) {
            emit("idgham-mutaqaribayn", range, ch(l), baseCh(np.letter));
            idghamConsumed.add(l);
          }
        }
      }
    }
  }

  // ---- qalqalah (after idghām consumption is known) ----
  for (let fi = 0; fi < flat.length; fi++) {
    const p = flat[fi]!;
    const l = p.letter;
    if (muqattaatWords.has(p.word)) continue;
    if (!QALQALAH_LETTERS.has(l.base)) continue;
    if (!isSakin(l) || l.shadda || l.tanwin !== null || l.silent !== null) continue;
    if (idghamConsumed.has(l)) continue; // assimilated away (قَد تَّبَيَّنَ)
    const np = nextPronounced(fi);
    if (np === null) continue; // verse-final = stop context (Phase 2 kubrā)
    emit("qalqalah-sughra", [l.start, l.end], ch(l), null);
  }

  // ---- waqf tails: stop-only rules on each stopped word ----
  /** madd letters whose ṭabīʿī is upgraded to ʿāriḍ at the stop */
  const aridMadds = new Set<Letter>();
  for (const wIdx of stops) {
    const w = verse.words[wIdx];
    if (w === undefined) continue;
    if (muqattaatWords.has(wIdx)) continue; // letter names stop as recited
    const L = w.letters;
    // effective final letter at waqf: skip trailing always-silent letters
    let i = L.length - 1;
    while (i >= 0 && L[i]!.silent === "always") i--;
    if (i < 0) continue;
    const f = L[i]!;

    if (f.silent === "wasl") {
      // أَنَا۠ / قَوَارِيرَا۠: the alif surfaces at the stop: natural madd
      emit("madd-tabii", [f.start, f.end], ch(f), null);
      continue;
    }
    // tanwīn-fatḥ seat (نَارًا، هُدًى): stop replaces the tanwīn with alif
    if (
      (f.base === ALEF || f.base === ALEF_MAKSURA) &&
      f.vowel === null && f.tanwin === null && !f.shadda && !f.sukun &&
      i > 0 && L[i - 1]!.tanwin === "fath"
    ) {
      emit("madd-iwad", [L[i - 1]!.start, f.end], sliceText(verse, L[i - 1]!.start, f.end), null);
      continue;
    }
    // word ends in a madd letter itself (قَالُوا۟، فِى، عَلَىٰ): ṭabīʿī stands
    if (isMaddLetter(L, i)) continue;

    // stopping on a consonant: sukūn ʿāriḍ (or aṣlī if already sākin)
    if (QALQALAH_LETTERS.has(f.base)) {
      emit("qalqalah-kubra", [f.start, f.end], ch(f), null);
    }
    // open-tāʾ rasm (jazariyyah:93–99): the feminine tāʾ written ت (not ة) :
    // stopping keeps the tāʾ sound. The rasm itself selects the sites; the
    // word list guards against ordinary verb tāʾs.
    if (f.base === TEH && isOpenTaWord(w)) {
      emit("waqf-ta-maftuha", [f.start, f.end], ch(f), null);
    }
    // rawm/ishmām options at the stop (jazariyyah:103–104): ḍammah → both;
    // kasrah → rawm only; fatḥah/naṣb → neither
    if (f.vowel === "damma" || f.tanwin === "damm") {
      emit("rawm", [f.start, f.end], ch(f), null);
      emit("ishmam", [f.start, f.end], ch(f), null);
    } else if (f.vowel === "kasra" || f.tanwin === "kasr") {
      emit("rawm", [f.start, f.end], ch(f), null);
    }
    // stopping on rāʾ: the dropped vowel no longer governs: look back
    // (jazariyyah:40 "كذاك بعد الكسر حيث سكنت"): yāʾ sākinah or kasrah before
    // → tarqīq; an intervening sākin istiʿlāʾ letter after kasrah (مِصْر،
    // ٱلْقِطْر) is a transmitted khilāf → flagged tafkhīm; else tafkhīm.
    if (f.base === REH) {
      const b1 = i > 0 ? L[i - 1]! : null;
      const isYaSakin = (x: Letter | null) =>
        x !== null && (x.base === YEH || x.base === ALEF_MAKSURA) &&
        x.vowel === null && x.tanwin === null && !x.shadda;
      if (b1 !== null && (isYaSakin(b1) || b1.vowel === "kasra")) {
        emit("ra-tarqiq", [f.start, f.end], ch(f), null);
      } else if (
        b1 !== null && isSakin(b1) && !isMaddLetter(L, i - 1) &&
        i > 1 && L[i - 2]!.vowel === "kasra"
      ) {
        if (ISTILA_LETTERS.has(b1.base)) {
          emit("ra-tafkhim", [f.start, f.end], ch(f), null, "flagged"); // مِصْر wajhān
        } else {
          emit("ra-tarqiq", [f.start, f.end], ch(f), null);
        }
      } else {
        emit("ra-tafkhim", [f.start, f.end], ch(f), null);
      }
    }
    if (i > 0) {
      const before = L[i - 1]!;
      const bIdx = i - 1;
      // aqwā al-maddayn: if the stronger muttaṣil (hamzah final: ٱلسَّمَآءِ) or
      // lāzim (shaddah final: جَآنٌّ) already governs this madd letter, the
      // ʿāriḍ upgrade does not apply
      const strongerCause = HAMZA_FAMILY.has(f.base) || f.shadda;
      if (isMaddLetter(L, bIdx) && !strongerCause) {
        emit("madd-arid-lissukun", [before.start, f.end], ch(before), baseCh(f));
        aridMadds.add(before);
      } else if (isLinLetter(L, bIdx) && !strongerCause) {
        emit("madd-lin", [before.start, f.end], ch(before), baseCh(f));
      }
    }
  }

  // ---- tafkhīm & tarqīq (jazariyyah:21, 40–42) ----
  for (let fi = 0; fi < flat.length; fi++) {
    const p = flat[fi]!;
    const l = p.letter;
    const w = verse.words[p.word]!;

    // istiʿlāʾ letters are always heavy (jazariyyah:21 خص ضغط قظ)
    if (ISTILA_LETTERS.has(l.base) && l.silent === null) {
      emit("tafkhim-istila", [l.start, l.end], ch(l), null);
    }

    // ض/ظ contact: distinguishing them is obligatory (jazariyyah:59
    // أنقض ظهرك، يعض الظالم). The scan looks through an assimilated article
    // lām (يَعَضُّ ٱلظَّالِمُ: the lām is unpronounced).
    if ((l.base === DAD || l.base === ZAH) && l.silent === null) {
      let np = nextPronounced(fi);
      if (np !== null && np.letter.base === LAM && isSakin(np.letter) && !np.letter.shadda) {
        const nw = verse.words[np.word]!;
        const after = np.idx + 1 < nw.letters.length ? nw.letters[np.idx + 1]! : null;
        if (after !== null && after.shadda) np = { letter: after, word: np.word, idx: np.idx + 1 };
      }
      if (
        np !== null &&
        ((l.base === DAD && np.letter.base === ZAH) || (l.base === ZAH && np.letter.base === DAD))
      ) {
        emit("bayan-dad-zha", [l.start, np.letter.end], ch(l), baseCh(np.letter));
      }
    }

    if (l.base !== REH || l.silent !== null) continue;

    // doubled rāʾ: conceal the trill (jazariyyah:42)
    if (l.shadda) {
      emit("ra-takrir", [l.start, l.end], ch(l), null);
    }

    // rāʾ at the stopped word's final position: waqf ruling (below, tail pass)
    const isStoppedFinal =
      stops.has(p.word) &&
      p.idx === lastPronouncedIdx(w) ;
    if (isStoppedFinal) continue;

    // the imālah rāʾ (11:41 مَجْر۪ىٰهَا) is muraqqaqah
    if (l.ortho.includes(IMALA)) {
      emit("ra-tarqiq", [l.start, l.end], ch(l), null);
      continue;
    }

    const v = l.vowel ?? (l.tanwin === "fath" ? "fatha" : l.tanwin === "damm" ? "damma" : l.tanwin === "kasr" ? "kasra" : null);
    if (v === "fatha" || v === "damma") {
      emit("ra-tafkhim", [l.start, l.end], ch(l), null);
      continue;
    }
    if (v === "kasra") {
      emit("ra-tarqiq", [l.start, l.end], ch(l), null);
      continue;
    }

    // rāʾ sākinah: ruled by the preceding vowel (jazariyyah:40–41)
    const prev = p.idx > 0 ? w.letters[p.idx - 1]! : null;
    if (prev === null) {
      // sākin rāʾ cannot start an utterance; treat defensively as tafkhīm
      emit("ra-tafkhim", [l.start, l.end], ch(l), null, "flagged");
      continue;
    }
    if (prev.base === HAMZAT_WASL) {
      // the kasrah of hamzat al-waṣl is not original (ٱرْجِعُوا) → tafkhīm
      emit("ra-tafkhim", [l.start, l.end], ch(l), null);
      continue;
    }
    if (prev.vowel === "kasra") {
      // original kasrah before sākin rāʾ → tarqīq, unless an unseparated
      // istiʿlāʾ letter follows in the same word (قِرْطَاس); an istiʿlāʾ letter
      // that itself carries kasrah is the transmitted khilāf (فِرْقٍ: jaz:42)
      const next = p.idx + 1 < w.letters.length ? w.letters[p.idx + 1]! : null;
      if (next !== null && ISTILA_LETTERS.has(next.base)) {
        if (next.vowel === "kasra" || next.tanwin === "kasr") {
          emit("ra-tarqiq", [l.start, l.end], ch(l), null, "flagged"); // wajhān
        } else {
          emit("ra-tafkhim", [l.start, l.end], ch(l), null);
        }
      } else {
        emit("ra-tarqiq", [l.start, l.end], ch(l), null);
      }
      continue;
    }
    // preceding fatḥah/ḍammah (or sākin chain resolving there) → tafkhīm
    emit("ra-tafkhim", [l.start, l.end], ch(l), null);
  }

  // ---- madd ----
  annotateMadd(verse, flat, sakt, stops, aridMadds, emit);

  anns.sort((x, y) => x.range[0] - y.range[0] || x.range[1] - y.range[1]);
  return anns;
}

function isSakinOrBare(l: Letter): boolean {
  return isSakin(l);
}

/** The feminine words whose tāʾ the rasm writes open (jazariyyah:93–99):
 *  رحمت نعمت امرأت سنت لعنت معصيت كلمت بقيت قرت فطرت شجرت جنت ابنت.
 *  Matched by base-letter skeleton (hamzah seats normalized), tolerating a
 *  one-letter prefix (وَرَحْمَتُ). */
const OPEN_TA_SKELETONS: readonly string[] = [
  "رحمت", "نعمت", "امرءت", "سنت", "لعنت", "معصيت", "كلمت", "بقيت",
  "قرت", "فطرت", "شجرت", "جنت", "ابنت",
];

function isOpenTaWord(w: Word): boolean {
  const skel = w.letters
    .map((l) => {
      const c = String.fromCodePoint(l.base);
      return HAMZA_FAMILY.has(l.base) ? "ء" : c === "ٱ" ? "ا" : c;
    })
    .join("");
  return OPEN_TA_SKELETONS.some(
    (s) => skel === s || (skel.length === s.length + 1 && skel.endsWith(s))
  );
}

/** Index of the last letter of the word that is pronounced at a stop
 *  (skipping trailing always-silent letters); -1 if none. */
function lastPronouncedIdx(w: Word): number {
  for (let i = w.letters.length - 1; i >= 0; i--) {
    if (w.letters[i]!.silent !== "always") return i;
  }
  return -1;
}

/**
 * The vowel used when starting at a word-initial hamzat waṣl
 * (jazariyyah:100–102): fatḥah for the definite article; kasrah for the seven
 * listed nouns; for verbs, ḍammah if the third letter carries an original
 * ḍammah, else kasrah.
 */
function startWaslVowel(w: Word): { vowel: string; why: string; confidence: "certain" | "flagged" } {
  const L = w.letters;
  const bases = L.map((x) => x.base);
  if (bases[1] === LAM) {
    return { vowel: "fatḥah", why: "the lām of the definite article follows (jazariyyah:101 «غير اللام»)", confidence: "certain" };
  }
  // the seven nouns (jazariyyah:102): ابن ابنة امرئ امرأة اثنين اثنتين اسم
  const NOUNS: number[][] = [
    [BEH, NOON], // ٱبن / ٱبنة
    [MEEM, REH], // ٱمرئ / ٱمرأة (م ر أ / م ر ئ)
    [THEH, NOON], // ٱثنين / ٱثنتين
    [SEEN, MEEM], // ٱسم
  ];
  for (const n of NOUNS) {
    if (bases[1] === n[0] && bases[2] === n[1]) {
      return { vowel: "kasrah", why: "one of the seven listed nouns (jazariyyah:102)", confidence: "certain" };
    }
  }
  // verb: third letter's vowel decides (jazariyyah:100–101). A ḍammah that is
  // not original (ٱقْضُوا۟-type) still takes kasrah: flagged, morphology-level.
  const third = L[2];
  if (third !== undefined && third.vowel === "damma") {
    return { vowel: "ḍammah", why: "the verb's third letter carries ḍammah (jazariyyah:100)", confidence: "flagged" };
  }
  return { vowel: "kasrah", why: "the verb's third letter carries fatḥah/kasrah (jazariyyah:101)", confidence: "certain" };
}

/** Ḥafṣ mutajānisayn pairs (first sākin): ت/ط ط/ت ت/د د/ت ذ/ظ ث/ذ ب/م: tuhfah:32–33, jazariyyah:50. */
const MUTAJANIS_PAIRS: ReadonlySet<string> = new Set([
  `${TEH},${TAH}`, `${TAH},${TEH}`, `${TEH},${DAL}`, `${DAL},${TEH}`,
  `${THAL},${ZAH}`, `${THEH},${THAL}`, `${BEH},${MEEM}`,
]);
/** Ḥafṣ mutaqāribayn pairs: ل/ر ق/ك: tuhfah:31, jazariyyah:45, 49. */
const MUTAQARIB_PAIRS: ReadonlySet<string> = new Set([
  `${LAM},${REH}`, `${QAF},${KAF}`,
]);

// ---------- madd analysis ----------

type Emit = (
  rule: RuleId,
  range: [number, number],
  trigger: string,
  next: string | null,
  confidence?: "certain" | "flagged"
) => void;

function annotateMadd(
  verse: TokenizedVerse,
  flat: Pos[],
  sakt: ReadonlySet<number>,
  stops: ReadonlySet<number>,
  aridMadds: ReadonlySet<Letter>,
  emit: Emit
): void {
  const words = verse.words;
  for (let fi = 0; fi < flat.length; fi++) {
    const p = flat[fi]!;
    const w = words[p.word]!;
    const letters = w.letters;
    const l = p.letter;
    if (!isMaddLetter(letters, p.idx)) continue;
    if (aridMadds.has(l)) continue; // upgraded to madd ʿāriḍ at a stop
    // fawātiḥ words handled separately
    if (letters.every((x) => x.vowel === null && x.tanwin === null && !x.shadda && !x.sukun && x.silent === null)) continue;

    const range: [number, number] = [l.start, l.end];
    const trigger = [...verse.text].slice(l.start, l.end).join("");

    // find the next letter within the word that is phonologically present
    let nextInWord: Letter | null = null;
    for (let j = p.idx + 1; j < letters.length; j++) {
      const x = letters[j]!;
      if (x.silent !== null) continue;
      nextInWord = x;
      break;
    }

    if (nextInWord !== null) {
      const nb = nextInWord.base;
      const hamzaVoweled = nextInWord.vowel !== null || nextInWord.tanwin !== null;
      if (HAMZA_FAMILY.has(nb) && hamzaVoweled) {
        // (a sākin hamzah after a madd letter: فَٱدَّٰرَٰٔتُمْ: does not make
        // muttaṣil; the madd stays ṭabīʿī. ASSUMPTIONS A-008.)
        //
        // Particle contractions: المد المنفصل الحكمي: the vocative يَا
        // (يَٰٓأَيُّهَا، يَٰٓـَٔادَمُ) and deictic هَا (هَٰٓأَنتُمْ، هَٰٓؤُلَآءِ) are
        // written joined to the following hamzah-initial word but are separate
        // words in ruling: the literature names this munfaṣil ḥukmī, and the
        // qirāʾāt confirm it (readers who shorten munfaṣil shorten هؤلاء).
        // Structural test: dagger alif at index 1 after a word-initial ي/ه.
        const isParticle =
          l.base === DAGGER_ALIF && p.idx === 1 &&
          (letters[0]!.base === YEH || letters[0]!.base === HEH);
        if (isParticle) {
          emit("madd-munfasil", [l.start, nextInWord.end], trigger, String.fromCodePoint(nb));
        } else {
          emit("madd-muttasil", [l.start, nextInWord.end], trigger, String.fromCodePoint(nb));
        }
        continue;
      }
      if (HAMZA_FAMILY.has(nb) && !hamzaVoweled) {
        // sākin hamzah after madd (فَٱدَّٰرَٰٔتُمْ): ṭabīʿī (A-008)
        emitTabiiOrBadal(letters, p.idx, range, trigger, emit);
        continue;
      }
      if (nextInWord.shadda) {
        emit("madd-lazim-kalimi-muthaqqal", [l.start, nextInWord.end], trigger, String.fromCodePoint(nb));
        continue;
      }
      if (isSakin(nextInWord) && !isMaddLetter(letters, letters.indexOf(nextInWord))) {
        // original sukūn after madd letter in one word (آلْـَٰٔنَ): rare
        emit("madd-lazim-kalimi-mukhaffaf", [l.start, nextInWord.end], trigger, String.fromCodePoint(nb));
        continue;
      }
      // normal vocalized consonant follows → ṭabīʿī (badal refinement below)
      emitTabiiOrBadal(letters, p.idx, range, trigger, emit);
      continue;
    }

    // word-final madd letter: look at the next word (unless a stop intervenes)
    const nw =
      p.word + 1 < words.length && !stops.has(p.word) ? words[p.word + 1]! : null;
    if (nw === null) {
      // verse-final: continuation mode assumes recitation continues to the
      // next verse; the ʿāriḍ/stop treatment is Phase 2. Emit ṭabīʿī.
      emitTabiiOrBadal(letters, p.idx, range, trigger, emit);
      continue;
    }
    const first = nw.letters[0]!;
    if (first.base === HAMZAT_WASL) {
      // iltiqāʾ al-sākinayn: the madd letter is elided (فِى ٱلْأَرْضِ): no madd
      continue;
    }
    if (HAMZA_FAMILY.has(first.base)) {
      if (sakt.has(p.word)) {
        // sakt between the words blocks the munfaṣil connection
        emitTabiiOrBadal(letters, p.idx, range, trigger, emit);
        continue;
      }
      emit("madd-munfasil", [l.start, first.end], trigger, String.fromCodePoint(first.base));
      continue;
    }
    emitTabiiOrBadal(letters, p.idx, range, trigger, emit);
  }
}

function emitTabiiOrBadal(
  letters: readonly Letter[],
  i: number,
  range: [number, number],
  trigger: string,
  emit: Emit
): void {
  // badal: the madd letter's governing predecessor is a hamzah (آمَنُوا: in
  // Tanzil spelled ءَامَنُوا): tuhfah:46
  let j = i - 1;
  while (j >= 0) {
    const q = letters[j]!;
    const bareSeat =
      (q.base === ALEF || q.base === ALEF_MAKSURA || q.base === WAW) &&
      q.vowel === null && q.tanwin === null && !q.shadda && !q.sukun && q.silent === null;
    if (!bareSeat) break;
    j--;
  }
  const prev = j >= 0 ? letters[j]! : null;
  if (prev !== null && HAMZA_FAMILY.has(prev.base)) {
    emit("madd-badal", range, trigger, null);
  } else {
    emit("madd-tabii", range, trigger, null);
  }
}

// ---------- public API ----------

export function annotate(text: string, opts: AnnotateOptions = {}): Annotation[] {
  return annotateTokens(tokenize(text), opts);
}
