import {
  speakEmergencyVoice,
  findBestVoiceForLanguage,
  VoiceLanguage,
  initVoiceEngine,
} from './voicePack';

/**
 * Synthesizes emergency warning tones and navigation chimes using Web Audio API.
 */
class EmergencyAudioEngine {
  private ctx: AudioContext | null = null;
  private isSirenActive = false;
  private sirenInterval: any = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playAlertChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.3); // A4

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // ignore
    }
  }

  public playSosSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.08 + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + (i + 1) * 0.08 + 0.15);
      });
    } catch {
      // ignore
    }
  }

  public toggleSiren(enable: boolean) {
    this.isSirenActive = enable;
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }

    if (enable) {
      this.initCtx();
      this.playSirenTone();
      this.sirenInterval = setInterval(() => {
        if (this.isSirenActive) {
          this.playSirenTone();
        }
      }, 1400);
    }
  }

  /**
   * Synthesizes a realistic thunderclap rumble using filtered white noise and low-frequency resonance
   */
  public playThunderAlertSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Initial lightning strike crack / sharp transient
      const crackOsc = this.ctx.createOscillator();
      const crackGain = this.ctx.createGain();
      crackOsc.type = 'sawtooth';
      crackOsc.frequency.setValueAtTime(3200, now);
      crackOsc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
      crackGain.gain.setValueAtTime(0.25, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      crackOsc.connect(crackGain);
      crackGain.connect(this.ctx.destination);
      crackOsc.start(now);
      crackOsc.stop(now + 0.18);

      // 2. Synthesized deep rolling thunder rumble (filtered white noise buffer)
      const bufferSize = this.ctx.sampleRate * 2.5;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise filter integration for deep thunder roar
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(220, now);
      lowpass.frequency.linearRampToValueAtTime(80, now + 2.2);

      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.35, now);
      rumbleGain.gain.linearRampToValueAtTime(0.45, now + 0.3);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      whiteNoise.connect(lowpass);
      lowpass.connect(rumbleGain);
      rumbleGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 2.5);

      // 3. Low Sub-bass oscillator swell (40-90Hz)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(55, now);
      subOsc.frequency.linearRampToValueAtTime(35, now + 1.8);
      subGain.gain.setValueAtTime(0.2, now);
      subGain.gain.linearRampToValueAtTime(0.3, now + 0.2);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 2.0);
    } catch {
      // ignore
    }
  }

  /**
   * Lightning Proximity Warning high-urgency strobe beeps
   */
  public playLightningWarningTone() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [0, 0.12, 0.24].forEach((offset) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now + offset);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.08);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Synthesizes low-frequency seismic earth grind, subterranean soil fracture, and rolling debris rumble
   */
  public playLandslideRumbleSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Heavy low-frequency earth grind (Brownian noise buffer with 45Hz lowpass)
      const bufferSize = this.ctx.sampleRate * 3.0;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.015 * white) / 1.015;
        lastOut = output[i];
        output[i] *= 4.2;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(140, now);
      lowpass.frequency.linearRampToValueAtTime(55, now + 2.8);

      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.2, now);
      rumbleGain.gain.linearRampToValueAtTime(0.45, now + 0.6);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      noiseSource.connect(lowpass);
      lowpass.connect(rumbleGain);
      rumbleGain.connect(this.ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 3.0);

      // 2. Sub-harmonic tectonic shudder oscillator (32 Hz down to 22 Hz)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(38, now);
      subOsc.frequency.exponentialRampToValueAtTime(24, now + 2.6);

      const subFilter = this.ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(80, now);

      subGain.gain.setValueAtTime(0.25, now);
      subGain.gain.linearRampToValueAtTime(0.35, now + 0.4);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(this.ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 2.8);
    } catch {
      // ignore
    }
  }

  /**
   * Geotechnical Inclinometer Alarm Tone (dual-tone slope shear frequency)
   */
  public playLandslideWarningTone() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [0, 0.15, 0.30, 0.45].forEach((offset, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'square';
        osc.frequency.setValueAtTime(idx % 2 === 0 ? 540 : 720, now + offset);
        gain.gain.setValueAtTime(0.18, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Dam Breach & High Water Surge Alarm (Central Water Commission / NDMA Hydro Alarm)
   */
  public playDamBreachAlarm() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 3-tone repeating acoustic warning: 440Hz -> 880Hz -> 1175Hz
      [0, 0.22, 0.44].forEach((offset, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(idx === 0 ? 440 : idx === 1 ? 880 : 1175, now + offset);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.2);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Google Maps Style Friendly Navigation Turn Ding (approaching next maneuver)
   */
  public playNavigationTurnChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Two bright bell tones: 987.77 Hz (B5) -> 1318.51 Hz (E6)
      [987.77, 1318.51].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.18, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + (idx + 1) * 0.12 + 0.28);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Google Maps Route Recalculation Alert Sound (when avoiding new road blocks)
   */
  public playRerouteChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Descending then resolving tone: 1100Hz -> 880Hz -> 1320Hz
      [1100, 880, 1320].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.16, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.1 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + (idx + 1) * 0.1 + 0.22);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Spoken Voice Navigation Guidance for Turn-by-Turn Maneuvers in English, Bengali, and Hindi.
   */
  public speakNavigationGuidance(
    text: string,
    lang: VoiceLanguage = 'en',
    fallbackPhoneticText?: string
  ) {
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      initVoiceEngine();
      const voiceInfo = findBestVoiceForLanguage(lang);

      // If OS lacks a native Bengali/Hindi voice, use the clear phonetic transliteration
      const textToDeliver =
        !voiceInfo.isNative && fallbackPhoneticText ? fallbackPhoneticText : text;

      speakEmergencyVoice(textToDeliver, lang, {
        rate: lang === 'bn' || lang === 'hi' ? 0.98 : 1.02,
        pitch: 1.0,
        volume: 1.0,
      });
    } catch {
      // ignore
    }
  }

  /**
   * Synthesize hydrodynamic flood rush and dam water surge sound
   */
  public playHydroSurgeSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 2.2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.04 * white) / 1.04;
        lastOut = output[i];
        output[i] *= 3.0;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.linearRampToValueAtTime(900, now + 1.0);
      filter.frequency.linearRampToValueAtTime(320, now + 2.2);
      filter.Q.setValueAtTime(2.0, now);

      const surgeGain = this.ctx.createGain();
      surgeGain.gain.setValueAtTime(0.1, now);
      surgeGain.gain.linearRampToValueAtTime(0.4, now + 0.6);
      surgeGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      whiteNoise.connect(filter);
      filter.connect(surgeGain);
      surgeGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 2.2);
    } catch {
      // ignore
    }
  }

  /**
   * Stop any active synthesized speech or audio output
   */
  public stopAllAudio() {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // ignore
    }
  }

  private playSirenTone() {
    try {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;

      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.7);
      osc.frequency.linearRampToValueAtTime(600, now + 1.4);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.7);
      gain.gain.linearRampToValueAtTime(0.02, now + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.4);
    } catch {
      // ignore
    }
  }
}

export const audioEngine = new EmergencyAudioEngine();
