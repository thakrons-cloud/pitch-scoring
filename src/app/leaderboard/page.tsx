"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Clock } from "lucide-react";
import { useTeams, useEventState } from "@/hooks/useFirebaseData";

export default function LeaderboardPage() {
  const { teams, loading: teamsLoading } = useTeams();
  const { eventState, loading: eventLoading } = useEventState();

  const loading = teamsLoading || eventLoading;

  // Sort teams by total score (descending) and then by total votes (descending)
  const sortedTeams = [...teams].sort((a, b) => {
    const scoreA = a.totalScore || 0;
    const scoreB = b.totalScore || 0;
    if (scoreB === scoreA) {
      return (b.totalVotes || 0) - (a.totalVotes || 0);
    }
    return scoreB - scoreA;
  });

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!eventState?.timerStartedAt || !eventState?.timerDuration) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const startedAt = eventState.timerStartedAt!.toMillis();
      const durationMs = eventState.timerDuration * 1000;
      const diff = now - startedAt;
      const remaining = Math.max(0, Math.floor((durationMs - diff) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [eventState?.timerStartedAt, eventState?.timerDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex flex-col items-center justify-center mb-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(251,191,36,0.3)]"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400 mb-4"
          >
            Live Rankings
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-neutral-400"
          >
            {eventState?.eventName || "Pitching Competition 2026"}
          </motion.p>
        </header>

        {/* Timer Section */}
        {timeLeft !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 flex flex-col items-center"
          >
            <div className={`
              glass-panel px-12 py-8 flex flex-col items-center border-2 transition-colors duration-500
              ${timeLeft <= 10 && timeLeft > 0 ? "border-red-500/50 bg-red-500/5 shadow-[0_0_50px_rgba(239,68,68,0.2)]" : "border-blue-500/30"}
            `}>
              <div className="flex items-center gap-2 text-neutral-500 uppercase tracking-widest text-sm mb-2 font-bold">
                <Clock className="w-4 h-4" /> Time Remaining
              </div>
              <div className={`text-8xl md:text-9xl font-mono font-black tracking-tighter ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-white"}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-6">
          {sortedTeams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 + 0.3 }}
              className="glass-panel p-6 md:p-8 flex items-center gap-6 relative overflow-hidden group"
            >
              {/* Rank Badge */}
              <div className={`
                w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-2xl font-black
                ${index === 0 ? "bg-yellow-400 text-black shadow-[0_0_30px_rgba(251,191,36,0.4)]" : 
                  index === 1 ? "bg-neutral-300 text-black" : 
                  index === 2 ? "bg-amber-700 text-white" : "bg-white/10 text-white"}
              `}>
                #{index + 1}
              </div>

              {/* Team Name */}
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{team.name}</h2>

              </div>

              {/* Score */}
              <div className="text-right">
                <div className="flex items-baseline justify-end min-w-[100px]">
                  <span className="text-4xl font-bold text-yellow-500">
                    {team.totalScore || 0}
                  </span>
                </div>
              </div>

              {/* Highlight gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
