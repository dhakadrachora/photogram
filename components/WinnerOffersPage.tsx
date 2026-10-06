'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Crown,
  Gift,
  Instagram,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { InstagramReelsBooster } from './InstagramReelsBooster';

interface WinnerOffer {
  id: string;
  winnerName: string;
  winnerPhoto?: string;
  votes: number;
  reward: string;
  instagramUsername?: string;
  instagramUrl?: string;
  title?: string;
  description?: string;
  createdAt?: string;
}

interface WinnerOffersPageProps {
  onBack: () => void;
}

const REWARD_RULES = [
  {
    votes: 50,
    reward: '10K',
    title: '10K Instagram Reels Views',
    description: '50+ votes complete karne wale winner ko.',
  },
  {
    votes: 100,
    reward: '100K',
    title: '100K Instagram Reels Views',
    description: '100+ votes complete karne wale winner ko.',
  },
  {
    votes: 250,
    reward: '1 Million',
    title: '1 Million Instagram Reels Views',
    description: '250+ votes complete karne wale winner ko.',
  },
];

function getRewardForVotes(votes: number) {
  if (votes >= 250) {
    return {
      label: '1 Million',
      title: '1 Million Instagram Reels Views FREE',
    };
  }

  if (votes >= 100) {
    return {
      label: '100K',
      title: '100K Instagram Reels Views FREE',
    };
  }

  if (votes >= 50) {
    return {
      label: '10K',
      title: '10K Instagram Reels Views FREE',
    };
  }

  return {
    label: 'Not Eligible',
    title: 'Reward threshold not reached',
  };
}

