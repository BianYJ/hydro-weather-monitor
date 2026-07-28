import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const sourceDirectory = resolve(
  projectRoot,
  "node_modules/@mlightcad/cad-simple-viewer/dist",
);
const targetDirectory = resolve(projectRoot, "public/assets");
const viewerCss = resolve(
  projectRoot,
  "node_modules/@mlightcad/cad-viewer/dist/cad-viewer.css",
);
const workers = [
  "dxf-parser-worker.js",
  "libredwg-parser-worker.js",
  "mtext-renderer-worker.js",
];

await mkdir(targetDirectory, { recursive: true });
await Promise.all(
  workers.map((worker) =>
    copyFile(resolve(sourceDirectory, worker), resolve(targetDirectory, worker)),
  ),
);

const originalCss = await readFile(viewerCss, "utf8");
const fixedCss = originalCss
  .replaceAll(
    "@media (max-width: v-bind(mobileMaxWidth))",
    "@media (max-width: 768px)",
  )
  .replaceAll("body{margin:0;display:flex}", "body{margin:0}");

if (fixedCss !== originalCss) {
  await writeFile(viewerCss, fixedCss);
}
