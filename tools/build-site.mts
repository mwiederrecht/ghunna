/**
 * Assemble the documentation site: page bodies + one shared shell (rail, css).
 *
 *   npx tsx tools/build-site.mts     -> site/public/*.html
 *
 * Hand-written bodies live in site/pages/<name>.html and begin with:
 *   <!-- title: Getting started | nav: start -->
 * Three pages are generated here so they cannot drift from the code:
 *   /rules    from RULE_META and the poem transcriptions
 *   /sources  from docs/sources/*.md
 *   /api      from the declaration files the package ships (dist/*.d.ts)
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { RULE_META } from "../src/rules/meta.js";
import type { RuleId } from "../src/annotation.js";

const OUT = "site/public";
const PAGES = "site/pages";
mkdirSync(OUT, { recursive: true });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- poems ----
function poemLines(path: string): Map<number, string> {
  const out = new Map<number, string>();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^(\d+)\. (.+)$/);
    if (m) out.set(Number(m[1]), m[2].replace(/\s*\*\*\*\s*/, " ۞ "));
  }
  return out;
}
const POEMS = {
  tuhfah: { name: "Tuḥfat al-Aṭfāl", lines: poemLines("docs/sources/tuhfah.md") },
  jazariyyah: { name: "al-Muqaddimah al-Jazariyyah", lines: poemLines("docs/sources/jazariyyah.md") },
};

// ---- /rules : the catalog, generated from RULE_META ----
const GROUPS: Array<[string, string, RuleId[]]> = [
  ["Nūn sākinah and tanwīn", "The nūn sākinah family of Tuḥfat al-Aṭfāl: what happens to an unvoweled nūn, or to tanwīn, before each class of following letter.",
    ["izhar-halqi", "idgham-bighunnah", "izhar-mutlaq", "idgham-bila-ghunnah", "iqlab", "ikhfa-haqiqi"]],
  ["Ghunnah", "", ["ghunnah-mushaddadah"]],
  ["Mīm sākinah", "", ["ikhfa-shafawi", "idgham-shafawi", "izhar-shafawi"]],
  ["The lām rules", "The definite article before moon and sun letters, and the lām of the divine name.",
    ["lam-qamariyyah", "lam-shamsiyyah", "lam-jalalah-tafkhim", "lam-jalalah-tarqiq"]],
  ["Tafkhīm and tarqīq", "The heaviness rules: the seven istiʿlāʾ letters, and the contextual rules of the rāʾ. These are printed in the Dar al-Maarifah tajweed muṣḥaf as a separate (blue) color class that the digital datasets never carried; this library is, to our knowledge, their first digital derivation.",
    ["tafkhim-istila", "ra-tafkhim", "ra-tarqiq", "ra-takrir"]],
  ["Articulation care", "", ["bayan-dad-zha"]],
  ["Adjacent-consonant idghām", "Assimilation between neighboring consonants outside the nūn and mīm families.",
    ["idgham-mithlayn", "idgham-mutajanisayn", "idgham-mutaqaribayn"]],
  ["Qalqalah", "", ["qalqalah-sughra", "qalqalah-kubra"]],
  ["The madd family", "All madd classes, with the aqwā al-maddayn precedence rule applied when two causes compete for one madd letter.",
    ["madd-tabii", "madd-badal", "madd-muttasil", "madd-munfasil", "madd-arid-lissukun", "madd-lin",
     "madd-lazim-kalimi-muthaqqal", "madd-lazim-kalimi-mukhaffaf", "madd-lazim-harfi-muthaqqal", "madd-lazim-harfi-mukhaffaf", "madd-iwad"]],
  ["Stopping options and structure", "Transmitted performance options at a stop, and the structural categories of the written text.",
    ["rawm", "ishmam", "waqf-ta-maftuha", "hamzat-wasl", "silent", "sakt"]],
];
{
  const covered = new Set(GROUPS.flatMap(([, , ids]) => ids));
  const all = Object.keys(RULE_META);
  const missing = all.filter((r) => !covered.has(r as RuleId));
  if (missing.length) throw new Error(`rules page missing: ${missing.join(", ")}`);
  if (covered.size !== all.length) throw new Error("rules page lists unknown rules");
}
function ruleCard(id: RuleId): string {
  const m = RULE_META[id];
  const src = POEMS[m.citation.text as keyof typeof POEMS];
  const couplets = m.citation.lines
    .map((n) => {
      const t = src.lines.get(n);
      return t ? `<div class="couplet">${esc(t)} <span class="ln">${n}</span></div>` : "";
    })
    .join("");
  return `<div class="rulecard" id="${id}">
  <div class="rn"><span class="ar">${esc(m.name.arabic)}</span><span class="id">${id}</span>${m.waqfDependent ? '<span class="badge">waqf-dependent</span>' : ""}</div>
  <div class="tr">${esc(m.name.transliteration)} · ${esc(m.name.english)}</div>
  <div class="why">${esc(m.derivation)}</div>
  <div class="why ar">${esc(m.derivationAr)}</div>
  <div class="cite">${src.name} ${m.citation.lines.join(", ")}</div>
  ${couplets}
</div>`;
}
{
  const count = Object.keys(RULE_META).length;
  let body = `<!-- title: Rule catalog | nav: rules -->
<section style="padding-bottom: 8px">
  <p class="label">Rule catalog <span class="n">${count}</span></p>
  <h1>Every rule, with its line.</h1>
  <p class="lede">This page is generated from <code>RULE_META</code>, the table the package
  ships, so the catalog and the code agree by construction.</p>
  <p>Each entry gives the canonical Arabic name, transliteration and English gloss, the
  derivation template in English and Arabic, the citation into the source poem, and the
  cited couplets verbatim. In the templates, <code>{t}</code> is replaced with the trigger
  letters and <code>{n}</code> with the following letter at annotation time. Entries marked
  <i>waqf-dependent</i> change with the recitation mode described in
  <a href="/waqf">the waqf model</a>.</p>
</section>
`;
  for (const [title, note, ids] of GROUPS) {
    body += `<section id="${title.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}">
  <h2>${title}</h2>
  ${note ? `<p>${note}</p>` : ""}
  ${ids.map(ruleCard).join("\n")}
</section>\n`;
  }
  writeFileSync(join(PAGES, "rules.html"), body);
}

