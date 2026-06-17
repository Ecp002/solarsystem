class AudioEngineClass {
  private audioCtx: AudioContext | null = null;
  private backgroundAudio: HTMLAudioElement | null = null;
  private bgSource: MediaElementAudioSourceNode | null = null;
  private bgFilter: BiquadFilterNode | null = null;
  private bgGain: GainNode | null = null;
  
  private masterGain: GainNode | null = null;
  private initialVolume: number = 0.4;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  private audioUrl = "/interstellar.mp3";

  constructor() {}

  public init() {
    if (this.isInitialized) return;

    try {
      // Create HTML Audio Element for streaming soundtrack
      this.backgroundAudio = new Audio(this.audioUrl);
      this.backgroundAudio.crossOrigin = "anonymous";
      this.backgroundAudio.loop = true;
      this.backgroundAudio.muted = this.isMuted; // Initialize muted state

      // Initialize Web Audio context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();

      // Setup Routing
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.initialVolume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);

      // Setup Background Stream
      this.bgSource = this.audioCtx.createMediaElementSource(this.backgroundAudio);
      this.bgFilter = this.audioCtx.createBiquadFilter();
      this.bgGain = this.audioCtx.createGain();

      this.bgFilter.type = 'lowpass';
      this.bgFilter.frequency.setValueAtTime(12000, this.audioCtx.currentTime);

      this.bgGain.gain.setValueAtTime(0.7, this.audioCtx.currentTime); // Background music slightly quieter

      // Connect Background Stream
      this.bgSource.connect(this.bgFilter);
      this.bgFilter.connect(this.bgGain);
      this.bgGain.connect(this.masterGain);

      this.isInitialized = true;
      this.playBackground();
    } catch (e) {
      console.warn("Web Audio API failed to initialize:", e);
    }
  }

  public playBackground() {
    if (!this.isInitialized || !this.backgroundAudio || !this.audioCtx) return;
    
    this.backgroundAudio.muted = this.isMuted; // Sync muted state
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.backgroundAudio.play().catch((err) => {
      console.log("Audio play deferred. Awaiting user interaction.", err);
    });
  }

  public pauseBackground() {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
    }
  }

  public setVolume(val: number) {
    this.initialVolume = val;
    if (this.isInitialized && this.masterGain && this.audioCtx) {
      const target = this.isMuted ? 0 : val;
      this.masterGain.gain.linearRampToValueAtTime(target, this.audioCtx.currentTime + 0.1);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.backgroundAudio) {
      this.backgroundAudio.muted = this.isMuted; // Ensure element volume state is hard-synced
    }
    if (this.isInitialized && this.masterGain && this.audioCtx) {
      const target = this.isMuted ? 0 : this.initialVolume;
      this.masterGain.gain.linearRampToValueAtTime(target, this.audioCtx.currentTime + 0.1);
    }
    return this.isMuted;
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.initialVolume;
  }

  // 1. Button Hover SFX: short high-pitch chirp
  public playButtonHover() {
    if (!this.isInitialized || !this.audioCtx || !this.masterGain || this.isMuted) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.07);

    gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  // 2. Button Click SFX: deep activation pulse
  public playButtonClick() {
    if (!this.isInitialized || !this.audioCtx || !this.masterGain || this.isMuted) return;

    const ctx = this.audioCtx;
    
    // Low frequency thud
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.35);

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    // Filtered noise pop (mechanical click)
    const bufferSize = ctx.sampleRate * 0.02; // 20ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);

    noiseSource.start();
    noiseSource.stop(ctx.currentTime + 0.02);
  }

  // 3. Planet Hover SFX: soft flutter hum
  public playPlanetHover() {
    if (!this.isInitialized || !this.audioCtx || !this.masterGain || this.isMuted) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    // LFO frequency modulates the beep to sound "holographic"
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(12, ctx.currentTime); // 12Hz flutter
    lfoGain.gain.setValueAtTime(60, ctx.currentTime); // +/- 60Hz sweep

    gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    lfo.start();
    osc.start();

    lfo.stop(ctx.currentTime + 0.12);
    osc.stop(ctx.currentTime + 0.12);
  }

  // 4. Planet Selection: deep sub-bass drop and filter swell
  public playPlanetSelection() {
    if (!this.isInitialized || !this.audioCtx || !this.masterGain || this.isMuted) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const delayNode = ctx.createDelay();
    const feedback = ctx.createGain();

    osc.connect(gainNode);
    subOsc.connect(gainNode);
    
    // Connect to master via a spatial echo/delay
    gainNode.connect(delayNode);
    delayNode.connect(feedback);
    feedback.connect(delayNode);
    
    gainNode.connect(this.masterGain);
    delayNode.connect(this.masterGain);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(25, ctx.currentTime + 0.7);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(50, ctx.currentTime);
    subOsc.frequency.linearRampToValueAtTime(20, ctx.currentTime + 0.7);

    delayNode.delayTime.setValueAtTime(0.2, ctx.currentTime);
    feedback.gain.setValueAtTime(0.4, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    feedback.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.start();
    subOsc.start();
    osc.stop(ctx.currentTime + 0.8);
    subOsc.stop(ctx.currentTime + 0.8);

    // Space swell effect (Open background music lowpass filter)
    if (this.bgFilter) {
      this.bgFilter.frequency.setValueAtTime(300, ctx.currentTime);
      this.bgFilter.frequency.exponentialRampToValueAtTime(14000, ctx.currentTime + 2.5);
    }
  }

  // 5. Camera Travel Whoosh: Bandpass-filtered white noise sweep
  public playTravelWhoosh() {
    if (!this.isInitialized || !this.audioCtx || !this.masterGain || this.isMuted) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    
    // Generate 2 seconds of white noise
    const duration = 2.0;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(4.0, now);
    // Sweep bandpass frequency up and then down
    filter.frequency.setValueAtTime(150, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.9);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.7); // Rise
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Fall

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + duration);

    // Muffle the background music momentarily during whoosh
    if (this.bgFilter) {
      this.bgFilter.frequency.setValueAtTime(12000, now);
      this.bgFilter.frequency.exponentialRampToValueAtTime(200, now + 0.6);
      this.bgFilter.frequency.exponentialRampToValueAtTime(12000, now + duration);
    }
  }

  // 6. Arrival Chime: Major triad FM bell chime
  public playArrivalChime() {
    if (!this.isInitialized || !this.audioCtx || !this.masterGain || this.isMuted) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major Triad)

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.masterGain!);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Slight offset for ringing delay
      const start = now + (i * 0.08);
      gainNode.gain.setValueAtTime(0.0, now);
      gainNode.gain.setValueAtTime(0.08, start);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + 1.8);

      osc.start(start);
      osc.stop(start + 1.8);
    });
  }

  private cursorOsc: OscillatorNode | null = null;
  private cursorFilter: BiquadFilterNode | null = null;
  private cursorGain: GainNode | null = null;

  public updateCursorGravity(activeCount: number) {
    if (!this.isInitialized || !this.audioCtx || !this.masterGain || this.isMuted) {
      this.stopCursorGravity();
      return;
    }

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    if (activeCount > 0) {
      if (!this.cursorOsc) {
        this.cursorOsc = ctx.createOscillator();
        this.cursorFilter = ctx.createBiquadFilter();
        this.cursorGain = ctx.createGain();

        this.cursorOsc.type = 'sine';
        this.cursorOsc.frequency.setValueAtTime(880, now); // high-pitched chime tone

        this.cursorFilter.type = 'bandpass';
        this.cursorFilter.frequency.setValueAtTime(880, now);
        this.cursorFilter.Q.setValueAtTime(4.0, now);

        this.cursorGain.gain.setValueAtTime(0.001, now);

        this.cursorOsc.connect(this.cursorFilter);
        this.cursorFilter.connect(this.cursorGain);
        this.cursorGain.connect(this.masterGain);

        this.cursorOsc.start(now);
      }

      // Modulate frequency and gain based on number of glowing stars
      const intensity = Math.min(1.0, activeCount / 100); // scales up to 100 stars
      const targetFreq = 880 + intensity * 220; // 880Hz to 1100Hz
      const targetGain = intensity * 0.02; // extremely soft, elegant backdrop volume

      this.cursorOsc.frequency.setTargetAtTime(targetFreq, now, 0.15);
      this.cursorFilter!.frequency.setTargetAtTime(targetFreq, now, 0.15);
      this.cursorGain!.gain.setTargetAtTime(targetGain, now, 0.2);
    } else {
      this.stopCursorGravity();
    }
  }

  public stopCursorGravity() {
    if (this.cursorOsc && this.audioCtx && this.cursorGain) {
      try {
        const now = this.audioCtx.currentTime;
        this.cursorGain.gain.cancelScheduledValues(now);
        this.cursorGain.gain.linearRampToValueAtTime(0.0, now + 0.15);
        this.cursorOsc.stop(now + 0.15);
      } catch (e) {}
      this.cursorOsc = null;
      this.cursorFilter = null;
      this.cursorGain = null;
    }
  }
}

export const AudioEngine = new AudioEngineClass();
