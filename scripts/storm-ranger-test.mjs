#!/usr/bin/env node
/**
 * Storm engine tests. The TypeScript NPM package does not ship the Ranger
 * compiler; .rgr suites compile when a Ranger 3.x checkout is available
 * (RANGER_ROOT, sibling `../ranger`, or this cloud layout).
 *
 * Host checks that are plain JavaScript always run.
 *
 * In CI (or with REQUIRE_RANGER=1) a missing compiler is a hard failure —
 * otherwise a misconfigured job would skip every .rgr suite and still go
 * green, which is how engine regressions would reach master.
 *
 *   npm run storm:test
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STORM = path.join(ROOT, "storm");

// The compiler: a Ranger checkout (RANGER_ROOT, sibling `../ranger` or
// `../Ranger`, or `ranger-compiler/` here), else the `ranger-compiler` npm
// package in node_modules. A checkout has `dist/rgrc.js` (older ones
// `bin/output.js`); the package ships `dist/rgrc.js` with `Lang.rgr` and
// `stdops.rgr` beside it.
function compilerIn(dir) {
  for (const rel of ["dist/rgrc.js", "bin/output.js"]) {
    const file = path.join(dir, rel);
    if (fs.existsSync(file)) return path.resolve(file);
  }
  return null;
}

function findCompiler() {
  const fromEnv = process.env.RANGER_ROOT;
  if (fromEnv) {
    // Explicit: do not fall through to another compiler if CI pointed at a
    // missing one. That would skip the failure the job is meant to catch.
    const file = compilerIn(fromEnv);
    return file ? { root: path.resolve(fromEnv), file } : null;
  }
  const candidates = [
    path.resolve(ROOT, "../ranger"),
    path.resolve(ROOT, "../Ranger"),
    path.join(ROOT, "ranger-compiler"),
    path.join(ROOT, "node_modules/ranger-compiler"),
  ];
  for (const dir of candidates) {
    const file = compilerIn(dir);
    if (file) return { root: dir, file };
  }
  return null;
}

function rangerLib(found) {
  const pairs = [
    ["compiler/Lang.rgr", "lib/stdops.rgr"],
    ["dist/Lang.rgr", "dist/stdops.rgr"],
  ];
  for (const [lang, ops] of pairs) {
    const a = path.join(found.root, lang);
    const b = path.join(found.root, ops);
    if (fs.existsSync(a) && fs.existsSync(b)) return [a, b].join(":");
  }
  return "";
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
  "EVGRelayoutTest.rgr",
  "EVGTextOverflowTest.rgr",
];

function rangerRequired() {
  if (process.env.REQUIRE_RANGER === "1") return true;
  if (process.env.RANGER_ROOT) return true;
  // GitHub Actions and most other CI set CI=true. A local `npm run storm:test`
  // without a compiler still skips the .rgr suites so the TS package can be
  // developed on its own.
  if (process.env.CI === "true") return true;
  return false;
}

const found = findCompiler();
if (!found) {
  if (rangerRequired()) {
    console.error(
      "Ranger compiler is required to run Storm engine tests " +
        "(CI / REQUIRE_RANGER / RANGER_ROOT).\n" +
        "Run `npm ci` (ranger-compiler is a devDependency), set RANGER_ROOT to a\n" +
        "Ranger checkout that contains dist/rgrc.js, or clone\n" +
        "https://github.com/terotests/Ranger next to this repo.\n" +
        "Looked at RANGER_ROOT=" +
        (process.env.RANGER_ROOT || "(unset)"),
    );
    process.exit(1);
  }
  console.log(
    "\nstorm:test: Ranger compiler not found — JS host checks passed; .rgr suites skipped.\n" +
      "Run `npm ci`, set RANGER_ROOT or clone terotests/Ranger next to this repo to run the engine tests.",
  );
  process.exit(0);
}

const compiler = found.file;
const lib = rangerLib(found);
console.log("\ncompiler:", compiler);
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
      cwd: ROOT,
      env: lib ? { ...process.env, RANGER_LIB: lib } : process.env,
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
