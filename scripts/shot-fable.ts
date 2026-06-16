import { runTest } from "./auth";

runTest("Fable Screenshots", async (helper) => {
  const { page } = helper;
  const url = process.env.APP_URL || "http://localhost:4173";
  
  await page.goto(url);
  await page.waitForTimeout(3000);
  
  // Hero
  await page.screenshot({ path: "tmp/fable-hero.png" });
  console.log("✅ Hero");
  
  // Scroll to bento features
  await page.evaluate(() => window.scrollBy(0, 1200));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tmp/fable-features.png" });
  console.log("✅ Features");
  
  // Keep scrolling to models
  await page.evaluate(() => window.scrollBy(0, 1400));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tmp/fable-models.png" });
  console.log("✅ Models");
  
  // Code section
  await page.evaluate(() => window.scrollBy(0, 1200));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tmp/fable-code.png" });
  console.log("✅ Code");
  
  // Pricing
  await page.evaluate(() => window.scrollBy(0, 2000));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tmp/fable-pricing.png" });
  console.log("✅ Pricing");
  
  // Footer/CTA
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tmp/fable-cta.png" });
  console.log("✅ CTA");
  
}).catch((e) => { console.error(e); process.exit(1); });
