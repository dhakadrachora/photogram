'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { Users, Shield, ShieldAlert, BadgeCheck, Loader2, Search, MoreVertical } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/admin/content?type=users', { headers, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.users) setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleVerification = async (user: User) => {
    const isCurrentlyVerified = Boolean(user.isVerified);
    const action = isCurrentlyVerified ? 'revoke' : 'grant';
    if (!confirm(`Are you sure you want to ${action} the Blue Tick for ${user.name}?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const res = await fetch('/api/admin/users/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          isVerified: !isCurrentlyVerified
        })
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update verification status');
      }
    } catch (err) {
      alert('Network error while updating verification');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">User Management</h1>
          <p className="mt-1 text-sm font-medium text-stone-500">Manage accounts, verifications, and access control.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-stone-200 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 mb-4">
              <Users className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-black text-stone-900">No Users Found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">User</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Email</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Joined</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((user) => {
                  const isVerified = Boolean(user.isVerified);
                  const isBlocked = Boolean(user.isBlocked);
                  
                  return (
                    <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                            alt="" 
                            className="h-10 w-10 rounded-full object-cover bg-stone-100" 
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-900">{user.name}</span>
                              {isVerified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
                            </div>
                            <span className="text-xs text-stone-500">ID: {user.id?.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-600">{user.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                            <ShieldAlert className="h-3 w-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                            <Shield className="h-3 w-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-stone-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleVerification(user)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                            isVerified 
                              ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' 
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          {isVerified ? 'Revoke Tick' : 'Grant Blue Tick'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
