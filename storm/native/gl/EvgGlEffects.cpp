// SPDX-License-Identifier: MIT
// See EvgGlEffects.h.

#include "EvgGlEffects.h"

#include <algorithm>
#include <cstdio>

namespace evg {
namespace gl {

namespace {

// What every plugin gets, named as evg-webgl.js names it. `vUV` there is a
// varying; here the surface copy is the target's size, so it is the fragment's
// own position over the target.
const char* FX_PREAMBLE = R"GLSL(#version 330 core
in vec2 vP;
out vec4 outColor;
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform vec2 uDraw;
uniform vec4 uBox;
uniform float uRadius;
uniform float uTime;
#define MAX_EVENTS 8
uniform vec3 uEvents[MAX_EVENTS];
uniform int uEventCount;
#define vUV (gl_FragCoord.xy / uDraw)
vec2 fxPagePoint() { return vP; }
float fxBoxDistance(vec2 p) {
  vec2 halfBox = uBox.zw * 0.5;
  vec2 centre = uBox.xy + halfBox;
  float r = min(uRadius, min(halfBox.x, halfBox.y));
  vec2 d = abs(p - centre) - (halfBox - vec2(r));
  return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
}
float fxBoxCoverage(vec2 p) {
  return 1.0 - smoothstep(-0.75, 0.75, fxBoxDistance(p));
}
)GLSL";

const char* FX_MAIN_SOURCE = R"GLSL(
void main() {
  vec2 p = vP;
  vec2 local = (p - uBox.xy) / max(uBox.zw, vec2(1.0));
  vec4 c = fxColor(p, local);
  outColor = vec4(c.rgb, c.a * fxBoxCoverage(p));
}
)GLSL";

// A backdrop or a filter REPLACES the surface inside the box; blending is off
// and the edge mixes with what was there.
const char* FX_MAIN_REPLACE = R"GLSL(
void main() {
  vec2 p = vP;
  vec2 local = (p - uBox.xy) / max(uBox.zw, vec2(1.0));
  vec4 here = texture(uSrc, vUV);
  vec4 c = fxColor(p, local);
  outColor = mix(here, c, fxBoxCoverage(p));
}
)GLSL";

std::string glslName(std::string k) {
  for (char& c : k) {
    if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_')) c = '_';
  }
  return k;
}

}  // namespace

bool EffectDef::fromManifest(const json::Value& m, const std::string& glsl, EffectDef& out, std::string* err) {
  out = EffectDef{};
  out.name = m.strOr("name", "");
  if (out.name.empty()) {
    if (err) *err = "effect manifest has no name";
    return false;
  }
  std::string layer = m.strOr("layer", "source");
  out.layer = layer == "backdrop" ? Layer::Backdrop : layer == "filter" ? Layer::Filter : Layer::Source;
  if (const json::Value* p = m.get("params")) {
    for (auto& kv : p->obj) out.param(kv.first, kv.second.type == json::Value::Num ? (float)kv.second.num : 0.f);
  }
  if (const json::Value* a = m.get("arrays")) {
    for (auto& kv : a->obj) out.paramArray(kv.first, (int)kv.second.num);
  }
  // The player's first manifests said "bands": 32 for b0..b31.
  if (int bands = (int)m.numOr("bands", 0)) out.paramArray("b", bands);
  out.glsl = glsl;
  return true;
}

Effects::~Effects() = default;

void Effects::add(EffectDef def) {
  programs_.erase(def.name);  // recompiled from the new definition when next drawn
  defs_[def.name] = std::move(def);
}

const EffectDef* Effects::find(const std::string& name) const {
  auto it = defs_.find(name);
  return it == defs_.end() ? nullptr : &it->second;
}

bool Effects::init(std::string&) {
  glGenVertexArrays(1, &vao_);
  glGenBuffers(1, &vbo_);
  glBindVertexArray(vao_);
  glBindBuffer(GL_ARRAY_BUFFER, vbo_);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(1);
  glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));
  return true;
}

