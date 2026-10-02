// SPDX-License-Identifier: MIT
//
// An effect MANIFEST registered with this painter — the same file the native
// painter reads (storm/native/gl/EvgGlEffects.h, `EffectDef::fromManifest`),
// so one effect is one GLSL body and one manifest for both:
//
//   { "name": "spectrum", "layer": "source",
//     "params": { "level": 0, "hue": 205 },
//     "arrays": { "b": 32 },              // b0 … b31, floats like the rest
//     "file": "spectrum.glsl" }
//
//   import { registerEffectManifest } from "<evg package>/gl/evg-fx-def.js";
//   registerEffectManifest(manifest, glslText, commonGlsl);
//
// "bands": N is read as "arrays": { "b": N }, which is what the first
// manifests (EVG Player's) wrote.

import { registerSurfaceEffect } from "./evg-webgl.js";

export function effectParams(manifest) {
  const params = { ...(manifest.params || {}) };
  const arrays = { ...(manifest.arrays || {}) };
  if (manifest.bands) arrays.b = manifest.bands;
  for (const [prefix, count] of Object.entries(arrays)) {
    for (let i = 0; i < count; i++) params[prefix + i] = 0;
  }
  return params;
}

export function registerEffectManifest(manifest, glsl, common = "") {
  return registerSurfaceEffect({
    name: manifest.name,
    layer: manifest.layer || "source",
    params: effectParams(manifest),
    frag: common + glsl,
  });
}
