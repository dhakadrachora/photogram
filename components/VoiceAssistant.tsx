'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, VoiceState, ToolCall, AppTab } from '@/types';
import { LiveSession, selectMaleVoice } from '@/lib/audio/live-session';
import { AudioVisualizer } from './AudioVisualizer';
import { SoundEffects } from '@/lib/audio/sound-effects';
import {
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Send,
  Zap,
  Sparkles,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Crown,
  RefreshCw,
  Home as HomeIcon,
} from 'lucide-react';

interface VoiceAssistantProps {
  currentUser: User | null;
  onNavigateTab: (tab: AppTab) => void;
  onOpenAuth: () => void;
}

type CallStatus = 'idle' | 'calling' | 'connected' | 'ended';

export function VoiceAssistant({
  currentUser,
  onNavigateTab,
  onOpenAuth,
}: VoiceAssistantProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);

  const [voiceState, setVoiceState] = useState<VoiceState>('disconnected');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [userTranscript, setUserTranscript] = useState<string>('');

  const [assistantTranscript, setAssistantTranscript] = useState<string>(
    'राम राम भाईसाहब!'
  );

  const [recentTool, setRecentTool] = useState<ToolCall | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<
    {
      sender: 'user' | 'assistant';
      text: string;
      time: string;
    }[]
  >([
    {
      sender: 'assistant',
      text: 'राम राम भाईसाहब!',
      time: 'Just now',
    },
  ]);

  const [isTextChatOpen, setIsTextChatOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Autonomous Swarm Agent Runner State
  const [activeAgentModal, setActiveAgentModal] = useState<{
    id: string;
    name: string;
    icon: string;
    badge: string;
    desc: string;
  } | null>(null);
  const [agentPrompt, setAgentPrompt] = useState<string>('');
  const [agentRunning, setAgentRunning] = useState<boolean>(false);
  const [agentOutput, setAgentOutput] = useState<string | null>(null);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);

  const runSwarmAgentTask = async (agentId: string, customText?: string) => {
    try {
      setAgentRunning(true);
      setAgentOutput(null);
      const promptToSend = customText !== undefined ? customText : agentPrompt;
      const res = await fetch('/api/ai/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, prompt: promptToSend }),
      });
      const data = await res.json();
      if (data?.result) {
        setAgentOutput(data.result);
      } else {
        setAgentOutput('एजेंट ने कार्य प्रोसेस कर दिया है।');
      }
    } catch (err: any) {
      setAgentOutput(`एरर: ${err?.message || 'टास्क प्रोसेस नहीं हो सका'}`);
    } finally {
      setAgentRunning(false);
    }
  };

  const liveSessionRef = useRef<LiveSession | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
   * Duration Formatter (00:00)
   * ---------------------------------------------------------
   */
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /*
   * ---------------------------------------------------------
   * Create LiveSession
   * ---------------------------------------------------------
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
            const time = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            if (userText) {
              setChatHistory((prev) => [
                ...prev.slice(-10),
                { sender: 'user', text: userText, time },
                { sender: 'assistant', text: assistantText, time },
              ]);
            } else {
              setChatHistory((prev) => [
                ...prev.slice(-10),
                { sender: 'assistant', text: assistantText, time },
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

          if (tool.name === 'navigateTab' && tool.args?.tab) {
            let targetTab = String(tool.args.tab).toLowerCase();
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
              onNavigateTab(targetTab as AppTab);
            }
          }
        },
        onError: (err) => {
          showError(err || 'Voice connection में समस्या आ गई।');
        },
      },
      currentUser?.email || 'guest@dhotiaale.online'
    );

    liveSessionRef.current = session;

    return () => {
      try {
        session.disconnect();
      } catch {
        // Ignore cleanup
      }
      liveSessionRef.current = null;
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (toolTimerRef.current) clearTimeout(toolTimerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      SoundEffects.stopOutgoingRingtone();
    };
  }, [onNavigateTab, currentUser?.email]);

  // Keep authenticated email synced
  useEffect(() => {
    const session = liveSessionRef.current;
    if (!session) return;
    session.setUserEmail(currentUser?.email || 'guest@dhotiaale.online');
  }, [currentUser]);

  /*
   * ---------------------------------------------------------
   * Call Timer effect
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (callStatus === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStatus]);

  /*
   * ---------------------------------------------------------
   * START CALL (कॉल लगाएं और AI कॉल उठाएगा!)
   * ---------------------------------------------------------
   */
  const startCall = async (topicIntro?: string) => {
    setErrorMessage(null);
    const session = liveSessionRef.current;
    if (!session) {
      showError('कॉल सिस्टम तैयार हो रहा है, कृपया 2 सेकंड में दोबारा दबाएं।');
      return;
    }

    // 1. Immediately request microphone access on direct click gesture
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr: any) {
      console.warn('Microphone permission check on call click:', permErr?.message || permErr);
      showError('कृपया माइक्रोफ़ोन (Microphone) की परमिशन Allow करें।');
      return;
    }

    // 2. Enter Calling / Ringing state
    setCallStatus('calling');
    setUserTranscript('');
    setIsMuted(false);
    session.setMuted(false);

    // 3. Play realistic outgoing ringtone ("Tring... Tring...")
    SoundEffects.startOutgoingRingtone();

    // 4. Pre-fetch genuine neural male audio for the greeting while ringing
    const greetingMessage = 'राम राम भाईसाहब!';

    setAssistantTranscript(greetingMessage);

    let preloadedMaleAudio: string | null = null;
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: greetingMessage }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.audio) preloadedMaleAudio = data.audio;
      })
      .catch((err) => console.warn('Preload male TTS notice:', err));

    // 5. AI picks up call after realistic 2-second ringing delay
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);

    ringTimeoutRef.current = setTimeout(async () => {
      try {
        // AI Answers the call!
        SoundEffects.playCallConnected();
        setCallStatus('connected');
        setCallDuration(0);

        session.setUserEmail(currentUser?.email || 'guest@dhotiaale.online');
        await session.connect(greetingMessage, preloadedMaleAudio);
      } catch (error: any) {
        console.error('[VoiceCall] pickup failed:', error);
        SoundEffects.stopOutgoingRingtone();
        setCallStatus('ended');
        showError('कॉल कनेक्ट होने में समस्या आई। कृपया दोबारा प्रयास करें।');
      }
    }, 2200);
  };

  /*
   * ---------------------------------------------------------
   * END CALL (कॉल काटें)
   * ---------------------------------------------------------
   */
  const endCall = () => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    SoundEffects.stopOutgoingRingtone();
    SoundEffects.playCallEnded();

    const session = liveSessionRef.current;
    if (session) {
      try {
        session.disconnect();
      } catch {
        // ignore
      }
    }

    setCallStatus('ended');
  };

  /*
   * ---------------------------------------------------------
   * TOGGLE MUTE
   * ---------------------------------------------------------
   */
  const toggleMute = () => {
    const session = liveSessionRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (session) {
      session.setMuted(nextMuted);
    }
  };

  /*
   * ---------------------------------------------------------
   * TOGGLE SPEAKER
   * ---------------------------------------------------------
   */
  const toggleSpeaker = () => {
    setIsSpeakerOn((prev) => !prev);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeakerOn) {
        window.speechSynthesis.cancel();
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * Public in-call text prompt
   * ---------------------------------------------------------
   */
  const handleSendPrompt = (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    setErrorMessage(null);
    setUserTranscript(text);
    setManualInput('');

    const session = liveSessionRef.current;
    if (!session) {
      showError('AI अभी तैयार नहीं है, थोड़ी देर में प्रयास करें।');
      return;
    }

    try {
      session.processUserInput(text, isSpeakerOn);
    } catch (error) {
      console.error('[VoiceAssistant] text prompt failed:', error);
      showError('AI से जवाब लेने में समस्या आई।');
    }
  };

  const quickCallTopics = [
    {
      label: '🎁 100 फ्री रील्स व्यूज',
      topic: '100 फ्री इंस्टाग्राम रील्स व्यूज बूस्टर',
    },
    {
      label: '⚔️ अखाड़े में कौन जीतेगा?',
      topic: 'अखाड़े के लाइव मुकाबले और जीतने की संभावना',
    },
    {
      label: '👑 DHOTI AALE एडमिन',
      topic: 'DHOTI AALE एडमिन टीम',
    },
    {
      label: '📢 गाँव ढोटी की ताज़ा खबर',
      topic: 'गाँव ढोटी के ताज़ा समाचार व अपडेट्स',
    },
    {
      label: '🪙 धोती सिक्के कैसे कमाएं?',
      topic: 'धोती सिक्के (Dhoti Coins) कमाने के नियम',
    },
    {
      label: '🔥 कड़क चौपाल की शायरी',
      topic: 'देसी चौपाल की शायरी और स्वैग',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] w-full flex flex-col justify-between p-3 sm:p-6 max-w-4xl mx-auto">
      {/* Background ambient light */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-amber-500/10 to-orange-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Info */}
      <div className="relative z-10 flex flex-col items-center text-center pt-2">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          {/* Live Call Mode Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>24/7 लाइव देसी वॉइस कॉल • 100% फ्री</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 border border-amber-500/30 text-amber-300 text-[11px] font-bold shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>देसी मर्द की आवाज़ (Hindi Male Voice) 🎙️</span>
          </div>
        </div>

        {/* Tool Feedback Banner */}
        {recentTool && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-400 px-3.5 py-1 text-xs text-amber-200 font-semibold animate-in slide-in-from-top-2">
            <Zap className="h-4 w-4 text-amber-400 animate-spin" />
            <span>
              कार्य पूरा किया: <strong>{recentTool.name}</strong>
            </span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-red-500/20 border border-red-500/40 px-3.5 py-1.5 text-xs text-red-200 animate-in shake">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* ========================================================
          SCREEN 1: IDLE / READY TO CALL (कॉल लगाने के लिए तैयार)
          ======================================================== */}
      {callStatus === 'idle' && (
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Profile Card */}
          <div className="relative flex flex-col items-center">
            {/* Glowing Ring around Avatar */}
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 opacity-60 blur-xl animate-pulse" />
              <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-amber-400 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 flex flex-col items-center justify-center shadow-2xl overflow-hidden">
                <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-amber-400" />
                <span className="text-[10px] sm:text-xs font-black uppercase text-amber-200 tracking-wider mt-1">
                  DHOTI AALE
                </span>
                <span className="text-[8px] font-bold text-emerald-400">
                  AI देसी भाई
                </span>
              </div>
              <span className="absolute bottom-1 right-2 flex h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-slate-950 animate-pulse" />
            </div>

            {/* Caller Name & Details */}
            <div className="mt-4 text-center">
              <h1 className="text-2xl sm:text-4xl font-black text-white flex items-center justify-center gap-2">
                <span>DHOTI AALE AI</span>
                <span className="text-blue-400 text-lg sm:text-2xl" title="वेरिफाइड ब्लू टिक">
                  ✓
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                देसी AI डिजिटल साथी • 24/7 लाइव वॉइस कॉल
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ऑनलाइन है • कॉल उठाने के लिए तैयार 🟢</span>
              </div>
            </div>

            {/* MAIN GREEN CALL BUTTON */}
            <div className="mt-8 flex flex-col items-center">
              <button
                id="start-ai-call-btn"
                onClick={() => startCall()}
                className="group relative flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-lg sm:text-xl shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all hover:scale-105 active:scale-95 ring-4 ring-emerald-400/30"
                title="DHOTI AALE AI को लाइव कॉल लगाएं"
              >
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/20">
                  <PhoneCall className="h-6 w-6 sm:h-7 sm:w-7 animate-bounce" />
                </div>
                <span>कॉल लगाएं (Call Now 📞)</span>
              </button>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                बटन दबाते ही घंटी बजेगी और DHOTI AALE कॉल उठाएगा!
              </p>
            </div>

            {/* 🤖 DEPLOYED AUTONOMOUS AI AGENT SWARM HUB */}
            <div className="mt-10 w-full max-w-2xl px-2">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Autonomous AI Swarm (ऑल एआई एजेंट्स)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  6 Agents Active 🟢
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Agent 1 */}
                <div
                  onClick={() => {
                    SoundEffects.playTap();
                    setActiveAgentModal({
                      id: 'voice_man',
                      name: 'Desi Voice Man (गाँव वॉइस मैन)',
                      icon: '🎙️',
                      badge: '24x7 Live Voice',
                      desc: 'देसी हिंदी व राजस्थानी लाइव वॉइस चैट और अखाड़ा गाइड',
                    });
                    setAgentPrompt('');
                    setAgentOutput(null);
                  }}
                  className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 hover:bg-slate-800/90 cursor-pointer transition-all flex items-start gap-3 group shadow-lg"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 text-base group-hover:scale-110 transition-transform">
                    🎙️
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300">Desi Voice Man</span>
                      <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded font-bold">24x7 Voice</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      देसी हिंदी व राजस्थानी लाइव वॉइस चैट और अखाड़ा गाइड
                    </p>
                  </div>
                </div>

                {/* Agent 2 */}
                <div
                  onClick={() => {
                    SoundEffects.playTap();
                    setActiveAgentModal({
                      id: 'seo_writer',
                      name: 'SEO & Viral News Agent',
                      icon: '✍️',
                      badge: 'Auto-Publish Engine',
                      desc: 'डेली ऑटोमेटेड ट्रेंडिंग न्यूज़ आर्टिकल्स और एसईओ ब्लॉग्स',
                    });
                    setAgentPrompt('');
                    setAgentOutput(null);
                  }}
                  className="p-3 rounded-xl bg-slate-900/80 border border-sky-500/30 hover:border-sky-400 hover:bg-slate-800/90 cursor-pointer transition-all flex items-start gap-3 group shadow-lg"
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 text-base group-hover:scale-110 transition-transform">
                    ✍️
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-sky-300">SEO & Viral News</span>
                      <span className="text-[9px] px-1 bg-sky-500/20 text-sky-300 rounded font-bold">Auto-Publish</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      डेली ऑटोमेटेड न्यूज़ आर्टिकल्स और ट्रेंडिंग ब्लॉग पब्लिशर
                    </p>
                  </div>
                </div>

                {/* Agent 3 */}
                <div
                  onClick={() => {
                    SoundEffects.playTap();
                    setActiveAgentModal({
                      id: 'freelance_pitcher',
                      name: 'Freelance Pitch & Client Hunter',
                      icon: '💼',
                      badge: 'Global Outreach',
                      desc: 'वेब डेवलपमेंट, वीडियो और एसईओ के लिए हाई-कन्वर्टिंग क्लाइंट आउटरीच',
                    });
                    setAgentPrompt('');
                    setAgentOutput(null);
                  }}
                  className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-400 hover:bg-slate-800/90 cursor-pointer transition-all flex items-start gap-3 group shadow-lg"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 text-base group-hover:scale-110 transition-transform">
                    💼
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300">Freelance Pitcher</span>
                      <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-300 rounded font-bold">Global Outreach</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      वेब डेवलपमेंट, वीडियो और एसईओ के लिए क्लाइंट हंटिंग
                    </p>
                  </div>
                </div>

                {/* Agent 4 */}
                <div
                  onClick={() => {
                    SoundEffects.playTap();
                    setActiveAgentModal({
                      id: 'studio_3d',
                      name: '3D Video & Cinematic Studio Agent',
                      icon: '🎬',
                      badge: 'Cinematic 8K',
                      desc: '8K 3D डॉक्यूमेंट्री, थ्री.जेएस विजुअल्स और रील्स क्रिएटर',
                    });
                    setAgentPrompt('');
                    setAgentOutput(null);
                  }}
                  className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/30 hover:border-purple-400 hover:bg-slate-800/90 cursor-pointer transition-all flex items-start gap-3 group shadow-lg"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 text-base group-hover:scale-110 transition-transform">
                    🎬
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300">3D Video & Studio</span>
                      <span className="text-[9px] px-1 bg-purple-500/20 text-purple-300 rounded font-bold">Cinematic</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      8K 3D डॉक्यूमेंट्री, थ्री.जेएस विजुअल्स और रील्स क्रिएटर
                    </p>
                  </div>
                </div>

                {/* Agent 5 */}
                <div
                  onClick={() => {
                    SoundEffects.playTap();
                    setActiveAgentModal({
                      id: 'job_hunter',
                      name: 'Remote Job Outreach Hunter',
                      icon: '🎯',
                      badge: 'Batch Auto',
                      desc: 'इंटरनेशनल व डोमेस्टिक रिमोट जॉब्स सर्च व ऑटो-अप्लाई',
                    });
                    setAgentPrompt('');
                    setAgentOutput(null);
                  }}
                  className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/30 hover:border-rose-400 hover:bg-slate-800/90 cursor-pointer transition-all flex items-start gap-3 group shadow-lg"
                >
                  <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 text-base group-hover:scale-110 transition-transform">
                    🎯
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-rose-300">Remote Job Hunter</span>
                      <span className="text-[9px] px-1 bg-rose-500/20 text-rose-300 rounded font-bold">Batch Auto</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      इंटरनेशनल व डोमेस्टिक रिमोट जॉब्स सर्च व ऑटो-अप्लाई
                    </p>
                  </div>
                </div>

                {/* Agent 6 */}
                <div
                  onClick={() => {
                    SoundEffects.playTap();
                    setActiveAgentModal({
                      id: 'dev_bot',
                      name: 'Full-Stack Dev Bot',
                      icon: '💻',
                      badge: 'Vercel & Next',
                      desc: 'नेक्स्ट.जेएस आर्किटेक्चर, एपीआई, बग फिक्सिंग व सीआई/सीडी',
                    });
                    setAgentPrompt('');
                    setAgentOutput(null);
                  }}
                  className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/30 hover:border-indigo-400 hover:bg-slate-800/90 cursor-pointer transition-all flex items-start gap-3 group shadow-lg"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 text-base group-hover:scale-110 transition-transform">
                    💻
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-indigo-300">Full-Stack Dev Bot</span>
                      <span className="text-[9px] px-1 bg-indigo-500/20 text-indigo-300 rounded font-bold">Vercel & Next</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      नेक्स्ट.जेएस आर्किटेक्चर, एपीआई, बग फिक्सिंग व सीआई/सीडी
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SCREEN 2: RINGING / CALLING (कॉल लग रही है...)
          ======================================================== */}
      {callStatus === 'calling' && (
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8 animate-in fade-in duration-300">
          {/* Animated Pulsing Calling Avatar */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute h-40 w-40 sm:h-48 sm:w-48 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="absolute h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-emerald-500/30 animate-pulse" />
            <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-emerald-400 bg-slate-900 flex flex-col items-center justify-center shadow-2xl">
              <PhoneCall className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-400 animate-bounce" />
              <span className="text-[9px] sm:text-xs font-black uppercase text-emerald-300 mt-1">
                DHOTI AALE
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white text-center">
            DHOTI AALE AI को कॉल लग रही है...
          </h2>
          <p className="text-sm sm:text-base font-bold text-amber-300 mt-1 animate-pulse">
            घंटी बज रही है... (Ringing... 📳)
          </p>
          <p className="text-xs text-slate-400 mt-1">
            AI भाईसाहब बस कॉल उठाने ही वाले हैं!
          </p>

          {/* Cancel Call Button */}
          <div className="mt-8">
            <button
              onClick={endCall}
              className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 ring-4 ring-red-500/30"
              title="कॉल रद्द करें"
            >
              <PhoneOff className="h-5 w-5" />
              <span>कॉल रद्द करें (Cancel)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          SCREEN 3: ACTIVE LIVE CALL (🟢 कॉल चालू है)
          ======================================================== */}
      {callStatus === 'connected' && (
        <div className="relative z-10 flex flex-col items-center justify-between my-auto py-2 sm:py-4 w-full animate-in zoom-in-95 duration-300">
          {/* Active Call Header */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-emerald-500/40 px-4 py-1.5 rounded-full shadow-lg mb-4">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs sm:text-sm font-black text-emerald-300 uppercase tracking-wider">
              🟢 लाइव कॉल चालू है • {formatDuration(callDuration)}
            </span>
          </div>

          {/* Active Visualizer & Caller State */}
          <div className="relative flex flex-col items-center my-2">
            <AudioVisualizer state={voiceState} audioLevel={audioLevel} />

            {/* In-Call Status Pill */}
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-1.5 border border-slate-700 text-slate-200 text-xs font-bold shadow-md">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  voiceState === 'speaking'
                    ? 'bg-orange-400 animate-pulse'
                    : isMuted
                    ? 'bg-red-400'
                    : 'bg-emerald-400 animate-ping'
                }`}
              />
              <span>
                {isMuted
                  ? 'माइक म्यूट है 🔇'
                  : voiceState === 'speaking'
                  ? 'DHOTI AALE बोल रहा है 🗣️'
                  : 'सुन रहा हूँ भाईसाहब... बोलिए 👂'}
              </span>
            </div>
          </div>

          {/* Real-Time Live Transcript HUD Card */}
          <div className="mt-4 w-full max-w-xl rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-2xl backdrop-blur-md">
            {userTranscript && (
              <div className="mb-2 text-xs text-amber-300/90 font-medium bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-400">आप: </span>
                <span>&ldquo;{userTranscript}&rdquo;</span>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 font-black text-[11px]">
                AI
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed">
                {assistantTranscript}
              </p>
            </div>
          </div>

          {/* IN-CALL CONTROLS BAR (Phone Call Dock) */}
          <div className="mt-6 flex items-center justify-center gap-4 sm:gap-6">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`flex flex-col items-center gap-1 p-3 sm:p-4 rounded-2xl border transition-all active:scale-95 ${
                isMuted
                  ? 'bg-red-500/20 border-red-500 text-red-300 ring-4 ring-red-500/20'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
              title={isMuted ? 'अनम्यूट करें' : 'माइक म्यूट करें'}
            >
              {isMuted ? (
                <MicOff className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
              ) : (
                <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
              )}
              <span className="text-[10px] font-bold">
                {isMuted ? 'Muted' : 'Mic On'}
              </span>
            </button>

            {/* Speaker Button */}
            <button
              onClick={toggleSpeaker}
              className={`flex flex-col items-center gap-1 p-3 sm:p-4 rounded-2xl border transition-all active:scale-95 ${
                !isSpeakerOn
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
              title={isSpeakerOn ? 'आवाज़ बंद करें' : 'आवाज़ चालू करें'}
            >
              {isSpeakerOn ? (
                <Volume2 className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
              ) : (
                <VolumeX className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
              )}
              <span className="text-[10px] font-bold">
                {isSpeakerOn ? 'Speaker' : 'Mute Spk'}
              </span>
            </button>

            {/* Chat History Button */}
            <button
              onClick={() => setIsTextChatOpen(!isTextChatOpen)}
              className="flex flex-col items-center gap-1 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all active:scale-95"
              title="चैट हिस्ट्री देखें"
            >
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              <span className="text-[10px] font-bold">History</span>
            </button>

            {/* BIG RED HANG UP BUTTON (कॉल काटें) */}
            <button
              id="end-ai-call-btn"
              onClick={endCall}
              className="flex flex-col items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all hover:scale-105 active:scale-90 ring-4 ring-red-500/30"
              title="कॉल काटें (End Call)"
            >
              <PhoneOff className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          SCREEN 4: CALL ENDED (कॉल समाप्त)
          ======================================================== */}
      {callStatus === 'ended' && (
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 border-2 border-slate-700 shadow-xl mb-3">
            <Phone className="h-9 w-9 text-slate-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">
            कॉल समाप्त (Call Ended)
          </h2>
          <p className="text-sm font-semibold text-emerald-400 mt-1">
            बातचीत का कुल समय: {formatDuration(callDuration)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            DHOTI AALE AI हमेशा आपकी सेवा में हाजिर है!
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => startCall()}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-sm shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>दोबारा कॉल लगाएं (Call Again 📞)</span>
            </button>

            <button
              onClick={() => onNavigateTab('home')}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm transition-all"
            >
              <HomeIcon className="h-4 w-4" />
              <span>होमपेज पर जाएं</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM QUICK TOPICS & TEXT FALLBACK
          ======================================================== */}
      <div className="relative z-10 flex flex-col items-center gap-2.5 pt-3">
        {/* Quick Call Topics (clickable both in idle & call) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-2xl">
          {quickCallTopics.map((item, idx) => (
            <button
              key={idx}
              id={`quick-call-topic-${idx}`}
              onClick={() => {
                if (callStatus === 'connected') {
                  handleSendPrompt(item.topic);
                } else {
                  startCall(item.topic);
                }
              }}
              className="rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-amber-300 transition-all active:scale-95 shadow-sm"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Text Input (always accessible during call or idle) */}
        <div className="w-full max-w-xl flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="voice-manual-text-input"
              type="text"
              placeholder={
                callStatus === 'connected'
                  ? 'कॉल पर मैसेज भी लिख सकते हैं...'
                  : 'कॉल न लगे तो यहाँ मैसेज लिखकर पूछें...'
              }
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (callStatus !== 'connected') {
                    startCall();
                    setTimeout(() => handleSendPrompt(manualInput), 2500);
                  } else {
                    handleSendPrompt(manualInput);
                  }
                }
              }}
              className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 shadow-inner"
            />

            <button
              id="voice-text-send-btn"
              onClick={() => {
                if (callStatus !== 'connected') {
                  startCall();
                  setTimeout(() => handleSendPrompt(manualInput), 2500);
                } else {
                  handleSendPrompt(manualInput);
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-amber-500 hover:bg-amber-400 p-2 text-slate-950 transition-colors shadow-md"
              title="मैसेज भेजें"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            id="toggle-chat-drawer-btn"
            onClick={() => setIsTextChatOpen(!isTextChatOpen)}
            className={`rounded-2xl p-3 border transition-colors ${
              isTextChatOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
            title="चैट हिस्ट्री"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
          AUTONOMOUS AI AGENT WORKSPACE MODAL
          ======================================================== */}
      {activeAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900/95 border border-amber-500/40 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
                  {activeAgentModal.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-sm sm:text-base">
                      {activeAgentModal.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      {activeAgentModal.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeAgentModal.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  SoundEffects.playTap();
                  setActiveAgentModal(null);
                }}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                ✕ बंद करें
              </button>
            </div>

            {/* Modal Body & Quick Action Prompts */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  एजेंट को क्या काम देना है? (कस्टम निर्देश या तुरंत कार्य चुनें)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="जैसे: नया वायरल आर्टिकल लिखो, कोल्ड ईमेल भेजो..."
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !agentRunning) {
                        runSwarmAgentTask(activeAgentModal.id);
                      }
                    }}
                    className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 placeholder-slate-500 shadow-inner"
                  />
                  <button
                    onClick={() => runSwarmAgentTask(activeAgentModal.id)}
                    disabled={agentRunning}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {agentRunning ? (
                      <>
                        <Zap className="h-4 w-4 animate-spin" />
                        <span>काम चालू है...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>एजेंट रन करें</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Agent Execution Result Output */}
              {agentOutput && (
                <div className="rounded-2xl bg-slate-950/90 border border-amber-500/30 p-4 relative space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      कार्य परिणाम (Live Agent Output)
                    </span>
                    <button
                      onClick={() => {
                        SoundEffects.playTap();
                        navigator.clipboard.writeText(agentOutput);
                        setCopiedResult(true);
                        setTimeout(() => setCopiedResult(false), 2000);
                      }}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      {copiedResult ? '✓ कॉपी हो गया' : '📋 कॉपी करें'}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {agentOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}