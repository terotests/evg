// SPDX-License-Identifier: MIT
// See EvgGlText.h.

#include "EvgGlText.h"

#include <algorithm>
#include <cmath>
#include <fstream>
#include <iterator>

#define STB_TRUETYPE_IMPLEMENTATION
#define STBTT_STATIC
#include "../third_party/stb_truetype.h"

namespace evg {
namespace gl {

namespace {

const char* TEXT_FRAG = R"GLSL(#version 330 core
in vec2 vTex;
out vec4 o;
uniform sampler2D uAtlas;
uniform vec4 uColor;
void main() {
  o = vec4(uColor.rgb, uColor.a * texture(uAtlas, vTex).r);
}
)GLSL";

unsigned nextCodepoint(const std::string& s, size_t& i) {
  unsigned char c = (unsigned char)s[i++];
  if (c < 0x80) return c;
  int extra = c >= 0xF0 ? 3 : c >= 0xE0 ? 2 : c >= 0xC0 ? 1 : 0;
  unsigned cp = c & (0x3F >> extra);
  while (extra-- > 0 && i < s.size()) cp = (cp << 6) | ((unsigned char)s[i++] & 0x3F);
  return cp;
}

std::string lower(std::string s) {
  std::transform(s.begin(), s.end(), s.begin(), ::tolower);
  return s;
}

}  // namespace

Text::~Text() {
  for (auto& f : faces_) delete (stbtt_fontinfo*)f->info;
}

bool Text::addFace(const std::string& family, bool bold, bool italic, std::vector<unsigned char> bytes, std::string* err) {
  auto face = std::make_unique<Face>();
  face->family = family;
  face->bold = bold;
  face->italic = italic;
  face->data = std::move(bytes);
  auto* info = new stbtt_fontinfo;
  if (face->data.empty() || !stbtt_InitFont(info, face->data.data(), stbtt_GetFontOffsetForIndex(face->data.data(), 0))) {
    delete info;
    if (err) *err = "not a font: " + family;
    return false;
  }
  int a, d, g;
  stbtt_GetFontVMetrics(info, &a, &d, &g);
  float em = stbtt_ScaleForMappingEmToPixels(info, 1.f);
  face->ascent = a * em;
  face->descent = d * em;
  face->info = info;
  faces_.push_back(std::move(face));
  return true;
}

bool Text::addFaceFile(const std::string& family, bool bold, bool italic, const std::string& path, std::string* err) {
  std::ifstream f(path, std::ios::binary);
  if (!f) {
    if (err) *err = "cannot read " + path;
    return false;
  }
  std::vector<unsigned char> bytes((std::istreambuf_iterator<char>(f)), std::istreambuf_iterator<char>());
  return addFace(family, bold, italic, std::move(bytes), err);
}

bool Text::init(std::string& err) {
  prog_ = linkProgram(kPageVertexShader, TEXT_FRAG, err);
  if (!prog_) return false;
  uRes_ = glGetUniformLocation(prog_, "uRes");
  uAtlas_ = glGetUniformLocation(prog_, "uAtlas");
  uColor_ = glGetUniformLocation(prog_, "uColor");
  atlas_.assign((size_t)atlasW_ * atlasH_, 0);
  glGenTextures(1, &tex_);
  glBindTexture(GL_TEXTURE_2D, tex_);
  glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
  glTexImage2D(GL_TEXTURE_2D, 0, GL_R8, atlasW_, atlasH_, 0, GL_RED, GL_UNSIGNED_BYTE, atlas_.data());
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
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

// "Noto Sans-Bold" is the measurer's name for the bold face of "Noto Sans";
// the weight may also come on its own.
int Text::faceFor(const json::Value& cmd) const {
  if (faces_.empty()) return -1;
  std::string font = cmd.strOr("font", "");
  std::string family = font;
  bool bold = cmd.strOr("weight", "") == "bold";
  bool italic = cmd.numOr("italic", 0) != 0;
  size_t dash = font.rfind('-');
  if (dash != std::string::npos) {
    std::string style = lower(font.substr(dash + 1));
    if (style.find("bold") != std::string::npos) bold = true;
    if (style.find("italic") != std::string::npos) italic = true;
    family = font.substr(0, dash);
  }
  family = lower(family);
  int best = -1, bestScore = -1;
  for (int i = 0; i < (int)faces_.size(); i++) {
    const Face& f = *faces_[i];
    int score = (lower(f.family) == family ? 4 : 0) + (f.bold == bold ? 2 : 0) + (f.italic == italic ? 1 : 0);
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  }
  return best;
}

const Text::Glyph& Text::glyph(int face, int px, unsigned cp) {
  unsigned long long key = ((unsigned long long)face << 52) | ((unsigned long long)px << 32) | cp;
  auto it = glyphs_.find(key);
  if (it != glyphs_.end()) return it->second;
  auto* info = (stbtt_fontinfo*)faces_[face]->info;
  float scale = stbtt_ScaleForMappingEmToPixels(info, (float)px);
  int adv, lsb, x0, y0, x1, y1;
  stbtt_GetCodepointHMetrics(info, (int)cp, &adv, &lsb);
  stbtt_GetCodepointBitmapBox(info, (int)cp, scale, scale, &x0, &y0, &x1, &y1);
  Glyph g{};
  g.adv = adv * scale;
  int gw = x1 - x0, gh = y1 - y0;
  if (gw > 0 && gh > 0 && gw < atlasW_ - 2 && gh < atlasH_ - 2) {
    if (penX_ + gw + 1 >= atlasW_) {
      penX_ = 1;
      penY_ += rowH_ + 1;
      rowH_ = 0;
    }
    if (penY_ + gh + 1 >= atlasH_) {
      // Full: start again; every glyph is rasterised anew as it is asked for.
      glyphs_.clear();
      std::fill(atlas_.begin(), atlas_.end(), 0);
      penX_ = penY_ = 1;
      rowH_ = 0;
      return glyph(face, px, cp);
    }
    stbtt_MakeCodepointBitmap(info, &atlas_[(size_t)penY_ * atlasW_ + penX_], gw, gh, atlasW_, scale, scale, (int)cp);
    g.u0 = (float)penX_ / atlasW_;
    g.v0 = (float)penY_ / atlasH_;
    g.u1 = (float)(penX_ + gw) / atlasW_;
    g.v1 = (float)(penY_ + gh) / atlasH_;
    g.w = (float)gw;
    g.h = (float)gh;
    g.xoff = (float)x0;
    g.yoff = (float)y0;
    g.ok = true;
    penX_ += gw + 1;
    rowH_ = std::max(rowH_, gh);
    dirty_ = true;
  }
  return glyphs_[key] = g;
}

void Text::draw(const json::Value& c, int pageW, int pageH, float dpr) {
  std::string s = c.strOr("text", "");
  int face = faceFor(c);
  if (s.empty() || face < 0) return;
  Face& f = *faces_[face];
  auto* info = (stbtt_fontinfo*)f.info;
  float size = (float)c.numOr("size", 14);
  int px = std::max(1, (int)std::lround(size * dpr));
  float x = (float)c.numOr("x", 0), y = (float)c.numOr("y", 0), h = (float)c.numOr("h", size);
  float spacing = (float)c.numOr("ls", 0);
  float content = (f.ascent - f.descent) * size;
  float baseline = y + (h - content) / 2 + f.ascent * size;
  float col[4] = {0, 0, 0, 1};
  if (const json::Value* cv = c.get("c")) {
    if (cv->arr.size() >= 3) {
      for (int i = 0; i < 3; i++) col[i] = (float)cv->arr[i].num / 255.f;
      col[3] = cv->arr.size() > 3 ? (float)cv->arr[3].num : 1.f;
    }
  }

  std::vector<float> v;
  float pen = x;
  float emPx = stbtt_ScaleForMappingEmToPixels(info, (float)px);
  int prev = 0;
  for (size_t i = 0; i < s.size();) {
    unsigned cp = nextCodepoint(s, i);
    if (prev) pen += stbtt_GetCodepointKernAdvance(info, prev, (int)cp) * emPx / dpr;
    const Glyph& g = glyph(face, px, cp);
    if (g.ok) {
      float gx = pen + g.xoff / dpr, gy = baseline + g.yoff / dpr, gw = g.w / dpr, gh = g.h / dpr;
      float q[24] = {gx, gy, g.u0, g.v0, gx + gw, gy, g.u1, g.v0, gx + gw, gy + gh, g.u1, g.v1,
                     gx, gy, g.u0, g.v0, gx + gw, gy + gh, g.u1, g.v1, gx, gy + gh, g.u0, g.v1};
      v.insert(v.end(), q, q + 24);
    }
    pen += g.adv / dpr + spacing;
    prev = (int)cp;
  }
  if (v.empty()) return;
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_2D, tex_);
  if (dirty_) {
    glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
    glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, atlasW_, atlasH_, GL_RED, GL_UNSIGNED_BYTE, atlas_.data());
    dirty_ = false;
  }
  glUseProgram(prog_);
  glUniform2f(uRes_, (float)pageW, (float)pageH);
  glUniform1i(uAtlas_, 0);
  glUniform4fv(uColor_, 1, col);
  glBindVertexArray(vao_);
  glBindBuffer(GL_ARRAY_BUFFER, vbo_);
  glBufferData(GL_ARRAY_BUFFER, v.size() * sizeof(float), v.data(), GL_STREAM_DRAW);
  glDrawArrays(GL_TRIANGLES, 0, (GLsizei)(v.size() / 4));
}

}  // namespace gl
}  // namespace evg
