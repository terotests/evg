// SPDX-License-Identifier: MIT
// See EvgGlTarget.h.

#include "EvgGlTarget.h"

#include <algorithm>
#include <cstring>

namespace evg {
namespace gl {

Target::~Target() { release(); }

void Target::release() {
  if (fbo_) glDeleteFramebuffers(1, &fbo_);
  if (color_) glDeleteRenderbuffers(1, &color_);
  if (depth_) glDeleteRenderbuffers(1, &depth_);
  fbo_ = color_ = depth_ = 0;
}

void Target::ensure(int w, int h, int samples) {
  GLint maxSamples = 0;
  glGetIntegerv(GL_MAX_SAMPLES, &maxSamples);
  int s = std::max(0, std::min(samples, (int)maxSamples));
  if (s == 1) s = 0;
  if (fbo_ && w == w_ && h == h_ && s == samples_) return;
  release();
  w_ = w;
  h_ = h;
  samples_ = s;
  GLint prev = 0;
  glGetIntegerv(GL_DRAW_FRAMEBUFFER_BINDING, &prev);
  glGenFramebuffers(1, &fbo_);
  glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
  glGenRenderbuffers(1, &color_);
  glBindRenderbuffer(GL_RENDERBUFFER, color_);
  if (s) glRenderbufferStorageMultisample(GL_RENDERBUFFER, s, GL_RGBA8, w, h);
  else glRenderbufferStorage(GL_RENDERBUFFER, GL_RGBA8, w, h);
  glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_RENDERBUFFER, color_);
  glGenRenderbuffers(1, &depth_);
  glBindRenderbuffer(GL_RENDERBUFFER, depth_);
  if (s) glRenderbufferStorageMultisample(GL_RENDERBUFFER, s, GL_DEPTH24_STENCIL8, w, h);
  else glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH24_STENCIL8, w, h);
  glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, depth_);
  glBindFramebuffer(GL_FRAMEBUFFER, (GLuint)prev);
}

void Target::bind() const { glBindFramebuffer(GL_FRAMEBUFFER, fbo_); }

void Target::resolve(GLuint to) const {
  glBindFramebuffer(GL_READ_FRAMEBUFFER, fbo_);
  glBindFramebuffer(GL_DRAW_FRAMEBUFFER, to);
  glBlitFramebuffer(0, 0, w_, h_, 0, 0, w_, h_, GL_COLOR_BUFFER_BIT, GL_NEAREST);
  glBindFramebuffer(GL_FRAMEBUFFER, to);
}

std::vector<unsigned char> Target::readPixels() {
  std::vector<unsigned char> up((size_t)w_ * h_ * 4);
  if (samples_) {
    Target plain;
    plain.ensure(w_, h_, 0);
    resolve(plain.fbo());
    glBindFramebuffer(GL_READ_FRAMEBUFFER, plain.fbo());
    glReadPixels(0, 0, w_, h_, GL_RGBA, GL_UNSIGNED_BYTE, up.data());
  } else {
    glBindFramebuffer(GL_READ_FRAMEBUFFER, fbo_);
    glReadPixels(0, 0, w_, h_, GL_RGBA, GL_UNSIGNED_BYTE, up.data());
  }
  glBindFramebuffer(GL_FRAMEBUFFER, 0);
  std::vector<unsigned char> rgba(up.size());
  for (int y = 0; y < h_; y++) std::memcpy(&rgba[(size_t)y * w_ * 4], &up[(size_t)(h_ - 1 - y) * w_ * 4], (size_t)w_ * 4);
  return rgba;
}

SurfaceCopy::~SurfaceCopy() {
  if (fbo_) glDeleteFramebuffers(1, &fbo_);
  if (tex_) glDeleteTextures(1, &tex_);
}

GLuint SurfaceCopy::copy(int w, int h) {
  GLint from = 0;
  glGetIntegerv(GL_DRAW_FRAMEBUFFER_BINDING, &from);
  if (!tex_ || w != w_ || h != h_) {
    if (fbo_) glDeleteFramebuffers(1, &fbo_);
    if (tex_) glDeleteTextures(1, &tex_);
    glGenTextures(1, &tex_);
    glBindTexture(GL_TEXTURE_2D, tex_);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    // A refraction near the edge samples past it: repeat the edge, not black.
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glGenFramebuffers(1, &fbo_);
    glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, tex_, 0);
    w_ = w;
    h_ = h;
  }
  glBindFramebuffer(GL_READ_FRAMEBUFFER, (GLuint)from);
  glBindFramebuffer(GL_DRAW_FRAMEBUFFER, fbo_);
  glBlitFramebuffer(0, 0, w, h, 0, 0, w, h, GL_COLOR_BUFFER_BIT, GL_NEAREST);
  glBindFramebuffer(GL_FRAMEBUFFER, (GLuint)from);
  return tex_;
}

}  // namespace gl
}  // namespace evg
