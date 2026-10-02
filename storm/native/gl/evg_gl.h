// SPDX-License-Identifier: MIT
//
// OpenGL 3.3 core, per platform, and the two helpers every module here uses
// to build a program. Windows needs a loader (glad, GLEW) included before
// this header and EVG_GL_HAVE_LOADER defined; it is not wired up here.

#pragma once
#include <string>

#if defined(EVG_GL_HAVE_LOADER)
// The host has included its loader.
#elif defined(__APPLE__)
#define GL_SILENCE_DEPRECATION 1
#include <OpenGL/gl3.h>
#else
#define GL_GLEXT_PROTOTYPES 1
#include <GL/gl.h>
#include <GL/glext.h>
#endif

namespace evg {
namespace gl {

// Compile one stage; on failure returns 0 and appends the driver's log.
GLuint compileShader(GLenum type, const std::string& src, std::string& err);

// Compile and link a program; on failure returns 0 and appends the logs.
GLuint linkProgram(const std::string& vertex, const std::string& fragment, std::string& err);

// The vertex stage every program here shares: positions in page pixels
// (y down), projected onto the target; `vP` hands the page point on.
extern const char* kPageVertexShader;

}  // namespace gl
}  // namespace evg
