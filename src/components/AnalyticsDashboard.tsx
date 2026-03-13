'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';

type CalendarDay = {
   date: Date;
   hasPost: boolean;
};

interface AnalyticsDashboardProps {
   refreshKey?: number;
   compact?: boolean;
}

export default function AnalyticsDashboard({ refreshKey, compact }: AnalyticsDashboardProps) {
   const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
   const [mounted, setMounted] = useState(false);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      setMounted(true);

      const fetchData = async () => {
         setLoading(true);
         const days = compact ? 30 : 60;
         const startDate = subDays(new Date(), days - 1);

         const { data, error } = await supabase
            .from('daily_selfies')
            .select('created_at')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

         const postDates = new Set<string>();
         if (!error && data) {
            data.forEach((row) => {
               const dayStr = format(new Date(row.created_at), 'yyyy-MM-dd');
               postDates.add(dayStr);
            });
         }

         const calendar = Array.from({ length: days }).map((_, i) => {
            const date = subDays(new Date(), days - 1 - i);
            const dayStr = format(date, 'yyyy-MM-dd');
            return { date, hasPost: postDates.has(dayStr) };
         });

         setCalendarData(calendar);
         setLoading(false);
      };

      fetchData();
   }, [refreshKey, compact]);

   const currentStreak = useMemo(() => {
      let streak = 0;
      for (let i = calendarData.length - 1; i >= 0; i--) {
         if (calendarData[i].hasPost) streak++;
         else break;
      }
      return streak;
   }, [calendarData]);

   const longestStreak = useMemo(() => {
      let max = 0, current = 0;
      calendarData.forEach((day) => {
         if (day.hasPost) { current++; max = Math.max(max, current); }
         else { current = 0; }
      });
      return max;
   }, [calendarData]);

   const totalPosts = useMemo(() => calendarData.filter(d => d.hasPost).length, [calendarData]);

   const consistencyRate = useMemo(() => {
      if (calendarData.length === 0) return 0;
      return Math.round((totalPosts / calendarData.length) * 100);
   }, [totalPosts, calendarData.length]);

   if (!mounted || loading) {
      return (
         <div className="w-full flex flex-col gap-5 animate-pulse">
            <div className="grid grid-cols-4 gap-2">
               {[1, 2, 3, 4].map(i => <div key={i} className="h-20 flex-1 border border-white/5" />)}
            </div>
            {!compact && (
               <div className="flex flex-wrap gap-1 w-full mt-4">
                  {Array.from({ length: compact ? 30 : 60 }).map((_, i) => (
                     <div key={i} className="w-3.5 h-3.5 border border-white/5" />
                  ))}
               </div>
            )}
         </div>
      );
   }

   return (
      <div className="w-full flex flex-col gap-6">
         {/* Stats Cards */}
         <div className="grid grid-cols-4 gap-2">
            <StatCard value={currentStreak} label="Streak" highlight={currentStreak > 0} />
            <StatCard value={longestStreak} label="Best" />
            <StatCard value={totalPosts} label="Posts" />
            <StatCard value={`${consistencyRate}%`} label="Rate" />
         </div>

         {/* Contribution Grid */}
         <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
               <span className="text-[9px] text-white/50 font-bold uppercase tracking-[0.2em]">
                  Log — {compact ? 30 : 60}D
               </span>
               <div className="flex items-center gap-3 text-[8px] font-bold uppercase tracking-[0.2em] text-white/50">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 border border-white/20" /> MISS</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-white" /> POST</div>
               </div>
            </div>

            <div className="flex flex-wrap gap-1">
               {calendarData.map((day, i) => (
                  <div
                     key={i}
                     title={`${format(day.date, 'MMM dd')} — ${day.hasPost ? 'POST' : 'MISS'}`}
                     className={`w-3.5 h-3.5 transition-all duration-500 border relative group ${day.hasPost
                           ? 'bg-white border-white glow-white scale-[1.05] z-10 hover:scale-125'
                           : 'bg-transparent border-white/10 hover:border-white/40'
                        }`}
                  />
               ))}
            </div>
         </div>
      </div>
   );
}

function StatCard({ value, label, highlight }: { value: string | number; label: string; highlight?: boolean }) {
   return (
      <div className={`flex flex-col items-start justify-center py-4 px-3 border transition-all duration-300 ${highlight ? 'bg-white text-black border-white shadow-[0_5px_20px_-5px_rgba(255,255,255,0.3)]' : 'bg-transparent border-white/10 hover:border-white/30 text-white'
         }`}>
         <span className={`text-2xl font-black leading-none tracking-tighter ${highlight ? 'text-black' : 'text-white'}`}>
            {value}
         </span>
         <span className={`text-[8px] font-bold uppercase tracking-[0.2em] mt-2 ${highlight ? 'text-black/60' : 'text-text-muted'}`}>
            {label}
         </span>
      </div>
   );
}
