/**
 * @file public/audio-processors/dsp-audio-processor.js
 * @description AudioWorkletProcessor running on the dedicated Web Audio rendering thread.
 * Performs real-time time-domain analysis, spectral flux tracking, and autocorrelation BPM detection.
 */

/* global AudioWorkletProcessor, registerProcessor */

class DspAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // 128-sample circular buffer for time-domain waveform
    this.timeDomainBuffer = new Uint8Array(128);

    // Audio calculation state
    this.fluxHistory = new Float32Array(240);
    this.fluxIndex = 0;
    this.frameCount = 0;
    this.lastBpm = 0;
    this.previousFreqBins = new Float32Array(64);

    // Dynamic high-water peak baseline tracking
    this.maxTreble = 0.1;

    // Rate limiter: Post messages at ~60 FPS (every ~735 samples at 44.1kHz or 128-sample block count = 6)
    this.samplesSinceLastPost = 0;
    this.postIntervalSamples = 735; // ~60Hz at 44.1kHz
  }

  /**
   * Main real-time audio block processing callback.
   *
   * @param {Float32Array[][]} inputs - Audio inputs per channel.
   * @param {Float32Array[][]} outputs - Audio outputs per channel.
   * @returns {boolean} Whether to keep the processor active.
   */
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    // Pass through audio cleanly to downstream nodes
    if (input && output) {
      for (let channel = 0; channel < input.length; channel++) {
        output[channel].set(input[channel]);
      }
    }

    if (!input || input.length === 0 || input[0].length === 0) {
      return true;
    }

    const channelData = input[0];
    const blockSize = channelData.length; // Standard Web Audio quantum is 128 samples

    // Capture latest 128 samples normalized into 0..255 Uint8Array format for shader compatibility
    for (let i = 0; i < blockSize && i < 128; i++) {
      const sample = channelData[i];
      // Map -1.0..1.0 to 0..255
      this.timeDomainBuffer[i] = Math.max(0, Math.min(255, Math.floor((sample + 1.0) * 127.5)));
    }

    this.samplesSinceLastPost += blockSize;

    if (this.samplesSinceLastPost >= this.postIntervalSamples) {
      this.samplesSinceLastPost = 0;

      // ── 1. Energy & Band Approximations ────────────────────────────────────
      // Approximate low/mid/high energy from time-domain zero-crossings & rectified signal power
      let totalEnergy = 0;
      let rawBassEnergy = 0;
      let zeroCrossings = 0;

      for (let i = 0; i < blockSize; i++) {
        const val = Math.abs(channelData[i]);
        totalEnergy += val;

        // Sub-sample low frequency energy
        if (i % 4 === 0) {
          rawBassEnergy += val;
        }

        if (i > 0 && channelData[i] * channelData[i - 1] < 0) {
          zeroCrossings++;
        }
      }

      const meanEnergy = totalEnergy / blockSize;
      const pureRawBass = Math.min(1.0, (rawBassEnergy / (blockSize / 4)) * 1.8);
      const highFreqRatio = Math.min(1.0, (zeroCrossings / blockSize) * 4.0);

      const targetBass = pureRawBass;
      const targetMid = Math.min(1.0, meanEnergy * 1.4);
      const targetTreble = Math.min(1.0, meanEnergy * highFreqRatio * 2.2);

      // ── 2. Spectral Flux Tracking ──────────────────────────────────────────
      // Use difference in instantaneous band power
      const diff =
        Math.max(0, targetBass - this.previousFreqBins[0]) +
        Math.max(0, targetMid - this.previousFreqBins[1]) +
        Math.max(0, targetTreble - this.previousFreqBins[2]);

      this.previousFreqBins[0] = targetBass;
      this.previousFreqBins[1] = targetMid;
      this.previousFreqBins[2] = targetTreble;

      const currentFlux = Math.min(1.0, diff * 0.8);

      // Record in 240-frame circular buffer
      this.fluxHistory[this.fluxIndex] = currentFlux;
      this.fluxIndex = (this.fluxIndex + 1) % 240;

      // Moving average threshold over past 15 frames
      let fluxSum = 0;
      for (let i = 1; i <= 15; i++) {
        let idx = this.fluxIndex - i;
        if (idx < 0) idx += 240;
        fluxSum += this.fluxHistory[idx];
      }
      const fluxThreshold = fluxSum / 15;

      // ── 3. BPM Detection via Autocorrelation (Every 15 frames) ─────────────
      this.frameCount++;
      if (this.frameCount % 15 === 0) {
        let maxCorrelation = 0;
        let bestLag = 0;

        // Lag 20 to 60 corresponds to 60 - 180 BPM at 60 FPS
        for (let lag = 20; lag <= 60; lag++) {
          let correlation = 0;
          for (let i = 0; i < 180; i++) {
            let idxA = this.fluxIndex - i - 1;
            if (idxA < 0) idxA += 240;
            let idxB = this.fluxIndex - i - 1 - lag;
            if (idxB < 0) idxB += 240;

            correlation += this.fluxHistory[idxA] * this.fluxHistory[idxB];
          }

          if (correlation > maxCorrelation) {
            maxCorrelation = correlation;
            bestLag = lag;
          }
        }

        if (bestLag > 0) {
          this.lastBpm = Math.round(3600 / bestLag);
        }
      }

      this.maxTreble = Math.max(this.maxTreble * 0.999, targetTreble);

      // ── 4. Dispatch to Main Thread via MessagePort ─────────────────────────
      this.port.postMessage({
        type: 'AUDIO_METRICS',
        targetBass,
        targetMid,
        targetTreble,
        pureRawBass,
        flux: currentFlux,
        fluxThreshold,
        bpm: this.lastBpm,
        maxTreble: Math.max(0.05, this.maxTreble),
        timeDomainBuffer: this.timeDomainBuffer,
      });
    }

    return true;
  }
}

registerProcessor('dsp-audio-processor', DspAudioProcessor);
