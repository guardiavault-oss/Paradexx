import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

await build({
  entryPoints: [resolve(rootDir, "server/index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outdir: resolve(rootDir, "dist"),
  packages: "external",
  external: ["vite", "../vite.config", "natural", "cheerio"],
  resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
  absWorkingDir: rootDir,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  logLevel: "info",
}).catch(() => process.exit(1));

console.log("✅ Server build complete");

