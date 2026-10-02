// SPDX-License-Identifier: MIT
//
// See EvgGlPainter.h. The boxes are signed-distance rounded rectangles, the
// same function evg-webgl.js uses; paths are filled through the stencil
// buffer, so a concave or holed outline is exact.

#include "EvgGlPainter.h"

#include <algorithm>
#include <cmath>
#include <map>

namespace evg {
namespace gl {

namespace {

// uMode: 0 filled rounded box, 1 rounded ring of uThick, 2 soft shadow of
// uBlur, 3 no mask (stroke triangles, path cover). uGrad: -1 solid, 0 top to
// bottom, 1 left to right, across uBox.
const char* SHAPE_FRAG = R"GLSL(#version 330 core
in vec2 vP;
out vec4 o;
uniform vec4 uBox;
uniform float uRadius;
uniform vec4 uC1;
uniform vec4 uC2;
uniform int uGrad;
uniform int uMode;
uniform float uThick;
uniform float uBlur;
float sdBox(vec2 p) {
  vec2 h = uBox.zw * 0.5;
  vec2 c = uBox.xy + h;
  float r = min(uRadius, min(h.x, h.y));
  vec2 d = abs(p - c) - (h - vec2(r));
  return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
}
void main() {
  vec4 col = uC1;
  if (uGrad == 0) col = mix(uC1, uC2, clamp((vP.y - uBox.y) / max(uBox.w, 1.0), 0.0, 1.0));
  if (uGrad == 1) col = mix(uC1, uC2, clamp((vP.x - uBox.x) / max(uBox.z, 1.0), 0.0, 1.0));
  float cov = 1.0;
  if (uMode == 0) {
    cov = 1.0 - smoothstep(-0.5, 0.5, sdBox(vP));
  } else if (uMode == 1) {
    float d = sdBox(vP);
    cov = (1.0 - smoothstep(-0.5, 0.5, d)) * smoothstep(-0.5, 0.5, d + uThick);
  } else if (uMode == 2) {
    float b = max(uBlur, 0.5);
    cov = 1.0 - smoothstep(-b, b, sdBox(vP));
    cov *= cov;
  }
  o = vec4(col.rgb, col.a * cov);
}
)GLSL";

void color(const json::Value* c, float out[4]) {
  out[0] = out[1] = out[2] = 0;
  out[3] = 1;
  if (!c || c->type != json::Value::Arr || c->arr.size() < 3) return;
  for (int i = 0; i < 3; i++) out[i] = (float)c->arr[i].num / 255.f;
  out[3] = c->arr.size() > 3 ? (float)c->arr[3].num : 1.f;
}

// The rings of a path command: `pts` is x,y pairs and `ends` the index (into
// pts) where each ring stops; no `ends` is one ring.
std::vector<std::vector<float>> rings(const json::Value& c) {
  std::vector<std::vector<float>> out;
  const json::Value* pts = c.get("pts");
  if (!pts || pts->type != json::Value::Arr) return out;
  std::vector<size_t> ends;
  if (const json::Value* e = c.get("ends")) {
    for (const json::Value& v : e->arr) ends.push_back((size_t)v.num);
  }
  if (ends.empty()) ends.push_back(pts->arr.size());
  size_t start = 0;
  for (size_t stop : ends) {
    std::vector<float> ring;
    for (size_t k = start; k < stop && k < pts->arr.size(); k++) ring.push_back((float)pts->arr[k].num);
    if (ring.size() >= 4) out.push_back(std::move(ring));
    start = stop;
  }
  return out;
}

int gradOf(const json::Value& c) { return c.get("gd") ? (int)c.numOr("gd", 0) : -1; }

}  // namespace

bool Painter::init(std::string& err) {
  prog_ = linkProgram(kPageVertexShader, SHAPE_FRAG, err);
  if (!prog_) return false;
  uRes_ = glGetUniformLocation(prog_, "uRes");
  uBox_ = glGetUniformLocation(prog_, "uBox");
  uRadius_ = glGetUniformLocation(prog_, "uRadius");
  uC1_ = glGetUniformLocation(prog_, "uC1");
  uC2_ = glGetUniformLocation(prog_, "uC2");
  uGrad_ = glGetUniformLocation(prog_, "uGrad");
  uMode_ = glGetUniformLocation(prog_, "uMode");
  uThick_ = glGetUniformLocation(prog_, "uThick");
  uBlur_ = glGetUniformLocation(prog_, "uBlur");
  glGenVertexArrays(1, &vao_);
  glGenBuffers(1, &vbo_);
  glBindVertexArray(vao_);
  glBindBuffer(GL_ARRAY_BUFFER, vbo_);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(1);
  glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));
  return text_.init(err) && effects_.init(err);
}