Effects::Program* Effects::program(const std::string& name) {
  auto found = programs_.find(name);
  if (found != programs_.end()) return found->second->failed ? nullptr : found->second.get();
  auto def = defs_.find(name);
  if (def == defs_.end()) return nullptr;
  auto prog = std::make_unique<Program>();
  std::string decls;
  for (auto& p : def->second.params) decls += "uniform float p_" + glslName(p.first) + ";\n";
  std::string err;
  const char* mainSrc = def->second.layer == Layer::Source ? FX_MAIN_SOURCE : FX_MAIN_REPLACE;
  prog->prog = linkProgram(kPageVertexShader, std::string(FX_PREAMBLE) + decls + common_ + def->second.glsl + mainSrc, err);
  if (!prog->prog) {
    // An effect that does not compile leaves its box as the list drew it,
    // as evg-webgl.js does, and says so once.
    std::fprintf(stderr, "evg-gl: surface effect '%s' did not compile:\n%s\n", name.c_str(), err.c_str());
    prog->failed = true;
    programs_[name] = std::move(prog);
    return nullptr;
  }
  for (auto& p : def->second.params) prog->loc[p.first] = glGetUniformLocation(prog->prog, ("p_" + glslName(p.first)).c_str());
  GLuint id = prog->prog;
  prog->uBox = glGetUniformLocation(id, "uBox");
  prog->uRadius = glGetUniformLocation(id, "uRadius");
  prog->uRes = glGetUniformLocation(id, "uRes");
  prog->uDraw = glGetUniformLocation(id, "uDraw");
  prog->uTime = glGetUniformLocation(id, "uTime");
  prog->uSrc = glGetUniformLocation(id, "uSrc");
  prog->uEvents = glGetUniformLocation(id, "uEvents");
  prog->uEventCount = glGetUniformLocation(id, "uEventCount");
  Program* raw = prog.get();
  programs_[name] = std::move(prog);
  return raw;
}

void Effects::draw(const json::Value& inst, int pageW, int pageH, int drawW, int drawH, float time,
                   const EffectHook& hook, GLuint surface) {
  std::string kind = inst.strOr("kind", "");
  const EffectDef* def = find(kind);
  Program* prog = def ? program(kind) : nullptr;
  if (!prog) return;
  const json::Value* box = inst.get("box");
  if (!box || box->arr.size() < 4) return;
  float x = (float)box->arr[0].num, y = (float)box->arr[1].num, w = (float)box->arr[2].num, h = (float)box->arr[3].num;

  // The plugin's defaults, then what the stylesheet wrote, then the host's.
  std::map<std::string, float> p;
  for (auto& d : def->params) p[d.first] = d.second;
  if (const json::Value* wrote = inst.get("p")) {
    for (auto& kv : wrote->obj) {
      if (kv.second.type == json::Value::Num) p[kv.first] = (float)kv.second.num;
    }
  }
  EffectInputs in;
  if (hook) hook(inst.strOr("id", ""), kind, in);
  for (auto& kv : in.params) p[kv.first] = kv.second;

  glUseProgram(prog->prog);
  glUniform2f(prog->uRes, (float)pageW, (float)pageH);
  glUniform2f(prog->uDraw, (float)drawW, (float)drawH);
  glUniform4f(prog->uBox, x, y, w, h);
  glUniform1f(prog->uRadius, (float)inst.numOr("r", 0));
  glUniform1f(prog->uTime, time);
  float ev[24] = {0};
  int n = (int)std::min<size_t>(8, in.events.size());
  for (int i = 0; i < 8; i++) {
    ev[i * 3] = i < n ? in.events[i].x : 0;
    ev[i * 3 + 1] = i < n ? in.events[i].y : 0;
    ev[i * 3 + 2] = i < n ? in.events[i].age : -1;
  }
  if (prog->uEvents >= 0) glUniform3fv(prog->uEvents, 8, ev);
  if (prog->uEventCount >= 0) glUniform1i(prog->uEventCount, n);
  for (auto& kv : prog->loc) {
    if (kv.second >= 0) glUniform1f(kv.second, p[kv.first]);
  }
  bool replace = def->layer != Layer::Source;
  if (replace) {
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, surface);
    if (prog->uSrc >= 0) glUniform1i(prog->uSrc, 0);
    glDisable(GL_BLEND);
  }
  float v[24] = {x, y, 0, 0, x + w, y, 1, 0, x + w, y + h, 1, 1, x, y, 0, 0, x + w, y + h, 1, 1, x, y + h, 0, 1};
  glBindVertexArray(vao_);
  glBindBuffer(GL_ARRAY_BUFFER, vbo_);
  glBufferData(GL_ARRAY_BUFFER, sizeof v, v, GL_STREAM_DRAW);
  glDrawArrays(GL_TRIANGLES, 0, 6);
  if (replace) glEnable(GL_BLEND);
}

}  // namespace gl
}  // namespace evg
