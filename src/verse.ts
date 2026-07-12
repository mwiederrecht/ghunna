/**
 * Verse-level API: ask for a verse, get its tajweed rules.
 *
 * Bundles the canonical corpus (Tanzil Uthmani — see corpus-data.ts header for
 * attribution) and the Ḥafṣ/Shāṭibiyyah riwāyah data (sakt sites), so
 * `annotateVerse(2, 255)` needs no configuration.
 */
import type { Annotation } from "./annotation.js";
import { CORPUS_LINES } from "./corpus-data.js";
import { annotate, type AnnotateOptions } from "./engine.js";
import { HAFS_SHATIBIYYAH, type RiwayahParams } from "./riwayah.js";

let corpus: Map<string, string> | null = null;

function loadCorpus(): Map<string, string> {
  if (corpus !== null) return corpus;
  corpus = new Map();
  for (const line of CORPUS_LINES.split("\n")) {
    const sep1 = line.indexOf("|");
    const sep2 = line.indexOf("|", sep1 + 1);
    corpus.set(line.slice(0, sep2), line.slice(sep2 + 1));
  }
  if (corpus.size !== 6236) throw new Error(`corpus corrupt: ${corpus.size} verses`);
  return corpus;
}

export interface VerseAnnotationResult {
  surah: number;
  ayah: number;
  /** The verse text the ranges index into (codepoints). */
  text: string;
  annotations: Annotation[];
  riwayah: string;
}

export interface AnnotateVerseOptions {
  riwayah?: RiwayahParams; // default Ḥafṣ/Shāṭibiyyah
  /** "continue" (default): flow into the next verse. "stop": waqf at verse
   *  end. "both": union with appliesIn labels. */
  mode?: "continue" | "stop" | "both";
  /** Stop after this word index (recitation-tutor use). */
  stopAt?: number;
  /** Treat the verse start as an utterance start (fresh recitation). */
  startFresh?: boolean;
}

/** Number of ayat per surah (1-indexed surah). */
export function getVerseText(surah: number, ayah: number): string {
  const text = loadCorpus().get(`${surah}|${ayah}`);
  if (text === undefined) {
    throw new RangeError(`No such verse: ${surah}:${ayah}`);
  }
  return text;
}

/**
 * Annotate one verse of the Qur'an (Ḥafṣ ʿan ʿĀṣim, ṭarīq al-Shāṭibiyyah).
 * Continuation (waṣl) mode — waqf modes arrive with the Phase 2 stop model.
 */
export function annotateVerse(
  surah: number,
  ayah: number,
  opts: AnnotateVerseOptions = {}
): VerseAnnotationResult {
  const riwayah = opts.riwayah ?? HAFS_SHATIBIYYAH;
  const text = getVerseText(surah, ayah);
  const engineOpts: AnnotateOptions = {
    saktAfterWord: riwayah.saktSites
      .filter((s) => s.surah === surah && s.ayah === ayah)
      .map((s) => s.afterWord),
    ...(opts.mode !== undefined ? { mode: opts.mode } : {}),
    ...(opts.stopAt !== undefined ? { stopAt: opts.stopAt } : {}),
    ...(opts.startFresh !== undefined ? { startFresh: opts.startFresh } : {}),
  };
  return {
    surah,
    ayah,
    text,
    annotations: annotate(text, engineOpts),
    riwayah: riwayah.id,
  };
}