void Painter::quad(float x, float y, float w, float h) {
  float v[24] = {x, y, 0, 0, x + w, y, 1, 0, x + w, y + h, 1, 1, x, y, 0, 0, x + w, y + h, 1, 1, x, y + h, 0, 1};
  glBindVertexArray(vao_);
  glBindBuffer(GL_ARRAY_BUFFER, vbo_);
  glBufferData(GL_ARRAY_BUFFER, sizeof v, v, GL_STREAM_DRAW);
  glDrawArrays(GL_TRIANGLES, 0, 6);
}

void Painter::tris(const std::vector<float>& xy) {
  if (xy.size() < 6) return;
  std::vector<float> v;
  v.reserve(xy.size() * 2);
  for (size_t i = 0; i + 1 < xy.size(); i += 2) v.insert(v.end(), {xy[i], xy[i + 1], 0.f, 0.f});
  glBindVertexArray(vao_);
  glBindBuffer(GL_ARRAY_BUFFER, vbo_);
  glBufferData(GL_ARRAY_BUFFER, v.size() * sizeof(float), v.data(), GL_STREAM_DRAW);
  glDrawArrays(GL_TRIANGLES, 0, (GLsizei)(v.size() / 4));
}

// The shape program with its uniforms set (the quad is the caller's).
void Painter::shape(float x, float y, float w, float h, float radius, const float c1[4], const float c2[4], int grad,
                    int mode, float thick, float blur) {
  glUseProgram(prog_);
  glUniform2f(uRes_, (float)frame_.pageW, (float)frame_.pageH);
  glUniform4f(uBox_, x, y, w, h);
  glUniform1f(uRadius_, radius);
  glUniform4fv(uC1_, 1, c1);
  glUniform4fv(uC2_, 1, c2 ? c2 : c1);
  glUniform1i(uGrad_, grad);
  glUniform1i(uMode_, mode);
  glUniform1f(uThick_, thick);
  glUniform1f(uBlur_, blur);
}

void Painter::rect(const json::Value& c) {
  float x = (float)c.numOr("x", 0), y = (float)c.numOr("y", 0);
  float w = (float)c.numOr("w", 0), h = (float)c.numOr("h", 0);
  float r = (float)c.numOr("r", 0);
  if (const json::Value* rc = c.get("rc")) {
    if (rc->arr.size() == 4) r = (float)rc->arr[0].num;
  }
  if (const json::Value* sh = c.get("sh")) {
    float sc[4];
    color(sh->get("c"), sc);
    float blur = (float)sh->numOr("blur", 0);
    float sx = x + (float)sh->numOr("x", 0), sy = y + (float)sh->numOr("y", 0);
    shape(sx, sy, w, h, r, sc, nullptr, -1, 2, 0, blur);
    float pad = blur * 2 + 2;
    quad(sx - pad, sy - pad, w + pad * 2, h + pad * 2);
  }
  float c1[4], c2[4];
  color(c.get("c"), c1);
  color(c.get("c2"), c2);
  int grad = gradOf(c);
  if (c1[3] <= 0 && (grad < 0 || c2[3] <= 0)) return;
  shape(x, y, w, h, r, c1, c2, grad, 0, 0, 0);
  quad(x - 1, y - 1, w + 2, h + 2);
}

void Painter::border(const json::Value& c) {
  float x = (float)c.numOr("x", 0), y = (float)c.numOr("y", 0);
  float w = (float)c.numOr("w", 0), h = (float)c.numOr("h", 0);
  float c1[4];
  color(c.get("c"), c1);
  shape(x, y, w, h, (float)c.numOr("r", 0), c1, nullptr, -1, 1, (float)c.numOr("t", 1), 0);
  quad(x - 1, y - 1, w + 2, h + 2);
}

