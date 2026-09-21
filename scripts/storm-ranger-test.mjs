#!/usr/bin/env node
/**
 * Compile and run the Ranger Storm engine tests when a Ranger 3.x checkout
 * is available (sibling `../ranger`, RANGER_ROOT, or this cloud layout).
 *
 * The NPM package itself does not ship the Ranger compiler — Storm sources
 * under /storm are compiled by Ranger applications that depend on this repo.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function rangerRoot() {
  const fromEnv = process.env.RANGER_ROOT;
  if (fromEnv && fs.existsSync(path.join(fromEnv, "bin/output.js"))) {
    return path.resolve(fromEnv);
  }
  const candidates = [
    path.resolve(ROOT, "../ranger"),
    "/agent/repos/ranger",
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "bin/output.js"))) return dir;
  }
  return null;
}

const ranger = rangerRoot();
if (!ranger) {
  console.log(
    "storm:test skipped — no Ranger compiler found. Set RANGER_ROOT or clone terotests/ranger next to this repo."
  );
  process.exit(0);
}

const compiler = path.join(ranger, "bin/output.js");
const lib = [
  path.join(ranger, "compiler/Lang.rgr"),
  path.join(ranger, "lib/stdops.rgr"),
].join(":");
const src = path.join(ROOT, "storm/EVGJsonTest.rgr");
const outDir = path.join(ROOT, "storm/bin");
fs.mkdirSync(outDir, { recursive: true });

console.log("Compiling storm/EVGJsonTest.rgr with Ranger at", ranger);
const compile = spawnSync(
  process.execPath,
  [compiler, "-es6", src, `-d=${outDir}`, "-o=EVGJsonTest.js", "-nodecli"],
  {
    cwd: ranger,
    env: { ...process.env, RANGER_LIB: lib },
    stdio: "inherit",
  }
);
if (compile.status !== 0) {
  process.exit(compile.status || 1);
}

const run = spawnSync(process.execPath, [path.join(outDir, "EVGJsonTest.js")], {
  cwd: ROOT,
  stdio: "inherit",
});
process.exit(run.status || 0);
