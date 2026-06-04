/**
 * Capture README screenshots from the running AI-CIMO stack.
 *
 * Run via:
 *   docker run --rm --network host \
 *     -v $(pwd):/work -w /work \
 *     mcr.microsoft.com/playwright:v1.49.0-noble \
 *     node scripts/capture-screenshots.mjs
 *
 * Saves 5 PNGs into docs/images/.
 */
import { chromium } from "playwright";

const HOST = process.env.AI_CIMO_HOST || "http://localhost:5180";
const API = process.env.AI_CIMO_API || "${API}";
const VIEWPORT = { width: 1440, height: 900 };
const OUT = "docs/images";

const pages = [
  // fullPage:false → first viewport only (keeps the README screenshot tidy
  // when the table would otherwise scroll for hundreds of rows).
  { name: "landing",   path: "/",            wait: 1200, fullPage: true  },
  { name: "dashboard", path: "/dashboard",   wait: 3000, fullPage: true  },
  { name: "services",  path: "/services",    wait: 2000, fullPage: true  },
  { name: "logs",      path: "/logs",        wait: 2500, fullPage: false },
  { name: "incidents", path: "/incidents",   wait: 2000, fullPage: true  },
];

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2, // retina for crisp text
    colorScheme: "dark",
  });

  // Sign in once via the API and prime localStorage so React Router lets us in.
  const loginRes = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@aicimo.io", password: "demo1234" }),
  });
  const { access_token } = await loginRes.json();
  if (!access_token) throw new Error("login failed");
  const meRes = await fetch(`${API}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const me = await meRes.json();
  console.log("logged in as", me.email, "role =", me.role);

  await ctx.addInitScript(
    ({ token, user }) => {
      try {
        localStorage.setItem("ai_cimo_token", token);
        localStorage.setItem("ai_cimo_user", JSON.stringify(user));
      } catch {}
    },
    { token: access_token, user: me },
  );

  // Frontend hardcodes the API at http://localhost:8050 (host machine). Inside this
  // Playwright container, `localhost` would resolve to the container itself, so
  // we fetch ourselves and fulfill the response.
  await ctx.route(/localhost:8050/, async (route) => {
    const req = route.request();
    const newUrl = req
      .url()
      .replace("://localhost:8050/", "://host.docker.internal:8050/");
    try {
      const res = await fetch(newUrl, {
        method: req.method(),
        headers: req.headers(),
        body: ["GET", "HEAD"].includes(req.method())
          ? undefined
          : req.postData() ?? undefined,
      });
      const body = Buffer.from(await res.arrayBuffer());
      const headers = {};
      res.headers.forEach((v, k) => (headers[k] = v));
      await route.fulfill({ status: res.status, headers, body });
    } catch (e) {
      console.error("  route proxy failed:", newUrl, e.message);
      await route.abort();
    }
  });

  const page = await ctx.newPage();
  page.on("requestfailed", (r) =>
    console.warn("  request failed:", r.url(), r.failure()?.errorText),
  );

  for (const p of pages) {
    const url = HOST + p.path;
    console.log(`→ ${p.name.padEnd(10)} ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(p.wait); // let animations/sparklines settle
    const file = `${OUT}/${p.name}.png`;
    await page.screenshot({ path: file, fullPage: p.fullPage });
    console.log(`  saved ${file}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
