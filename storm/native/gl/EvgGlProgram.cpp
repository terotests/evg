// SPDX-License-Identifier: MIT

#include "evg_gl.h"

namespace evg {
namespace gl {

const char* kPageVertexShader = R"GLSL(#version 330 core
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec2 aUV;
uniform vec2 uRes;
// A command turned about a point: radians, then the point. A program that
// never sets it leaves it zero, which is no turn.
uniform vec3 uRot;
out vec2 vP;
out vec2 vTex;
void main() {
  vP = aPos;
  vTex = aUV;
  vec2 p = aPos;
  if (uRot.x != 0.0) {
    vec2 d = aPos - uRot.yz;
    float c = cos(uRot.x), s = sin(uRot.x);
    p = uRot.yz + vec2(d.x * c - d.y * s, d.x * s + d.y * c);
  }
  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
}
)GLSL";

GLuint compileShader(GLenum type, const std::string& src, std::string& err) {
  GLuint s = glCreateShader(type);
  const char* p = src.c_str();
  glShaderSource(s, 1, &p, nullptr);
  glCompileShader(s);
  GLint ok = 0;
  glGetShaderiv(s, GL_COMPILE_STATUS, &ok);
  if (!ok) {
    char log[4096];
    glGetShaderInfoLog(s, sizeof log, nullptr, log);
    err += log;
    glDeleteShader(s);
    return 0;
  }
  return s;
}

GLuint linkProgram(const std::string& vertex, const std::string& fragment, std::string& err) {
  GLuint v = compileShader(GL_VERTEX_SHADER, vertex, err);
  GLuint f = compileShader(GL_FRAGMENT_SHADER, fragment, err);
  if (!v || !f) {
    if (v) glDeleteShader(v);
    if (f) glDeleteShader(f);
    return 0;
  }
  GLuint p = glCreateProgram();
  glAttachShader(p, v);
  glAttachShader(p, f);
  glLinkProgram(p);
  glDeleteShader(v);
  glDeleteShader(f);
  GLint ok = 0;
  glGetProgramiv(p, GL_LINK_STATUS, &ok);
  if (!ok) {
    char log[4096];
    glGetProgramInfoLog(p, sizeof log, nullptr, log);
    err += log;
    glDeleteProgram(p);
    return 0;
  }
  return p;
}

}  // namespace gl
}  // namespace evg
