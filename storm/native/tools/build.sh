#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Build tools/evg-gl-render: the native painter and a hidden SDL2 window.
#   macOS: brew install sdl2      Debian/Ubuntu: apt-get install libsdl2-dev libgl-dev
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
NATIVE="$(dirname "$HERE")"
OUT="${1:-$HERE/build}"
mkdir -p "$OUT"
CXX="${CXX:-$(command -v clang++ || command -v g++)}"
if [[ "$(uname -s)" == "Darwin" ]]; then GL="-framework OpenGL"; else GL="-lGL"; fi
SDL="$(pkg-config --cflags --libs sdl2 2>/dev/null || sdl2-config --cflags --libs)"
# shellcheck disable=SC2086
"$CXX" -std=c++17 -O2 -Wall -Wno-unused-function \
  "$HERE/evg-gl-render.cpp" "$NATIVE"/gl/*.cpp \
  -o "$OUT/evg-gl-render" $SDL $GL
echo "$OUT/evg-gl-render"
