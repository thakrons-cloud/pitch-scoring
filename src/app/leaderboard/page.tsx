"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
      const startedAt = (eventState.timerStartedAt as import("firebase/firestore").Timestamp).toMillis();
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

  const showTimer = timeLeft !== null && timeLeft > 0;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 overflow-hidden relative flex flex-col items-center justify-center">
      {/* Background decorations */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {showTimer ? (
            <motion.div
              key="timer-view"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center"
            >
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-3xl text-neutral-400 mb-8 font-medium uppercase tracking-[0.3em]"
              >
                {eventState?.eventName || "Pitching Competition"}
              </motion.p>
              
              <div className={`
                glass-panel px-16 py-12 flex flex-col items-center border-2 transition-colors duration-500
                ${timeLeft <= 10 ? "border-red-500 bg-red-500/10 shadow-[0_0_80px_rgba(239,68,68,0.3)]" : "border-blue-500/30"}
              `}>
                <div className="flex items-center gap-3 text-neutral-500 uppercase tracking-widest text-lg mb-6 font-bold">
                  <Clock className="w-6 h-6" /> Time Remaining
                </div>
                <div className={`text-[12rem] md:text-[16rem] leading-none font-mono font-black tracking-tighter ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-white"}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard-view"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <header className="flex flex-col items-center justify-center mb-16 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(251,191,36,0.3)]"
                >
                  <Trophy className="w-10 h-10 text-white" />
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400 mb-4">
                  Final Rankings
                </h1>
                <p className="text-xl text-neutral-400">
                  {eventState?.eventName || "Pitching Competition"}
                </p>
              </header>

              <div className="space-y-4">
                {sortedTeams.map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-panel p-4 md:p-6 flex items-center gap-6 relative overflow-hidden group"
                  >
                    <div className={`
                      w-14 h-14 shrink-0 rounded-xl flex items-center justify-center text-xl font-black
                      ${index === 0 ? "bg-yellow-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]" : 
                        index === 1 ? "bg-neutral-300 text-black" : 
                        index === 2 ? "bg-amber-700 text-white" : "bg-white/10 text-white"}
                    `}>
                      #{index + 1}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold">{team.name}</h2>
                    </div>

                    <div className="text-right">
                      <span className="text-3xl font-bold text-yellow-500">
                        {team.totalScore || 0}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
