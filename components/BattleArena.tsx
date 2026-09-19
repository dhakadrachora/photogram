'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Swords,
  Trophy,
  Clock,
  MessageCircle,
  Send,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

type BattleOption = {
  id: string;
  name?: string | null;
  label?: string | null;
  tagline?: string | null;
  emoji?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  votes?: number | null;
};

type Battle = {
  id: string;
  title?: string | null;
  description?: string | null;
  question?: string | null;

  options?: BattleOption[] | null;

  optionA?: BattleOption | null;
  optionB?: BattleOption | null;

  startsAt?: string | number | null;
  starts_at?: string | number | null;

  endsAt?: string | number | null;
  ends_at?: string | number | null;

  status?: string | null;
  published?: boolean;

  winnerOptionId?: string | null;
  winner_option_id?: string | null;
};

type BattleComment = {
  id: string;
  battle_id?: string;
  battleId?: string;
  user_id?: string;
  userId?: string;
  user_name?: string;
  userName?: string;
  message: string;
  created_at?: string;
  createdAt?: string;
};

type BattleArenaProps = {
  currentUser?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    [key: string]: any;
  } | null;

  onOpenAuth?: () => void;
  selectedOpponent?: string;

  onUpdateUser?: (
    updater: ((previous: any) => any) | Partial<any>
  ) => void;

  onNavigateTab?: (tab: any) => void;

  userEmail?: string | null;
  currentUserEmail?: string | null;
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://zlngcbefvdtbihndaeun.supabase.co';

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* ---------------------------------------------------------
   NORMALIZATION
--------------------------------------------------------- */

function normalizeOption(
  option: any,
  fallbackId: string
): BattleOption {
  return {
    id: String(option?.id || fallbackId),

    name:
      option?.name ??
      option?.label ??
      '',

    label:
      option?.label ??
      option?.name ??
      '',

    tagline:
      option?.tagline ??
      '',

    emoji:
      option?.emoji ??
      '',

    imageUrl:
      option?.imageUrl ??
      option?.image_url ??
      option?.image ??
      option?.photoUrl ??
      option?.photo_url ??
      '',

    image_url:
      option?.image_url ??
      option?.imageUrl ??
      option?.image ??
      option?.photoUrl ??
      option?.photo_url ??
      '',

    votes:
      Number(option?.votes ?? 0),
  };
}

function getOptions(
  battle: Battle | null
): BattleOption[] {
  if (!battle) return [];

  if (
    Array.isArray(battle.options) &&
    battle.options.length > 0
  ) {
    return battle.options
      .slice(0, 2)
      .map((option, index) =>
        normalizeOption(
          option,
          index === 0 ? 'option_a' : 'option_b'
        )
      );
  }

  const result: BattleOption[] = [];

  if (battle.optionA) {
    result.push(
      normalizeOption(
        battle.optionA,
        'option_a'
      )
    );
  }

  if (battle.optionB) {
    result.push(
      normalizeOption(
        battle.optionB,
        'option_b'
      )
    );
  }

  return result.slice(0, 2);
}

function getOptionName(
  option: BattleOption
) {
  return (
    option.name ||
    option.label ||
    'Participant'
  );
}

function getOptionImage(
  option: BattleOption
) {
  const url =
    option.imageUrl ||
    option.image_url ||
    '';

  return typeof url === 'string'
    ? url.trim()
    : '';
}

function getEndTime(
  battle: Battle | null
): number | null {
  if (!battle) return null;

  const value =
    battle.endsAt ??
    battle.ends_at;

  if (!value) return null;

  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? value
      : null;
  }

  const time =
    new Date(value).getTime();

  return Number.isFinite(time)
    ? time
    : null;
}

