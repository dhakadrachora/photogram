/**
 * AudioStreamer manages:
 * 1. Mic capture with 16kHz PCM16 downsampling & base64 streaming.
 * 2. 24kHz PCM / audio chunk gapless scheduling & playback.
 * 3. RMS volume monitoring for visualizer animations.
 * 4. Immediate interruption / reset handling.
 */

export class AudioStreamer {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private onAudioLevelCallback?: (level: number) => void;
  private onPcmDataCallback?: (base64Pcm: string) => void;
  private isRecording = false;

  constructor(
    onPcmData?: (base64Pcm: string) => void,
    onAudioLevel?: (level: number) => void
  ) {
    this.onPcmDataCallback = onPcmData;
    this.onAudioLevelCallback = onAudioLevel;
  }

  public setCallbacks(
    onPcmData?: (base64Pcm: string) => void,
    onAudioLevel?: (level: number) => void
  ) {
    if (onPcmData) this.onPcmDataCallback = onPcmData;
    if (onAudioLevel) this.onAudioLevelCallback = onAudioLevel;
  }

  /**
   * Initializes microphone capture at 16kHz
   */
  public async startRecording(): Promise<void> {
    if (this.isRecording) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });

      if (this.inputAudioCtx.state === 'suspended') {
        await this.inputAudioCtx.resume();
      }

      this.sourceNode = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
      // 4096 buffer size at 16kHz gives ~256ms chunk
      this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      this.scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate RMS for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        if (this.onAudioLevelCallback) {
          this.onAudioLevelCallback(Math.min(1, rms * 5)); // amplify for visualizer
        }

        // Convert float32 to PCM16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Base64 encode
        const uint8 = new Uint8Array(pcm16.buffer);
        let binary = '';
        const len = uint8.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64 = btoa(binary);

        if (this.onPcmDataCallback) {
          this.onPcmDataCallback(base64);
        }
      };

      this.sourceNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.inputAudioCtx.destination);
      this.isRecording = true;
    } catch (err) {
      console.error('Error starting audio recording:', err);
      throw err;
    }
  }

  /**
   * Stops microphone capture
   */
  public stopRecording(): void {
    this.isRecording = false;
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.inputAudioCtx) {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }
  }

  /**
   * Initializes 24kHz output context for playing model audio
   */
  private getOutputContext(): AudioContext {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
    }
    if (this.outputAudioCtx.state === 'suspended') {
      this.outputAudioCtx.resume().catch(() => {});
    }
    return this.outputAudioCtx;
  }

  /**
   * Plays a base64 encoded PCM16 (24kHz) or WAV chunk seamlessly
   */
  public async playChunk(base64Audio: string, sampleRate = 24000): Promise<void> {
    try {
      const ctx = this.getOutputContext();
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Check if it's a WAV container (starts with "RIFF")
      const isWav =
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46;

      let audioBuffer: AudioBuffer;

      try {
        // Automatically decodes MP3, WAV, AAC into AudioBuffer
        audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      } catch {
        // Fallback to Raw PCM16 Mono 24kHz if not encoded
        const int16Array = new Int16Array(bytes.buffer);
        const floatArray = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          floatArray[i] = int16Array[i] / 32768;
        }
        audioBuffer = ctx.createBuffer(1, floatArray.length, sampleRate);
        audioBuffer.copyToChannel(floatArray, 0, 0);
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Connect analyzer node for visualizer while speaking
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 64;
      source.connect(analyzer);
      analyzer.connect(ctx.destination);

      // Gapless scheduling
      const now = ctx.currentTime;
      if (this.nextStartTime < now) {
        this.nextStartTime = now + 0.05; // tiny buffer against jitter
      }

      const scheduledStart = this.nextStartTime;
      source.start(scheduledStart);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(source);

      return new Promise<void>((resolve) => {
        let isDone = false;
        const finish = () => {
          if (!isDone) {
            isDone = true;
            resolve();
          }
        };

        source.onended = () => {
          const idx = this.activeSources.indexOf(source);
          if (idx !== -1) this.activeSources.splice(idx, 1);
          finish();
        };

        (source as any)._cancelPlayback = finish;
        // Safety timeout in case onended doesn't fire
        const remainingDelayMs = Math.max(100, ((scheduledStart - now) + audioBuffer.duration + 0.25) * 1000);
        setTimeout(finish, remainingDelayMs);
      });
    } catch (err) {
      console.warn('Error playing audio chunk:', err);
    }
  }

  /**
   * Interrupts and cuts off any currently playing audio immediately
   */
  public interrupt(): void {
    for (const source of this.activeSources) {
      try {
        if ((source as any)._cancelPlayback) {
          (source as any)._cancelPlayback();
        }
        source.stop();
        source.disconnect();
      } catch {
        // ignore already stopped
      }
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
  }

  public cleanup(): void {
    this.stopRecording();
    this.interrupt();
    if (this.outputAudioCtx) {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }
  }
}
