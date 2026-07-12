/** Public annotation types (API sketch in README / project brief). */

export type RuleId =
  // nūn sākinah & tanwīn family
  | "izhar-halqi"
  | "idgham-bighunnah"
  | "izhar-mutlaq"
  | "idgham-bila-ghunnah"
  | "iqlab"
  | "ikhfa-haqiqi"
  // ghunnah
  | "ghunnah-mushaddadah"
  // mīm sākinah family
  | "ikhfa-shafawi"
  | "idgham-shafawi"
  | "izhar-shafawi"
  // lām rules
  | "lam-qamariyyah"
  | "lam-shamsiyyah"
  | "lam-jalalah-tafkhim"
  | "lam-jalalah-tarqiq"
  // tafkhīm & tarqīq
  | "tafkhim-istila"
  | "ra-tafkhim"
  | "ra-tarqiq"
  | "ra-takrir"
  // articulation care
  | "bayan-dad-zha"
  // waqf performance options
  | "rawm"
  | "ishmam"
  | "waqf-ta-maftuha"
  // adjacent-consonant idghām
  | "idgham-mithlayn"
  | "idgham-mutajanisayn"
  | "idgham-mutaqaribayn"
  // qalqalah
  | "qalqalah-sughra"
  | "qalqalah-kubra"
  // madd
  | "madd-tabii"
  | "madd-badal"
  | "madd-muttasil"
  | "madd-munfasil"
  | "madd-arid-lissukun"
  | "madd-lin"
  | "madd-lazim-kalimi-muthaqqal"
  | "madd-lazim-kalimi-mukhaffaf"
  | "madd-lazim-harfi-muthaqqal"
  | "madd-lazim-harfi-mukhaffaf"
  | "madd-iwad"
  // structural
  | "hamzat-wasl"
  | "silent"
  | "sakt";

export interface SourceRef {
  /** Which classical text — citation targets in docs/sources/. */
  text: "tuhfah" | "jazariyyah";
  /** Line number(s) in the numbered source file. */
  lines: number[];
}

export interface RuleName {
  arabic: string;
  transliteration: string;
  english: string;
}

export interface Annotation {
  rule: RuleId;
  /** Canonical rule name: Arabic, transliteration, English. */
  name: RuleName;
  /** Codepoint range [start, end) into the annotated verse text. */
  range: [start: number, end: number];
  trigger: {
    /** The exact triggering characters, as written. */
    letters: string;
    description: string;
  };
  /** Human-readable why: "nūn sākinah followed by ب → iqlāb". */
  derivation: string;
  citation: SourceRef;
  waqfDependent: boolean;
  confidence: "certain" | "flagged";
  /** In 'both' mode: which recitation mode this annotation belongs to.
   *  Absent = applies in both waṣl and waqf. */
  appliesIn?: "wasl" | "waqf";
}