function formatTime(
  milliseconds: number
) {
  const seconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const days = Math.floor(
    seconds / 86400
  );

  const hours = Math.floor(
    (seconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const remainingSeconds =
    seconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(
      2,
      '0'
    )}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(remainingSeconds).padStart(
      2,
      '0'
    )}`;
  }

  return `${String(hours).padStart(
    2,
    '0'
  )}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(remainingSeconds).padStart(
    2,
    '0'
  )}`;
}

/* ---------------------------------------------------------
   COMPONENT
--------------------------------------------------------- */

export function BattleArena({
  currentUser,
  onOpenAuth,
  selectedOpponent,
  userEmail,
  currentUserEmail,
}: BattleArenaProps) {
  const email =
    currentUserEmail ||
    userEmail ||
    currentUser?.email ||
    null;

  const [battle, setBattle] =
    useState<Battle | null>(null);

  const [comments, setComments] =
    useState<BattleComment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [remaining, setRemaining] =
    useState(0);

  const [selectedOption, setSelectedOption] =
    useState<string | null>(null);

  const [hasVoted, setHasVoted] =
    useState(false);

  const [voting, setVoting] =
    useState(false);

  const [voteError, setVoteError] =
    useState('');

  const [comment, setComment] =
    useState('');

  const [sendingComment, setSendingComment] =
    useState(false);

  const [commentError, setCommentError] =
    useState('');

  const [userId, setUserId] =
    useState<string | null>(
      currentUser?.id
        ? String(currentUser.id)
        : null
    );

  const options = useMemo(
    () => getOptions(battle),
    [battle]
  );

  const totalVotes = useMemo(
    () =>
      options.reduce(
        (sum, option) =>
          sum +
          Number(option.votes || 0),
        0
      ),
    [options]
  );

  const winnerId =
    battle?.winnerOptionId ||
    battle?.winner_option_id ||
    null;

  const winner =
    winnerId
      ? options.find(
          option =>
            option.id === winnerId
        )
      : null;

  const finished =
    battle?.status === 'completed' ||
    battle?.status === 'closed' ||
    remaining <= 0;

  /* -------------------------------------------------------
     AUTH TOKEN
  ------------------------------------------------------- */

  async function getToken() {
    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    return (
      session?.access_token || null
    );
  }

  /* -------------------------------------------------------
     LOAD BATTLE
  ------------------------------------------------------- */

  async function loadBattle(
    refresh = false
  ) {
    try {
      if (refresh) {
        setRefreshing(true);
      }

      const response =
        await fetch(
          '/api/battle',
          {
            method: 'GET',
            cache: 'no-store',
            headers: {
              Accept:
                'application/json',
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          `Battle API failed: ${response.status}`
        );
      }

      const data =
        await response.json();

      let result: Battle | null =
        null;

      if (data?.battle) {
        result = data.battle;
      }

      if (
        !result &&
        Array.isArray(data?.battles)
      ) {
        result =
          data.battles.find(
            (item: Battle) =>
              item?.published !== false
          ) || null;
      }

      if (
        !result &&
        Array.isArray(data)
      ) {
        result =
          data.find(
            (item: Battle) =>
              item?.published !== false
          ) || null;
      }

      if (result) {
        console.log(
          'COMMUNITY BATTLE:',
          result
        );

        console.log(
          'OPTION A:',
          result.optionA
        );

        console.log(
          'OPTION B:',
          result.optionB
        );
      }

      setBattle(result);
    } catch (error) {
      console.error(
        'Battle load error:',
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* -------------------------------------------------------
     COMMENTS
  ------------------------------------------------------- */

  async function loadComments(
    battleId: string
  ) {
    try {
      const response =
        await fetch(
          `/api/battle/comments?battleId=${encodeURIComponent(
            battleId
          )}`,
          {
            cache: 'no-store',
          }
        );

      if (!response.ok) return;

      const data =
        await response.json();

      const list =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.comments)
          ? data.comments
          : [];

      setComments(
        list.filter(
          (item: BattleComment) =>
            item?.id
        )
      );
    } catch (error) {
      console.error(
        'Comments error:',
        error
      );
    }
  }

  /* -------------------------------------------------------
     VOTE STATUS
  ------------------------------------------------------- */

  async function loadVoteStatus(
    battleId: string
  ) {
    if (!email) return;

    const token =
      await getToken();

    if (!token) return;

    try {
      const response =
        await fetch(
          `/api/battle/vote?battleId=${encodeURIComponent(
            battleId
          )}&status=true`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            cache: 'no-store',
          }
        );

      if (!response.ok) return;

      const data =
        await response.json();

      if (
        typeof data?.hasVoted ===
        'boolean'
      ) {
        setHasVoted(
          data.hasVoted
        );
      }

      if (data?.optionId) {
        setSelectedOption(
          String(data.optionId)
        );
      }
    } catch (error) {
      console.error(
        'Vote status error:',
        error
      );
    }
  }

  /* -------------------------------------------------------
     INITIAL LOAD
  ------------------------------------------------------- */

  useEffect(() => {
    void loadBattle();

    async function loadUser() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (user?.id) {
        setUserId(
          String(user.id)
        );
      }
    }

    void loadUser();
  }, []);

  useEffect(() => {
    if (!battle?.id) return;

    void loadComments(
      battle.id
    );

    void loadVoteStatus(
      battle.id
    );
  }, [battle?.id, email]);

  /* -------------------------------------------------------
     TIMER
  ------------------------------------------------------- */

  useEffect(() => {
    if (!battle) return;

    const updateTimer = () => {
      const end =
        getEndTime(battle);

      if (end === null) {
        setRemaining(0);
        return;
      }

      setRemaining(
        Math.max(
          0,
          end - Date.now()
        )
      );
    };

    updateTimer();

    const timer =
      window.setInterval(
        updateTimer,
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [battle]);

  /* -------------------------------------------------------
     REALTIME COMMENTS
  ------------------------------------------------------- */

  useEffect(() => {
    if (!battle?.id) return;

    const channel =
      supabase
        .channel(
          `battle-comments-${battle.id}`
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'battle_comments',
            filter:
              `battle_id=eq.${battle.id}`,
          },
          payload => {
            const incoming =
              payload.new as BattleComment;

            setComments(old => {
              if (
                old.some(
                  item =>
                    item.id ===
                    incoming.id
                )
              ) {
                return old;
              }

              return [
                ...old,
                incoming,
              ];
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'battle_comments',
            filter:
              `battle_id=eq.${battle.id}`,
          },
          payload => {
            const deleted =
              payload.old as BattleComment;

            setComments(old =>
              old.filter(
                item =>
                  item.id !==
                  deleted.id
              )
            );
          }
        )
        .subscribe();

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, [battle?.id]);

  /* -------------------------------------------------------
     VOTE
  ------------------------------------------------------- */

  async function vote(
    optionId: string
  ) {
    setVoteError('');

    if (!email) {
      setVoteError(
        'Vote karne ke liye login karo.'
      );
      onOpenAuth?.();
      return;
    }

    if (!battle?.id) return;

    if (finished) {
      setVoteError(
        'Voting close ho chuki hai.'
      );
      return;
    }

    if (hasVoted) {
      setVoteError(
        'Aap already vote kar chuke ho.'
      );
      return;
    }

    const token =
      await getToken();

    if (!token) {
      setVoteError(
        'Login session expire ho gaya.'
      );
      return;
    }

    try {
      setVoting(true);

      const response =
        await fetch(
          '/api/battle/vote',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              battleId:
                battle.id,
              optionId,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Vote submit nahi hua.'
        );
      }

      setHasVoted(true);
      setSelectedOption(
        optionId
      );

      await loadBattle();
    } catch (error: any) {
      setVoteError(
        error?.message ||
          'Vote submit nahi hua.'
      );
    } finally {
      setVoting(false);
    }
  }

  /* -------------------------------------------------------
     COMMENT
  ------------------------------------------------------- */

  async function sendComment() {
    setCommentError('');

    if (!email) {
      setCommentError(
        'Comment karne ke liye login karo.'
      );
      onOpenAuth?.();
      return;
    }

    if (!battle?.id) return;

    if (finished) {
      setCommentError(
        'Battle khatam ho chuki hai.'
      );
      return;
    }

    const message =
      comment.trim();

    if (!message) return;

    if (message.length > 500) {
      setCommentError(
        'Maximum 500 characters allowed.'
      );
      return;
    }

    const token =
      await getToken();

    if (!token) {
      setCommentError(
        'Login session expire ho gaya.'
      );
      return;
    }

    try {
      setSendingComment(true);

      const response =
        await fetch(
          '/api/battle/comments',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              battleId:
                battle.id,
              message,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Comment send nahi hua.'
        );
      }

      if (data?.comment) {
        setComments(old => {
          if (
            old.some(
              item =>
                item.id ===
                data.comment.id
            )
          ) {
            return old;
          }

          return [
            ...old,
            data.comment,
          ];
        });
      }

      setComment('');
    } catch (error: any) {
      setCommentError(
        error?.message ||
          'Comment send nahi hua.'
      );
    } finally {
      setSendingComment(false);
    }
  }

  /* -------------------------------------------------------
     DELETE COMMENT
  ------------------------------------------------------- */

  async function deleteComment(
    commentId: string
  ) {
    const token =
      await getToken();

    if (!token) return;

    try {
      const response =
        await fetch(
          `/api/battle/comments?id=${encodeURIComponent(
            commentId
          )}`,
          {
            method: 'DELETE',
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) return;

      setComments(old =>
        old.filter(
          item =>
            item.id !==
            commentId
        )
      );
    } catch (error) {
      console.error(
        'Delete comment error:',
        error
      );
    }
  }

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-black/20">
        <div className="flex items-center gap-3 text-white/70">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>
            Battle loading...
          </span>
        </div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
        <Swords className="mb-4 h-12 w-12 text-white/30" />

        <h2 className="text-xl font-bold text-white">
          No active battle
        </h2>

        <p className="mt-2 text-sm text-white/40">
          Abhi koi Community Battle available nahi hai.
        </p>

        <button
          type="button"
          onClick={() =>
            void loadBattle(true)
          }
          disabled={refreshing}
          className="mt-5 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
        >
          <RefreshCw
            className={
              refreshing
                ? 'h-4 w-4 animate-spin'
                : 'h-4 w-4'
            }
          />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-black/20">

      {/* HEADER */}
      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
              <Swords className="h-4 w-4" />
              Community Battle
            </div>

            <h2 className="text-2xl font-black text-white">
              {battle.title ||
                battle.question ||
                'Community Battle'}
            </h2>

            {battle.description && (
              <p className="mt-2 text-sm text-white/50">
                {battle.description}
              </p>
            )}

            {selectedOpponent && (
              <p className="mt-2 text-xs text-white/30">
                Opponent: {selectedOpponent}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              void loadBattle(true)
            }
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              className={
                refreshing
                  ? 'h-4 w-4 animate-spin'
                  : 'h-4 w-4'
              }
            />
            Refresh
          </button>
        </div>
      </div>

      {/* TIMER */}
      <div className="border-b border-white/10 bg-white/[0.02] p-5 text-center">
        {finished ? (
          <div className="text-yellow-300">
            <Trophy className="mx-auto mb-2 h-7 w-7" />
            <div className="font-bold">
              Battle Finished
            </div>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
              <Clock className="h-4 w-4" />
              Time Remaining
            </div>

            <div className="font-mono text-3xl font-black text-white sm:text-4xl">
              {formatTime(remaining)}
            </div>
          </>
        )}
      </div>

      {/* OPTIONS */}
      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        {options.map(option => {
          const votes =
            Number(option.votes || 0);

          const percentage =
            totalVotes > 0
              ? Math.round(
                  (votes /
                    totalVotes) *
                    100
                )
              : 0;

          const selected =
            selectedOption ===
            option.id;

          const isWinner =
            winner?.id ===
            option.id;

          const image =
            getOptionImage(option);

          return (
            <div
              key={option.id}
              className={`overflow-hidden rounded-3xl border ${
                isWinner
                  ? 'border-yellow-400/50 bg-yellow-400/10'
                  : selected
                  ? 'border-red-400/50 bg-red-400/10'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >

              {/* IMAGE */}
              <div className="aspect-[16/10] bg-white/5">
                {image ? (
                  <img
                    src={image}
                    alt={getOptionName(option)}
                    loading="eager"
                    className="h-full w-full object-cover"
                    onError={event => {
                      console.error(
                        'Battle image failed:',
                        image
                      );

                      event.currentTarget.style.display =
                        'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/20">
                    <UsersIcon />
                  </div>
                )}
              </div>

              <div className="p-5">

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {getOptionName(option)}
                    </h3>

                    {option.tagline && (
                      <p className="mt-1 text-xs text-white/40">
                        {option.tagline}
                      </p>
                    )}
                  </div>

                  {isWinner && (
                    <Trophy className="h-5 w-5 shrink-0 text-yellow-400" />
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-xs text-white/50">
                    <span>
                      {votes} votes
                    </span>

                    <span>
                      {percentage}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all"
                      style={{
                        width:
                          `${percentage}%`,
                      }}
                    />
                  </div>
                </div>

                {!finished && (
                  <button
                    type="button"
                    onClick={() =>
                      void vote(
                        option.id
                      )
                    }
                    disabled={
                      voting ||
                      hasVoted
                    }
                    className="mt-5 w-full rounded-xl bg-red-500 px-4 py-3 font-bold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {voting &&
                    selected
                      ? 'Voting...'
                      : hasVoted
                      ? 'Already Voted'
                      : 'Vote'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ERROR */}
      {voteError && (
        <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300 sm:mx-6">
          <AlertCircle className="h-4 w-4" />
          {voteError}
        </div>
      )}

      {/* RESULT */}
      {finished && (
        <div className="border-y border-white/10 bg-yellow-400/5 p-6 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-yellow-400" />

          {winner ? (
            <>
              <div className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                Winner
              </div>

              <h3 className="mt-1 text-3xl font-black text-white">
                {getOptionName(winner)}
              </h3>

              {getOptionImage(
                winner
              ) && (
                <img
                  src={getOptionImage(
                    winner
                  )}
                  alt={getOptionName(winner)}
                  className="mx-auto mt-5 max-h-[350px] max-w-md rounded-2xl object-cover"
                />
              )}
            </>
          ) : (
            <h3 className="text-2xl font-black text-white">
              It&apos;s a Draw!
            </h3>
          )}
        </div>
      )}

      {/* COMMENTS */}
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-white/60" />

          <h3 className="font-black text-white">
            Comments
          </h3>

          <span className="text-xs text-white/30">
            ({comments.length})
          </span>
        </div>

        <div className="max-h-[350px] space-y-3 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-white/30">
              No comments yet.
            </div>
          ) : (
            comments.map(item => {
              const itemUserId =
                item.userId ||
                item.user_id;

              const own =
                !!userId &&
                !!itemUserId &&
                String(userId) ===
                  String(itemUserId);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex justify-between gap-3">
                    <div className="text-sm font-bold text-white">
                      {item.userName ||
                        item.user_name ||
                        'User'}
                    </div>

                    {own && (
                      <button
                        type="button"
                        onClick={() =>
                          void deleteComment(
                            item.id
                          )
                        }
                        className="text-xs text-red-300"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-white/60">
                    {item.message}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {!finished && email && (
          <div className="mt-5">
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={event =>
                  setComment(
                    event.target.value
                  )
                }
                onKeyDown={event => {
                  if (
                    event.key ===
                    'Enter'
                  ) {
                    event.preventDefault();
                    void sendComment();
                  }
                }}
                maxLength={500}
                placeholder="Write a comment..."
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
              />

              <button
                type="button"
                onClick={() =>
                  void sendComment()
                }
                disabled={
                  sendingComment ||
                  !comment.trim()
                }
                className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                {sendingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}

                <span className="hidden sm:inline">
                  Send
                </span>
              </button>
            </div>

            {commentError && (
              <p className="mt-2 text-xs text-red-300">
                {commentError}
              </p>
            )}
          </div>
        )}

        {!email && (
          <button
            type="button"
            onClick={() =>
              onOpenAuth?.()
            }
            className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Login to comment
          </button>
        )}
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-white/20"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default BattleArena;