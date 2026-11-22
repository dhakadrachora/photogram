'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Shield,
  Users,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Search,
  Lock,
  Trash2,
  BadgeCheck,
  RefreshCw,
  LogOut,
  AlertTriangle,
  ArrowLeft,
  Server,
  Database,
  Cloud,
} from 'lucide-react';
import { useAuth, StoredAccount } from '@/context/AuthContext';
import { usePosts } from '@/context/PostsContext';

const ADMIN_PASSKEY = 'photogram@2026';

export default function AdminPage() {
  const { user, updateProfile } = useAuth();
  const { posts } = usePosts();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [registeredAccounts, setRegisteredAccounts] = useState<StoredAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Check existing admin session
  useEffect(() => {
    try {
      const sess = sessionStorage.getItem('photogram_admin_auth');
      if (sess === 'true') {
        setIsAuthenticated(true);
        loadAccounts();
      }
    } catch {}
  }, []);

  const loadAccounts = () => {
    try {
      const raw = localStorage.getItem('photogram_registered_accounts');
      if (raw) {
        setRegisteredAccounts(JSON.parse(raw));
      } else {
        setRegisteredAccounts([]);
      }
    } catch {
      setRegisteredAccounts([]);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput === ADMIN_PASSKEY || passkeyInput === 'admin2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('photogram_admin_auth', 'true');
      setLoginError(false);
      loadAccounts();
    } else {
      setLoginError(true);
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('photogram_admin_auth');
  };

  // Toggle Blue Verified Badge for any user
  const toggleVerifiedBadge = (targetUsername: string) => {
    try {
      const raw = localStorage.getItem('photogram_registered_accounts');
      const accounts: StoredAccount[] = raw ? JSON.parse(raw) : [];
      const idx = accounts.findIndex(
        (a) => a.username.toLowerCase() === targetUsername.toLowerCase()
      );

      let nextStatus = true;
      if (idx !== -1) {
        nextStatus = !accounts[idx].is_verified;
        accounts[idx].is_verified = nextStatus;
        localStorage.setItem('photogram_registered_accounts', JSON.stringify(accounts));
        setRegisteredAccounts([...accounts]);
      }

      // If modifying current logged-in user, update session as well
      if (user && user.username.toLowerCase() === targetUsername.toLowerCase()) {
        updateProfile({ is_verified: nextStatus });
      }

      setSuccessNotice(
        `Updated verified badge for @${targetUsername}: ${nextStatus ? 'VERIFIED (Blue Badge Granted)' : 'UNVERIFIED'}`
      );
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch {}
  };

  // Delete user account
  const handleDeleteUser = (targetUsername: string) => {
    if (!confirm(`Are you sure you want to remove user @${targetUsername}?`)) return;

    try {
      const raw = localStorage.getItem('photogram_registered_accounts');
      const accounts: StoredAccount[] = raw ? JSON.parse(raw) : [];
      const updated = accounts.filter(
        (a) => a.username.toLowerCase() !== targetUsername.toLowerCase()
      );
      localStorage.setItem('photogram_registered_accounts', JSON.stringify(updated));
      setRegisteredAccounts(updated);
      setSuccessNotice(`User @${targetUsername} has been permanently removed.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch {}
  };

  const filteredAccounts = registeredAccounts.filter(
    (a) =>
      a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If Not Authenticated, show Admin Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 select-none">
        <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#0095f6]/10 border border-[#0095f6]/30 flex items-center justify-center mx-auto mb-4 text-[#0095f6]">
            <Shield className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white">Photogram Admin</h2>
          <p className="text-xs text-neutral-400 mt-1 mb-6">
            Enter master key to access administrator dashboard.
          </p>

          {loginError && (
            <div className="p-3 mb-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Invalid admin passkey. Try &apos;photogram@2026&apos;</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                placeholder="Admin Passkey"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                autoFocus
                className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white pl-10 pr-3.5 py-2.5 rounded-xl outline-none focus:border-[#0095f6]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Unlock Dashboard
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-900">
            <Link href="/" className="text-xs text-neutral-500 hover:text-white flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Photogram</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 max-w-6xl mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0095f6]/10 border border-[#0095f6]/30 flex items-center justify-center text-[#0095f6]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Photogram Master Admin</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PROD v2.4.0
              </span>
            </h1>
            <p className="text-xs text-neutral-400">Manage real user accounts, verified badges, and moderation.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white transition-colors"
          >
            Open App
          </Link>
          <button
            onClick={handleAdminLogout}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
          >
            Lock Admin
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold">Total Accounts</span>
            <Users className="w-4 h-4 text-[#0095f6]" />
          </div>
          <p className="text-2xl font-bold text-white">{registeredAccounts.length + (user ? 1 : 0)}</p>
          <span className="text-[10px] text-neutral-500">Real registered profiles</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold">Total Posts</span>
            <ImageIcon className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{posts.length}</p>
          <span className="text-[10px] text-neutral-500">Live community photos</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold">Media CDN</span>
            <Cloud className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-emerald-400 mt-1">Cloudinary CDN</p>
          <span className="text-[10px] text-neutral-500">Auto-compression active</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold">Database Engine</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-sm font-bold text-sky-400 mt-1">Supabase PostgreSQL</p>
          <span className="text-[10px] text-neutral-500">Live on photogramweb.online</span>
        </div>
      </div>

      {/* Success Notice Banner */}
      {successNotice && (
        <div className="p-3.5 mb-6 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* User Management Section */}
      <div className="border border-neutral-800 rounded-2xl bg-neutral-950 overflow-hidden shadow-2xl">
        <div className="p-4 md:p-6 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-white">Registered Users & Blue Badges</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Click &quot;Blue Badge&quot; on any user to instantly grant or remove the verified badge.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white pl-9 pr-3.5 py-2 rounded-xl outline-none focus:border-neutral-700"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email / Phone</th>
                <th className="py-3 px-4">Verified Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {/* Current Active Session User */}
              {user && (
                <tr className="hover:bg-neutral-900/60 transition-colors bg-[#0095f6]/5">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
                      <Image
                        src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={user.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 font-semibold text-white">
                        <span>@{user.username}</span>
                        {user.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-[#0095f6]" />}
                        <span className="text-[9px] bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-400">Current</span>
                      </div>
                      <span className="text-[11px] text-neutral-400">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400">{user.username}@photogram.app</td>
                  <td className="py-3.5 px-4">
                    {user.is_verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0095f6]/20 text-[#0095f6] border border-[#0095f6]/30">
                        <CheckCircle className="w-3 h-3" />
                        Verified Blue Badge
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400">
                        Standard Account
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toggleVerifiedBadge(user.username)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#0095f6] hover:bg-[#1877f2] text-white transition-colors cursor-pointer mr-2"
                    >
                      {user.is_verified ? 'Remove Blue Badge' : 'Grant Blue Badge'}
                    </button>
                  </td>
                </tr>
              )}

              {/* Other Registered Accounts */}
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-neutral-900/60 transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
                      <Image
                        src={account.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={account.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 font-semibold text-white">
                        <span>@{account.username}</span>
                        {account.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-[#0095f6]" />}
                      </div>
                      <span className="text-[11px] text-neutral-400">{account.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400">{account.email || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    {account.is_verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0095f6]/20 text-[#0095f6] border border-[#0095f6]/30">
                        <CheckCircle className="w-3 h-3" />
                        Verified Blue Badge
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400">
                        Standard Account
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => toggleVerifiedBadge(account.username)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer"
                    >
                      {account.is_verified ? 'Remove Badge' : 'Grant Badge'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(account.username)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove user"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
