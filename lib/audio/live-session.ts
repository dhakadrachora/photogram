import { AudioStreamer } from './audio-streamer';
import { VoiceState, ToolCall } from '@/types';
import { SoundEffects } from './sound-effects';

export interface LiveSessionCallbacks {
  onStateChange: (state: VoiceState) => void;
  onAudioLevel: (level: number) => void;
  onTranscript: (userText: string, assistantText: string) => void;
  onToolCall: (tool: ToolCall) => void;
  onError: (error: string) => void;
}

export class LiveSession {
  private streamer: AudioStreamer;
  private state: VoiceState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private recognition: unknown = null;
  private isListeningContinuous = false;
  private currentAssistantReply = '';
  private currentPromptHistory: { role: 'user' | 'assistant'; text: string }[] = [];
  private userEmail: string | null = null;

  constructor(callbacks: LiveSessionCallbacks, initialEmail?: string | null) {
    this.callbacks = callbacks;
    this.userEmail = initialEmail || null;
    this.streamer = new AudioStreamer(
      (base64Pcm) => {
        // Microphone PCM stream chunk
      },
      (level) => {
        this.callbacks.onAudioLevel(level);
      }
    );
  }

  public setUserEmail(email: string | null) {
    this.userEmail = email;
  }

  public getState(): VoiceState {
    return this.state;
  }

  private setState(newState: VoiceState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  public async connect(): Promise<void> {
    if (this.state !== 'disconnected') return;

    // Authentication Guard for Voice Mode
    if (!this.userEmail || !this.userEmail.includes('@')) {
      this.callbacks.onError('Google Sign-In is required for AI Assistant voice mode.');
      return;
    }

    this.setState('connecting');
    try {
      await this.streamer.startRecording();
      this.initSpeechRecognition();
      this.setState('listening');

      // Initial friendly witty voice greeting
      SoundEffects.playBell();
      this.sendVoiceMessage('Arey Dhoti aale, swagat hai! Batao kya haal chaal hai tumhare?');
    } catch (err) {
      console.error('Failed to connect live session:', err);
      this.setState('disconnected');
      this.callbacks.onError('Microphone access denied or audio error. Please allow microphone.');
    }
  }

  public disconnect(): void {
    this.isListeningContinuous = false;
    this.stopSpeechRecognition();
    this.streamer.cleanup();
    this.setState('disconnected');
  }

  public interrupt(): void {
    this.streamer.interrupt();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.state === 'speaking') {
      this.setState('listening');
    }
  }

  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser, using manual voice queries.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Optimized for Hindi / Hinglish

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          this.processUserInput(finalTranscript.trim(), true);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition warning:', event.error);
        }
      };

      recognition.onend = () => {
        // Automatically restart if still in listening state
        if (this.state === 'listening' && this.isListeningContinuous) {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        }
      };

      this.isListeningContinuous = true;
      recognition.start();
      this.recognition = recognition;
    } catch (err) {
      console.warn('Could not start webkitSpeechRecognition:', err);
    }
  }

  private stopSpeechRecognition() {
    if (this.recognition) {
      try {
        (this.recognition as any).stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
  }

  /**
   * Send text or voice input to Gemini Server API
   * isVoice: true -> Login required, synthesizes voice audio
   * isVoice: false -> Public access, no login needed
   */
  public async processUserInput(userPrompt: string, isVoice: boolean = true): Promise<void> {
    if (!userPrompt.trim()) return;

    // If voice mode requested, verify user email
    if (isVoice && (!this.userEmail || !this.userEmail.includes('@'))) {
      this.callbacks.onError('Google Sign-In is required for AI Assistant voice mode.');
      return;
    }

    this.interrupt();
    if (isVoice) {
      this.setState('speaking');
    }

    try {
      this.currentPromptHistory.push({ role: 'user', text: userPrompt });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response: Response;
      try {
        response = await fetch('/api/gemini/voice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-request-mode': isVoice ? 'voice' : 'text',
            'x-user-email': isVoice ? (this.userEmail || '') : '',
          },
          signal: controller.signal,
          body: JSON.stringify({
            prompt: userPrompt,
            history: this.currentPromptHistory.slice(-6),
            mode: isVoice ? 'voice' : 'text',
            userEmail: isVoice ? this.userEmail : undefined,
            isVoice,
          }),
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.status === 401) {
        if (isVoice) {
          this.disconnect();
        }
        this.callbacks.onError('Google Sign-In is required for AI Assistant voice mode.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.text || 'Arre jaan, kya bol rahe the? Dobara bolo na!';
      this.currentAssistantReply = replyText;
      this.currentPromptHistory.push({ role: 'assistant', text: replyText });
      this.callbacks.onTranscript(userPrompt, replyText);

      // Handle tool calls if any returned from Gemini
      if (data.toolCalls && Array.isArray(data.toolCalls)) {
        for (const tool of data.toolCalls) {
          this.executeToolCall(tool);
        }
      }

      // If voice mode, play audio response
      if (isVoice) {
        if (data.audio) {
          await this.streamer.playChunk(data.audio, 24000);
        } else {
          await this.speakFallback(replyText);
        }
      }
    } catch (err: any) {
      console.warn('Query handling notice:', err?.message || err);
      const fallbackReply = isVoice
        ? 'Arre Dhoti aale, network thoda dheema hai! Par mai sun raha hu, bolo kya keh rahe the?'
        : 'Arre meri jaan! Thoda signal weak hai, par mai yahi hu! Ek baar fir likho na!';
      this.callbacks.onTranscript(userPrompt, fallbackReply);
      if (isVoice) {
        await this.speakFallback(fallbackReply);
      }
    } finally {
      if (isVoice && this.state !== 'disconnected') {
        this.setState('listening');
      }
    }
  }

  public async sendVoiceMessage(customText: string) {
    this.setState('speaking');
    this.callbacks.onTranscript('', customText);
    await this.speakFallback(customText);
    if (this.state !== 'disconnected') {
      this.setState('listening');
    }
  }

  private executeToolCall(tool: ToolCall) {
    this.callbacks.onToolCall(tool);

    if (tool.name === 'openWebsite') {
      const url = String(tool.args?.url || 'https://google.com');
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else if (tool.name === 'playHypeSound') {
      const type = String(tool.args?.soundType || 'airhorn');
      if (type === 'airhorn') SoundEffects.playAirhorn();
      else if (type === 'cheer') SoundEffects.playCheer();
      else if (type === 'dhol') SoundEffects.playDhol();
      else if (type === 'whistle') SoundEffects.playWhistle();
    }
  }

  private async speakFallback(text: string): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find((v) => v.lang.includes('hi') || v.lang.includes('IN'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }

      utterance.pitch = 1.05;
      utterance.rate = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }
}
