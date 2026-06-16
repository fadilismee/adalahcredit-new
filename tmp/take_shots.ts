import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = 4175;
const URL = `http://localhost:${PORT}`;

async function main() {
  console.log("🚀 Starting server...");
  
  const server = Bun.spawn(["bun", "-e", `Bun.serve({port:${PORT},fetch(req){const u=new URL(req.url);let p='dist'+u.pathname;if(!p.match(/\\.[a-z]+$/i))p='dist/index.html';return new Response(Bun.file(p))}})`], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });

  // Wait for server
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(URL);
      if (r.ok) break;
    } catch {}
    await Bun.sleep(500);
  }
  
  console.log("✅ Server ready");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  
  const shots = [
    { y: 0, name: "v2-hero" },
    { y: 750, name: "v2-code" },
    { y: 1600, name: "v2-models" },
    { y: 2600, name: "v2-oneapi" },
    { y: 4000, name: "v2-features" },
    { y: 5500, name: "v2-faq" },
    { y: 99999, name: "v2-footer" },
  ];

  for (const s of shots) {
    await page.evaluate((y: number) => window.scrollTo(0, y), s.y);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `tmp/${s.name}.png` });
    console.log(`📸 ${s.name}`);
  }

  await browser.close();
  server.kill();
  console.log("✅ Done!");
}

main().catch(e => { console.error(e); process.exit(1); });
