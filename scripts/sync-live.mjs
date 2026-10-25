import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const from = path.join(root, "dist", "assets");
const to = path.join(root, "assets");
fs.mkdirSync(to, { recursive: true });
for (const name of fs.readdirSync(from)) {
  fs.copyFileSync(path.join(from, name), path.join(to, name));
}
fs.copyFileSync(path.join(root, "public", "favicon.svg"), path.join(root, "favicon.svg"));
