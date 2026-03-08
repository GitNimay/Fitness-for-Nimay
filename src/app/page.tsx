'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CameraWidget from '@/components/CameraWidget';
import GalleryView from '@/components/GalleryView';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { Images, BarChart3, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';


type TabType = 'overview' | 'gallery' | 'analytics';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Home', icon: <Flame className="w-5 h-5" /> },
    { id: 'gallery', label: 'Gallery', icon: <Images className="w-5 h-5" /> },
    { id: 'analytics', label: 'Stats', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  // Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel('selfies-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'daily_selfies' },
        () => setRefreshKey((k) => k + 1)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePhotoSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full min-h-full">

      {/* ── Mobile Header ── */}
      <header className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Fitonist" className="w-full h-full object-contain p-0.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight leading-tight">Fitonist</span>
            <span className="text-[10px] text-text-muted leading-tight">Daily Tracker</span>
          </div>
        </div>

        {/* Desktop Nav (hidden on mobile) */}
        <nav className="hidden md:flex bg-card-bg rounded-2xl p-1 border border-white/5 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-neon-purple-start text-white shadow-lg shadow-neon-purple-start/25'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-card-elevated overflow-hidden border border-white/8">
          <div className="w-full h-full bg-gradient-to-br from-neon-purple-start/60 to-neon-cyan/40" />
        </div>
      </header>

      {/* ═══════════════════ OVERVIEW ═══════════════════ */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-3 flex-grow">

          {/* Camera — Full-width hero on mobile */}
          <div className="glass rounded-2xl overflow-hidden h-[55vh] md:h-[45vh] lg:h-[50vh] relative neon-glow-purple">
            <CameraWidget onPhotoSaved={handlePhotoSaved} />
          </div>

          {/* Quick Stats strip */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-secondary tracking-wide uppercase">Activity</h2>
              <button
                onClick={() => setActiveTab('analytics')}
                className="text-[11px] text-neon-purple-start font-medium"
              >
                See All →
              </button>
            </div>
            <AnalyticsDashboard refreshKey={refreshKey} compact />
          </div>

          {/* Gallery Preview */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-secondary tracking-wide uppercase">Recent</h2>
              <button
                onClick={() => setActiveTab('gallery')}
                className="text-[11px] text-neon-purple-start font-medium"
              >
                View All →
              </button>
            </div>
            <GalleryView refreshKey={refreshKey} limit={6} />
          </div>
        </div>
      )}

      {/* ═══════════════════ GALLERY ═══════════════════ */}
      {activeTab === 'gallery' && (
        <div className="flex flex-col gap-3 flex-grow">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
              <p className="text-xs text-text-muted mt-0.5">Your fitness journey timeline</p>
            </div>
          </div>
          <div className="glass rounded-2xl p-3">
            <GalleryView refreshKey={refreshKey} />
          </div>
        </div>
      )}

      {/* ═══════════════════ ANALYTICS ═══════════════════ */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-3 flex-grow">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Stats</h1>
              <p className="text-xs text-text-muted mt-0.5">Real-time analytics of your journey</p>
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <AnalyticsDashboard refreshKey={refreshKey} />
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-strong z-50 safe-bottom">
        <div className="flex justify-around items-center pt-2 pb-1 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 py-1 px-5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'text-neon-purple-start'
                    : 'text-text-muted active:scale-95'
                }`}
              >
                <div className={`transition-all duration-300 ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-neon-purple-start' : 'text-text-muted'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-neon-purple-start mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
