#!/usr/bin/env python3
"""Generate narration + ambience with the ElevenLabs API.

Usage:  ELEVENLABS_API_KEY=... python3 tools/generate_audio.py [--force] [name ...]
Existing files are skipped unless --force is given. The key is read from the
environment only and is never written to disk.
"""
import json, os, sys, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "audio")
KEY = os.environ["ELEVENLABS_API_KEY"]
API = "https://api.elevenlabs.io"
VOICE = "JBFqnCBsd6RMkjVDRZzb"  # "George" - warm British storyteller
TTS_MODELS = ["eleven_v4", "eleven_v3", "eleven_multilingual_v2"]  # best first, fall back

SFX = {
    "sea": dict(text="Gentle Mediterranean sea waves lapping on a pebble shore on a calm day, close, soothing, no voices, no music", duration_seconds=14, loop=True),
    "hills": dict(text="Summer cicadas chirping in dry Mediterranean hills with a light warm breeze through pine trees, no voices, no music", duration_seconds=14, loop=True),
    "whoosh": dict(text="Soft airy cinematic whoosh, a smooth gliding swoop through open air", duration_seconds=1.6),
    "chime": dict(text="A single small ancient bronze bell struck once, warm, resonant, gentle decay", duration_seconds=2.5),
}
MUSIC = {
    "music": dict(prompt="Ancient Mediterranean ambient instrumental: solo lyre and kithara plucked slowly, soft frame drum, distant aulos flute, warm, contemplative, sunlit, no vocals, seamless loop", music_length_ms=45000),
}

def post(path, body):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode(),
        headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()

def save(name, data):
    with open(os.path.join(OUT, name + ".mp3"), "wb") as f:
        f.write(data)
    print(f"  wrote {name}.mp3 ({len(data)//1024} kB)")

def tts(text):
    last = None
    for model in TTS_MODELS:
        try:
            return post(f"/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128", {"text": text, "model_id": model}), model
        except urllib.error.HTTPError as e:
            last = f"{model}: {e.code} {e.read()[:300]!r}"
            print("  !", last)
    raise SystemExit(last)

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    os.makedirs(OUT, exist_ok=True)
    want = lambda n: (not args or n in args) and (force or not os.path.exists(os.path.join(OUT, n + ".mp3")))
    narration = json.load(open(os.path.join(ROOT, "src", "narration.json")))
    for key, text in narration.items():
        name = "vo-" + key
        if want(name):
            print(name)
            data, model = tts(text)
            print("  model:", model)
            save(name, data)
    for name, body in SFX.items():
        if want(name):
            print(name)
            save(name, post("/v1/sound-generation?output_format=mp3_44100_128", {**body, "prompt_influence": 0.5}))
    for name, body in MUSIC.items():
        if want(name):
            print(name)
            try:
                save(name, post("/v1/music?output_format=mp3_44100_128", body))
            except urllib.error.HTTPError as e:
                print("  ! music failed:", e.code, e.read()[:300])

if __name__ == "__main__":
    main()
