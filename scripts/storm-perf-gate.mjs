#!/usr/bin/env node
/**
 * Perf gate: the Storm engine's layout and display-list cost, base vs head,
 * as instruction counts (callgrind), which do not move with the machine's
 * load the way wall-clock times do.
 *
 * storm/EvgPerfGate.rgr (head's copy, for both sides) builds four pages of
 * 10k elements (flex, grid, text, dashboard) and lays out / lists each three
 * times in its own gate* function. Both sides are compiled to C++ (g++ -O2),
 * run once under valgrind --tool=callgrind, and each gate* function's
 * inclusive instructions are compared. The gate fails when one is more than
 * PERF_GATE_MAX_PCT (default 5) per cent over base.
 *
 *   node scripts/storm-perf-gate.mjs [--base=<git ref>]
 *
 * The base is --base, PERF_BASE, or the merge base with origin/master. Needs
 * a Ranger compiler (as storm:test), g++ and valgrind (callgrind_annotate).
 */
import fs from "fs";
import path from "path";
import { spawn, spawnSync, execFileSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "tmp/perf-gate");
const MAX = Number(process.env.PERF_GATE_MAX_PCT || 5);

// the compiler, as storm-ranger-test.mjs finds it
function compilerIn(dir) {
  for (const rel of ["dist/rgrc.js", "bin/output.js"]) {
    const file = path.join(dir, rel);
    if (fs.existsSync(file)) return path.resolve(file);
  }
  return null;
}
function findCompiler() {
  const dirs = process.env.RANGER_ROOT
    ? [process.env.RANGER_ROOT]
    : [path.resolve(ROOT, "../ranger"), path.resolve(ROOT, "../Ranger"), path.join(ROOT, "ranger-compiler"), path.join(ROOT, "node_modules/ranger-compiler")];
  for (const dir of dirs) {
    const file = compilerIn(dir);
    if (file) {
      for (const [lang, ops] of [["compiler/Lang.rgr", "lib/stdops.rgr"], ["dist/Lang.rgr", "dist/stdops.rgr"]]) {
        const a = path.join(dir, lang), b = path.join(dir, ops);
        if (fs.existsSync(a) && fs.existsSync(b)) return { file, lib: `${a}:${b}` };
      }
      return { file, lib: "" };
    }
  }
  return null;
}

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
function baseRef() {
  const arg = process.argv.find((a) => a.startsWith("--base="));
  if (arg) return arg.slice(7);
  if (process.env.PERF_BASE) return process.env.PERF_BASE;
  return git("merge-base", "HEAD", "origin/master");
}

function run(cmd, args, opts = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
    let log = "";
    p.stdout.on("data", (d) => (log += d));
    p.stderr.on("data", (d) => (log += d));
    p.on("close", (code) => (code === 0 ? ok(log) : fail(new Error(`${cmd} ${args.join(" ")} exited ${code}\n${log.slice(-3000)}`))));
  });
}

// one side: storm/ at dir, compiled and measured; {gateLayFlex: Ir, ...}
async function measure(name, stormDir, rgrc) {
  const dir = path.join(OUT, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(ROOT, "storm/EvgPerfGate.rgr"), path.join(stormDir, "EvgPerfGate.rgr"));
  await run(process.execPath, [rgrc.file, "-l=cpp", path.join(stormDir, "EvgPerfGate.rgr"), `-d=${dir}`, "-o=gate.cpp"], {
    env: rgrc.lib ? { ...process.env, RANGER_LIB: rgrc.lib } : process.env,
  });
  const cpp = path.join(dir, "gate.cpp");
  if (!fs.existsSync(cpp)) throw new Error(`${name}: the compiler wrote no gate.cpp`);
  // (each gate* function its own frame, not inlined into main)
  fs.writeFileSync(cpp, fs.readFileSync(cpp, "utf8").replace(/^void\s+EvgPerfGate::gate/gm, "__attribute__((noinline)) void EvgPerfGate::gate"));
  await run("g++", ["-O2", "-std=c++17", "-w", cpp, "-o", path.join(dir, "gate")]);
  const cg = path.join(dir, "callgrind.out");
  await run("valgrind", ["--tool=callgrind", `--callgrind-out-file=${cg}`, path.join(dir, "gate")]);
  const ann = execFileSync("callgrind_annotate", ["--inclusive=yes", cg], { encoding: "utf8", maxBuffer: 1 << 28 });
  const ir = {};
  for (const line of ann.split("\n")) {
    const m = line.match(/^\s*([\d,]+)\s.*EvgPerfGate::(gate\w+)\(/);
    if (m && !/\.cold/.test(line) && !(m[2] in ir)) ir[m[2]] = Number(m[1].replace(/,/g, ""));
  }
  if (Object.keys(ir).length !== 8) throw new Error(`${name}: found ${Object.keys(ir).length} of 8 gate functions in the profile`);
  return ir;
}

const rgrc = findCompiler();
if (!rgrc) {
  console.error("perf gate: no Ranger compiler (RANGER_ROOT, ../ranger, or npm ci)");
  process.exit(1);
}
for (const tool of ["g++", "valgrind", "callgrind_annotate"]) {
  if (spawnSync("which", [tool]).status !== 0) {
    console.error(`perf gate: ${tool} is not installed`);
    process.exit(1);
  }
}
const base = baseRef();
fs.rmSync(OUT, { recursive: true, force: true });
const baseStorm = path.join(OUT, "base-src");
fs.mkdirSync(baseStorm, { recursive: true });
execFileSync("sh", ["-c", `git archive ${base} storm | tar -x -C "${baseStorm}"`], { cwd: ROOT });
const headStorm = path.join(OUT, "head-src");
fs.cpSync(path.join(ROOT, "storm"), path.join(headStorm, "storm"), { recursive: true });

console.log(`perf gate: base ${git("rev-parse", "--short", base)} vs head ${git("rev-parse", "--short", "HEAD")} (limit +${MAX} %)`);
const [b, h] = await Promise.all([measure("base", path.join(baseStorm, "storm"), rgrc), measure("head", path.join(headStorm, "storm"), rgrc)]);

const rows = [];
let failed = 0;
for (const k of Object.keys(b)) {
  const pct = (100 * (h[k] - b[k])) / b[k];
  const bad = pct > MAX;
  if (bad) failed++;
  rows.push(`| ${k.replace(/^gate/, "")} | ${b[k].toLocaleString("en")} | ${h[k].toLocaleString("en")} | ${pct >= 0 ? "+" : ""}${pct.toFixed(1)} % | ${bad ? "FAIL" : "ok"} |`);
}
const table = ["| fixture (3 runs, 10k elements) | base Ir | head Ir | change | |", "|---|---:|---:|---:|---|", ...rows].join("\n");
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Storm perf gate\n\nInstructions (callgrind), limit +${MAX} %\n\n${table}\n`);
}
if (failed) {
  console.error(`perf gate: FAIL, ${failed} fixture(s) over +${MAX} %`);
  process.exit(1);
}
console.log("perf gate: PASS");
