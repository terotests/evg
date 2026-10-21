#!/usr/bin/env node
/**
 * The strict-Rust EVG core (rs/) against itself on every target and against
 * Storm:
 *   1. cargo run in rs/parity prints the reference lines
 *   2. rgrc of rs/parity/src/main.rs for es6, go and cpp (a missing
 *      toolchain is skipped) must print exactly the same
 *   3. rs/parity/StormParity.rgr, built from storm/'s .rgr classes, must
 *      print exactly the same
 * Needs a Ranger checkout with the Rust frontend: RANGER_ROOT or ../Ranger.
 *
 *   npm run rs:parity
 */
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CRATE = path.join(ROOT, "rs", "parity");
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), "evg-rs-parity-"));
let failed = 0;

function rangerRoot() {
  const dirs = [process.env.RANGER_ROOT, path.resolve(ROOT, "../Ranger"), path.resolve(ROOT, "../ranger")];
  for (const d of dirs) {
    if (d && fs.existsSync(path.join(d, "dist", "rgrc.js")) && fs.existsSync(path.join(d, "compiler", "Lang.rgr"))) {
      return path.resolve(d);
    }
  }
  console.error("rs:parity needs a Ranger checkout with dist/rgrc.js: set RANGER_ROOT or clone terotests/Ranger next to this repo");
  process.exit(1);
}

function run(cmd, args, cwd = ROOT, env = process.env) {
  const r = spawnSync(cmd, args, { cwd, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, stdout: r.stdout || "", stderr: r.stderr || "", error: r.error };
}

function has(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  return !r.error && r.status === 0;
}

function report(name, ok, detail = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? " " + detail : ""}`);
  if (!ok) failed += 1;
}

function compare(name, got, expected, log = "") {
  report(name, got === expected);
  if (got !== expected) {
    const a = expected.split("\n");
    const b = got.split("\n");
    const i = a.findIndex((l, k) => l !== b[k]);
    console.log(`  first difference at line ${i + 1}:\n  cargo: ${a[i]}\n  got:   ${b[i]}\n${log.slice(0, 2000)}`);
  }
}

const ranger = rangerRoot();
const rgrc = path.join(ranger, "dist", "rgrc.js");

const native = run("cargo", ["run", "--quiet", "--manifest-path", path.join(CRATE, "Cargo.toml"), "--target-dir", path.join(OUT, "cargo")]);
if (native.status !== 0 || native.stdout.length === 0) {
  console.log(native.stdout + native.stderr);
  report("rust native (cargo run)", false);
  process.exit(1);
}
const expected = native.stdout;
report("rust native (cargo run)", true, `(${expected.split("\n").length - 1} lines)`);

const targets = [
  { l: "es6", file: "parity.cjs", tool: ["node", ["--version"]], exec: (d) => run("node", [path.join(d, "parity.cjs")]) },
  {
    l: "go",
    file: "parity.go",
    tool: ["go", ["version"]],
    exec: (d) => {
      const b = run("go", ["build", "-o", "parity", "parity.go"], d, { ...process.env, GO111MODULE: "off" });
      return b.status !== 0 ? b : run(path.join(d, "parity"), []);
    },
  },
  {
    l: "cpp",
    file: "parity.cpp",
    tool: ["g++", ["--version"]],
    exec: (d) => {
      const b = run("g++", ["-std=c++17", "-O2", "-o", path.join(d, "parity"), path.join(d, "parity.cpp")]);
      return b.status !== 0 ? b : run(path.join(d, "parity"), []);
    },
  },
];
for (const t of targets) {
  if (!has(...t.tool)) {
    console.log(`skip ${t.l}: no ${t.tool[0]}`);
    continue;
  }
  const d = path.join(OUT, t.l);
  fs.mkdirSync(d, { recursive: true });
  const c = run("node", [rgrc, `-l=${t.l}`, path.relative(ROOT, path.join(CRATE, "src", "main.rs")), `-d=${d}`, `-o=${t.file}`]);
  const log = c.stdout + c.stderr;
  if (c.status !== 0 || /\[FAIL\]/.test(log) || !fs.existsSync(path.join(d, t.file))) {
    console.log(log.split("\n").filter((l) => /FAIL|rror/.test(l)).join("\n"));
    report(`rgrc -l=${t.l}`, false);
    continue;
  }
  const r = t.exec(d);
  compare(`rgrc -l=${t.l} prints what cargo printed`, r.stdout, expected, r.stderr);
}

const sd = path.join(OUT, "storm");
const lib = [path.join(ranger, "compiler", "Lang.rgr"), path.join(ranger, "lib", "stdops.rgr")].join(":");
const sc = run("node", [rgrc, "-es6", path.join(CRATE, "StormParity.rgr"), `-d=${sd}`, "-o=storm.cjs", "-nodecli"], ROOT, {
  ...process.env,
  RANGER_LIB: lib,
});
if (sc.status !== 0 || /Compilation FAILED|\[FAIL\]/.test(sc.stdout + sc.stderr) || !fs.existsSync(path.join(sd, "storm.cjs"))) {
  console.log(sc.stdout + sc.stderr);
  report("StormParity.rgr compiles", false);
} else {
  const s = run("node", [path.join(sd, "storm.cjs")]);
  compare("storm .rgr prints what cargo printed", s.stdout, expected, s.stderr);
}
process.exit(failed ? 1 : 0);
