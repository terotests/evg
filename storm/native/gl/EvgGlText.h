// SPDX-License-Identifier: MIT
//
// Text for the native painter: the faces a host registers, and one glyph
// atlas they are rasterised into (stb_truetype), once per glyph and pixel
// size.
//
// FACES ARE THE HOST'S. The display list names a family and a weight
// (`"font": "Noto Sans-Bold"`, `"weight": "bold"`); this module has no font
// of its own and no font directory, so a host registers the faces its layout
// was measured with — the same ones, or the text will not fit the boxes it
// was laid out in. A run whose family is not registered is drawn in the first
// face registered with its weight, then in the first face at all.
//
// Text is positioned the way CSS positions a line: the face's ascent-to-
// descent box centred in the command's line height (half-leading), baseline
// below that.

#pragma once
#include <map>
#include <memory>
#include <string>
#include <vector>

#include "../evg_json.h"
#include "evg_gl.h"

namespace evg {
namespace gl {

class Text {
 public:
  ~Text();
  // A face, as the bytes of a TrueType/OpenType file. `family` is what the
  // display list calls it ("Noto Sans"); `bold` / `italic` select within it.
  bool addFace(const std::string& family, bool bold, bool italic, std::vector<unsigned char> bytes, std::string* err = nullptr);
  bool addFaceFile(const std::string& family, bool bold, bool italic, const std::string& path, std::string* err = nullptr);
  bool empty() const { return faces_.empty(); }

  bool init(std::string& err);
  // Draw a k3 command. pageW/H and dpr as the painter's frame.
  void draw(const json::Value& cmd, int pageW, int pageH, float dpr);

 private:
  struct Face {
    std::string family;
    bool bold = false, italic = false;
    std::vector<unsigned char> data;
    void* info = nullptr;  // stbtt_fontinfo
    float ascent = 0, descent = 0;
  };
  struct Glyph { float u0, v0, u1, v1, w, h, xoff, yoff, adv; bool ok; };

  int faceFor(const json::Value& cmd) const;
  const Glyph& glyph(int face, int px, unsigned cp);

  std::vector<std::unique_ptr<Face>> faces_;  // stable addresses: stb keeps pointers into the bytes
  std::map<unsigned long long, Glyph> glyphs_;
  std::vector<unsigned char> atlas_;
  int atlasW_ = 1024, atlasH_ = 1024, penX_ = 1, penY_ = 1, rowH_ = 0;
  bool dirty_ = false;
  GLuint prog_ = 0, tex_ = 0, vao_ = 0, vbo_ = 0;
  GLint uRes_ = -1, uAtlas_ = -1, uColor_ = -1;
};

}  // namespace gl
}  // namespace evg
