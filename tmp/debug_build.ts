import { build } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

try {
  await build({
    configFile: false,
    root: process.cwd(),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "src"),
      },
    },
    build: {
      outDir: "dist",
    },
  });
  console.log("Build succeeded!");
} catch(e: any) {
  console.error("Build error:", e?.message);
  console.error("Stack:", e?.stack);
}
