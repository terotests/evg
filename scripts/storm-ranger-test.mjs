#!/usr/bin/env node
/**
 * Storm engine tests. The TypeScript NPM package does not ship the Ranger
 * compiler; .rgr suites compile when a Ranger 3.x checkout is available
 * (RANGER_ROOT, sibling `../ranger`, or this cloud layout).
 *
 * Host checks that are plain JavaScript always run.
 *
 *   npm run storm:test
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STORM = path.join(ROOT, "storm");

function rangerRoot() {
  const fromEnv = process.env.RANGER_ROOT;
  if (fromEnv && fs.existsSync(path.join(fromEnv, "bin/output.js"))) {
    return path.resolve(fromEnv);
  }
  const candidates = [
    path.resolve(ROOT, "../ranger"),
    path.join(ROOT, "ranger-compiler"),
    "/agent/repos/ranger",
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "bin/output.js"))) return dir;
  }
  return null;
}

function runNode(script, cwd = ROOT) {
  console.log("\n==>", path.relative(ROOT, script));
  const r = spawnSync(process.execPath, [script], { cwd, stdio: "inherit" });
  if (r.status !== 0) {
    process.exit(r.status || 1);
  }
}

const JS_CHECKS = [
  path.join(ROOT, "scripts/check-adopt.mjs"),
  path.join(STORM, "gl/gestures-check.mjs"),
  path.join(STORM, "gl/stroke-check.mjs"),
  path.join(STORM, "gl/view-policy-check.mjs"),
  path.join(STORM, "gl/shift-check.mjs"),
  path.join(STORM, "gl/a11y-paint-check.mjs"),
];

for (const script of JS_CHECKS) {
  if (!fs.existsSync(script)) {
    console.error("missing", script);
    process.exit(1);
  }
  runNode(script);
}

const RGR_SUITES = [
  "EVGJsonTest.rgr",
  "EVGTimingTest.rgr",
  "EVGReconcileTest.rgr",
  "EVGInvalidateTest.rgr",
  "EVGStyleCacheTest.rgr",
  "EVGComponentTest.rgr",
  "EVGViewportUnitTest.rgr",
  "EVGFlexRulesTest.rgr",
  "EVGFlexWrapTest.rgr",
  "EVGBoxShorthandTest.rgr",
  "EVGStyleStateTest.rgr",
  "EVGFocusTest.rgr",
  "EVGStyleVarTest.rgr",
  "EVGOverlayTest.rgr",
  "EVGFixedTest.rgr",
  "EVGConnectorTest.rgr",
  "EVGPopoverTest.rgr",
  "EVGRtlLayoutTest.rgr",
  "EVGRulerTest.rgr",
  "EVGHostMeasurerTest.rgr",
  "EVGHostTreeTest.rgr",
  "EVGPatchTest.rgr",
  "EvgBitmapTracerTest.rgr",
  "EVGEffectTest.rgr",
];

const ranger = rangerRoot();
if (!ranger) {
  if (process.env.RANGER_ROOT) {
    console.error("RANGER_ROOT is set but bin/output.js was not found at", process.env.RANGER_ROOT);
    process.exit(1);
  }
  console.log(
    "\nstorm:test: Ranger compiler not found — JS host checks passed; .rgr suites skipped.\n" +
      "Set RANGER_ROOT or clone terotests/ranger next to this repo to run the engine tests.",
  );
  process.exit(0);
}

const compiler = path.join(ranger, "bin/output.js");
const lib = [
  path.join(ranger, "compiler/Lang.rgr"),
  path.join(ranger, "lib/stdops.rgr"),
].join(":");
const outDir = path.join(STORM, "bin");
fs.mkdirSync(outDir, { recursive: true });

for (const name of RGR_SUITES) {
  const src = path.join(STORM, name);
  if (!fs.existsSync(src)) {
    console.error("missing", src);
    process.exit(1);
  }
  const jsName = name.replace(/\.rgr$/, ".js");
  const outFile = path.join(outDir, jsName);
  try {
    fs.unlinkSync(outFile);
  } catch {
    /* ok */
  }
  console.log("\n==> compile", name);
  const compile = spawnSync(
    process.execPath,
    [compiler, "-es6", src, `-d=${outDir}`, `-o=${jsName}`, "-nodecli"],
    {
      cwd: ranger,
      env: { ...process.env, RANGER_LIB: lib },
      encoding: "utf8",
    },
  );
  const log = `${compile.stdout || ""}${compile.stderr || ""}`;
  if (log) process.stdout.write(log);
  if (compile.status !== 0 || /Compilation FAILED/.test(log)) {
    console.error("FAILED to compile", src);
    process.exit(compile.status || 1);
  }
  if (!fs.existsSync(outFile)) {
    console.error("compiler wrote no", outFile);
    process.exit(1);
  }
  const run = spawnSync(process.execPath, [outFile], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const runLog = `${run.stdout || ""}${run.stderr || ""}`;
  if (runLog) process.stdout.write(runLog);
  if (run.status !== 0 || /\[FAIL\]/.test(runLog)) {
    console.error("FAILED", jsName);
    process.exit(run.status || 1);
  }
  if (!/ALL PASS|failed=0|Failed:\s*0/.test(runLog)) {
    console.error("no pass marker in", jsName);
    process.exit(1);
  }
}

console.log("\nALL PASS — Storm engine tests");
