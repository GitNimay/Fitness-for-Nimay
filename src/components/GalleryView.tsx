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
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: limit || 6 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-card-elevated animate-pulse" />
        ))}
      </div>
    );
  }

  if (selfies.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-card-elevated flex items-center justify-center mb-3">
          <ImageOff className="w-6 h-6 text-text-muted" />
        </div>
        <h3 className="text-sm font-semibold mb-0.5">No selfies yet</h3>
        <p className="text-[11px] text-text-muted">Take your first daily selfie to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {selfies.map((s) => (
        <div
          key={s.id}
          className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer border border-white/5 hover:border-neon-purple-start/20 transition-all duration-300"
        >
          <img
            src={s.image_url}
            alt={`Workout on ${s.created_at}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {/* Date overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-white font-semibold text-[11px] leading-tight">
              {format(new Date(s.created_at), 'MMM dd')}
            </p>
            <p className="text-white/50 text-[9px] leading-tight">
              {format(new Date(s.created_at), 'hh:mm a')}
            </p>
          </div>
          {/* Always-visible mini date badge */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <span className="text-[9px] font-medium text-white/80">
              {format(new Date(s.created_at), 'dd')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
