import { runTest } from "./auth";

runTest("Landing Page Screenshots", async (helper) => {
  const { page } = helper;
  
  // Go to landing page (public route)
  await page.goto(helper.appUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  
  // Full hero screenshot
  await page.screenshot({ path: "tmp/fable-hero.png", fullPage: false });
  console.log("✅ Hero screenshot taken");
  
  // Scroll to features
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.2, behavior: "instant" }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "tmp/fable-features.png", fullPage: false });
  console.log("✅ Features screenshot taken");
  
  // Scroll to models
  await page.evaluate(() => {
    const el = document.querySelector('#models');
    if (el) el.scrollIntoView({ behavior: "instant" });
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "tmp/fable-models.png", fullPage: false });
  console.log("✅ Models screenshot taken");
  
  // Scroll to code section
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 4, behavior: "instant" }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "tmp/fable-code.png", fullPage: false });
  console.log("✅ Code section screenshot taken");
  
  // Scroll to pricing
  await page.evaluate(() => {
    const el = document.querySelector('#pricing');
    if (el) el.scrollIntoView({ behavior: "instant" });
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "tmp/fable-pricing.png", fullPage: false });
  console.log("✅ Pricing screenshot taken");
  
  // Scroll to bottom / CTA + FAQ
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight - window.innerHeight, behavior: "instant" }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "tmp/fable-footer.png", fullPage: false });
  console.log("✅ Footer screenshot taken");
  
}).catch(() => process.exit(1));
