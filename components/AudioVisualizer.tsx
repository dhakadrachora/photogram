'use client';

import React, { useState, useEffect } from 'react';
import { VoiceState } from '@/types';

interface AudioVisualizerProps {
  state: VoiceState;
  audioLevel: number;
}

export function AudioVisualizer({ state, audioLevel }: AudioVisualizerProps) {
  // Generate 24 animated wave bars
  const barsCount = 24;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (state === 'disconnected') return;
    let animId: number;
    let frame = 0;
    const loop = () => {
      frame += 1;
      setTick(frame);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state]);

  return (
    <div className="relative flex items-center justify-center h-44 sm:h-56 w-full max-w-sm mx-auto select-none">
      {/* Outer ambient glow circles */}
      <div
        className={`absolute rounded-full filter blur-2xl transition-all duration-700 pointer-events-none ${
          state === 'speaking'
            ? 'h-48 w-48 bg-orange-500/40 scale-125'
            : state === 'listening'
            ? 'h-44 w-44 bg-amber-400/30 scale-110'
            : state === 'connecting'
            ? 'h-36 w-36 bg-blue-500/20 animate-pulse'
            : 'h-28 w-28 bg-slate-700/20'
        }`}
      />

      {/* Pulsing ring 1 */}
      {(state === 'listening' || state === 'speaking') && (
        <div
          className="absolute rounded-full border border-amber-400/40 pointer-events-none transition-transform duration-100"
          style={{
            width: `${140 + audioLevel * 70}px`,
            height: `${140 + audioLevel * 70}px`,
            opacity: Math.max(0.2, 1 - audioLevel * 0.5),
          }}
        />
      )}

      {/* Pulsing ring 2 */}
      {(state === 'listening' || state === 'speaking') && (
        <div
          className="absolute rounded-full border border-orange-500/30 pointer-events-none transition-transform duration-150"
          style={{
            width: `${180 + audioLevel * 100}px`,
            height: `${180 + audioLevel * 100}px`,
            opacity: Math.max(0.1, 0.8 - audioLevel * 0.6),
          }}
        />
      )}

      {/* Waveform Frequency Bars Ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-1 sm:gap-1.5 h-20">
          {Array.from({ length: barsCount }).map((_, i) => {
            const distanceFromCenter = Math.abs(i - barsCount / 2) / (barsCount / 2);
            const baseFactor = 1 - distanceFromCenter * 0.6;

            let heightPercent = 10;
            if (state === 'speaking') {
              const sineWave = Math.sin(tick * 0.15 + i * 0.4) * 0.5 + 0.5;
              heightPercent = Math.max(15, (sineWave * 70 + 20) * baseFactor);
            } else if (state === 'listening') {
              const dynamic = (audioLevel * 100 + 10) * baseFactor;
              heightPercent = Math.min(95, Math.max(12, dynamic));
            } else if (state === 'connecting') {
              const ripple = Math.sin(tick * 0.1 + i * 0.3) * 20 + 25;
              heightPercent = ripple;
            }

            return (
              <div
                key={i}
                className={`w-1 sm:w-1.5 rounded-full transition-all duration-75 ${
                  state === 'speaking'
                    ? 'bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-200'
                    : state === 'listening'
                    ? 'bg-gradient-to-t from-amber-600 via-amber-400 to-amber-200'
                    : state === 'connecting'
                    ? 'bg-blue-400/60'
                    : 'bg-slate-700/50'
                }`}
                style={{
                  height: `${heightPercent}%`,
                  minHeight: '4px',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