void Painter::pathFill(const json::Value& c) {
  auto rs = rings(c);
  if (rs.empty()) return;
  float c1[4], c2[4];
  color(c.get("c"), c1);
  color(c.get("c2"), c2);
  float minX = 1e9f, minY = 1e9f, maxX = -1e9f, maxY = -1e9f;

  // 1. Each ring as a fan into the stencil: the winding (or its parity) is
  //    left in each pixel, and no colour is written.
  shape(0, 0, 0, 0, 0, c1, nullptr, -1, 3, 0, 0);
  glEnable(GL_STENCIL_TEST);
  glColorMask(GL_FALSE, GL_FALSE, GL_FALSE, GL_FALSE);
  glStencilMask(0xFF);
  glStencilFunc(GL_ALWAYS, 0, 0xFF);
  if (c.numOr("eo", 0) != 0) {
    glStencilOp(GL_KEEP, GL_KEEP, GL_INVERT);
  } else {
    glStencilOpSeparate(GL_FRONT, GL_KEEP, GL_KEEP, GL_INCR_WRAP);
    glStencilOpSeparate(GL_BACK, GL_KEEP, GL_KEEP, GL_DECR_WRAP);
  }
  for (auto& ring : rs) {
    std::vector<float> t;
    for (size_t k = 2; k + 3 < ring.size(); k += 2) t.insert(t.end(), {ring[0], ring[1], ring[k], ring[k + 1], ring[k + 2], ring[k + 3]});
    for (size_t k = 0; k + 1 < ring.size(); k += 2) {
      minX = std::min(minX, ring[k]);
      maxX = std::max(maxX, ring[k]);
      minY = std::min(minY, ring[k + 1]);
      maxY = std::max(maxY, ring[k + 1]);
    }
    tris(t);
  }

  // 2. One cover quad where the stencil is set, which also clears it.
  glColorMask(GL_TRUE, GL_TRUE, GL_TRUE, GL_TRUE);
  glStencilFunc(GL_NOTEQUAL, 0, 0xFF);
  glStencilOp(GL_ZERO, GL_ZERO, GL_ZERO);
  shape((float)c.numOr("x", 0), (float)c.numOr("y", 0), (float)c.numOr("w", 0), (float)c.numOr("h", 0), 0, c1, c2,
        gradOf(c), 3, 0, 0);
  quad(minX - 1, minY - 1, maxX - minX + 2, maxY - minY + 2);
  glDisable(GL_STENCIL_TEST);
}

void Painter::stroke(const json::Value& c) {
  auto rs = rings(c);
  float half = std::max(0.5f, (float)c.numOr("t", 1) / 2);
  float c1[4];
  color(c.get("c"), c1);
  shape(0, 0, 0, 0, 0, c1, nullptr, -1, 3, 0, 0);
  // Each segment a quad, lengthened by half the width at both ends so the
  // joins between short flattened segments close. Overlaps are drawn twice,
  // which only shows on a translucent stroke.
  std::vector<float> t;
  for (auto& ring : rs) {
    for (size_t k = 0; k + 3 < ring.size(); k += 2) {
      float x1 = ring[k], y1 = ring[k + 1], x2 = ring[k + 2], y2 = ring[k + 3];
      float dx = x2 - x1, dy = y2 - y1, len = std::sqrt(dx * dx + dy * dy);
      if (len < 1e-4f) continue;
      float ux = dx / len * half, uy = dy / len * half, nx = -uy, ny = ux;
      x1 -= ux;
      y1 -= uy;
      x2 += ux;
      y2 += uy;
      t.insert(t.end(), {x1 + nx, y1 + ny, x2 + nx, y2 + ny, x2 - nx, y2 - ny, x1 + nx, y1 + ny, x2 - nx, y2 - ny, x1 - nx, y1 - ny});
    }
  }
  tris(t);
}

