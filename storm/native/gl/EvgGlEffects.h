// SPDX-License-Identifier: MIT
//
// Surface effects for the native painter: the same plugin ABI as
// lib/evg/gl/evg-webgl.js, so ONE GLSL body runs in the browser and natively.
//
//   A plugin is   a name, a layer, a list of float parameters, and GLSL that
//                 defines   vec4 fxColor(vec2 p, vec2 local)
//   It is given   uBox (x, y, w, h in page px), uRadius, uRes (page size),
//                 uTime (s), uEvents[8] (x, y, age) with uEventCount, one
//                 `uniform float p_<name>` per parameter, fxBoxDistance(p),
//                 fxBoxCoverage(p), and — for backdrop and filter layers —
//                 uSrc sampled at vUV: the surface so far.
//   Layers        source    drawn in paint order at the element's background,
//                           composited over what is there
//                 backdrop  drawn at the same point, reading the surface so
//                           far, replacing it inside the box
//                 filter    drawn after the frame over the finished surface
//
// The box mask is applied in the shared main(), so a plugin cannot paint
// outside the element that declared it — as on the web.
//
// The display list says which element carries which effect
// (`"effects": [{ id, kind, box, r, p }]`, with `efx` on the rect that marks
// the paint position). What changes every frame — music levels, a clock,
// presses — is not in the list: the host supplies it per instance through
// the hook the painter is given, as web hosts write `inst.p` / `inst.events`.

#pragma once
#include <functional>
#include <map>
#include <memory>
#include <string>
#include <utility>
#include <vector>

#include "../evg_json.h"
#include "evg_gl.h"

namespace evg {
namespace gl {

enum class Layer { Source, Backdrop, Filter };

struct EffectDef {
  std::string name;
  Layer layer = Layer::Source;
  std::vector<std::pair<std::string, float>> params;  // name → default
  std::string glsl;                                   // fxColor() and helpers

  EffectDef& param(const std::string& n, float def) {
    params.emplace_back(n, def);
    return *this;
  }
  // `prefix0` … `prefix<count-1>`: an array, as float parameters, which is
  // the only shape the web registry can pass too.
  EffectDef& paramArray(const std::string& prefix, int count, float def = 0) {
    for (int i = 0; i < count; i++) params.emplace_back(prefix + std::to_string(i), def);
    return *this;
  }
  // From a manifest — { "name", "layer"?, "params": {…}, "arrays"?: { "b": 32 } } —
  // and the GLSL it names. The same manifest web/viz-style loaders read.
  static bool fromManifest(const json::Value& m, const std::string& glsl, EffectDef& out, std::string* err = nullptr);
};

struct EffectEvent {
  float x = 0, y = 0, age = 0;  // page px, seconds
};

// What a host supplies for one instance this frame.
struct EffectInputs {
  std::map<std::string, float> params;  // overrides the list's and the defaults
  std::vector<EffectEvent> events;      // at most 8 are passed
};

using EffectHook = std::function<void(const std::string& id, const std::string& kind, EffectInputs& in)>;

class Effects {
 public:
  ~Effects();
  // GLSL prepended to every plugin (shared helpers).
  void setCommon(std::string glsl) { common_ = std::move(glsl); }
  // Register or replace; compiled on first draw.
  void add(EffectDef def);
  const EffectDef* find(const std::string& name) const;
  bool init(std::string& err);

  // Draw one instance over its box. `surface` is a texture holding the
  // surface so far (backdrop, filter) or 0 (source).
  void draw(const json::Value& inst, int pageW, int pageH, int drawW, int drawH, float time,
            const EffectHook& hook, GLuint surface);

 private:
  struct Program {
    GLuint prog = 0;
    bool failed = false;
    std::map<std::string, GLint> loc;
    GLint uBox = -1, uRadius = -1, uRes = -1, uTime = -1, uDraw = -1, uSrc = -1, uEvents = -1, uEventCount = -1;
  };
  Program* program(const std::string& name);

  std::string common_;
  std::map<std::string, EffectDef> defs_;
  std::map<std::string, std::unique_ptr<Program>> programs_;
  GLuint vao_ = 0, vbo_ = 0;
};

}  // namespace gl
}  // namespace evg
