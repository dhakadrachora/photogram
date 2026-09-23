'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, VoiceState, ToolCall, AppTab } from '@/types';
import { LiveSession, selectMaleVoice } from '@/lib/audio/live-session';
import { AudioVisualizer } from './AudioVisualizer';
import {
  Mic,
  Volume2,
  Radio,
  Send,
  Zap,
  Sparkles,
  AlertCircle,
  MessageSquare,
  Lock,
  LogIn,
  ShieldCheck,
} from 'lucide-react';

interface VoiceAssistantProps {
  currentUser: User | null;
  onNavigateTab: (tab: AppTab) => void;
  onOpenAuth: () => void;
}

export function VoiceAssistant({
  currentUser,
  onNavigateTab,
  onOpenAuth,
}: VoiceAssistantProps) {
  const [voiceState, setVoiceState] =
    useState<VoiceState>('disconnected');

  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [userTranscript, setUserTranscript] = useState<string>('');

  const [assistantTranscript, setAssistantTranscript] = useState<string>(
    'राम राम भाईसाहब! (RAM RAM BHAISAB!) मैं हूँ DHOTI AALE — आपका अपना देसी AI वॉइस मैन। आज गाँव ढोटी में क्या नया अपडेट है, अखाड़े में कौन आगे है और किसकी जीत की संभावना है — सब पूछो!'
  );

  const [recentTool, setRecentTool] =
    useState<ToolCall | null>(null);

  const [manualInput, setManualInput] =
    useState<string>('');

  const [chatHistory, setChatHistory] = useState<
    {
      sender: 'user' | 'assistant';
      text: string;
      time: string;
    }[]
  >([
    {
      sender: 'assistant',
      text: 'राम राम भाईसाहब! (RAM RAM BHAISAB!) मैं हूँ DHOTI AALE। गाँव ढोटी की हर ताज़ा खबर, चौपाल का हाल और अखाड़े में कौन आगे है और कौन जीतेगा — पूरी जानकारी मेरे पास है। हुक्म करो भाईसाहब!',
      time: 'Just now',
    },
  ]);

  const [isTextChatOpen, setIsTextChatOpen] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const liveSessionRef =
    useRef<LiveSession | null>(null);

  const errorTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const toolTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * ---------------------------------------------------------
   * Error helper
   * ---------------------------------------------------------
   */

  const showError = (message: string) => {
    setErrorMessage(message);

    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }

    errorTimerRef.current = setTimeout(() => {
      setErrorMessage(null);
    }, 7000);
  };

  /*
   * ---------------------------------------------------------
   * Greeting audio
   * ---------------------------------------------------------
   */

  const playGreetingAudio = () => {
    const greetingText =
      'राम राम भाईसाहब! (RAM RAM BHAISAB!) मैं हूँ DHOTI AALE — आपका अपना देसी AI साथी। रिवॉर्ड्स पेज पर 100 फ्री इंस्टाग्राम रील्स व्यूज, अखाड़े में कौन आगे है और किसकी जीत की संभावना है — पूरी वेबसाइट की जानकारी मेरे पास है! कहो भाईसाहब क्या सेवा करें आपकी?';

    setAssistantTranscript(greetingText);

    const session = liveSessionRef.current;

    if (session) {
      try {
        session.sendVoiceMessage(greetingText);
        return;
      } catch {
        // Fall back to browser speech below.
      }
    }

    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      showError('इस browser में voice playback available नहीं है।');
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(greetingText);

      const voices =
        window.speechSynthesis.getVoices();

      const maleVoice =
        selectMaleVoice(voices);

      if (maleVoice) {
        utterance.voice = maleVoice;
        utterance.lang = maleVoice.lang || 'hi-IN';
      } else {
        utterance.lang = 'hi-IN';
      }

      utterance.pitch = 0.82;
      utterance.rate = 0.98;
      utterance.volume = 1;

      window.speechSynthesis.speak(utterance);
    } catch {
      showError('Voice playback शुरू नहीं हो पाया।');
    }
  };

  /*
   * ---------------------------------------------------------
   * Create LiveSession ONCE
   * ---------------------------------------------------------
   *
   * Important:
   * currentUser email बदलने पर नया session create नहीं करते।
   * Existing session को setUserEmail() से update करते हैं।
   */

  useEffect(() => {
    const session = new LiveSession(
      {
        onStateChange: (state) => {
          setVoiceState(state);
        },

        onAudioLevel: (level) => {
          setAudioLevel(level);
        },

        onTranscript: (userText, assistantText) => {
          if (userText) {
            setUserTranscript(userText);
          }

          if (assistantText) {
            setAssistantTranscript(assistantText);

            const time = new Date().toLocaleTimeString(
              [],
              {
                hour: '2-digit',
                minute: '2-digit',
              }
            );

            if (userText) {
              setChatHistory((prev) => [
                ...prev.slice(-10),
                {
                  sender: 'user',
                  text: userText,
                  time,
                },
                {
                  sender: 'assistant',
                  text: assistantText,
                  time,
                },
              ]);
            } else {
              setChatHistory((prev) => [
                ...prev.slice(-10),
                {
                  sender: 'assistant',
                  text: assistantText,
                  time,
                },
              ]);
            }
          }
        },

        onToolCall: (tool) => {
          setRecentTool(tool);

          if (toolTimerRef.current) {
            clearTimeout(toolTimerRef.current);
          }

          toolTimerRef.current = setTimeout(() => {
            setRecentTool(null);
          }, 5000);

          if (tool.name === 'startBattle') {
            setTimeout(() => {
              onNavigateTab('battle');
            }, 1500);

            return;
          }

          if (
            tool.name === 'navigateTab' &&
            tool.args?.tab
          ) {
            let targetTab =
              String(tool.args.tab).toLowerCase();

            if (targetTab === 'chat') {
              targetTab = 'worldchat';
            }

            if (
              [
                'home',
                'worldchat',
                'battle',
                'rewards',
                'assistant',
                'profile',
              ].includes(targetTab)
            ) {
              onNavigateTab(
                targetTab as AppTab
              );
            }
          }
        },

        onError: (err) => {
          showError(
            err ||
              'Voice connection में समस्या आ गई।'
          );
        },
      },

      currentUser?.email || null
    );

    liveSessionRef.current = session;

    return () => {
      try {
        session.disconnect();
      } catch {
        // Ignore cleanup errors.
      }

      liveSessionRef.current = null;

      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }

      if (toolTimerRef.current) {
        clearTimeout(toolTimerRef.current);
      }
    };
  }, [onNavigateTab, currentUser?.email]);

  /*
   * ---------------------------------------------------------
   * Keep authenticated user synced with LiveSession
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const session = liveSessionRef.current;

    if (!session) {
      return;
    }

    session.setUserEmail(
      currentUser?.email || 'guest@dhotiaale.online'
    );
  }, [currentUser]);

  /*
   * ---------------------------------------------------------
   * Voice connection
   * ---------------------------------------------------------
   */

  const toggleConnection = async () => {
    setErrorMessage(null);

    const session = liveSessionRef.current;

    if (!session) {
      showError(
        'Voice system अभी तैयार नहीं है। कृपया दोबारा प्रयास करें।'
      );
      return;
    }

    const effectiveEmail = currentUser?.email || 'guest@dhotiaale.online';

    /*
     * Connect
     */
    if (voiceState === 'disconnected') {
      try {
        session.setUserEmail(effectiveEmail);
        await session.connect();
        setErrorMessage(null);
      } catch (error: unknown) {
        console.error(
          '[VoiceAssistant] connect failed:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : String(error || '');

        if (
          /permission|denied|notallowed|microphone/i.test(
            message
          )
        ) {
          showError(
            'Microphone permission दें और फिर दोबारा प्रयास करें।'
          );
        } else if (
          /timeout|timed out|time out/i.test(
            message
          )
        ) {
          showError(
            'Voice connection में timeout हुआ। Internet/API connection check करके फिर प्रयास करें।'
          );
        } else {
          showError(
            'Voice connection शुरू नहीं हो पाया। कृपया फिर प्रयास करें।'
          );
        }
      }

      return;
    }

    /*
     * Disconnect
     */
    try {
      session.disconnect();
    } catch (error) {
      console.error(
        '[VoiceAssistant] disconnect failed:',
        error
      );
    }

    setVoiceState('disconnected');
    setAudioLevel(0);
  };

  /*
   * ---------------------------------------------------------
   * Interrupt AI speech
   * ---------------------------------------------------------
   */

  const handleInterrupt = () => {
    const session = liveSessionRef.current;

    if (!session) {
      return;
    }

    try {
      session.interrupt();
    } catch (error) {
      console.error(
        '[VoiceAssistant] interrupt failed:',
        error
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * Public text chat
   * ---------------------------------------------------------
   */

  const handleSendPrompt = (textToSend: string) => {
    const text = textToSend.trim();

    if (!text) {
      return;
    }

    setErrorMessage(null);
    setUserTranscript(text);
    setManualInput('');

    const session = liveSessionRef.current;

    if (!session) {
      showError(
        'AI chat अभी तैयार नहीं है। कृपया थोड़ी देर बाद प्रयास करें।'
      );
      return;
    }

    try {
      /*
       * Text chat remains public.
       * Voice authentication is handled separately.
       */
      session.processUserInput(text, false);
    } catch (error) {
      console.error(
        '[VoiceAssistant] text chat failed:',
        error
      );

      showError(
        'AI से जवाब लेने में समस्या आई। कृपया फिर प्रयास करें।'
      );
    }
  };

  const quickPrompts = [
    {
      label: '🎁 100 फ्री रील्स व्यूज कैसे पाएं?',
      prompt:
        'रिवॉर्ड्स पेज पर 100 फ्री इंस्टाग्राम रील्स व्यूज कैसे मिलते हैं और इसके क्या नियम हैं?',
    },
    {
      label: '⚔️ अखाड़े में कौन आगे है और कौन जीतेगा?',
      prompt:
        'अखाड़े में कौन-कौन बैटल में है, अभी वोटों में आगे कौन चल रहा है और किसकी जीतने की संभावना है?',
    },
    {
      label: '👑 वेबसाइट का मालिक व एडमिन कौन है?',
      prompt:
        'इस वेबसाइट के ओनर और एडमिन कौन हैं?',
    },
    {
      label: '📢 आज क्या नया अपडेट है?',
      prompt:
        'राम राम भाईसाहब! आज गाँव ढोटी में क्या-क्या नया अपडेट और ताज़ा खबर है?',
    },
    {
      label: '🪙 धोती सिक्के (Coins) कैसे कमाएं?',
      prompt:
        'धोती सिक्के (Dhoti Coins) कैसे कमाएं और गाँव में इसका क्या फायदा है?',
    },
    {
      label: '📯 अखाड़े का ढोल बजाओ!',
      prompt:
        'अखाड़े में जश्न का ढोल बजाओ और बिगुल फूँको!',
    },
    {
      label: '🔥 कड़क देसी शायरी!',
      prompt:
        'भाईसाहब मुझे एक जोरदार चौपाल की देसी शायरी सुनाओ!',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex flex-col justify-between p-3 sm:p-6 max-w-5xl mx-auto">
      {/* Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-amber-500/15 via-orange-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Status */}
      <div className="relative z-10 flex flex-col items-center text-center pt-2">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          {/* Public text chat */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              100% फ्री व पब्लिक (No Login Required)
            </span>
          </div>

          {/* Voice status */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 border border-amber-500/30 text-amber-300 text-[11px] font-bold shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-amber-300">
              देसी AI मर्द की आवाज़ (Active for All) 🎙️
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
          <span>DHOTI AALE</span>
          <span className="text-amber-400 text-base sm:text-2xl font-bold font-sans">
            देसी AI वॉइस मैन
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
          &ldquo;राम राम भाईसाहब!&rdquo; गाँव ढोटी की हर
          ताज़ा खबर, अखाड़े के मुकाबले, आगे कौन है और
          कौन जीतेगा — पूरी जानकारी उपलब्ध है
        </p>

        {/* Tool feedback */}
        {recentTool && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-400 px-3.5 py-1.5 text-xs text-amber-200 font-semibold animate-in slide-in-from-top-2">
            <Zap className="h-4 w-4 text-amber-400 animate-spin" />

            <span>
              Tool Executed:{' '}
              <strong>{recentTool.name}</strong>{' '}
              {JSON.stringify(recentTool.args)}
            </span>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-500/20 border border-red-500/40 px-3.5 py-1.5 text-xs text-red-200 animate-in shake">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />

            <span>{errorMessage}</span>

            {!currentUser && (
              <button
                onClick={onOpenAuth}
                className="ml-2 font-bold underline text-white hover:text-amber-300"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-5">
        <AudioVisualizer
          state={voiceState}
          audioLevel={audioLevel}
        />

        {/* Mic */}
        <div className="relative mt-2 flex flex-col items-center">
          <button
            id="central-mic-toggle-btn"
            onClick={toggleConnection}
            className={`relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full transition-all duration-300 shadow-2xl active:scale-95 ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-300 text-slate-950 ring-8 ring-amber-400/30 scale-105'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-orange-600 via-amber-500 to-amber-300 text-slate-950 ring-8 ring-orange-500/40 animate-pulse'
                : voiceState === 'connecting'
                ? 'bg-blue-600 text-white ring-8 ring-blue-500/30 animate-pulse'
                : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 hover:from-amber-950/40 hover:to-slate-800 text-amber-400 hover:text-amber-300 border-2 border-amber-500/50 hover:border-amber-400 hover:shadow-amber-500/20'
            }`}
            title="DHOTI AALE से देसी मर्द की आवाज़ में बात करें"
            aria-label="Start DHOTI AALE voice assistant"
          >
            {voiceState === 'listening' ? (
              <Mic className="h-10 w-10 sm:h-12 sm:w-12 animate-bounce" />
            ) : voiceState === 'speaking' ? (
              <Volume2 className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
            ) : voiceState === 'connecting' ? (
              <Radio className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
            ) : (
              <div className="flex flex-col items-center">
                <Mic className="h-8 w-8 sm:h-10 sm:w-10 text-amber-400" />

                <span className="text-[9px] font-extrabold uppercase text-amber-300/90 mt-1 tracking-wider">
                  बोलें
                </span>
              </div>
            )}
          </button>

          {/* State */}
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                voiceState === 'listening'
                  ? 'bg-emerald-400 animate-ping'
                  : voiceState === 'speaking'
                  ? 'bg-orange-400 animate-pulse'
                  : voiceState === 'connecting'
                  ? 'bg-blue-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />

            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-300">
              {voiceState === 'listening'
                ? 'सुन रहा हूँ भाईसाहब...'
                : voiceState === 'speaking'
                ? 'DHOTI AALE बोल रहा है'
                : voiceState === 'connecting'
                ? 'कनेक्ट हो रहा है...'
                : 'बोलने के लिए माइक दबाएं'}
            </span>
          </div>

          {/* Optional Sign In for coins/profile */}
          {!currentUser &&
            voiceState === 'disconnected' && (
              <button
                onClick={onOpenAuth}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 hover:bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300/80 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 transition-all hover:scale-105"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>
                  सिक्के व प्रोफ़ाइल सेव करने के लिए Sign In करें
                </span>
              </button>
            )}

          {/* Interrupt */}
          {voiceState === 'speaking' && (
            <button
              onClick={handleInterrupt}
              className="mt-2 rounded-full bg-slate-800/90 hover:bg-slate-700 px-3 py-1 text-[11px] font-bold text-amber-300 border border-slate-700 transition-colors"
            >
              Tap to Interrupt ✋
            </button>
          )}
        </div>

        {/* Transcript */}
        <div className="mt-6 w-full max-w-xl rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />

              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                DHOTI AALE (AI वॉइस मैन)
              </span>
            </div>

            <button
              onClick={playGreetingAudio}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-all hover:scale-105 active:scale-95"
              title="DHOTI AALE की आवाज़ सुनें"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>🔊 राम राम भाईसाहब सुनो</span>
            </button>
          </div>

          {userTranscript && (
            <div className="mb-2 text-xs text-amber-400/80 font-medium">
              You said:{' '}
              <span className="text-slate-200">
                &ldquo;{userTranscript}&rdquo;
              </span>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs">
              AI
            </div>

            <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
              {assistantTranscript}
            </p>
          </div>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="relative z-10 flex flex-col items-center gap-3 pt-3">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-2xl">
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              id={`quick-prompt-${idx}`}
              onClick={() =>
                handleSendPrompt(item.prompt)
              }
              className="rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-amber-300 transition-all active:scale-95 shadow-sm"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className="w-full max-w-xl flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="voice-manual-text-input"
              type="text"
              placeholder="Type anything in Hinglish / English..."
              value={manualInput}
              onChange={(e) =>
                setManualInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendPrompt(manualInput);
                }
              }}
              className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 shadow-inner"
            />

            <button
              id="voice-text-send-btn"
              onClick={() =>
                handleSendPrompt(manualInput)
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-amber-500 hover:bg-amber-400 p-2 text-slate-950 transition-colors shadow-md"
              title="Send text message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            id="toggle-chat-drawer-btn"
            onClick={() =>
              setIsTextChatOpen(
                !isTextChatOpen
              )
            }
            className={`rounded-2xl p-3 border transition-colors ${
              isTextChatOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
            title="Chat History"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat history */}
      {isTextChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />

                <h3 className="font-bold text-white text-sm">
                  Dhoti aale AI Chat History
                </h3>
              </div>

              <button
                onClick={() =>
                  setIsTextChatOpen(false)
                }
                className="text-slate-400 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {chatHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    item.sender === 'user'
                      ? 'items-end'
                      : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm ${
                      item.sender === 'user'
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                    }`}
                  >
                    {item.text}
                  </div>

                  <span className="text-[10px] text-slate-500 px-1 mt-0.5">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Reply to Dhoti AI..."
                value={manualInput}
                onChange={(e) =>
                  setManualInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendPrompt(manualInput);
                  }
                }}
                className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />

              <button
                onClick={() =>
                  handleSendPrompt(manualInput)
                }
                className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}