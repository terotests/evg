#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// `EVGElement.adoptFrom` must mention every field of EVGElement.
//
//   node scripts/check-adopt.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "storm/EVGElement.rgr");

const EXPECTED_SKIPS = {
  parent: "structure — a back-reference the reconciler owns",
  children: "structure — EVGReconcile decides the child list",
  transitions: "the in-flight animations, which are the reason the element is kept",
  paintStamp: "this element's own count of paint changes — adopting is one, so it is moved on, not copied",
  effectRuntimeId: "in-flight — the display list names the instance again on every build",
  ringsCache: "derived — the flattened path, kept warm across a reconcile",
  ringsHave: "derived — whether the cache above holds anything",
  ringsPath: "derived — the `d` the cache was flattened from, which validates it",
  ringsX: "derived — the box the cache was flattened for",
  ringsY: "derived — the box the cache was flattened for",
  ringsW: "derived — the box the cache was flattened for",
  ringsH: "derived — the box the cache was flattened for",
  ringsSteps: "derived — the step ceiling the cache was flattened at",
  ringsScale: "derived — the scale the cache was flattened at",
  ringsViewBox: "derived — the viewBox the cache was flattened under",
  ringsFit: "derived — the preserveAspectRatio the cache was flattened under",
};

const src = fs.readFileSync(FILE, "utf8").split("\n");

const classAt = src.findIndex((l) => l.startsWith("class EVGElement"));
if (classAt < 0) throw new Error("class EVGElement not found in " + FILE);

const fields = [];
for (let i = classAt + 1; i < src.length; i++) {
  const line = src[i];
  if (/^\s{4}(Constructor|s?fn)\s/.test(line)) break;
  const m = /^\s{4}def\s+(\w+)(@\([^)]*\))?:/.exec(line);
  if (m) fields.push(m[1]);
}
if (fields.length === 0) throw new Error("no fields parsed — has the class layout changed?");

const bodyStart = src.findIndex((l) => l.includes("fn adoptFrom:void ("));
if (bodyStart < 0) throw new Error("adoptFrom not found in " + FILE);
const assigned = new Set();
for (let i = bodyStart + 1; i < src.length; i++) {
  if (/^\s{4}\}/.test(src[i])) break;
  const m = /^\s+(\w+)\s*=\s*other\.(\w+)\s*$/.exec(src[i]);
  if (!m) continue;
  if (m[1] !== m[2]) {
    console.error(`adoptFrom assigns ${m[1]} from other.${m[2]} — a copy must be field-to-itself`);
    process.exit(1);
  }
  assigned.add(m[1]);
}

const missing = fields.filter((f) => !assigned.has(f) && !(f in EXPECTED_SKIPS));
const strayed = [...assigned].filter((f) => !fields.includes(f));
const skippedButCopied = Object.keys(EXPECTED_SKIPS).filter((f) => assigned.has(f));

let bad = false;
for (const f of missing) {
  console.error(`EVGElement.${f} is not copied by adoptFrom — a reconciled element would lose it`);
  bad = true;
}
for (const f of strayed) {
  console.error(`adoptFrom copies "${f}", which is not a field of EVGElement`);
  bad = true;
}
for (const f of skippedButCopied) {
  console.error(`adoptFrom copies "${f}", which it must not: ${EXPECTED_SKIPS[f]}`);
  bad = true;
}

const covered = fields.length - Object.keys(EXPECTED_SKIPS).length;
console.log(
  `EVGElement: ${fields.length} fields, ${covered} copied by adoptFrom, ` +
    `${Object.keys(EXPECTED_SKIPS).length} deliberately not`,
);
if (bad) {
  console.log("");
  console.log("FAILURES");
  process.exit(1);
}
console.log("ALL PASS");