// ---- /sources : the two poems in full ----
{
  const meta = {
    tuhfah: {
      heading: "Tuḥfat al-Aṭfāl",
      about:
        "By Sulaymān al-Jamzūrī (1198 AH). The standard introductory poem on the rules of nūn sākinah and tanwīn, mīm sākinah, ghunnah, the lām rules, adjacent-consonant idghām, and the madd family. Text from Arabic Wikisource (CC BY-SA), fetched 2026-07-11. The line numbers below are the citation targets used throughout the library.",
    },
    jazariyyah: {
      heading: "al-Muqaddimah al-Jazariyyah",
      about:
        "By Ibn al-Jazarī (d. 833 AH), the central reference poem of tajweed: articulation points and attributes of the letters, tafkhīm and tarqīq, the rāʾ rules, ḍād and ẓāʾ, the kinds of stop, and the rules of the connective hamzah. Text from Arabic Wikisource (CC BY-SA), fetched 2026-07-11.",
    },
  };
  let body = `<!-- title: The sources | nav: sources -->
<section style="padding-bottom: 8px">
  <p class="label">The sources</p>
  <h1>The two poems, in full.</h1>
  <p class="lede">Every rule the library emits cites one of these two texts, to the line.
  The transcriptions below are the library's canonical citation targets.</p>
  <p>Hemistichs are separated by ۞. The transcriptions are also shipped in the repository
  under <code>docs/sources/</code>, and the rule catalog quotes the relevant couplets
  beside each rule.</p>
</section>
`;
  for (const key of ["tuhfah", "jazariyyah"] as const) {
    const m = meta[key];
    body += `<section id="${key}">
  <h2>${m.heading}</h2>
  <p>${m.about}</p>
  ${[...POEMS[key].lines.entries()].map(([n, t]) => `<div class="couplet">${esc(t)} <span class="ln">${n}</span></div>`).join("\n  ")}
</section>\n`;
  }
  writeFileSync(join(PAGES, "sources.html"), body);
}

