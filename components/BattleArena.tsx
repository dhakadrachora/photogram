'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, BattleState, BattleRound, BattleEvent, AppTab } from '@/types';
import { SoundEffects } from '@/lib/audio/sound-effects';
import { isSiteAdmin } from '@/lib/admin-auth';
import {
  Swords,
  Flame,
  Trophy,
  Volume2,
  Mic,
  Send,
  Sparkles,
  RefreshCw,
  Award,
  Zap,
  CheckCircle2,
  Lock,
  LogIn,
  Vote,
  Clock,
  ShieldCheck,
  Crown,
} from 'lucide-react';

interface BattleArenaProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  selectedOpponent?: string;
  onUpdateUser?: (updater: (prev: User) => User) => void;
  onNavigateTab?: (tab: AppTab) => void;
}

export function BattleArena({
  currentUser,
  onOpenAuth,
  selectedOpponent,
  onUpdateUser,
  onNavigateTab,
}: BattleArenaProps) {
  const isAdmin = isSiteAdmin(currentUser?.email);
  const [activeArenaTab, setActiveArenaTab] = useState<'events' | '1v1'>('events');
  const [battleMode, setBattleMode] = useState<'rap' | 'roast' | 'wit'>('rap');
  const opponentName = selectedOpponent || 'Dhoti aale AI Champion';
  const [inBattle, setInBattle] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [rounds, setRounds] = useState<BattleRound[]>([]);
  const [playerTotalScore, setPlayerTotalScore] = useState(0);
  const [opponentTotalScore, setOpponentTotalScore] = useState(0);
  const [crowdHype, setCrowdHype] = useState(65);
  const [userVerseInput, setUserVerseInput] = useState('');
  const [isJudging, setIsJudging] = useState(false);
  const [winnerDeclared, setWinnerDeclared] = useState<'player' | 'opponent' | 'tie' | null>(null);
  const [latestCommentary, setLatestCommentary] = useState('');

  // Community Battles & Voting State
  const [battleEvents, setBattleEvents] = useState<BattleEvent[]>([]);
  const [isLoadingBattles, setIsLoadingBattles] = useState(true);
  const [votingBattleId, setVotingBattleId] = useState<string | null>(null);
  const [voteFeedback, setVoteFeedback] = useState<{ battleId: string; message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadBattles() {
      try {
        const emailParam = currentUser?.email ? `?email=${encodeURIComponent(currentUser.email)}` : '';
        const res = await fetch(`/api/battle/vote${emailParam}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!ignore && data.battles && Array.isArray(data.battles)) {
          setBattleEvents(data.battles);
        }
      } catch (err) {
        console.warn('Could not fetch battle events:', err);
      } finally {
        if (!ignore) {
          setIsLoadingBattles(false);
        }
      }
    }
    loadBattles();
    return () => {
      ignore = true;
    };
  }, [currentUser?.email]);

  const reloadBattles = async () => {
    try {
      const emailParam = currentUser?.email ? `?email=${encodeURIComponent(currentUser.email)}` : '';
      const res = await fetch(`/api/battle/vote${emailParam}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.battles && Array.isArray(data.battles)) {
        setBattleEvents(data.battles);
      }
    } catch (err) {
      console.warn('Could not reload battle events:', err);
    }
  };

  // Handle Voting in Community Battles
  const handleVoteInBattle = async (battle: BattleEvent, optionId: string) => {
    // Access Control: Google Sign-In is required to vote in Battle
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    // Access Control: Prevent voting after battle has ended
    if (battle.isEnded) {
      setVoteFeedback({
        battleId: battle.id,
        message: 'This battle has ended. No further votes can be submitted.',
        type: 'error',
      });
      return;
    }

    // Access Control: One authenticated user can vote only once per battle
    if (battle.userVotedOptionId) {
      setVoteFeedback({
        battleId: battle.id,
        message: 'You have already voted in this battle! Only 1 vote per user is allowed.',
        type: 'error',
      });
      return;
    }

    setVotingBattleId(battle.id);
    setVoteFeedback(null);

    try {
      const res = await fetch('/api/battle/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email,
        },
        body: JSON.stringify({
          battleId: battle.id,
          optionId,
          userEmail: currentUser.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVoteFeedback({
          battleId: battle.id,
          message: data.error || 'Voting failed. Please try again.',
          type: 'error',
        });
        if (res.status === 401) {
          onOpenAuth();
        }
        return;
      }

      SoundEffects.playCheer();
      setVoteFeedback({
        battleId: battle.id,
        message: `Vote securely verified & registered for ${optionId === battle.optionA.id ? battle.optionA.label : battle.optionB.label}!`,
        type: 'success',
      });

      // Update state with updated battle data from server
      if (data.battle) {
        setBattleEvents((prev) =>
          prev.map((b) => (b.id === battle.id ? { ...data.battle, userVotedOptionId: optionId } : b))
        );
      } else {
        reloadBattles();
      }
    } catch {
      setVoteFeedback({
        battleId: battle.id,
        message: 'Network issue while submitting vote. Please try again.',
        type: 'error',
      });
    } finally {
      setVotingBattleId(null);
    }
  };

  const startNewBattle = (mode: 'rap' | 'roast' | 'wit') => {
    SoundEffects.playDhol();
    setBattleMode(mode);
    setInBattle(true);
    setCurrentRound(1);
    setRounds([]);
    setPlayerTotalScore(0);
    setOpponentTotalScore(0);
    setCrowdHype(70);
    setWinnerDeclared(null);
    setLatestCommentary('Round 1 shuru! Apni sabse dumdaar punchline feko!');
  };

  const handleVerseSubmit = async (verse: string) => {
    if (!verse.trim() || isJudging) return;

    SoundEffects.playWhistle();
    setIsJudging(true);

    try {
      const response = await fetch('/api/gemini/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: battleMode,
          userVerse: verse,
          roundNumber: currentRound,
          opponentName,
          userScore: playerTotalScore,
          opponentScore: opponentTotalScore,
        }),
      });

      const data = await response.json();
      const pScore = data.playerScore || 8;
      const oScore = data.opponentScore || 8;
      const commentary = data.commentary || 'Kya dumdaar round tha bhaiyo!';
      const opponentVerse =
        data.opponentVerse ||
        'Dhoti aale ke aage tikna mushkil hai, agle round me dekh lenge!';
      const hypeDelta = data.hypeChange || 10;

      const newRound: BattleRound = {
        roundNumber: currentRound,
        playerVerse: verse,
        opponentVerse,
        playerScore: pScore,
        opponentScore: oScore,
        commentary,
      };

      const nextPlayerTotal = playerTotalScore + pScore;
      const nextOpponentTotal = opponentTotalScore + oScore;

      setRounds((prev) => [...prev, newRound]);
      setPlayerTotalScore(nextPlayerTotal);
      setOpponentTotalScore(nextOpponentTotal);
      setCrowdHype((prev) => Math.min(100, Math.max(20, prev + hypeDelta)));
      setLatestCommentary(commentary);
      setUserVerseInput('');

      if (currentRound >= 3) {
        // Battle Complete
        setTimeout(() => {
          let winner: 'player' | 'opponent' | 'tie' = 'tie';
          if (nextPlayerTotal > nextOpponentTotal) {
            winner = 'player';
            SoundEffects.playCheer();
            if (onUpdateUser) {
              onUpdateUser((prev) => ({
                ...prev,
                coins: prev.coins + 100,
                wins: prev.wins + 1,
                battles: prev.battles + 1,
              }));
            }
          } else if (nextOpponentTotal > nextPlayerTotal) {
            winner = 'opponent';
            SoundEffects.playAirhorn();
            if (onUpdateUser) {
              onUpdateUser((prev) => ({
                ...prev,
                coins: prev.coins + 20,
                battles: prev.battles + 1,
              }));
            }
          } else {
            winner = 'tie';
          }
          setWinnerDeclared(winner);
        }, 800);
      } else {
        setCurrentRound((prev) => prev + 1);
      }
    } catch {
      // Fallback round
      const newRound: BattleRound = {
        roundNumber: currentRound,
        playerVerse: verse,
        opponentVerse: 'Dhoti aale ka flow dekh kar sab dang reh gaye!',
        playerScore: 8,
        opponentScore: 7,
        commentary: 'Public ne dono ko aag bol diya!',
      };
      setRounds((prev) => [...prev, newRound]);
      setPlayerTotalScore((p) => p + 8);
      setOpponentTotalScore((o) => o + 7);
      if (currentRound >= 3) {
        setWinnerDeclared('player');
      } else {
        setCurrentRound((prev) => prev + 1);
      }
    } finally {
      setIsJudging(false);
    }
  };

  const sampleVerses = {
    rap: [
      'Gaam ka chhora, dhoti me swag, mic pe baith ke system kar de hang!',
      'Desi beat pe flow aisa ki stadium pura jhum jaye!',
      'Gadi me bass, hotho pe rap, Dhoti aale always on top of the map!',
    ],
    roast: [
      'Filter laga ke photo me hero bante ho, samne aao to billo bagge bilauri!',
      'Gadi me petrol nahi aur swag helicopter ka dikhate ho!',
      'Dhoti aale ke samne hero mat bano, yaha referee bhi tumse tez bolta hai!',
    ],
    wit: [
      'Dimag itna tez hai ki Google bhi search karne mujhse poochta hai!',
      'Witty punchline aisa ki stage pe aag lag jaye bina matchbox ke!',
    ],
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex flex-col p-3 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">Dhoti aale Battle Arena</h1>
            <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-bold text-orange-400 border border-orange-500/30">
              Battle Events & 1v1 Clash
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Public viewing for all • Official voting requires Google Sign-In • One vote per resident
          </p>
        </div>

        {/* Arena Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {isAdmin && onNavigateTab && (
            <button
              onClick={() => onNavigateTab('admin')}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 text-xs font-black shadow-md transition-all active:scale-95"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Admin Battle Controls 👑</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-slate-900/90 rounded-2xl p-1.5 border border-slate-800 shadow-inner">
            <button
              id="tab-community-battles"
              onClick={() => {
                setActiveArenaTab('events');
                setInBattle(false);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeArenaTab === 'events'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Vote className="h-3.5 w-3.5" />
              <span>Community Battles</span>
            </button>
            <button
              id="tab-1v1-clash"
              onClick={() => setActiveArenaTab('1v1')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeArenaTab === '1v1'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords className="h-3.5 w-3.5" />
              <span>1v1 Live Clash</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: Community Battle Events & Voting (PUBLIC ACCESS TO VIEW, LOGIN TO VOTE) */}
      {activeArenaTab === 'events' && (
        <div className="flex-1 flex flex-col py-4 space-y-6">
          {/* Access Control Information Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-slate-950 border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Public Battle Results • Verified Resident Voting
                </h4>
                <p className="text-[11px] text-slate-400">
                  Anyone can view ongoing clashes and scores. Google Sign-In is required to vote (1 vote per battle, validated server-side).
                </p>
              </div>
            </div>

            {!currentUser && (
              <button
                id="battle-public-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 px-4 py-2 text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
              >
                <LogIn className="h-3.5 w-3.5 text-blue-600" />
                <span>Login to Vote</span>
              </button>
            )}
          </div>

          {/* Battles List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {battleEvents.map((battle) => {
              const totalVotes = battle.optionA.votes + battle.optionB.votes;
              const percentA = totalVotes > 0 ? Math.round((battle.optionA.votes / totalVotes) * 100) : 50;
              const percentB = 100 - percentA;
              const isEnded = Boolean(battle.isEnded);
              const hasVoted = Boolean(battle.userVotedOptionId);

              return (
                <div
                  key={battle.id}
                  className={`rounded-3xl bg-slate-900/90 border p-5 flex flex-col justify-between shadow-xl transition-all ${
                    isEnded
                      ? 'border-slate-800 opacity-90'
                      : 'border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    {/* Category & Status Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                        {battle.category}
                      </span>
                      {isEnded ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-full">
                          <Lock className="h-3 w-3" />
                          Battle Ended
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Active Poll
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white leading-tight mb-1.5">
                      {battle.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      {battle.description}
                    </p>

                    {/* Voting Bars / Results Display */}
                    <div className="space-y-3.5 mb-4">
                      {/* Option A */}
                      <div className="space-y-1.5 p-2 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            {battle.optionA.imageUrl ? (
                              <Image
                                src={battle.optionA.imageUrl}
                                alt={battle.optionA.label}
                                width={28}
                                height={28}
                                referrerPolicy="no-referrer"
                                className="h-7 w-7 rounded-lg object-cover border border-amber-500/40"
                              />
                            ) : (
                              <span className="text-base">{battle.optionA.emoji}</span>
                            )}
                            <div>
                              <span className="text-slate-200 font-bold block">{battle.optionA.label}</span>
                              {battle.optionA.tagline && (
                                <span className="text-[10px] text-slate-400 font-normal block">
                                  {battle.optionA.tagline}
                                </span>
                              )}
                            </div>
                            {battle.userVotedOptionId === battle.optionA.id && (
                              <span className="text-amber-400 font-bold text-[10px] ml-1 bg-amber-400/10 px-1.5 py-0.2 rounded">
                                (Your Vote ✓)
                              </span>
                            )}
                          </div>
                          <span className="text-amber-400 font-bold">
                            {battle.optionA.votes} votes ({percentA}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentA}%` }}
                          />
                        </div>
                      </div>

                      {/* Option B */}
                      <div className="space-y-1.5 p-2 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            {battle.optionB.imageUrl ? (
                              <Image
                                src={battle.optionB.imageUrl}
                                alt={battle.optionB.label}
                                width={28}
                                height={28}
                                referrerPolicy="no-referrer"
                                className="h-7 w-7 rounded-lg object-cover border border-orange-500/40"
                              />
                            ) : (
                              <span className="text-base">{battle.optionB.emoji}</span>
                            )}
                            <div>
                              <span className="text-slate-200 font-bold block">{battle.optionB.label}</span>
                              {battle.optionB.tagline && (
                                <span className="text-[10px] text-slate-400 font-normal block">
                                  {battle.optionB.tagline}
                                </span>
                              )}
                            </div>
                            {battle.userVotedOptionId === battle.optionB.id && (
                              <span className="text-orange-400 font-bold text-[10px] ml-1 bg-orange-400/10 px-1.5 py-0.2 rounded">
                                (Your Vote ✓)
                              </span>
                            )}
                          </div>
                          <span className="text-orange-400 font-bold">
                            {battle.optionB.votes} votes ({percentB}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentB}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Feedback message for this battle */}
                    {voteFeedback?.battleId === battle.id && (
                      <div
                        className={`mb-3 rounded-xl p-2.5 text-xs font-semibold flex items-center gap-1.5 ${
                          voteFeedback.type === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        <span>{voteFeedback.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions / Vote Buttons */}
                  <div className="pt-2 border-t border-slate-800">
                    {isEnded ? (
                      <div className="rounded-2xl bg-slate-800/80 border border-slate-700/60 p-2.5 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-slate-500" />
                        <span>Voting Ended • Results Finalized</span>
                      </div>
                    ) : hasVoted ? (
                      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>You have voted (1 vote recorded)</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          id={`vote-optA-${battle.id}`}
                          onClick={() => handleVoteInBattle(battle, battle.optionA.id)}
                          disabled={votingBattleId === battle.id}
                          className="rounded-2xl bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400/50 p-2.5 text-xs font-bold text-slate-200 hover:text-amber-300 transition-all active:scale-95 text-center"
                        >
                          Vote {battle.optionA.emoji}
                        </button>
                        <button
                          id={`vote-optB-${battle.id}`}
                          onClick={() => handleVoteInBattle(battle, battle.optionB.id)}
                          disabled={votingBattleId === battle.id}
                          className="rounded-2xl bg-slate-800 hover:bg-orange-500/20 border border-slate-700 hover:border-orange-400/50 p-2.5 text-xs font-bold text-slate-200 hover:text-orange-300 transition-all active:scale-95 text-center"
                        >
                          Vote {battle.optionB.emoji}
                        </button>
                      </div>
                    )}

                    <div className="mt-2 text-center text-[10px] text-slate-500">
                      Total: {totalVotes} community votes recorded
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: 1v1 Live Rap/Roast Clash Arena */}
      {activeArenaTab === '1v1' && !inBattle && (
        /* Battle Mode Select Screen */
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="text-center max-w-lg mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-400 text-slate-950 shadow-xl shadow-orange-500/20">
              <Swords className="h-8 w-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Choose Your 1v1 Battle Arena</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Clash against {opponentName} across 3 intense rounds. Score high, hype up the stadium, and earn +100 Dhoti Coins!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
            {/* Rap Battle */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 p-6 flex flex-col justify-between shadow-xl group transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">🎤</span>
                  <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                    Flow & Rhyme
                  </span>
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                  Desi Rap Battle
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Spit high-voltage rhythmic bars in Hindi/Haryanvi style. Rhymes and punchlines get bonus hype.
                </p>
              </div>
              <button
                id="start-rap-battle-btn"
                onClick={() => startNewBattle('rap')}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 py-3 text-xs font-bold text-slate-950 shadow-md transition-transform active:scale-95"
              >
                Enter Rap Arena ⚔️
              </button>
            </div>

            {/* Roast Battle */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-orange-500/50 p-6 flex flex-col justify-between shadow-xl group transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">🔥</span>
                  <span className="text-[10px] font-bold uppercase bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
                    Banter & Wit
                  </span>
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors">
                  Desi Roast Battle
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Deliver funny, witty, playful roasts. Keep it clever, lighthearted, and full of desi swag!
                </p>
              </div>
              <button
                id="start-roast-battle-btn"
                onClick={() => startNewBattle('roast')}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 py-3 text-xs font-bold text-slate-950 shadow-md transition-transform active:scale-95"
              >
                Enter Roast Arena 🔥
              </button>
            </div>

            {/* Wit & Trivia */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 p-6 flex flex-col justify-between shadow-xl group transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">⚡</span>
                  <span className="text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                    Instant Comeback
                  </span>
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                  Wit & Trivia Clash
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Fast desi trivia, witty comebacks, and rapid-fire questions to test your speed.
                </p>
              </div>
              <button
                id="start-wit-battle-btn"
                onClick={() => startNewBattle('wit')}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 py-3 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
              >
                Enter Wit Arena ⚡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1v1 ACTIVE CLASH STAGE */}
      {activeArenaTab === '1v1' && inBattle && (
        <div className="flex-1 flex flex-col justify-between py-4 space-y-4">
          {/* Top Scoreboard & Crowd Hype Meter */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl items-center">
            {/* Player Info */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {currentUser?.name || 'You (Resident)'}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {playerTotalScore} pts
              </span>
              <span className="text-[10px] text-slate-500">
                {currentUser ? currentUser.badge : 'Guest Resident'}
              </span>
            </div>

            {/* Stadium Hype Center */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 mb-1">
                <Flame className="h-4 w-4 text-orange-400 animate-bounce" />
                <span className="text-xs font-black text-white">ROUND {currentRound} / 3</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-300 transition-all duration-300"
                  style={{ width: `${crowdHype}%` }}
                />
              </div>
              <span className="text-[10px] text-amber-300 font-bold mt-1">
                Stadium Hype: {crowdHype}%
              </span>
            </div>

            {/* Opponent Info */}
            <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[120px]">
                {opponentName}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-orange-400">
                {opponentTotalScore} pts
              </span>
              <span className="text-[10px] text-slate-500">Defending AI Champ</span>
            </div>
          </div>

          {/* AI Referee Live Commentary Banner */}
          {latestCommentary && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">📢</span>
                <span className="text-amber-300 font-semibold">{latestCommentary}</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold shrink-0">
                Live Referee
              </span>
            </div>
          )}

          {/* Verses Battle Exchange History */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px] max-h-[360px] p-2">
            {rounds.map((r, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 sm:p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1">
                  <span>Round {r.roundNumber} Clash</span>
                  <span>
                    You: +{r.playerScore} | Opponent: +{r.opponentScore}
                  </span>
                </div>

                {/* Player Verse */}
                <div className="flex items-start gap-2">
                  <span className="text-xs font-black text-amber-400">You:</span>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium">&ldquo;{r.playerVerse}&rdquo;</p>
                </div>

                {/* Opponent Verse */}
                <div className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-xl">
                  <span className="text-xs font-black text-orange-400">{opponentName}:</span>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium italic">&ldquo;{r.opponentVerse}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>

          {/* Round Complete / Winner Modal */}
          {winnerDeclared ? (
            <div className="rounded-3xl bg-slate-900 border-2 border-amber-400 p-6 text-center shadow-2xl animate-in zoom-in-95">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500 text-slate-950 shadow-xl">
                <Trophy className="h-8 w-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {winnerDeclared === 'player'
                  ? 'VICTORY! YOU ARE THE DHOTI CHAMPION!'
                  : winnerDeclared === 'opponent'
                  ? `${opponentName.toUpperCase()} TAKES THE WIN!`
                  : 'IT IS A LEGENDARY TIE!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Final Score: You {playerTotalScore} - {opponentTotalScore} {opponentName}
              </p>
              {winnerDeclared === 'player' && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/40">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>+100 Dhoti Coins Reward Credited to Profile!</span>
                </div>
              )}

              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => startNewBattle(battleMode)}
                  className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg"
                >
                  Rematch ⚔️
                </button>
                <button
                  onClick={() => setInBattle(false)}
                  className="rounded-2xl bg-slate-800 px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  Back to Arenas
                </button>
              </div>
            </div>
          ) : (
            /* Verse Entry Section */
            <div className="rounded-3xl bg-slate-950/90 border border-slate-800 p-4 shadow-xl">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Deliver your punchline for Round {currentRound}</span>
                <span className="text-amber-400">Or pick a quick desi rhyme below</span>
              </div>

              {/* Quick Rhyme Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {sampleVerses[battleMode].map((verse, idx) => (
                  <button
                    key={idx}
                    onClick={() => setUserVerseInput(verse)}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1 text-[11px] font-medium text-slate-300 hover:text-amber-300 transition-colors"
                  >
                    &ldquo;{verse.slice(0, 35)}...&rdquo;
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  id="battle-verse-input"
                  type="text"
                  placeholder={`Write your Round ${currentRound} ${battleMode} line...`}
                  value={userVerseInput}
                  onChange={(e) => setUserVerseInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerseSubmit(userVerseInput);
                  }}
                  disabled={isJudging}
                  className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />

                <button
                  id="battle-verse-submit-btn"
                  onClick={() => handleVerseSubmit(userVerseInput)}
                  disabled={isJudging || !userVerseInput.trim()}
                  className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-md transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isJudging ? 'Judging...' : 'Drop Bar 🔥'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