void Painter::applyClip() {
  if (clip_.empty()) {
    glDisable(GL_SCISSOR_TEST);
    return;
  }
  size_t n = clip_.size();
  float x = clip_[n - 4], y = clip_[n - 3], w = clip_[n - 2], h = clip_[n - 1];
  glEnable(GL_SCISSOR_TEST);
  glScissor((int)std::floor(x * dpr_), (int)std::floor(frame_.drawH - (y + h) * dpr_),
            std::max(0, (int)std::ceil(w * dpr_)), std::max(0, (int)std::ceil(h * dpr_)));
}

void Painter::pushClip(const json::Value& c) {
  float x = (float)c.numOr("x", 0), y = (float)c.numOr("y", 0);
  float x2 = x + (float)c.numOr("w", 0), y2 = y + (float)c.numOr("h", 0);
  size_t n = clip_.size();
  if (n >= 4) {  // nested clips intersect
    x = std::max(x, clip_[n - 4]);
    y = std::max(y, clip_[n - 3]);
    x2 = std::min(x2, clip_[n - 4] + clip_[n - 2]);
    y2 = std::min(y2, clip_[n - 3] + clip_[n - 1]);
  }
  clip_.insert(clip_.end(), {x, y, std::max(0.f, x2 - x), std::max(0.f, y2 - y)});
  applyClip();
}

void Painter::popClip() {
  if (clip_.size() >= 4) clip_.resize(clip_.size() - 4);
  applyClip();
}

void Painter::drawEffect(const json::Value& inst, Layer layer) {
  GLuint surface = 0;
  if (layer != Layer::Source) {
    // A copy is a blit, and a blit is scissored: copy the whole surface.
    glDisable(GL_SCISSOR_TEST);
    surface = surface_.copy(frame_.drawW, frame_.drawH);
    applyClip();
  }
  effects_.draw(inst, frame_.pageW, frame_.pageH, frame_.drawW, frame_.drawH, frame_.time, frame_.effects, surface);
}

void Painter::draw(const json::Value& list, const Frame& frame) {
  frame_ = frame;
  dpr_ = frame.pageW > 0 ? (float)frame.drawW / (float)frame.pageW : 1.f;
  clip_.clear();

  glViewport(0, 0, frame.drawW, frame.drawH);
  glDisable(GL_SCISSOR_TEST);
  glDisable(GL_DEPTH_TEST);
  glClearColor(0, 0, 0, 0);
  glClearStencil(0);
  glStencilMask(0xFF);
  glClear(GL_COLOR_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
  glEnable(GL_BLEND);
  // Straight-alpha sources, premultiplied result: over a transparent clear
  // this leaves rgb * a in the buffer, which a transparent window expects.
  glBlendFuncSeparate(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA, GL_ONE, GL_ONE_MINUS_SRC_ALPHA);

  std::map<std::string, const json::Value*> byId;
  std::vector<const json::Value*> filters;
  if (const json::Value* e = list.get("effects")) {
    for (const json::Value& inst : e->arr) {
      byId[inst.strOr("id", "")] = &inst;
      const EffectDef* def = effects_.find(inst.strOr("kind", ""));
      if (def && def->layer == Layer::Filter) filters.push_back(&inst);
    }
  }

  if (const json::Value* cmds = list.get("cmds")) {
    for (const json::Value& c : cmds->arr) {
      switch ((int)c.numOr("k", -1)) {
        case 0: {
          rect(c);
          std::string id = c.strOr("efx", "");
          if (!id.empty()) {
            auto it = byId.find(id);
            if (it != byId.end()) {
              const EffectDef* def = effects_.find(it->second->strOr("kind", ""));
              if (def && def->layer != Layer::Filter) drawEffect(*it->second, def->layer);
            }
          }
          break;
        }
        case 1: border(c); break;
        case 3: text_.draw(c, frame_.pageW, frame_.pageH, dpr_); break;
        case 4: pushClip(c); break;
        case 5: popClip(); break;
        case 6: pathFill(c); break;
        case 7: stroke(c); break;
        default: break;
      }
    }
  }

  // The filters, over the finished surface, in the order the list declares.
  clip_.clear();
  applyClip();
  for (const json::Value* inst : filters) drawEffect(*inst, Layer::Filter);
  glDisable(GL_SCISSOR_TEST);
}

}  // namespace gl
}  // namespace evg
