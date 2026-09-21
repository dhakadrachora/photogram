'use client';

import { useState, useEffect, useCallback } from 'react';

interface BattleOption {
  id: string;
  label: string;
  tagline?: string;
  votes: number;
  emoji?: string;
  imageUrl?: string;
}

interface Battle {
  id: string;
  title: string;
  category: string;
  description?: string;
  optionA: BattleOption;
  optionB: BattleOption;
  startsAt?: number;
  endsAt?: number;
  isEnded: boolean;
  status: 'active' | 'closed';
  published: boolean;
  userVotedOptionId?: string;
  totalVotes: number;
  winnerOptionId?: string;
  isDraw?: boolean;
}

interface BattleArenaProps {
  userEmail?: string | null;
  isAdmin?: boolean;
  currentUser?: any;
  onOpenAuth?: () => void;
}

export default function BattleArena({
  userEmail,
  isAdmin = false,
  currentUser,
  onOpenAuth,
}: BattleArenaProps) {
  const effectiveEmail =
    userEmail ||
    currentUser?.email ||
    currentUser?.userEmail ||
    null;

  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadBattles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = effectiveEmail
        ? `/api/battles/vote?email=${encodeURIComponent(effectiveEmail)}`
        : '/api/battles/vote';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveEmail ? { 'x-user-email': effectiveEmail } : {}),
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Battle request failed: ${response.status}`);
      }

      const data = await response.json();
      setBattles(Array.isArray(data.battles) ? data.battles : []);
    } catch (err: any) {
      setError(err?.message || 'Battle data load nahi ho saka.');
      setBattles([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveEmail]);

  useEffect(() => {
    loadBattles();
  }, [loadBattles, refreshKey]);

  const handleVote = async (battleId: string, optionId: string) => {
    if (!effectiveEmail) {
      if (onOpenAuth) onOpenAuth();
      else alert('Vote karne ke liye login karo!');
      return;
    }

    try {
      setVotingId(battleId);

      const response = await fetch('/api/battles/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': effectiveEmail,
        },
        body: JSON.stringify({ battleId, optionId, userEmail: effectiveEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'ALREADY_VOTED') alert('Aap pehle hi vote kar chuke ho!');
        else if (data.code === 'BATTLE_ENDED') alert('Yeh battle khatam ho chuki hai!');
        else alert(data.error || 'Vote failed');
        await loadBattles();
        return;
      }

      await loadBattles();
    } catch (err: any) {
      alert(err?.message || 'Vote failed');
    } finally {
      setVotingId(null);
    }
  };

  const filteredBattles = battles.filter((b) => {
    if (filter === 'active') return !b.isEnded;
    if (filter === 'ended') return b.isEnded;
    return true;
  });

  const liveCount = battles.filter((b) => !b.isEnded).length;
  const endedCount = battles.filter((b) => b.isEnded).length;

  const formatTimeLeft = (endsAt?: number) => {
    if (!endsAt) return '';
    const diff = endsAt - Date.now();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-amber-500 mb-2">
          ⚔️ Community Battle Arena
        </h1>
        <p className="text-gray-400">Apne favourite champion ko vote do!</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{liveCount}</div>
          <div className="text-xs text-red-200 uppercase tracking-wider">Live</div>
        </div>
        <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{endedCount}</div>
          <div className="text-xs text-amber-200 uppercase tracking-wider">Results</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          {(['all', 'active', 'ended'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-amber-500 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'active' ? 'Live' : 'Results'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading && battles.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin text-4xl mb-3">⚔️</div>
          <p>Battles load ho rahi hain...</p>
        </div>
      )}

      {!loading && filteredBattles.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="text-5xl mb-3">🏟️</div>
          <p className="text-gray-400">
            {filter === 'all'
              ? 'Koi battle nahi hai abhi.'
              : filter === 'active'
              ? 'Koi live battle nahi.'
              : 'Koi ended battle nahi.'}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {filteredBattles.map((battle) => {
          const totalVotes = battle.totalVotes || 0;
          const aVotes = battle.optionA?.votes || 0;
          const bVotes = battle.optionB?.votes || 0;
          const aPct = totalVotes > 0 ? Math.round((aVotes / totalVotes) * 100) : 50;
          const bPct = totalVotes > 0 ? 100 - aPct : 50;
          const hasVoted = Boolean(battle.userVotedOptionId);
          const userVotedA = battle.userVotedOptionId === battle.optionA?.id;
          const userVotedB = battle.userVotedOptionId === battle.optionB?.id;
          const canVote = !battle.isEnded && !hasVoted && Boolean(effectiveEmail);

          return (
            <div
              key={battle.id}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-xl"
            >
              <div className="p-5 border-b border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400 font-medium">
                    {battle.category}
                  </span>
                  {battle.isEnded ? (
                    <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 font-medium">
                      CLOSED
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 font-medium">
                      ● LIVE
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">{battle.title}</h2>
                {battle.description && (
                  <p className="text-sm text-gray-400 mt-1">{battle.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                  <span>
                    TOTAL VOTES: <span className="text-white font-bold">{totalVotes}</span>
                  </span>
                  {!battle.isEnded && battle.endsAt && (
                    <span className="text-amber-400 font-medium">
                      ⏱️ {formatTimeLeft(battle.endsAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                <div
                  className={`rounded-xl p-4 border-2 transition ${
                    userVotedA
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-gray-700 bg-gray-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {battle.optionA?.imageUrl && (
                      <img
                        src={battle.optionA.imageUrl}
                        alt={battle.optionA.label}
                        className="w-16 h-16 rounded-full object-cover border-2 border-amber-500"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{battle.optionA?.emoji || '🔥'}</span>
                        <h3 className="font-bold text-white">{battle.optionA?.label}</h3>
                      </div>
                      {battle.optionA?.tagline && (
                        <p className="text-xs text-gray-400">{battle.optionA.tagline}</p>
                      )}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{aVotes} votes</span>
                      <span>{aPct}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                        style={{ width: `${aPct}%` }}
                      />
                    </div>
                  </div>
                  {canVote && (
                    <button
                      onClick={() => handleVote(battle.id, battle.optionA.id)}
                      disabled={votingId === battle.id}
                      className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm disabled:opacity-50"
                    >
                      {votingId === battle.id ? 'Voting...' : `Vote ${battle.optionA.label}`}
                    </button>
                  )}
                  {userVotedA && (
                    <div className="text-center text-amber-400 text-sm font-bold">✓ Voted</div>
                  )}
                </div>

                <div
                  className={`rounded-xl p-4 border-2 transition ${
                    userVotedB
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-gray-700 bg-gray-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {battle.optionB?.imageUrl && (
                      <img
                        src={battle.optionB.imageUrl}
                        alt={battle.optionB.label}
                        className="w-16 h-16 rounded-full object-cover border-2 border-amber-500"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{battle.optionB?.emoji || '⚡'}</span>
                        <h3 className="font-bold text-white">{battle.optionB?.label}</h3>
                      </div>
                      {battle.optionB?.tagline && (
                        <p className="text-xs text-gray-400">{battle.optionB.tagline}</p>
                      )}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{bVotes} votes</span>
                      <span>{bPct}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                        style={{ width: `${bPct}%` }}
                      />
                    </div>
                  </div>
                  {canVote && (
                    <button
                      onClick={() => handleVote(battle.id, battle.optionB.id)}
                      disabled={votingId === battle.id}
                      className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm disabled:opacity-50"
                    >
                      {votingId === battle.id ? 'Voting...' : `Vote ${battle.optionB.label}`}
                    </button>
                  )}
                  {userVotedB && (
                    <div className="text-center text-amber-400 text-sm font-bold">✓ Voted</div>
                  )}
                </div>
              </div>

              {battle.isEnded && (
                <div className="p-5 border-t border-gray-700 bg-gray-900/50 text-center">
                  {battle.isDraw ? (
                    <>
                      <div className="text-4xl mb-2">🤝</div>
                      <div className="text-lg font-bold text-gray-300">Battle Draw!</div>
                    </>
                  ) : battle.winnerOptionId ? (
                    <>
                      <div className="text-4xl mb-2">🏆</div>
                      <div className="text-lg font-bold text-amber-400">
                        Winner:{' '}
                        {battle.winnerOptionId === battle.optionA.id
                          ? battle.optionA.label
                          : battle.optionB.label}
                      </div>
                      <div className="text-sm text-gray-400">Total: {totalVotes} votes</div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">📊</div>
                      <div className="text-gray-300">Result Pending</div>
                    </>
                  )}
                </div>
              )}

              {!battle.isEnded && !effectiveEmail && (
                <div className="p-3 bg-blue-900/30 border-t border-blue-700 text-center text-blue-300 text-xs">
                  🔐 Vote karne ke liye login karo
                </div>
              )}

              {!battle.isEnded && hasVoted && (
                <div className="p-3 bg-green-900/30 border-t border-green-700 text-center text-green-300 text-xs">
                  ✓ Aapne is battle mein vote kar diya
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}