// ---- /api : from the declaration files the package ships ----
{
  const index = readFileSync("dist/index.d.ts", "utf8");
  const core = readFileSync("dist/core.d.ts", "utf8");
  const body = `<!-- title: API reference | nav: api -->
<section style="padding-bottom: 8px">
  <p class="label">API reference</p>
  <h1>The interface, verbatim.</h1>
  <p class="lede">The two blocks below are the declaration files the npm package ships,
  reproduced without editing. The reference cannot drift from the code because it is the
  code's own type declaration.</p>
  <p>For a guided introduction, read <a href="/start">getting started</a>. For the meaning
  of each rule identifier, see <a href="/rules">the rule catalog</a>.</p>
</section>
<section id="entry-full">
  <h2>The full entry: <code>ghunna</code></h2>
  <p>Includes the bundled Qurʾān text (Tanzil Uthmani, carried intact). Adds
  <code>annotateVerse</code> and <code>getVerseText</code> on top of everything in the
  core entry.</p>
  <pre><code>${esc(index.trim())}</code></pre>
</section>
<section id="entry-core">
  <h2>The corpus-free entry: <code>ghunna/core</code></h2>
  <p>The engine, tokenizer, rule table, letter profiles and riwāyah parameters, without
  the embedded text. Use <code>annotate(text)</code> with your own Tanzil-Uthmani-encoded
  input.</p>
  <pre><code>${esc(core.trim())}</code></pre>
</section>`;
  writeFileSync(join(PAGES, "api.html"), body);
}

// ---- the shell ----
const css = readFileSync("site/assets/site.css", "utf8");

const NAV: Array<[string, Array<[string, string, string]>]> = [
  ["The library", [
    ["index", "Overview", "/"],
    ["start", "Getting started", "/start"],
    ["api", "API reference", "/api"],
    ["architecture", "Architecture", "/architecture"],
  ]],
  ["The rules", [
    ["rules", "Rule catalog", "/rules"],
    ["waqf", "The waqf model", "/waqf"],
    ["sources", "The sources", "/sources"],
  ]],
  ["Verification", [
    ["verification", "Method and results", "/verification"],
    ["residue", "The residue", "/residue"],
    ["assumptions", "Assumptions", "/assumptions"],
  ]],
];

const rail = (current: string) => `
<aside class="rail">
  <a class="wordmark" href="/">ghunna<span class="dot" aria-hidden="true"></span></a>
  <div class="tag">the tajweed library</div>
  <nav>
  ${NAV.map(([group, items]) => `<h5>${group}</h5>
  ${items.map(([id, label, href]) =>
    `<a class="nav" href="${href}"${id === current ? ' aria-current="page"' : ""}>${label}</a>`).join("\n  ")}`).join("\n  ")}
  </nav>
  <div class="foot">
    <a href="https://github.com/mwiederrecht/ghunna">GitHub</a>
    <a href="https://www.npmjs.com/package/ghunna">npm</a>
    <a href="https://melissawiederrecht.com">Melissa Wiederrecht</a>
  </div>
</aside>`;

const shell = (title: string, current: string, body: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · ghunna</title>
<meta name="description" content="ghunna, the tajweed library: a derivation engine for classical tajweed. Vocalized Uthmani text in, rule annotations out, every span cited to the line of Tuhfat al-Atfal or al-Muqaddimah al-Jazariyyah.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='34' fill='%2314684f'/></svg>">
<style>${css}</style>
</head>
<body>
${rail(current)}
<main><div class="content">
${body}
<footer class="page-foot">
  <div class="rule-acc"></div>
  <p style="max-width:none"><b>ghunna</b> (<span class="ar">غُنّة</span>): the nasal resonance
  of tajweed; the library is named for it. MIT license. Qurʾān text: Tanzil (carried intact,
  with attribution). Every rule cites its line.</p>
</footer>
</div></main>
</body>
</html>`;

let n = 0;
for (const f of readdirSync(PAGES).filter((f) => f.endsWith(".html"))) {
  const src = readFileSync(join(PAGES, f), "utf8");
  const head = src.match(/<!--\s*title:\s*(.+?)\s*\|\s*nav:\s*(\S+)\s*-->/);
  if (!head) { console.warn(`skip ${f}: no title/nav header`); continue; }
  const body = src.slice(src.indexOf("-->") + 3).trim();
  writeFileSync(join(OUT, basename(f, ".html") + ".html"), shell(head[1], head[2], body));
  n++;
}
console.log(`${n} pages built into ${OUT}`);
