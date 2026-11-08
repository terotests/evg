#!/usr/bin/env python3
"""Reads DeflateReuseTest's output on stdin: each stream must inflate to its input.

  rgrc image/tests/DeflateReuseTest.rgr -nodecli -d=/tmp/dt -o=dt.js
  node /tmp/dt/dt.js | python3 image/tests/check_deflate_reuse.py
"""
import sys, zlib
n = 0
for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    if parts[0] == "buffer":
        assert parts[1] == parts[2], "GrowableBuffer content differs"
        assert int(parts[3]) * 2 == len(parts[1]), "GrowableBuffer size differs"
        n += 1
        continue
    src = bytes.fromhex(parts[0]) if len(parts) == 2 else b""
    got = zlib.decompress(bytes.fromhex(parts[-1]), -15)
    assert got == src, "stream %d does not inflate to its input" % n
    n += 1
assert n == 8, "expected 8 lines, got %d" % n
print("ok", n)
