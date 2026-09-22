'use client';

import React from 'react';
import { Settings, Wrench, Globe, Bell } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Site Settings</h1>
        <p className="mt-1 text-sm font-medium text-stone-500">Configure global application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* General Settings */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-stone-400" />
            <h2 className="text-lg font-bold text-stone-800">General</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Site Maintenance Mode</label>
              <select className="w-full rounded-xl border border-stone-200 p-2.5 text-sm outline-none bg-stone-50">
                <option value="off">Off - Site is live</option>
                <option value="on">On - Only admins can access</option>
              </select>
              <p className="mt-1 text-xs text-stone-500">Turn this on during major upgrades.</p>
            </div>
            <button className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800">
              Save General Settings
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-4 flex items-center gap-3">
            <Bell className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-stone-800">Global Announcements</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Banner Message</label>
              <textarea 
                rows={3} 
                className="w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="Enter a message to broadcast to all users..."
              />
            </div>
            <button className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600">
              Broadcast Message
            </button>
          </div>
        </div>

      </div>

      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white border border-stone-200 mb-4">
          <Wrench className="h-6 w-6 text-stone-400" />
        </div>
        <h3 className="text-lg font-black text-stone-900">More Settings Coming Soon</h3>
        <p className="mt-2 text-stone-500 max-w-md mx-auto text-sm">
          This panel is a placeholder for future global configurations like payment gateways, ad management, and SEO metadata.
        </p>
      </div>

    </div>
  );
}
