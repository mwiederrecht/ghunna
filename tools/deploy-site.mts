/**
 * Build and deploy the documentation site to ghunna.com.
 *
 *   npx tsx tools/deploy-site.mts               build + gate + deploy + verify
 *   npx tsx tools/deploy-site.mts --build-only  build + gate, no deploy
 *
 * Cloudflare Pages project: ghunna. First run creates the project, attaches
 * the custom domain, and writes the CNAME in the melissawiederrecht.com zone.
 * Token: C:/Development/.cf_token_big_useful.txt (account-wide)
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const TOKEN_PATH = "C:/Development/.cf_token_big_useful.txt";
const ACCOUNT = "23c4ed86016680e63c6c038a14a9806b";
const PROJECT = "ghunna";
const DOMAIN = "ghunna.com";
const ZONE_NAME = "ghunna.com";
const BASE = `https://${DOMAIN}`;

execSync("npx tsx tools/build-site.mts", { stdio: "inherit" });

// the em-dash gate: no em dashes anywhere a visitor can read
{
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!/\.(html|css|js|svg)$/.test(f)) continue;
      const text = readFileSync(full, "utf8");
      let i = text.indexOf("—");
      while (i !== -1) {
        offenders.push(`${full}: ...${text.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, " ")}...`);
        i = text.indexOf("—", i + 1);
      }
    }
  };
  walk("site/public");
  if (offenders.length) {
    console.error(`EM-DASH GATE: ${offenders.length} found, deploy refused:`);
    for (const o of offenders.slice(0, 20)) console.error("  " + o);
    process.exit(1);
  }
  console.log("em-dash gate: clean");
}

if (process.argv.includes("--build-only")) process.exit(0);

if (!existsSync(TOKEN_PATH)) { console.error(`No Cloudflare token at ${TOKEN_PATH}`); process.exit(1); }
const TOKEN = readFileSync(TOKEN_PATH, "utf8").trim();
const env = { ...process.env, CLOUDFLARE_API_TOKEN: TOKEN, CLOUDFLARE_ACCOUNT_ID: ACCOUNT };
const api = async (path: string, init?: RequestInit) => {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  });
  return res.json() as Promise<{ success: boolean; result: any; errors: Array<{ code: number; message: string }> }>;
};

// project (idempotent)
{
  const got = await api(`/accounts/${ACCOUNT}/pages/projects/${PROJECT}`);
  if (!got.success) {
    const made = await api(`/accounts/${ACCOUNT}/pages/projects`, {
      method: "POST",
      body: JSON.stringify({ name: PROJECT, production_branch: "main" }),
    });
    if (!made.success) throw new Error(`project create failed: ${JSON.stringify(made.errors)}`);
    console.log("pages project created");
  }
}

execSync(`npx wrangler pages deploy site/public --project-name ${PROJECT} --branch main --commit-dirty=true`, {
  stdio: "inherit", env,
});

// custom domain + CNAME (idempotent)
{
  const domains = await api(`/accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains`);
  if (!domains.result?.some((d: any) => d.name === DOMAIN)) {
    const added = await api(`/accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains`, {
      method: "POST", body: JSON.stringify({ name: DOMAIN }),
    });
    if (!added.success) throw new Error(`domain attach failed: ${JSON.stringify(added.errors)}`);
    console.log("custom domain attached");
  }
  const zones = await api(`/zones?name=${ZONE_NAME}`);
  const zone = zones.result?.[0]?.id;
  if (!zone) throw new Error("zone not found with this token");
  const recs = await api(`/zones/${zone}/dns_records?type=CNAME&name=${DOMAIN}`);
  if (!recs.result?.length) {
    const rec = await api(`/zones/${zone}/dns_records`, {
      method: "POST",
      body: JSON.stringify({ type: "CNAME", name: "@", content: `${PROJECT}.pages.dev`, proxied: true }),
    });
    // 81062: the Pages domain attach already manages DNS for this host
    if (!rec.success && !rec.errors?.some((e) => e.code === 81062)) {
      throw new Error(`CNAME create failed: ${JSON.stringify(rec.errors)}`);
    }
    console.log(rec.success ? "CNAME created" : "DNS already managed by the Pages domain");
  }
}

// verify the live custom domain, with warm-up retries
const checks = ["/", "/start", "/api", "/architecture", "/rules", "/waqf", "/sources", "/verification", "/residue", "/assumptions"];
let failed = 0;
for (const path of checks) {
  let ok = false, status = 0;
  for (let attempt = 0; attempt < 6 && !ok; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 5000 * attempt));
    try {
      const res = await fetch(BASE + path, { cache: "no-store", redirect: "follow" });
      status = res.status;
      ok = res.ok && (res.headers.get("content-type") ?? "").includes("text/html");
    } catch { /* DNS may lag on first deploy */ }
  }
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${path}  ${status}`);
}
if (failed) { console.error(`${failed} live check(s) failed`); process.exit(1); }
console.log(`\n${BASE} live`);