export function WinnerOffersPage({
  onBack,
}: WinnerOffersPageProps) {
  const [offers, setOffers] = useState<WinnerOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadOffers = async () => {
      try {
        /*
         * Future Admin/Supabase API.
         *
         * If the API does not exist yet, the page simply
         * shows the reward rules without breaking.
         */
        const response = await fetch(
          '/api/winner-offers',
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error(
            `Winner offers request failed: ${response.status}`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          const nextOffers = Array.isArray(data)
            ? data
            : Array.isArray(data?.offers)
            ? data.offers
            : [];

          setOffers(nextOffers);
        }
      } catch {
        /*
         * API will be connected in the Admin/Supabase step.
         * Never show fake winners.
         */
        if (!cancelled) {
          setOffers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOffers();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#05070D] text-slate-100 pb-28">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#05070D]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition hover:border-cyan-500/40"
          >
            <ArrowLeft className="h-4 w-4 text-cyan-400" />
            Home
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                DHOTI AALE
              </p>

              <p className="text-sm font-extrabold text-white">
                Winner Rewards & Dhoti Coins
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl bg-stone-900 px-5 py-8 text-white shadow-xl sm:px-8 sm:py-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300">
              <Sparkles className="h-4 w-4" />
              Battle Winner Rewards
            </div>

            <h1 className="text-3xl font-black leading-tight sm:text-5xl">
              Jeeto Battle,
              <br />
              <span className="text-amber-400">
                Pao Instagram Views FREE
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">
              DHOTI AALE Battle me vote collect karo,
              winner bano aur apne Instagram Reels ke liye
              free views reward pao.
            </p>
          </div>
        </section>

        {/* INSTANT FREE 100 INSTAGRAM REELS VIEWS BOOSTER */}
        <section className="mt-8 mb-4">
          <div className="mb-3 px-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              ⚡ Instant Daily Free Views
            </span>
          </div>
          <InstagramReelsBooster />
        </section>

        {/* REWARD RULES */}
        <section className="mt-12">
          <div className="mb-4">
            <p className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
              Reward Rules
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              Kitne votes par kya milega?
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {REWARD_RULES.map((rule, index) => (
              <div
                key={rule.votes}
                className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-amber-500/40"
              >
                {index === 2 && (
                  <div className="absolute right-3 top-3 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[10px] font-black uppercase text-amber-300">
                    Top Reward 👑
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                    {index === 2 ? (
                      <Crown className="h-6 w-6" />
                    ) : (
                      <Gift className="h-6 w-6" />
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black text-white">
                      {rule.votes}+
                    </p>

                    <p className="text-[11px] font-bold text-slate-400">
                      VOTES
                    </p>
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-black text-white">
                  {rule.reward}
                </h3>

                <p className="mt-1 text-sm font-bold text-amber-400">
                  Instagram Reels Views FREE
                </p>

                <p className="mt-3 text-xs leading-5 text-slate-400">
                  {rule.description}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Reward Rule
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                Simple Process
              </p>

              <h2 className="text-xl font-black text-white">
                Reward kaise milega?
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4">
              <p className="text-sm font-black text-white">
                01. Battle join karo
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Apne battle me participate karo aur
                support collect karo.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4">
              <p className="text-sm font-black text-white">
                02. Votes collect karo
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Jitne zyada real votes, utna bada
                applicable reward.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4">
              <p className="text-sm font-black text-white">
                03. Reward claim karo
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Winner announce hone ke baad eligible
                reward diya jayega.
              </p>
            </div>
          </div>
        </section>

        {/* LATEST WINNERS */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
                Latest Winners
              </p>

              <h2 className="mt-1 text-2xl font-black text-white">
                Recent Reward Winners
              </h2>
            </div>

            <div className="hidden items-center gap-1.5 text-xs font-bold text-slate-400 sm:flex">
              <Award className="h-4 w-4 text-amber-400" />
              Real published offers
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-amber-400" />

              <p className="mt-4 text-sm font-bold text-slate-400">
                Winners load ho rahe hain...
              </p>
            </div>
          ) : offers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                <Trophy className="h-8 w-8 text-amber-400" />
              </div>

              <h3 className="mt-5 text-xl font-black text-white">
                Abhi koi winner offer published nahi hai
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                Jaise hi Super Admin winner offer publish
                karega, winner ki photo, naam, votes aur
                reward yahan automatically dikhai denge.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => {
                const calculatedReward =
                  getRewardForVotes(offer.votes);

                return (
                  <article
                    key={offer.id}
                    className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-sm transition hover:-translate-y-1 hover:border-amber-500/40"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                      {offer.winnerPhoto ? (
                        <img
                          src={offer.winnerPhoto}
                          alt={offer.winnerName}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Trophy className="h-16 w-16 text-slate-700" />
                        </div>
                      )}

                      <div className="absolute left-3 top-3 rounded-full bg-slate-950/90 border border-amber-400/40 px-3 py-1.5 text-xs font-black text-amber-300 shadow">
                        🏆 WINNER
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        {offer.title || 'Battle Winner'}
                      </p>

                      <h3 className="mt-1 text-xl font-black text-white">
                        {offer.winnerName}
                      </h3>

                      {offer.description && (
                        <p className="mt-2 text-sm leading-5 text-slate-400">
                          {offer.description}
                        </p>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Votes
                          </p>

                          <p className="mt-1 text-xl font-black text-white">
                            {offer.votes.toLocaleString('en-IN')}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3">
                          <p className="text-[10px] font-bold uppercase text-amber-400">
                            Reward
                          </p>

                          <p className="mt-1 text-lg font-black text-amber-300">
                            {offer.reward ||
                              calculatedReward.label}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                        <Instagram className="h-5 w-5 text-pink-400" />

                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase text-emerald-400">
                            Instagram Reward
                          </p>

                          <p className="truncate text-xs font-extrabold text-slate-200">
                            {offer.instagramUsername ||
                              offer.instagramUrl ||
                              'Instagram profile'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* FOOTER NOTE */}
        <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-center text-xs leading-5 text-amber-300">
            Reward eligibility real battle votes ke basis
            par calculate ki jayegi. Fake ya manually generated
            votes reward eligibility ke liye use nahi honge.
          </p>
        </section>
      </main>
    </div>
  );
}