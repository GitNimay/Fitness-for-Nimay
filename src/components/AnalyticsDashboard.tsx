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
         <div className="w-full flex flex-col gap-3 animate-pulse">
            <div className="flex gap-2">
               {[1,2,3,4].map(i => <div key={i} className="h-14 flex-1 bg-card-bg rounded-xl" />)}
            </div>
            {!compact && (
               <div className="flex flex-wrap gap-1 w-full">
                  {Array.from({ length: compact ? 30 : 60 }).map((_, i) => (
                     <div key={i} className="w-3 h-3 rounded-[3px] bg-card-bg" />
                  ))}
               </div>
            )}
         </div>
      );
   }

   return (
      <div className="w-full flex flex-col gap-3">
         {/* Stats Cards */}
         <div className="grid grid-cols-4 gap-2">
            <StatCard value={currentStreak} label="Streak" highlight={currentStreak > 0} />
            <StatCard value={longestStreak} label="Best" />
            <StatCard value={totalPosts} label="Posts" />
            <StatCard value={`${consistencyRate}%`} label="Rate" />
         </div>

         {/* Contribution Grid */}
         <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
               <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
                  Last {compact ? 30 : 60} days
               </span>
               <div className="flex items-center gap-1 text-[10px] text-text-muted">
                  <div className="w-2.5 h-2.5 rounded-[3px] bg-card-elevated" />
                  <span>Miss</span>
                  <div className="w-2.5 h-2.5 rounded-[3px] bg-neon-purple-start" />
                  <span>Post</span>
               </div>
            </div>
            
            <div className="flex flex-wrap gap-[5px]">
               {calendarData.map((day, i) => (
                  <div 
                     key={i} 
                     title={`${format(day.date, 'MMM dd')} — ${day.hasPost ? '✅' : '❌'}`}
                     className={`w-3 h-3 rounded-[3px] transition-all duration-500 ${
                        day.hasPost 
                           ? 'bg-neon-purple-start shadow-[0_0_6px_rgba(168,85,247,0.4)]' 
                           : 'bg-card-elevated'
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
      <div className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-colors ${
         highlight ? 'bg-neon-purple-start/10 border border-neon-purple-start/20' : 'bg-card-elevated/50'
      }`}>
         <span className={`text-lg font-bold leading-tight ${highlight ? 'text-neon-purple-start' : 'text-text-primary'}`}>
            {value}
         </span>
         <span className="text-[9px] text-text-muted font-medium uppercase tracking-wider mt-0.5">
            {label}
         </span>
      </div>
   );
}
