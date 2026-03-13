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
    <div className="flex flex-col gap-6 w-full min-h-full pb-8 pt-2">

      {/* ── Header ── */}
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-10 bg-white" />
          <div className="flex flex-col">
            <span className="text-3xl font-black tracking-tighter uppercase leading-none">Fitonist</span>
            <span className="text-[9px] text-text-muted font-medium uppercase tracking-[0.25em] mt-1">Daily Protocol</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 font-bold text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border ${activeTab === tab.id
                  ? 'bg-white text-black border-white'
                  : 'text-text-secondary border-transparent hover:border-white/20'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Avatar Profile */}
        <div className="w-10 h-10 bg-card-elevated border border-white/20 flex items-center justify-center">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]" />
        </div>
      </header>

      {/* ═══════════════════ OVERVIEW ═══════════════════ */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6 flex-grow">

          {/* Camera */}
          <div className="architectural-panel overflow-hidden h-[55vh] md:h-[45vh] lg:h-[50vh] relative w-full glow-white box-border">
            <CameraWidget onPhotoSaved={handlePhotoSaved} />
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white z-20 pointer-events-none" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white z-20 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white z-20 pointer-events-none" />
          </div>

          {/* Quick Stats strip */}
          <div className="architectural-panel p-5 relative group">
            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-2">
              <h2 className="text-[10px] font-black text-white tracking-[0.2em] uppercase">Activity</h2>
              <button
                onClick={() => setActiveTab('analytics')}
                className="text-[9px] text-white/50 font-bold uppercase tracking-[0.1em] hover:text-white transition-colors flex items-center gap-1"
              >
                Full Report <span className="text-white">↗</span>
              </button>
            </div>
            <AnalyticsDashboard refreshKey={refreshKey} compact />
          </div>

          {/* Gallery Preview */}
          <div className="architectural-panel p-5">
            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-2">
              <h2 className="text-[10px] font-black text-white tracking-[0.2em] uppercase">Archive</h2>
              <button
                onClick={() => setActiveTab('gallery')}
                className="text-[9px] text-white/50 font-bold uppercase tracking-[0.1em] hover:text-white transition-colors flex items-center gap-1"
              >
                View All <span className="text-white">↗</span>
              </button>
            </div>
            <GalleryView refreshKey={refreshKey} limit={6} />
          </div>
        </div>
      )}

      {/* ═══════════════════ GALLERY ═══════════════════ */}
      {activeTab === 'gallery' && (
        <div className="flex flex-col gap-6 flex-grow">
          <div className="flex items-end justify-between border-b border-white/20 pb-4">
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase relative z-10 w-fit mix-blend-difference">Gallery</h1>
              <p className="text-[10px] font-bold tracking-[0.25em] text-text-muted mt-2 uppercase">Your visual record</p>
            </div>
            <span className="text-5xl font-black text-white/5 leading-none">01</span>
          </div>
          <div className="architectural-panel p-4">
            <GalleryView refreshKey={refreshKey} />
          </div>
        </div>
      )}

      {/* ═══════════════════ ANALYTICS ═══════════════════ */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-6 flex-grow">
          <div className="flex items-end justify-between border-b border-white/20 pb-4">
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase relative z-10 w-fit mix-blend-difference">Metrics</h1>
              <p className="text-[10px] font-bold tracking-[0.25em] text-text-muted mt-2 uppercase">Performance analysis</p>
            </div>
            <span className="text-5xl font-black text-white/5 leading-none">02</span>
          </div>
          <div className="architectural-panel p-5">
            <AnalyticsDashboard refreshKey={refreshKey} />
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 architectural-panel-strong z-50 safe-bottom border-t border-white/10">
        <div className="flex justify-around items-center pt-3 pb-2 max-w-lg mx-auto relative">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1.5 py-1 px-5 transition-all duration-300 relative ${isActive
                    ? 'text-white'
                    : 'text-text-muted active:scale-95 hover:text-white/70'
                  }`}
              >
                <div className={`transition-all duration-300 ${isActive ? '-translate-y-1 scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]' : ''}`}>
                  {tab.icon}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-white' : 'text-transparent'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-white -mt-3 glow-white" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
