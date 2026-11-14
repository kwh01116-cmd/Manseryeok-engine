// 엔진 소스(다른 브랜치 체크아웃)를 묶어 index.html의 표시 구간에 넣는다.
//   node build.mjs <엔진 체크아웃 경로>
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const engine = resolve(process.argv[2] || "../../");
const out = await build({
  entryPoints: [resolve(here, "engine-glue.ts")],
  bundle: true, format: "iife", globalName: "ManseEngine", minify: true, write: false, target: "es2020",
  alias: { "@engine": resolve(engine, "src") },
  legalComments: "none",
});
const code = out.outputFiles[0].text.trim().replace(/<\/script/gi, "<\\/script");
const page = resolve(here, "index.html");
const START = "/*ENGINE_BUNDLE_START*/", END = "/*ENGINE_BUNDLE_END*/";
const html = readFileSync(page, "utf8");
const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < 0) throw new Error("index.html에 엔진 번들 표시 구간이 없습니다.");
writeFileSync(page, html.slice(0, a + START.length) + "\n" + code + "\n" + html.slice(b));
writeFileSync(resolve(here, ".engine-bundle.js"), code);
console.log(`engine bundle: ${code.length} bytes`);
