#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
#
# Runs image/tests/WebPDecoderTest.rgr compiled to JavaScript (node) and
# to C++17 (g++ or clang++). Fails when a compile fails or any check does.
# The compiler is RANGER_ROOT/dist/rgrc.js, else the ranger-compiler package
# in node_modules (`npm ci`).
#
#   bash image/tests/run_webp_tests.sh
set -u
cd "$(dirname "$0")/../.."
rgrc="${RANGER_ROOT:-node_modules/ranger-compiler}/dist/rgrc.js"
if [ ! -f "$rgrc" ]; then
  echo "no Ranger compiler at $rgrc (npm ci, or set RANGER_ROOT)"
  exit 1
fi
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT
status=0

echo "== JavaScript"
js=$( { node "$rgrc" -es6 image/tests/WebPDecoderTest.rgr -d="$out" -o=webp_test.js -nodecli && node "$out/webp_test.js"; } 2>&1)
echo "$js"
echo "$js" | grep -q "^ALL PASS" || status=1

echo "== C++"
log=$(node "$rgrc" -l=cpp image/tests/WebPDecoderTest.rgr -d="$out" -o=webp_test.cpp 2>&1)
if echo "$log" | grep -q "Compilation FAILED" || [ ! -f "$out/webp_test.cpp" ]; then
  echo "$log" | grep -B1 -A3 "\[FAIL\]" | head -40
  echo "FAILED to compile WebPDecoderTest.rgr to C++"
  exit 1
fi
cxx=""
for c in g++ clang++; do
  if command -v "$c" > /dev/null 2>&1; then cxx=$c; break; fi
done
if [ -z "$cxx" ]; then
  echo "no C++ compiler (g++ or clang++) found"
  exit 1
fi
"$cxx" -std=c++17 -O2 -w "$out/webp_test.cpp" -o "$out/webp_test" || exit 1
cpp=$("$out/webp_test" 2>&1)
echo "$cpp"
echo "$cpp" | grep -q "^ALL PASS" || status=1

exit $status
