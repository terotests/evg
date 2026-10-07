#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// A pixel check of the native GL painter, through tools/evg-gl-render:
// a list with each command it draws and one effect per layer, painted, and
// sampled where the answer is known.
//
//   bash storm/native/tools/build.sh && node storm/native/tests/check.mjs
//
// On Linux with no display it runs under xvfb-run (Mesa's llvmpipe is enough).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const NATIVE = path.join(HERE, "..");
const tool = path.join(NATIVE, "tools", "build", "evg-gl-render");
if (!fs.existsSync(tool)) { console.error("build it first: bash storm/native/tools/build.sh"); process.exit(2); }
const font = path.join(NATIVE, "..", "..", "fonts", "Open_Sans", "OpenSans-Regular.ttf");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "evg-gl-"));

// 200 x 100. Left half: a red background, a blue→white gradient box, a
// square with a square hole (even-odd), and a source effect that paints its
// box green. Right half: grey, with a backdrop effect that inverts what is
// under its box, and a filter that turns its box black after the frame.
const ring = (x, y, w, h) => [x, y, x + w, y, x + w, y + h, x, y + h, x, y];
const list = {
  width: 200, height: 100,
  cmds: [
    { k: 0, x: 0, y: 0, w: 100, h: 100, c: [255, 0, 0, 1] },
    { k: 0, x: 0, y: 0, w: 40, h: 40, c: [0, 0, 255, 1], gd: 1, c2: [255, 255, 255, 1] },
    { k: 6, x: 50, y: 0, w: 40, h: 40, c: [255, 255, 0, 1], eo: 1,
      pts: [...ring(50, 0, 40, 40), ...ring(60, 10, 20, 20)], ends: [10, 20] },
    { k: 0, x: 10, y: 60, w: 30, h: 30, c: [0, 0, 0, 0], efx: "src" },
    { k: 0, x: 100, y: 0, w: 100, h: 100, c: [128, 128, 128, 1] },
    { k: 0, x: 110, y: 10, w: 30, h: 30, c: [0, 0, 0, 0], efx: "back" },
    { k: 3, x: 50, y: 60, w: 50, h: 20, c: [255, 255, 255, 1], text: "Hi", font: "Open Sans", size: 16 },
  ],
  effects: [
    { id: "src", kind: "t-source", box: [10, 60, 30, 30], p: { g: 1 } },
    { id: "back", kind: "t-invert", box: [110, 10, 30, 30] },
    { id: "filt", kind: "t-black", box: [160, 60, 30, 30] },
  ],
};
fs.writeFileSync(path.join(tmp, "list.json"), JSON.stringify(list));
fs.writeFileSync(path.join(tmp, "source.glsl"), "vec4 fxColor(vec2 p, vec2 local) { return vec4(0.0, p_g, 0.0, 1.0); }\n");
fs.writeFileSync(path.join(tmp, "invert.glsl"), "vec4 fxColor(vec2 p, vec2 local) { vec4 s = texture(uSrc, vUV); return vec4(s.a - s.rgb, s.a); }\n");
fs.writeFileSync(path.join(tmp, "black.glsl"), "vec4 fxColor(vec2 p, vec2 local) { return vec4(0.0, 0.0, 0.0, 1.0); }\n");
fs.writeFileSync(path.join(tmp, "effects.json"), JSON.stringify([
  { name: "t-source", layer: "source", params: { g: 0 }, file: "source.glsl" },
  { name: "t-invert", layer: "backdrop", params: {}, file: "invert.glsl" },
  { name: "t-black", layer: "filter", params: {}, file: "black.glsl" },
]));

const out = path.join(tmp, "out.pam");
let cmd = tool, args = [path.join(tmp, "list.json"), out, "--effects", path.join(tmp, "effects.json"), "--font", `Open Sans:regular:${font}`];
if (process.platform === "linux" && !process.env.DISPLAY) {
  args = ["-a", "-s", "-screen 0 640x480x24 +extension GLX", cmd, ...args];
  cmd = "xvfb-run";
}
const r = spawnSync(cmd, args, { encoding: "utf8" });
if (r.status !== 0 || !fs.existsSync(out)) { console.error(r.stdout, r.stderr); process.exit(1); }

