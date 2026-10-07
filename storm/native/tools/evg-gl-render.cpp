// SPDX-License-Identifier: MIT
//
// Paint a display list (the JSON `EVGDisplayList.toJson` writes) with the
// native GL painter and write the frame as a PAM image (RGBA, alpha kept).
// A check and a debugging aid: what the native painter makes of a list,
// without an app around it.
//
//   evg-gl-render list.json out.pam [--scale 2] [--time 1.5]
//                 [--font "Noto Sans:regular:NotoSans-Regular.ttf"]…
//                 [--effects effects.json]…
//                 [--over list2.json --at ox,oy,scale]
//
// --over draws a second list over the first without clearing, its page
// placed at (ox, oy) and scaled, the way a host draws a slide on a stage.
// An image command whose src is "test:quad" gets a 2x2 texture: red, green
// over blue, white.
//
// --effects reads an array of effect manifests ({ name, layer, params,
// arrays, file }), each `file` relative to the manifest.
//
// It needs an OpenGL 3.3 context, which it gets from a hidden SDL2 window;
// on a machine with no display run it under xvfb-run.

#include <SDL.h>

#include <cstdio>
#include <fstream>
#include <sstream>

#include "../gl/EvgGlPainter.h"

static std::string readText(const std::string& path) {
  std::ifstream f(path);
  std::stringstream ss;
  ss << f.rdbuf();
  return ss.str();
}

static std::string dirOf(const std::string& path) {
  size_t slash = path.find_last_of('/');
  return slash == std::string::npos ? "." : path.substr(0, slash);
}

int main(int argc, char** argv) {
  if (argc < 3) {
    std::fprintf(stderr, "usage: evg-gl-render list.json out.pam [--scale N] [--time T] [--font family:style:path] [--effects manifest.json]\n");
    return 2;
  }
  std::string in = argv[1], out = argv[2];
  float scale = 1, time = 0;
  std::vector<std::string> fonts, effectFiles;
  std::string over;
  float atX = 0, atY = 0, atS = 1;
  for (int i = 3; i + 1 < argc; i += 2) {
    std::string a = argv[i];
    if (a == "--scale") scale = (float)std::atof(argv[i + 1]);
    else if (a == "--time") time = (float)std::atof(argv[i + 1]);
    else if (a == "--font") fonts.push_back(argv[i + 1]);
    else if (a == "--effects") effectFiles.push_back(argv[i + 1]);
    else if (a == "--over") over = argv[i + 1];
    else if (a == "--at") std::sscanf(argv[i + 1], "%f,%f,%f", &atX, &atY, &atS);
  }

  evg::json::Value list;
  std::string json = readText(in);
  if (!evg::json::Parser(json).parse(list)) {
    std::fprintf(stderr, "%s: not a display list\n", in.c_str());
    return 1;
  }
  // The page: the list does not carry it, so it is the extent of what it draws.
  int pageW = 1, pageH = 1;
  if (const evg::json::Value* cmds = list.get("cmds")) {
    for (const auto& c : cmds->arr) {
      pageW = std::max(pageW, (int)std::ceil(c.numOr("x", 0) + c.numOr("w", 0)));
      pageH = std::max(pageH, (int)std::ceil(c.numOr("y", 0) + c.numOr("h", 0)));
    }
  }
  pageW = (int)list.numOr("width", pageW);
  pageH = (int)list.numOr("height", pageH);

  if (SDL_Init(SDL_INIT_VIDEO) != 0) {
    std::fprintf(stderr, "SDL_Init: %s\n", SDL_GetError());
    return 1;
  }
  SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
  SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3);
  SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
#if defined(__APPLE__)
  SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 2);
  SDL_GL_SetAttribute(SDL_GL_CONTEXT_FLAGS, SDL_GL_CONTEXT_FORWARD_COMPATIBLE_FLAG);
#endif
  SDL_Window* win = SDL_CreateWindow("evg-gl-render", 0, 0, 16, 16, SDL_WINDOW_OPENGL | SDL_WINDOW_HIDDEN);
  SDL_GLContext ctx = win ? SDL_GL_CreateContext(win) : nullptr;
  if (!ctx) {
    std::fprintf(stderr, "no OpenGL 3.3 context: %s\n", SDL_GetError());
    return 1;
  }

  evg::gl::Painter painter;
  std::string err;
  for (const std::string& spec : fonts) {
    size_t a = spec.find(':'), b = spec.find(':', a + 1);
    if (a == std::string::npos || b == std::string::npos) continue;
    std::string style = spec.substr(a + 1, b - a - 1);
    if (!painter.text().addFaceFile(spec.substr(0, a), style.find("bold") != std::string::npos,
                                    style.find("italic") != std::string::npos, spec.substr(b + 1), &err)) {
      std::fprintf(stderr, "%s\n", err.c_str());
    }
  }
  for (const std::string& file : effectFiles) {
    evg::json::Value manifests;
    if (!evg::json::Parser(readText(file)).parse(manifests)) continue;
    for (const auto& m : manifests.arr) {
      evg::gl::EffectDef def;
      if (evg::gl::EffectDef::fromManifest(m, readText(dirOf(file) + "/" + m.strOr("file", "")), def, &err)) {
        painter.effects().add(def);
      }
    }
  }
  if (!painter.init(err)) {
    std::fprintf(stderr, "painter: %s\n", err.c_str());
    return 1;
  }

  int w = (int)std::lround(pageW * scale), h = (int)std::lround(pageH * scale);
  evg::gl::Target target;
  target.ensure(w, h, 4);
  target.bind();
  evg::gl::Frame frame;
  frame.pageW = pageW;
  frame.pageH = pageH;
  frame.drawW = w;
  frame.drawH = h;
  frame.time = time;
  GLuint quadTex = 0;
  frame.images = [&](const std::string& src, int& tw, int& th) -> GLuint {
    if (src != "test:quad") return 0;
    if (!quadTex) {
      const unsigned char px[16] = {255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255};
      glGenTextures(1, &quadTex);
      glBindTexture(GL_TEXTURE_2D, quadTex);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
      glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
      glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 2, 2, 0, GL_RGBA, GL_UNSIGNED_BYTE, px);
    }
    tw = th = 2;
    return quadTex;
  };
  painter.draw(list, frame);
  if (!over.empty()) {
    evg::json::Value list2;
    if (!evg::json::Parser(readText(over)).parse(list2)) {
      std::fprintf(stderr, "%s: not a display list\n", over.c_str());
      return 1;
    }
    evg::gl::Frame f2 = frame;
    f2.ox = atX;
    f2.oy = atY;
    f2.scale = atS;
    f2.clear = false;
    painter.draw(list2, f2);
  }
  std::vector<unsigned char> rgba = target.readPixels();

  std::ofstream f(out, std::ios::binary);
  f << "P7\nWIDTH " << w << "\nHEIGHT " << h << "\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n";
  f.write((const char*)rgba.data(), (std::streamsize)rgba.size());
  std::printf("%s: %dx%d\n", out.c_str(), w, h);
  SDL_GL_DeleteContext(ctx);
  SDL_DestroyWindow(win);
  SDL_Quit();
  return 0;
}
