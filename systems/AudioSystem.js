class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.lastShoot = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.0;
      this.musicGain.connect(this.master);
      this.musicNodes = null;
    } catch (e) {
      this.ctx = null;
    }
  }

  setVolume(v) {
    if (this.master) this.master.gain.value = Math.max(0, Math.min(1, v));
  }
  setMusicVolume(v) {
    if (this.musicGain) this.musicGain.gain.value = Math.max(0, Math.min(1, v));
  }

  startMusic(volume = 0.3) {
    if (!this.ctx || this.musicNodes) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    // Slow ambient drone: root + fifth + octave with slow LFO
    const base = 55; // A1
    const ratios = [1, 1.5, 2, 2.6667];
    const oscs = [];
    const gains = [];
    ratios.forEach((r, i) => {
      const o = ctx.createOscillator();
      o.type = i === 3 ? 'triangle' : 'sine';
      o.frequency.value = base * r;
      const g = ctx.createGain();
      g.gain.value = 0;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08 + i * 0.03;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.012;
      lfo.connect(lfoGain).connect(g.gain);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.018 + i * 0.005, t + 4);
      o.connect(g).connect(this.musicGain);
      o.start(t);
      lfo.start(t);
      oscs.push(o, lfo);
      gains.push(g);
    });
    this.setMusicVolume(volume);
    this.musicNodes = { oscs, gains };
  }

  stopMusic() {
    if (!this.ctx || !this.musicNodes) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
    this.musicGain.gain.linearRampToValueAtTime(0, t + 0.4);
    const nodes = this.musicNodes;
    this.musicNodes = null;
    setTimeout(() => {
      try { nodes.oscs.forEach(o => o.stop()); } catch (e) {}
    }, 600);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
  }

  _now() { return this.ctx.currentTime; }

  shoot() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    if (t - this.lastShoot < 0.018) return;
    this.lastShoot = t;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(820, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.06);
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.1);
  }

  hit() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const noise = this._noise(0.04);
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1400;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    noise.connect(f).connect(g).connect(this.master);
    noise.start(t);
  }

  pickup() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(1500, t + 0.07);
    g.gain.setValueAtTime(0.04, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.1);
  }

  levelUp() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const freqs = [440, 660, 880, 1175];
    freqs.forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      const start = t + i * 0.06;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.09, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      o.connect(g).connect(this.master);
      o.start(start);
      o.stop(start + 0.22);
    });
  }

  click() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.value = 1200;
    g.gain.setValueAtTime(0.04, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.05);
  }

  death() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.6);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.8);
  }

  explode() {
    if (!this.ctx || this.muted) return;
    const t = this._now();
    const noise = this._noise(0.2);
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2000, t);
    f.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    noise.connect(f).connect(g).connect(this.master);
    noise.start(t);
  }

  _noise(duration) {
    const buf = this.ctx.createBuffer(1, Math.max(1, this.ctx.sampleRate * duration), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }
}

export const Audio = new AudioSystem();
