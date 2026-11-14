#!/bin/sh
# Level-match the quiet clips and make the music loop seamless. Run once after generate_audio.py.
# Originals are kept in a temp dir so the script is safe to re-run from fresh generations only.
set -e
cd "$(dirname "$0")/../public/audio"
T=$(mktemp -d)
norm() { ffmpeg -v error -y -i "$1.mp3" -af "loudnorm=I=$2:TP=-1.5:LRA=11" -ar 44100 -b:a 128k "$T/$1.mp3" && mv "$T/$1.mp3" "$1.mp3"; }
if [ "$1" != music ]; then norm chime -18; norm hills -20; norm sea -22; fi
# music: drop the fade-out tail, then crossfade the end into the first 4 s so the loop point is continuous
ffmpeg -v error -y -i music.mp3 -f s16le -ac 2 -ar 44100 "$T/m.raw"
python3 - "$T/m.raw" "$T/loop.raw" <<'PY'
import sys, numpy as np
sr, x = 44100, np.fromfile(sys.argv[1], dtype=np.int16).reshape(-1, 2).astype(np.float32)
x = x[: len(x) - 2 * sr]                      # tail that fades to silence
n = 4 * sr
ramp = np.linspace(0, 1, n, dtype=np.float32)[:, None]
out = x[n:].copy()                             # loop starts 4 s in ...
out[-n:] = out[-n:] * (1 - ramp) + x[:n] * ramp  # ... and ends by fading into those first 4 s
np.clip(out, -32768, 32767).astype(np.int16).tofile(sys.argv[2])
PY
ffmpeg -v error -y -f s16le -ac 2 -ar 44100 -i "$T/loop.raw" -af "loudnorm=I=-20:TP=-1.5" -ar 44100 -b:a 128k "$T/music.mp3" && mv "$T/music.mp3" music.mp3
rm -rf "$T"