const buf = fs.readFileSync(out);
const end = buf.indexOf("ENDHDR\n") + 7;
const W = Number(/WIDTH (\d+)/.exec(buf.subarray(0, end).toString())[1]);
const px = (x, y) => [...buf.subarray(end + (y * W + x) * 4, end + (y * W + x) * 4 + 4)];
const near = (a, b, tol = 12) => a.every((v, i) => Math.abs(v - b[i]) <= tol);
const fails = [];
const expect = (what, got, want) => {
  const ok = near(got, want);
  if (!ok) fails.push(what);
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}${ok ? "" : ` — got ${got}, want ${want}`}`);
};
expect("rect: solid red", px(95, 50), [255, 0, 0, 255]);
expect("gradient: blue at the left", px(1, 20), [3, 3, 255, 255]);
expect("gradient: white at the right", px(38, 20), [249, 249, 255, 255]);
expect("path: filled ring", px(55, 20), [255, 255, 0, 255]);
expect("path: even-odd hole shows the background", px(70, 20), [255, 0, 0, 255]);
expect("source effect paints its box", px(25, 75), [0, 255, 0, 255]);
expect("source effect stays inside its box", px(45, 75), [255, 0, 0, 255]);
expect("backdrop effect inverts what is under it", px(125, 25), [127, 127, 127, 255]);
expect("backdrop leaves the rest", px(150, 25), [128, 128, 128, 255]);
expect("filter runs over its box", px(175, 75), [0, 0, 0, 255]);
const text = [];
for (let y = 60; y < 80; y++) for (let x = 50; x < 75; x++) text.push(px(x, y)[1]);
const inked = text.filter((g) => g > 200).length;
const ok = inked > 15;
if (!ok) fails.push("text");
console.log(`  ${ok ? "ok  " : "FAIL"} text is drawn (${inked} light pixels)`);

// A second frame: a turned box, a picture, and a list drawn over the first
// at a place and a scale without clearing it, the way a host puts a slide on
// its stage. 200 x 100, grey.
const base = {
  width: 200, height: 100,
  cmds: [
    { k: 0, x: 0, y: 0, w: 200, h: 100, c: [128, 128, 128, 1] },
    // 80 x 20 turned a quarter about its centre (50, 50): 20 x 80 standing
    { k: 0, x: 10, y: 40, w: 80, h: 20, c: [255, 255, 0, 1], rot: 90 },
    { k: 2, x: 150, y: 0, w: 40, h: 40, src: "test:quad" },
  ],
};
// its page is the window's, drawn at (100, 50) half size: x 0..100 of it
// lands on 100..150, and its clip 100..140 on 150..170
const over = {
  width: 200, height: 100,
  cmds: [
    { k: 0, x: 0, y: 0, w: 100, h: 100, c: [0, 255, 0, 1] },
    { k: 4, x: 100, y: 0, w: 40, h: 100, c: [0, 0, 0, 0] },
    { k: 0, x: 100, y: 0, w: 100, h: 100, c: [0, 0, 255, 1] },
    { k: 5, x: 0, y: 0, w: 0, h: 0, c: [0, 0, 0, 0] },
  ],
};
fs.writeFileSync(path.join(tmp, "base.json"), JSON.stringify(base));
fs.writeFileSync(path.join(tmp, "over.json"), JSON.stringify(over));
const out2 = path.join(tmp, "out2.pam");
let cmd2 = tool, args2 = [path.join(tmp, "base.json"), out2, "--over", path.join(tmp, "over.json"), "--at", "100,50,0.5"];
if (process.platform === "linux" && !process.env.DISPLAY) {
  args2 = ["-a", "-s", "-screen 0 640x480x24 +extension GLX", cmd2, ...args2];
  cmd2 = "xvfb-run";
}
const r2 = spawnSync(cmd2, args2, { encoding: "utf8" });
if (r2.status !== 0 || !fs.existsSync(out2)) { console.error(r2.stdout, r2.stderr); process.exit(1); }
const buf2 = fs.readFileSync(out2);
const end2 = buf2.indexOf("ENDHDR\n") + 7;
const px2 = (x, y) => [...buf2.subarray(end2 + (y * W + x) * 4, end2 + (y * W + x) * 4 + 4)];
expect("rotation: the turned box stands up", px2(50, 15), [255, 255, 0, 255]);
expect("rotation: and is gone from where it lay", px2(15, 50), [128, 128, 128, 255]);
expect("image: top left texel", px2(155, 5), [255, 0, 0, 255]);
expect("image: top right texel", px2(185, 5), [0, 255, 0, 255]);
expect("image: bottom left texel", px2(155, 35), [0, 0, 255, 255]);
expect("placed list: drawn at its place and scale", px2(120, 70), [0, 255, 0, 255]);
expect("placed list: nothing cleared around it", px2(60, 90), [128, 128, 128, 255]);
expect("placed list: its clip is placed too", px2(160, 70), [0, 0, 255, 255]);
expect("placed list: and cuts where it ends", px2(185, 70), [128, 128, 128, 255]);

// A symbol the run's face lacks comes from a face that has it: ▶ in a run of
// Open Sans, drawn from DejaVu Sans when the system has it to register.
const dejavu = ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/Library/Fonts/DejaVuSans.ttf"].find((f) => fs.existsSync(f));
if (dejavu) {
  fs.writeFileSync(path.join(tmp, "sym.json"), JSON.stringify({
    width: 60, height: 60,
    cmds: [{ k: 3, x: 5, y: 5, w: 50, h: 50, c: [255, 255, 255, 1], text: "\u25B6", font: "Open Sans", size: 40 }],
  }));
  const out3 = path.join(tmp, "out3.pam");
  let cmd3 = tool, args3 = [path.join(tmp, "sym.json"), out3, "--font", `Open Sans:regular:${font}`, "--font", `DejaVu Sans:regular:${dejavu}`];
  if (process.platform === "linux" && !process.env.DISPLAY) {
    args3 = ["-a", "-s", "-screen 0 640x480x24 +extension GLX", cmd3, ...args3];
    cmd3 = "xvfb-run";
  }
  const r3 = spawnSync(cmd3, args3, { encoding: "utf8" });
  if (r3.status !== 0 || !fs.existsSync(out3)) { console.error(r3.stdout, r3.stderr); process.exit(1); }
  const buf3 = fs.readFileSync(out3);
  const end3 = buf3.indexOf("ENDHDR\n") + 7;
  let lit = 0;
  for (let i = end3; i + 3 < buf3.length; i += 4) if (buf3[i + 3] > 128) lit++;
  const okSym = lit > 300;
  if (!okSym) fails.push("symbol fallback");
  console.log(`  ${okSym ? "ok  " : "FAIL"} a symbol the face lacks is drawn from one that has it (${lit} pixels)`);
} else {
  console.log("  (no DejaVu Sans on this system: the symbol fallback was not checked)");
}
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fails.length ? 1 : 0);
