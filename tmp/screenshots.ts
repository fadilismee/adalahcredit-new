import { type ChildProcess, spawn } from "node:child_process";
import { resolve } from "node:path";
import { chromium } from "playwright";

const PREVIEW_URL = "http://localhost:4174";

function startServer(): ChildProcess {
  // Use a simple bun serve to host the dist directory
  const server = spawn("bun", ["-e", `Bun.serve({port:4174,static:true,fetch(req){const url=new URL(req.url);let p="dist"+url.pathname;if(!p.includes(".")||!Bun.file(p).size)p="dist/index.html";return new Response(Bun.file(p))}})`], {
    cwd: resolve("."),
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });
  server.stdout?.on("data", () => {});
  server.stderr?.on("data", () => {});
  return server;
}

async function waitForServer(url: string, maxWait: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 304) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  console.log("🚀 Starting server...");
  const server = startServer();

  try {
    const ready = await waitForServer(PREVIEW_URL, 15000);
    if (!ready) { console.error("❌ Server failed to start"); process.exit(1); }
    console.log("✅ Server ready");

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    
    await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    
    // Hero
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "tmp/v2-hero.png" });
    console.log("📸 Hero");

    // Code preview + stats
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "tmp/v2-code.png" });
    console.log("📸 Code");

    // Models
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "tmp/v2-models.png" });
    console.log("📸 Models");

    // One API
    await page.evaluate(() => window.scrollTo(0, 2600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "tmp/v2-oneapi.png" });
    console.log("📸 One API");

    // Features
    await page.evaluate(() => window.scrollTo(0, 4000));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "tmp/v2-features.png" });
    console.log("📸 Features");

    // FAQ
    await page.evaluate(() => window.scrollTo(0, 5500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "tmp/v2-faq.png" });
    console.log("📸 FAQ");

    // Footer
    await page.evaluate(() => window.scrollTo(0, 99999));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "tmp/v2-footer.png" });
    console.log("📸 Footer");
    
    await browser.close();
    console.log("✅ Done!");
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => { console.error(err); process.exit(1); });
