'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ImageOff } from 'lucide-react';

type SelfieData = {
  id: string;
  image_url: string;
  created_at: string;
};

interface GalleryViewProps {
  refreshKey?: number;
  limit?: number;
}

export default function GalleryView({ refreshKey, limit }: GalleryViewProps) {
  const [selfies, setSelfies] = useState<SelfieData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSelfies = async () => {
      setLoading(true);

      let query = supabase
        .from('daily_selfies')
        .select('*')
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (!error && data) {
        setSelfies(data);
      }
      setLoading(false);
    };

    fetchSelfies();
  }, [refreshKey, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: limit || 6 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] border border-white/10 bg-black animate-pulse" />
        ))}
      </div>
    );
  }

  if (selfies.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 text-center border border-white/5 border-dashed">
        <div className="w-16 h-16 border border-white/20 flex items-center justify-center mb-4">
          <ImageOff className="w-6 h-6 text-white/50" />
        </div>
        <h3 className="text-xl font-black tracking-tighter uppercase mb-2">Void</h3>
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-text-muted">Initiate first capture</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {selfies.map((s) => (
        <div
          key={s.id}
          className="relative aspect-[3/4] overflow-hidden group cursor-pointer border border-white/10 hover:border-white transition-all duration-500 grayscale hover:grayscale-0"
        >
          <img
            src={s.image_url}
            alt={`Workout on ${s.created_at}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          {/* Stark overlay on hover */}
          <div className="absolute inset-x-0 bottom-0 bg-black/80 px-3 py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out border-t border-white/20 backdrop-blur-sm">
            <p className="text-white font-black text-[10px] tracking-[0.2em] uppercase mb-1">
              {format(new Date(s.created_at), 'MMM dd')}
            </p>
            <p className="text-white/40 text-[9px] tracking-[0.3em] font-mono">
              {format(new Date(s.created_at), 'HH:mm:ss')}
            </p>
          </div>
          {/* Always-visible brutalist date badge */}
          <div className="absolute top-0 right-0 bg-white text-black px-2.5 py-1.5">
            <span className="text-[12px] font-black tracking-tighter leading-none">
              {format(new Date(s.created_at), 'dd')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
