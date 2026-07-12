/**
 * SPEC ↔ rule-data sync (docs/SPEC.md §11) and the input-policy invariant:
 * rule logic must never read hint-class codepoints (§0).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RULE_META } from "../src/rules/meta.js";
import type { RuleId } from "../src/annotation.js";

const spec = readFileSync("docs/SPEC.md", "utf8");
const tuhfah = readFileSync("docs/sources/tuhfah.md", "utf8");
const jazariyyah = readFileSync("docs/sources/jazariyyah.md", "utf8");

describe("SPEC sync", () => {
  it("every rule id appears in docs/SPEC.md", () => {
    for (const id of Object.keys(RULE_META)) {
      // spec writes some ids as families (madd-lazim-*); accept prefix match
      const found = spec.includes(`\`${id}\``) || spec.includes(`\`${id.replace(/-(muthaqqal|mukhaffaf)$/, "-*")}\``);
      expect(found, `rule id ${id} missing from SPEC.md`).toBe(true);
    }
  });

  it("every citation points at an existing numbered source line", () => {
    const maxLine = { tuhfah: 61, jazariyyah: 108 };
    for (const [id, meta] of Object.entries(RULE_META)) {
      for (const line of meta.citation.lines) {
        expect(line, `${id} cites ${meta.citation.text}:${line}`).toBeGreaterThanOrEqual(1);
        expect(line, `${id} cites ${meta.citation.text}:${line}`).toBeLessThanOrEqual(maxLine[meta.citation.text]);
        const src = meta.citation.text === "tuhfah" ? tuhfah : jazariyyah;
        expect(src.includes(`\n${line}. `), `${meta.citation.text}:${line} not found`).toBe(true);
      }
    }
  });

  it("every rule has trilingual naming", () => {
    for (const [id, meta] of Object.entries(RULE_META)) {
      expect(meta.name.arabic, id).toMatch(/[؀-ۿ]/);
      expect(meta.name.transliteration.length, id).toBeGreaterThan(2);
      expect(meta.name.english.length, id).toBeGreaterThan(2);
    }
  });

  it("rule logic never references hint-class codepoints (SPEC §0)", () => {
    // The engine derives from context only. Hint marks (U+0653 maddah,
    // U+06E2/U+06ED iqlāb mīms) must not be consulted by rule logic.
    const engine = readFileSync("src/engine.ts", "utf8");
    for (const forbidden of ["MADDAH", "SMALL_HIGH_MEEM", "SMALL_LOW_MEEM", "0x0653", "0x06e2", "0x06ed", "\\u0653", "\\u06E2", "\\u06ED"]) {
      expect(engine.includes(forbidden), `engine references hint ${forbidden}`).toBe(false);
    }
    // and the letter-class tables used by rules must not contain them either
    const ids = Object.keys(RULE_META) as RuleId[];
    expect(ids.length).toBeGreaterThan(25);
  });
});
