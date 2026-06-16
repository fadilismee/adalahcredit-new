import { build } from "vite";
try {
  await build({
    configFile: "./vite.config.ts",
    root: process.cwd(),
    logLevel: "info",
  });
} catch(e: any) {
  console.error("Build error:", e?.message || e);
  console.error("Stack:", e?.stack);
}
