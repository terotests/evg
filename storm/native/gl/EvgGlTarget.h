// SPDX-License-Identifier: MIT
//
// Where the painter draws, and copies of what it drew.
//
//   Target       an offscreen framebuffer, multisampled or not, with the
//                stencil the path fills need. A window's own multisampling
//                depends on the visuals the display offers (an X server may
//                have none for a shaped window); a target of our own does not.
//                `resolve` puts it on the window.
//   SurfaceCopy  the surface so far, as a texture a backdrop or filter effect
//                samples: the bound framebuffer blitted (and resolved) into a
//                single-sampled texture the target's size.
//   readPixels   a whole target as RGBA, top row first: an image, a window
//                shape mask, an icon.

#pragma once
#include <vector>

#include "evg_gl.h"

namespace evg {
namespace gl {

class Target {
 public:
  ~Target();
  // (Re)allocate for w x h pixels with up to `samples` samples (0 or 1: none).
  void ensure(int w, int h, int samples = 4);
  void bind() const;
  // Blit to framebuffer `to` (0: the window), resolving the samples.
  void resolve(GLuint to = 0) const;
  // RGBA, top row first. A multisampled target is resolved first.
  std::vector<unsigned char> readPixels();
  GLuint fbo() const { return fbo_; }
  int width() const { return w_; }
  int height() const { return h_; }
  int samples() const { return samples_; }

 private:
  void release();
  GLuint fbo_ = 0, color_ = 0, depth_ = 0;
  int w_ = 0, h_ = 0, samples_ = 0;
};

class SurfaceCopy {
 public:
  ~SurfaceCopy();
  // Copy the framebuffer bound for drawing (w x h) into the texture and
  // leave that framebuffer bound again. Returns the texture.
  GLuint copy(int w, int h);

 private:
  GLuint fbo_ = 0, tex_ = 0;
  int w_ = 0, h_ = 0;
};

}  // namespace gl
}  // namespace evg
