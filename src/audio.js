// Sound: ElevenLabs-generated narration, ambience and music (see tools/generate_audio.py).
// Everything is optional — if a file is missing or audio is blocked the map still works.
const BASE = import.meta.env.BASE_URL + 'audio/';

export class Sound {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.buffers = {};
    this.pending = {};
    this.loops = {};
    this.voice = null;
    this.onVoiceEnd = null;
    this.lang = 'en';
  }

  async enable() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.master.gain.value = 0;
      // ambience first so there is sound quickly; the rest streams in behind
      ['sea', 'hills', 'music'].forEach((n) => this.load(n).then(() => this.startLoop(n)));
      ['whoosh', 'chime'].forEach((n) => this.load(n));
    }
    await this.ctx.resume();
    this.enabled = true;
    this.fade(1, 0.8);
    return true;
  }

  disable() {
    this.enabled = false;
    this.stopVoice();
    if (this.ctx) { this.fade(0, 0.3); setTimeout(() => { if (!this.enabled) this.ctx.suspend(); }, 400); }
  }

  // hold everything (voice included) while the page is not in front; resume continues mid-sentence
  pause() { if (this.ctx && this.enabled) this.ctx.suspend(); }
  resume() { if (this.ctx && this.enabled) this.ctx.resume(); }

  fade(to, secs) {
    const g = this.master.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + secs);
  }

  load(name) {
    // one fetch per clip, even when asked twice in quick succession
    return (this.pending[name] ||= this.fetchClip(name));
  }

  async fetchClip(name) {
    try {
      const r = await fetch(BASE + name + '.mp3');
      if (!r.ok) throw new Error(r.status);
      const buf = await this.ctx.decodeAudioData(await r.arrayBuffer());
      this.buffers[name] = buf;
      return buf;
    } catch (e) { console.warn('audio missing:', name); return null; }
  }

  startLoop(name) {
    const buf = this.buffers[name];
    if (!buf || this.loops[name]) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    src.connect(gain).connect(this.master);
    src.start();
    this.loops[name] = gain;
  }

  // mix ambience from where the camera is: sea near the coast, cicadas inland, music up high
  setMix({ sea, hills, music }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const duck = this.voice ? 0.45 : 1;
    const set = (n, v) => this.loops[n] && this.loops[n].gain.setTargetAtTime(v * duck, t, 0.6);
    set('sea', sea * 0.5); set('hills', hills * 0.45); set('music', music * 0.4);
  }

  play(name, vol = 0.5) {
    if (!this.enabled || !this.buffers[name]) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[name];
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(g).connect(this.master);
    src.start();
  }

  stopVoice() {
    if (this.voice) { try { this.voice.onended = null; this.voice.stop(); } catch (e) { /* already stopped */ } this.voice = null; }
  }

  async narrate(key, onEnd) {
    this.stopVoice();
    if (!this.enabled) return false;
    const token = (this.voiceToken = Symbol());
    const buf = await this.load('vo-' + (this.lang === 'en' ? '' : this.lang + '-') + key);
    if (!buf || token !== this.voiceToken || !this.enabled) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = 1;
    src.connect(g).connect(this.master);
    src.onended = () => { if (this.voice === src) { this.voice = null; onEnd && onEnd(); } };
    src.start(this.ctx.currentTime + 0.35);
    this.voice = src;
    return buf.duration;
  }
}
