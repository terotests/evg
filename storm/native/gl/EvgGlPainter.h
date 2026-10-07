// SPDX-License-Identifier: MIT
//
// An EVG display list drawn with OpenGL 3.3 core: the native counterpart of
// lib/evg/gl/evg-webgl.js. It reads the list as `EVGDisplayList.toJson`
// writes it, so any Ranger app compiled to C++ (or anything that can hand it
// that JSON) can be painted.
//
//   k0 rect      solid or 2-stop linear gradient, rounded, drop shadow / glow;
//                and the surface effect the rect carries (`efx`)
//   k1 border    rounded ring
//   k3 text      through Text (faces the host registers)
//   k4 / k5      rectangular clip push / pop (scissor)
//   k6 path fill stencil-then-cover, even-odd or non-zero, with a gradient
//   k7 stroke    the flattened rings as thick segments
//
//   k2 image     a texture the host supplies for `src` (Frame::images),
//                cropped (`cu`), mirrored (`fx`, `fy`), rounded (`r`)
//
// Any command may be turned (`rot` degrees about `rox`,`roy`, or about its
// box's centre). Not drawn yet: backdrop blur on a rect, per-corner radii
// (the first is used), dashed strokes. A command it does not draw is skipped.
//
// A list can be drawn somewhere other than the whole window, as a slide is on
// the stage and in the strip: `ox`, `oy` and `scale` place the list's page in
// the window's (`page * scale + o`), and `clear` false draws over what is
// there.
//
// The painter draws into whatever framebuffer is bound — a Target of its own
// (EvgGlTarget.h) or the window — clears it to transparent, and blends so
// that it holds premultiplied colour, which is what a transparent window
// composites. Effects that read the surface (backdrop, filter) copy the bound
// framebuffer; the pixels outside their boxes are untouched.
//
//   evg::gl::Painter painter;
//   painter.text().addFaceFile("Noto Sans", false, false, "NotoSans-Regular.ttf");
//   painter.effects().add(myEffect);
//   painter.init(err);                      // with a GL 3.3 context current
//   …
//   evg::json::Value list;
//   evg::json::Parser(app->displayListJson()).parse(list);
//   painter.draw(list, {pageW, pageH, drawW, drawH, seconds, hook});

#pragma once
#include <functional>
#include <string>
#include <vector>

#include "../evg_json.h"
#include "EvgGlEffects.h"
#include "EvgGlTarget.h"
#include "EvgGlText.h"
#include "evg_gl.h"

namespace evg {
namespace gl {

// The texture for an image command's `src`, and its size in pixels; 0 when
// the host has none (yet): the command is skipped.
using ImageHook = std::function<GLuint(const std::string& src, int& w, int& h)>;

struct Frame {
  int pageW = 0, pageH = 0;  // the list's page, in points (the window's)
  int drawW = 0, drawH = 0;  // the framebuffer, in pixels (HiDPI: larger)
  float time = 0;            // seconds, for effects
  EffectHook effects;        // per-instance inputs, may be empty
  ImageHook images;          // textures for k2, may be empty
  float ox = 0, oy = 0;      // where the list's page starts in the window, points
  float scale = 1;           // how big the list's page is drawn
  bool clear = true;         // clear the framebuffer first
};

class Painter {
 public:
  Text& text() { return text_; }
  Effects& effects() { return effects_; }

  // With a GL 3.3 core context current. Text faces and effects may be added
  // before or after.
  bool init(std::string& err);
  void draw(const json::Value& list, const Frame& frame);

 private:
  void quad(float x, float y, float w, float h);
  void tris(const std::vector<float>& xy);
  void shape(float x, float y, float w, float h, float radius, const float c1[4], const float c2[4], int grad, int mode,
             float thick, float blur);
  void rect(const json::Value& c);
  void border(const json::Value& c);
  void pathFill(const json::Value& c);
  void stroke(const json::Value& c);
  void image(const json::Value& c);
  void turn(const json::Value& c, GLint loc);
  void pushClip(const json::Value& c);
  void popClip();
  void applyClip();
  void drawEffect(const json::Value& inst, Layer layer);

  Text text_;
  Effects effects_;
  SurfaceCopy surface_;
  GLuint prog_ = 0, vao_ = 0, vbo_ = 0;
  GLint uRes_, uBox_, uRadius_, uC1_, uC2_, uGrad_, uMode_, uThick_, uBlur_, uRot_;
  GLuint imgProg_ = 0;
  GLint iRes_, iRot_, iBox_, iRadius_, iTex_, iAlpha_, iUV_;
  float rot_[3] = {0, 0, 0};
  Frame frame_;
  float dpr_ = 1;     // framebuffer pixels per unit of the list's page
  float winDpr_ = 1;  // framebuffer pixels per window point
  std::vector<float> clip_;
};

}  // namespace gl
}  // namespace evg
