/**
 * Waqf-mark data of the Ḥafṣ muṣḥaf (jazariyyah:72–77 on the kinds of stops).
 *
 * The marks are structural guidance printed in the muṣḥaf — they mark where
 * stopping is required/preferred/permitted/disliked. They feed the stop model
 * (`stopAt`) but are never used for rule derivation.
 */
import { WAQF_MARKS } from "./waqf-marks-data.js";

export type WaqfMarkKind =
  | "lazim" // ۘ  stop required
  | "preferred-stop" // ۗ  stopping preferred (qalā)
  | "permitted" // ۚ  stopping permitted (jīm)
  | "preferred-continue" // ۖ  continuing preferred (ṣalā)
  | "forbidden" // ۙ  do not stop (lā)
  | "muanaqah" // ۛ  stop at one of the pair, not both
  | "sakt" // ۜ  breathless pause (transmitted sites)
  | "sajdah"; // ۩  prostration sign

export interface WaqfMark {
  /** The mark occurs after this word index (0-based) of the verse. */
  afterWord: number;
  mark: string;
  kind: WaqfMarkKind;
  description: string;
}

const KINDS: Record<string, [WaqfMarkKind, string]> = {
  "ۘ": ["lazim", "stop required (mīm — waqf lāzim)"],
  "ۗ": ["preferred-stop", "stopping preferred (qalā)"],
  "ۚ": ["permitted", "stopping permitted (jīm)"],
  "ۖ": ["preferred-continue", "continuing preferred (ṣalā)"],
  "ۙ": ["forbidden", "do not stop (lā)"],
  "ۛ": ["muanaqah", "muʿānaqah pair — stop at one of the two, not both"],
  "ۜ": ["sakt", "sakt — brief breathless pause"],
  "۩": ["sajdah", "prostration (sajdah) sign"],
};

/** The waqf/sajdah marks of a verse (empty array if none). */
export function getWaqfMarks(surah: number, ayah: number): WaqfMark[] {
  const raw = WAQF_MARKS[`${surah}|${ayah}`] ?? [];
  return raw.map(([afterWord, mark]) => {
    const k = KINDS[mark];
    if (k === undefined) throw new Error(`unknown waqf mark ${mark}`);
    return { afterWord, mark, kind: k[0], description: k[1] };
  });
}
