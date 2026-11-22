'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Zap, AlertCircle, Check } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!email || !password || !username) {
          setError('Please fill in all required fields.');
          setLoading(false);
          return;
        }
        const res = await signup(email, password, username, fullName);
        if (res.success) {
          setSuccessMsg('Account created successfully! Redirecting...');
          setTimeout(() => router.push('/'), 1000);
        } else {
          setError(res.error || 'Failed to sign up.');
        }
      } else {
        if (!email || !password) {
          setError('Please enter your email/username and password.');
          setLoading(false);
          return;
        }
        const res = await login(email, password);
        if (res.success) {
          router.push('/');
        } else {
          setError(res.error || 'Failed to log in.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setLoading(true);
    await login('aryan.visuals@instagram.com', 'demo123456');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="flex items-center justify-center gap-8 w-full max-w-4xl">
        {/* Left Side: Mock Phone Preview (Desktop only) */}
        <div className="hidden lg:block relative w-[380px] h-[580px] shrink-0">
          <div className="w-full h-full rounded-[40px] border-4 border-neutral-800 bg-neutral-950 p-3 shadow-2xl relative overflow-hidden">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-neutral-800 rounded-full z-20" />
            <div className="w-full h-full rounded-[32px] overflow-hidden relative">
              <Image
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
                alt="Instagram Phone Demo"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
              <div className="absolute bottom-6 left-4 right-4 text-white">
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#0095f6] rounded-full">
                  Fast Cloudinary HD Photos
                </span>
                <p className="text-sm font-bold mt-2">1:1 Photogram Web Experience</p>
                <p className="text-[11px] text-neutral-300">
                  Supabase Database • Cloudinary Media • Next.js App Router
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div className="w-full max-w-[350px] space-y-3">
          {/* Main Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8 flex flex-col items-center">
            {/* Photogram Script Heading */}
            <h1 className="text-3xl font-bold tracking-tight text-white mb-6 font-serif italic">
              Photogram
            </h1>

            {error && (
              <div className="w-full bg-red-950/50 border border-red-800 text-red-300 text-xs p-2.5 rounded-lg mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="w-full bg-green-950/50 border border-green-800 text-green-300 text-xs p-2.5 rounded-lg mb-4 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-green-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-2">
              <input
                type="text"
                placeholder={isSignUp ? 'Mobile Number or Email' : 'Phone number, username, or email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3 py-2.5 rounded-md outline-none focus:border-neutral-600 transition-colors"
              />

              {isSignUp && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3 py-2.5 rounded-md outline-none focus:border-neutral-600 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3 py-2.5 rounded-md outline-none focus:border-neutral-600 transition-colors"
                  />
                </>
              )}

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3 py-2.5 rounded-md outline-none focus:border-neutral-600 transition-colors"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors mt-2"
              >
                {loading ? 'Please wait...' : isSignUp ? 'Sign up' : 'Log in'}
              </button>
            </form>

            {/* OR Divider */}
            <div className="w-full flex items-center my-4">
              <div className="flex-1 h-[1px] bg-neutral-800" />
              <span className="px-4 text-[11px] font-semibold text-neutral-500 uppercase">
                OR
              </span>
              <div className="flex-1 h-[1px] bg-neutral-800" />
            </div>

            {/* Instant Demo Login Button */}
            <button
              type="button"
              onClick={handleInstantDemoLogin}
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold rounded-lg shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>⚡ Instant Demo Login (1-Click)</span>
            </button>
          </div>

          {/* Toggle Login / Signup Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center text-xs text-neutral-300">
            {isSignUp ? (
              <p>
                Have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="font-semibold text-[#0095f6] hover:underline"
                >
                  Log in
                </button>
              </p>
            ) : (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="font-semibold text-[#0095f6] hover:underline"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
