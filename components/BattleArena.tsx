'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Swords,
  Flame,
  Trophy,
  RefreshCw,
  CheckCircle2,
  Lock,
  LogIn,
  Vote,
  Clock,
  ShieldCheck,
  Crown,
  Users,
  MessageCircle,
} from 'lucide-react';

import { User, BattleEvent, AppTab } from '@/types';
import { isSiteAdmin } from '@/lib/admin-auth';

interface BattleArenaProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  selectedOpponent?: string;
  onUpdateUser?: (updater: (prev: User) => User) => void;
  onNavigateTab?: (tab: AppTab) => void;
}

type VoteFeedback = {
  battleId: string;
  message: string;
  type: 'success' | 'error';
};

function formatRemaining(ms: number): string {
  if (ms <= 0) {
    return '00:00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(
      minutes
    ).padStart(2, '0')}m`;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;
}

function getBattleStatus(battle: BattleEvent, now: number) {
  if (battle.isEnded || battle.status === 'closed') {
    return 'closed' as const;
  }

  if (battle.startsAt != null && now < battle.startsAt) {
    return 'upcoming' as const;
  }

  if (battle.endsAt != null && battle.endsAt <= now) {
    return 'closed' as const;
  }

  return 'active' as const;
}

function getWinnerLabel(battle: BattleEvent): string | null {
  if (!battle.winnerOptionId) {
    return null;
  }

  if (battle.winnerOptionId === battle.optionA.id) {
    return battle.optionA.label;
  }

  if (battle.winnerOptionId === battle.optionB.id) {
    return battle.optionB.label;
  }

  return null;
}

function getImageUrl(imageUrl?: string) {
  if (!imageUrl || !imageUrl.trim()) {
    return null;
  }

  return imageUrl.trim();
}

function BattleOptionImage({
  imageUrl,
  alt,
}: {
  imageUrl?: string;
  alt: string;
}) {
  const src = getImageUrl(imageUrl);

  if (!src) {
    return (
      <div className="flex h-full min-h-[220px] w-full items-center justify-center bg-zinc-900 text-6xl">
        🏆
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      className="object-cover"
      unoptimized
    />
  );
}

export function BattleArena({
  currentUser,
  onOpenAuth,
  selectedOpponent,
  onUpdateUser,
  onNavigateTab,
}: BattleArenaProps) {
  const isAdmin = isSiteAdmin(currentUser?.email);

  const [activeArenaTab, setActiveArenaTab] = useState<'events' | '1v1'>(
    'events'
  );

  const [battleEvents, setBattleEvents] = useState<BattleEvent[]>([]);
  const [isLoadingBattles, setIsLoadingBattles] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [votingBattleId, setVotingBattleId] = useState<string | null>(null);

  const [voteFeedback, setVoteFeedback] =
    useState<VoteFeedback | null>(null);

  const [selectedBattle, setSelectedBattle] =
    useState<BattleEvent | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const opponentName =
    selectedOpponent || 'Dhoti Aale AI Champion';

  const loadBattles = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setIsRefreshing(true);
      }

      try {
        setErrorMessage(null);

        const emailParam = currentUser?.email
          ? `?email=${encodeURIComponent(currentUser.email)}`
          : '';

        const response = await fetch(`/api/battle/vote${emailParam}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error || 'Battle data load nahi ho saka.'
          );
        }

        if (Array.isArray(data?.battles)) {
          setBattleEvents(data.battles);
        } else {
          setBattleEvents([]);
        }
      } catch (error) {
        console.error('Battle load error:', error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Battle data load nahi ho saka.'
        );
      } finally {
        setIsLoadingBattles(false);
        setIsRefreshing(false);
      }
    },
    [currentUser?.email]
  );

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        setIsLoadingBattles(true);

        const emailParam = currentUser?.email
          ? `?email=${encodeURIComponent(currentUser.email)}`
          : '';

        const response = await fetch(`/api/battle/vote${emailParam}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });

        const data = await response.json().catch(() => null);

        if (!cancelled) {
          if (response.ok && Array.isArray(data?.battles)) {
            setBattleEvents(data.battles);
            setErrorMessage(null);
          } else {
            setBattleEvents([]);
            setErrorMessage(
              data?.error || 'Battle data load nahi ho saka.'
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Battle initial load error:', error);

          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Battle data load nahi ho saka.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBattles(false);
        }
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.email]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const hasExpiredActiveBattle = battleEvents.some((battle) => {
      const status = getBattleStatus(battle, now);

      return (
        status === 'closed' &&
        !battle.isEnded &&
        battle.status !== 'closed'
      );
    });

    if (!hasExpiredActiveBattle) {
      return;
    }

    const timer = window.setTimeout(() => {
      loadBattles(false);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [battleEvents, now, loadBattles]);

  const voteForBattle = async (
    battleId: string,
    optionId: string
  ) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (votingBattleId) {
      return;
    }

    setVotingBattleId(battleId);
    setVoteFeedback(null);

    try {
      const response = await fetch('/api/battle/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          battleId,
          optionId,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || 'Vote submit nahi ho saka.'
        );
      }

      setVoteFeedback({
        battleId,
        message:
          data?.message || 'Vote successfully submit ho gaya.',
        type: 'success',
      });

      if (data?.battle) {
        setBattleEvents((previous) =>
          previous.map((battle) =>
            battle.id === battleId ? data.battle : battle
          )
        );
      }

      await loadBattles(false);

      if (onUpdateUser) {
        onUpdateUser((previous) => ({
          ...previous,
          battles: (previous.battles || 0) + 1,
        }));
      }
    } catch (error) {
      console.error('Battle vote error:', error);

      setVoteFeedback({
        battleId,
        message:
          error instanceof Error
            ? error.message
            : 'Vote submit nahi ho saka.',
        type: 'error',
      });
    } finally {
      setVotingBattleId(null);
    }
  };

  const visibleBattles = useMemo(() => {
    return battleEvents.filter((battle) => {
      if (isAdmin) {
        return true;
      }

      return battle.published !== false;
    });
  }, [battleEvents, isAdmin]);

  const activeBattles = useMemo(() => {
    return visibleBattles.filter(
      (battle) => getBattleStatus(battle, now) === 'active'
    );
  }, [visibleBattles, now]);

  const upcomingBattles = useMemo(() => {
    return visibleBattles.filter(
      (battle) => getBattleStatus(battle, now) === 'upcoming'
    );
  }, [visibleBattles, now]);

  const closedBattles = useMemo(() => {
    return visibleBattles.filter(
      (battle) => getBattleStatus(battle, now) === 'closed'
    );
  }, [visibleBattles, now]);

  const renderBattleCard = (battle: BattleEvent) => {
    const status = getBattleStatus(battle, now);

    const totalVotes =
      typeof battle.totalVotes === 'number'
        ? battle.totalVotes
        : (battle.optionA.votes || 0) +
          (battle.optionB.votes || 0);

    const optionAVotes = battle.optionA.votes || 0;
    const optionBVotes = battle.optionB.votes || 0;

    const optionAPercent =
      totalVotes > 0
        ? Math.round((optionAVotes / totalVotes) * 100)
        : 0;

    const optionBPercent =
      totalVotes > 0 ? 100 - optionAPercent : 0;

    const winnerLabel = getWinnerLabel(battle);

    const remaining =
      status === 'active' && battle.endsAt != null
        ? Math.max(0, battle.endsAt - now)
        : 0;

    const canVote =
      Boolean(currentUser) &&
      status === 'active' &&
      !battle.userVotedOptionId &&
      votingBattleId === null;

    return (
      <article
        key={battle.id}
        className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl"
      >
        <div className="border-b border-white/10 bg-gradient-to-r from-orange-600/20 via-red-600/10 to-purple-600/20 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-300">
                  {battle.category}
                </span>

                {status === 'active' && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    LIVE
                  </span>
                )}

                {status === 'upcoming' && (
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300">
                    UPCOMING
                  </span>
                )}

                {status === 'closed' && (
                  <span className="flex items-center gap-1 rounded-full bg-zinc-500/15 px-3 py-1 text-xs font-semibold text-zinc-300">
                    <Lock size={13} />
                    CLOSED
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-white sm:text-2xl">
                {battle.title}
              </h3>

              {battle.description && (
                <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                  {battle.description}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                <Vote size={14} />
                TOTAL VOTES
              </div>

              <div className="mt-1 text-2xl font-black text-white">
                {totalVotes}
              </div>
            </div>
          </div>
        </div>

        {status === 'active' && (
          <div className="flex items-center justify-center gap-2 border-b border-white/10 bg-red-500/5 px-4 py-3 text-sm font-bold text-red-300">
            <Clock size={16} />
            Voting closes in {formatRemaining(remaining)}
          </div>
        )}

        {status === 'upcoming' && battle.startsAt != null && (
          <div className="flex items-center justify-center gap-2 border-b border-white/10 bg-blue-500/5 px-4 py-3 text-sm font-bold text-blue-300">
            <Clock size={16} />
            Battle starts soon
          </div>
        )}

        <div className="grid gap-4 p-4 md:grid-cols-2 md:p-6">
          <div
            className={`overflow-hidden rounded-2xl border ${
              battle.userVotedOptionId === battle.optionA.id
                ? 'border-emerald-400/60 bg-emerald-500/5'
                : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <div className="relative min-h-[220px] overflow-hidden">
              <BattleOptionImage
                imageUrl={battle.optionA.imageUrl}
                alt={battle.optionA.label}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4">
                <div className="mb-1 text-3xl">
                  {battle.optionA.emoji || '🔥'}
                </div>

                <h4 className="text-xl font-black text-white">
                  {battle.optionA.label}
                </h4>

                {battle.optionA.tagline && (
                  <p className="mt-1 text-sm text-zinc-300">
                    {battle.optionA.tagline}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-zinc-300">
                  {optionAVotes} votes
                </span>

                <span className="font-black text-orange-300">
                  {optionAPercent}%
                </span>
              </div>

              <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-500"
                  style={{
                    width: `${optionAPercent}%`,
                  }}
                />
              </div>

              {status === 'active' && (
                <button
                  type="button"
                  disabled={!canVote}
                  onClick={() =>
                    voteForBattle(
                      battle.id,
                      battle.optionA.id
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {battle.userVotedOptionId ===
                  battle.optionA.id ? (
                    <>
                      <CheckCircle2 size={18} />
                      Your Vote
                    </>
                  ) : votingBattleId === battle.id ? (
                    <>
                      <RefreshCw
                        size={18}
                        className="animate-spin"
                      />
                      Voting...
                    </>
                  ) : (
                    <>
                      <Vote size={18} />
                      Vote A
                    </>
                  )}
                </button>
              )}

              {status === 'closed' &&
                battle.winnerOptionId === battle.optionA.id && (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500/10 px-4 py-3 font-bold text-yellow-300">
                    <Trophy size={18} />
                    Winner
                  </div>
                )}
            </div>
          </div>

          <div className="relative md:hidden">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />

              <div className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-black text-red-300">
                VS
              </div>

              <div className="h-px flex-1 bg-white/10" />
            </div>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border ${
              battle.userVotedOptionId === battle.optionB.id
                ? 'border-emerald-400/60 bg-emerald-500/5'
                : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <div className="relative min-h-[220px] overflow-hidden">
              <BattleOptionImage
                imageUrl={battle.optionB.imageUrl}
                alt={battle.optionB.label}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4">
                <div className="mb-1 text-3xl">
                  {battle.optionB.emoji || '⚡'}
                </div>

                <h4 className="text-xl font-black text-white">
                  {battle.optionB.label}
                </h4>

                {battle.optionB.tagline && (
                  <p className="mt-1 text-sm text-zinc-300">
                    {battle.optionB.tagline}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-zinc-300">
                  {optionBVotes} votes
                </span>

                <span className="font-black text-purple-300">
                  {optionBPercent}%
                </span>
              </div>

              <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-500"
                  style={{
                    width: `${optionBPercent}%`,
                  }}
                />
              </div>

              {status === 'active' && (
                <button
                  type="button"
                  disabled={!canVote}
                  onClick={() =>
                    voteForBattle(
                      battle.id,
                      battle.optionB.id
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 font-bold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {battle.userVotedOptionId ===
                  battle.optionB.id ? (
                    <>
                      <CheckCircle2 size={18} />
                      Your Vote
                    </>
                  ) : votingBattleId === battle.id ? (
                    <>
                      <RefreshCw
                        size={18}
                        className="animate-spin"
                      />
                      Voting...
                    </>
                  ) : (
                    <>
                      <Vote size={18} />
                      Vote B
                    </>
                  )}
                </button>
              )}

              {status === 'closed' &&
                battle.winnerOptionId === battle.optionB.id && (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500/10 px-4 py-3 font-bold text-yellow-300">
                    <Trophy size={18} />
                    Winner
                  </div>
                )}
            </div>
          </div>
        </div>

        {status === 'closed' && (
          <div className="mx-4 mb-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center md:mx-6 md:mb-6">
            {winnerLabel ? (
              <>
                <div className="mb-2 flex items-center justify-center gap-2 text-yellow-300">
                  <Trophy size={22} />

                  <span className="font-black">
                    BATTLE RESULT
                  </span>
                </div>

                <div className="text-2xl font-black text-white">
                  🏆 {winnerLabel}
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 text-3xl">
                  🤝
                </div>

                <div className="text-xl font-black text-white">
                  Battle Result
                </div>

                <p className="mt-1 text-sm text-zinc-400">
                  Result calculate ho raha hai.
                </p>
              </>
            )}
          </div>
        )}

        {battle.userVotedOptionId && (
          <div className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-semibold text-emerald-300 md:mx-6">
            <CheckCircle2 size={17} />
            Aapka vote already recorded hai.
          </div>
        )}

        {voteFeedback?.battleId === battle.id && (
          <div
            className={`mx-4 mb-4 rounded-xl border px-4 py-3 text-center text-sm font-semibold md:mx-6 ${
              voteFeedback.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                : 'border-red-500/20 bg-red-500/5 text-red-300'
            }`}
          >
            {voteFeedback.message}
          </div>
        )}
      </article>
    );
  };

  return (
    <section className="w-full">
      <div className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-950 via-zinc-950 to-purple-950 p-6 shadow-2xl md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
                <Swords size={14} />
                DHOTI BATTLE ARENA
              </span>

              {isAdmin && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
                  <Crown size={14} />
                  ADMIN
                </span>
              )}
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Community Battle
            </h2>

            <p className="mt-3 max-w-2xl text-zinc-400">
              Dhoti ke real community battles dekho aur active
              battle me apna vote do.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
              <Flame
                className="mx-auto mb-2 text-orange-400"
                size={22}
              />

              <div className="text-xl font-black text-white">
                {activeBattles.length}
              </div>

              <div className="text-[11px] text-zinc-500">
                LIVE
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
              <Clock
                className="mx-auto mb-2 text-blue-400"
                size={22}
              />

              <div className="text-xl font-black text-white">
                {upcomingBattles.length}
              </div>

              <div className="text-[11px] text-zinc-500">
                UPCOMING
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
              <Trophy
                className="mx-auto mb-2 text-yellow-400"
                size={22}
              />

              <div className="text-xl font-black text-white">
                {closedBattles.length}
              </div>

              <div className="text-[11px] text-zinc-500">
                RESULTS
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex rounded-2xl border border-white/10 bg-zinc-950 p-1">
        <button
          type="button"
          onClick={() => setActiveArenaTab('events')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
            activeArenaTab === 'events'
              ? 'bg-red-500 text-white'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Swords size={17} />
          Community Battles
        </button>

        <button
          type="button"
          onClick={() => setActiveArenaTab('1v1')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
            activeArenaTab === '1v1'
              ? 'bg-red-500 text-white'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Flame size={17} />
          1v1 AI Battle
        </button>
      </div>

      {activeArenaTab === 'events' ? (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Users size={17} />
              Real community battles
            </div>

            <button
              type="button"
              onClick={() => loadBattles(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>

          {!currentUser && (
            <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Lock
                  className="mt-0.5 text-orange-400"
                  size={20}
                />

                <div>
                  <div className="font-bold text-white">
                    Vote karne ke liye login required hai
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">
                    Battle public dekh sakte ho, lekin vote sirf
                    logged-in user de sakta hai.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-400"
              >
                <LogIn size={16} />
                Login
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {isLoadingBattles ? (
            <div className="grid gap-5">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[500px] animate-pulse rounded-3xl border border-white/10 bg-zinc-950"
                />
              ))}
            </div>
          ) : visibleBattles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-950 p-10 text-center">
              <div className="mb-4 text-5xl">
                ⚔️
              </div>

              <h3 className="text-xl font-black text-white">
                Abhi koi battle nahi hai
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
                Super Admin jab battle publish karega tab yahan
                automatically show hoga.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {visibleBattles.map(renderBattleCard)}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
              <ShieldCheck
                className="mb-2 text-emerald-400"
                size={20}
              />

              <div className="font-bold text-white">
                One vote per battle
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                Duplicate voting server-side blocked hai.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
              <Clock
                className="mb-2 text-orange-400"
                size={20}
              />

              <div className="font-bold text-white">
                Real countdown
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                Voting server ke start/end time ke according close
                hoti hai.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
              <Trophy
                className="mb-2 text-yellow-400"
                size={20}
              />

              <div className="font-bold text-white">
                Real result
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                Winner real vote count se calculate hota hai.
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 text-6xl">
              🤖⚔️
            </div>

            <h3 className="text-3xl font-black text-white">
              1v1 AI Battle
            </h3>

            <p className="mt-3 text-zinc-400">
              {opponentName} ke saath AI battle mode.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-left transition hover:bg-red-500/10"
              >
                <Flame className="mb-3 text-red-400" />

                <div className="font-black text-white">
                  Rap
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  Desi rap battle
                </div>
              </button>

              <button
                type="button"
                className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 text-left transition hover:bg-orange-500/10"
              >
                <Swords className="mb-3 text-orange-400" />

                <div className="font-black text-white">
                  Roast
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  Fun roast battle
                </div>
              </button>

              <button
                type="button"
                className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 text-left transition hover:bg-purple-500/10"
              >
                <MessageCircle className="mb-3 text-purple-400" />

                <div className="font-black text-white">
                  Wit
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  Smart punchlines
                </div>
              </button>
            </div>

            {!currentUser ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-4 font-black text-white hover:bg-red-400"
              >
                <LogIn size={18} />
                Login to Start Battle
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab('assistant');
                  }
                }}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-4 font-black text-white hover:bg-red-400"
              >
                <Swords size={18} />
                Open AI Battle
              </button>
            )}
          </div>
        </div>
      )}

      {selectedBattle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedBattle(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-black text-white">
                {selectedBattle.title}
              </h3>

              <button
                type="button"
                onClick={() => setSelectedBattle(null)}
                className="rounded-xl bg-white/5 px-3 py-2 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>

            {renderBattleCard(selectedBattle)}
          </div>
        </div>
      )}
    </section>
  );
}

export default BattleArena;