/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CircadianPhase } from "../types";

class CircadianAudioEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: {
    oscillators: OscillatorNode[];
    gains: GainNode[];
    buffers: AudioBufferSourceNode[];
    intervalId?: number;
  } = {
    oscillators: [],
    gains: [],
    buffers: [],
  };
  private isPlaying = false;
  private currentPhase: CircadianPhase = "dawn_morning";
  private currentVolume = 0.4;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.audioCtx.currentTime, 0.1);
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentPhase(): CircadianPhase {
    return this.currentPhase;
  }

  public stop() {
    if (!this.isPlaying) return;

    if (this.activeNodes.intervalId) {
      clearInterval(this.activeNodes.intervalId);
      this.activeNodes.intervalId = undefined;
    }

    // Fade out smoothly
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(0.001, this.audioCtx.currentTime, 0.2);
    }

    setTimeout(() => {
      this.activeNodes.oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.activeNodes.buffers.forEach(buf => {
        try {
          buf.stop();
          buf.disconnect();
        } catch {}
      });
      this.activeNodes.gains.forEach(g => {
        try {
          g.disconnect();
        } catch {}
      });

      this.activeNodes = { oscillators: [], gains: [], buffers: [] };
      this.isPlaying = false;
      if (this.masterGain && this.audioCtx) {
        this.masterGain.gain.setValueAtTime(this.currentVolume, this.audioCtx.currentTime);
      }
    }, 250);
  }

  public play(phase: CircadianPhase) {
    this.stop();
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;

    this.currentPhase = phase;
    this.isPlaying = true;
    this.masterGain.gain.setValueAtTime(this.currentVolume, this.audioCtx.currentTime);

    switch (phase) {
      case "dawn_morning":
        this.createMorningAlphaLandscape();
        break;
      case "midday":
        this.createMiddayGammaClarity();
        break;
      case "dusk_evening":
        this.createEveningThetaRelease();
        break;
      case "night_harbor":
        this.createNightDeltaHarbor();
        break;
    }
  }

  /**
   * Morning Alpha Wave Focus: 10Hz binaural beat over warm 432Hz fundamental + soft pink ambient air
   */
  private createMorningAlphaLandscape() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Carrier base frequency: 216Hz / 226Hz (10Hz Alpha difference)
    const baseFreq = 216;
    const alphaDiff = 10;

    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    oscL.type = "sine";
    oscR.type = "sine";
    oscL.frequency.setValueAtTime(baseFreq, now);
    oscR.frequency.setValueAtTime(baseFreq + alphaDiff, now);

    const gainL = ctx.createGain();
    const gainR = ctx.createGain();
    gainL.gain.setValueAtTime(0.18, now);
    gainR.gain.setValueAtTime(0.18, now);

    // Stereo Panner or channel merger
    const merger = ctx.createChannelMerger(2);
    oscL.connect(gainL);
    oscR.connect(gainR);
    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);
    merger.connect(this.masterGain);

    // Warm overtone drone (432Hz)
    const overtone = ctx.createOscillator();
    overtone.type = "triangle";
    overtone.frequency.setValueAtTime(432, now);
    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.04, now);
    overtone.connect(overtoneGain);
    overtoneGain.connect(this.masterGain);

    // Soft morning noise wash (filtered pink noise)
    const noiseNode = this.createPinkNoiseNode(ctx, 400);
    if (noiseNode) {
      noiseNode.connect(this.masterGain);
      this.activeNodes.buffers.push(noiseNode);
    }

    oscL.start(now);
    oscR.start(now);
    overtone.start(now);

    this.activeNodes.oscillators.push(oscL, oscR, overtone);
    this.activeNodes.gains.push(gainL, gainR, overtoneGain);
  }

  /**
   * Midday Gamma Wave Clarity: 40Hz binaural clarity + brisk refreshing white noise ocean breeze
   */
  private createMiddayGammaClarity() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const baseFreq = 300;
    const gammaDiff = 40;

    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    oscL.type = "sine";
    oscR.type = "sine";
    oscL.frequency.setValueAtTime(baseFreq, now);
    oscR.frequency.setValueAtTime(baseFreq + gammaDiff, now);

    const gainL = ctx.createGain();
    const gainR = ctx.createGain();
    gainL.gain.setValueAtTime(0.15, now);
    gainR.gain.setValueAtTime(0.15, now);

    const merger = ctx.createChannelMerger(2);
    oscL.connect(gainL);
    oscR.connect(gainR);
    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);
    merger.connect(this.masterGain);

    // High clarity shimmer
    const chime = ctx.createOscillator();
    chime.type = "sine";
    chime.frequency.setValueAtTime(528, now); // 528Hz clarity
    const chimeGain = ctx.createGain();
    chimeGain.gain.setValueAtTime(0.03, now);
    chime.connect(chimeGain);
    chimeGain.connect(this.masterGain);

    const noiseNode = this.createPinkNoiseNode(ctx, 600);
    if (noiseNode) {
      noiseNode.connect(this.masterGain);
      this.activeNodes.buffers.push(noiseNode);
    }

    oscL.start(now);
    oscR.start(now);
    chime.start(now);

    this.activeNodes.oscillators.push(oscL, oscR, chime);
    this.activeNodes.gains.push(gainL, gainR, chimeGain);
  }

  /**
   * Dusk / Evening Theta Decompression: 6Hz deep relaxation binaural beat + warm singing bowl tone (174Hz)
   */
  private createEveningThetaRelease() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const baseFreq = 174; // Deep relaxation frequency
    const thetaDiff = 6;

    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    oscL.type = "sine";
    oscR.type = "sine";
    oscL.frequency.setValueAtTime(baseFreq, now);
    oscR.frequency.setValueAtTime(baseFreq + thetaDiff, now);

    const gainL = ctx.createGain();
    const gainR = ctx.createGain();
    gainL.gain.setValueAtTime(0.22, now);
    gainR.gain.setValueAtTime(0.22, now);

    const merger = ctx.createChannelMerger(2);
    oscL.connect(gainL);
    oscR.connect(gainR);
    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);
    merger.connect(this.masterGain);

    // Warm sub-bass ground
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(87, now);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.08, now);
    sub.connect(subGain);
    subGain.connect(this.masterGain);

    const noiseNode = this.createPinkNoiseNode(ctx, 250);
    if (noiseNode) {
      noiseNode.connect(this.masterGain);
      this.activeNodes.buffers.push(noiseNode);
    }

    oscL.start(now);
    oscR.start(now);
    sub.start(now);

    this.activeNodes.oscillators.push(oscL, oscR, sub);
    this.activeNodes.gains.push(gainL, gainR, subGain);
  }

  /**
   * Night Delta Sleep Harbor: 2Hz restorative delta wave + deep 108Hz soothing grounding hum
   */
  private createNightDeltaHarbor() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const baseFreq = 108;
    const deltaDiff = 2.5;

    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    oscL.type = "sine";
    oscR.type = "sine";
    oscL.frequency.setValueAtTime(baseFreq, now);
    oscR.frequency.setValueAtTime(baseFreq + deltaDiff, now);

    const gainL = ctx.createGain();
    const gainR = ctx.createGain();
    gainL.gain.setValueAtTime(0.24, now);
    gainR.gain.setValueAtTime(0.24, now);

    const merger = ctx.createChannelMerger(2);
    oscL.connect(gainL);
    oscR.connect(gainR);
    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);
    merger.connect(this.masterGain);

    // Soft low-pass night rainfall / ocean drift noise
    const noiseNode = this.createPinkNoiseNode(ctx, 180);
    if (noiseNode) {
      noiseNode.connect(this.masterGain);
      this.activeNodes.buffers.push(noiseNode);
    }

    oscL.start(now);
    oscR.start(now);

    this.activeNodes.oscillators.push(oscL, oscR);
    this.activeNodes.gains.push(gainL, gainR);
  }

  private createPinkNoiseNode(ctx: AudioContext, filterFreq: number): AudioBufferSourceNode | null {
    try {
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain!);

      whiteNoise.start(ctx.currentTime);
      this.activeNodes.gains.push(noiseGain);
      return whiteNoise;
    } catch {
      return null;
    }
  }
}

export const circadianAudio = new CircadianAudioEngine();
