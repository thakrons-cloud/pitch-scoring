"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, ChevronLeft, ChevronRight, Gamepad2, LogOut, Clock, RotateCcw } from "lucide-react";
import { serverTimestamp } from "firebase/firestore";
import { useEventState, useTeams } from "@/hooks/useFirebaseData";
import { updateEventState } from "@/lib/firebaseUtils";
import { useStore } from "@/store/useStore";
import { Timestamp } from "firebase/firestore";

export default function GamePage() {
  const { isAdmin, setIsAdmin } = useStore();
  const [passwordInput, setPasswordInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(3);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showTimerSetup, setShowTimerSetup] = useState(false);

  const { eventState } = useEventState();
  const { teams } = useTeams();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!eventState?.timerStartedAt || !eventState?.timerDuration) {
      setTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const startedAt = (eventState.timerStartedAt as Timestamp).toMillis();
      const durationMs = eventState.timerDuration * 1000;
      const remaining = Math.max(0, Math.floor((durationMs - (now - startedAt)) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 250);
    return () => clearInterval(interval);
  }, [eventState?.timerStartedAt, eventState?.timerDuration]);

  const activeTeamIndex = teams.findIndex(t => t.id === eventState?.activeTeamId);
  const activeTeam = activeTeamIndex >= 0 ? teams[activeTeamIndex] : null;
  const votingOpen = eventState?.votingOpen || false;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === "pitch-admin" || passwordInput.trim() === "admin123") {
      setIsAdmin(true);
    } else {
      setPasswordInput("");
    }
  };

  const toggleVoting = async () => {
    if (!eventState) return;
    await updateEventState({ votingOpen: !votingOpen });
  };

  const nextTeam = async () => {
    if (activeTeamIndex < teams.length - 1) {
      await updateEventState({ activeTeamId: teams[activeTeamIndex + 1].id, votingOpen: false });
    }
  };

  const prevTeam = async () => {
    if (activeTeamIndex > 0) {
      await updateEventState({ activeTeamId: teams[activeTeamIndex - 1].id, votingOpen: false });
    }
  };

  const startTimer = async () => {
    const total = timerMinutes * 60 + timerSeconds;
    await updateEventState({ timerDuration: total, timerStartedAt: serverTimestamp() });
    setShowTimerSetup(false);
  };

  const stopTimer = async () => {
    await updateEventState({ timerStartedAt: null });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20" />
        <form
          onSubmit={handleLogin}
          className="relative z-10 glass-panel p-10 w-full max-w-md flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-white">Game Controller</h1>
            <p className="text-neutral-400 mt-2">iPad Admin Access</p>
          </div>
          <input
            type="password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            placeholder="Admin Password"
            className="w-full px-5 py-5 text-xl rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 text-center font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-5 rounded-2xl text-xl transition-all shadow-lg shadow-blue-600/20"
          >
            Enter Game
          </button>
        </form>
      </div>
    );
  }

  const timerActive = timeLeft !== null && timeLeft > 0;
  const timerCritical = timerActive && timeLeft !== null && timeLeft <= 10;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col select-none overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-black to-purple-950/30 pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-lg text-neutral-300 truncate max-w-[200px] md:max-w-none">
            {eventState?.eventName || "Game Controller"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500 font-mono">
            {activeTeam ? `${activeTeamIndex + 1} / ${teams.length}` : `0 / ${teams.length}`}
          </span>
          <button
            onClick={() => setIsAdmin(false)}
            className="p-2.5 hover:bg-white/10 active:bg-white/20 rounded-xl transition-colors text-neutral-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-4 gap-6">

        {/* Team name */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTeam?.id || "none"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <p className="text-neutral-500 uppercase tracking-[0.3em] text-sm font-bold mb-2">Now on Stage</p>
            <h1 className="text-5xl md:text-7xl font-black leading-tight">
              {activeTeam?.name || "No Team"}
            </h1>
          </motion.div>
        </AnimatePresence>

        {/* Stats */}
        <div className="flex gap-6">
          <div className="glass-panel px-8 py-4 text-center">
            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Votes</p>
            <p className="text-4xl font-black">{activeTeam?.totalVotes || 0}</p>
          </div>
          <div className="glass-panel px-8 py-4 text-center">
            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Score</p>
            <p className="text-4xl font-black text-yellow-400">{activeTeam?.totalScore || 0}</p>
          </div>
          <div className="glass-panel px-8 py-4 text-center">
            <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Avg</p>
            <p className="text-4xl font-black text-blue-400">
              {activeTeam?.totalVotes ? (activeTeam.totalScore / activeTeam.totalVotes).toFixed(1) : "—"}
            </p>
          </div>
        </div>

        {/* Voting toggle — main CTA */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={toggleVoting}
          className={`
            w-full max-w-sm py-7 rounded-3xl text-2xl font-black flex items-center justify-center gap-3
            transition-all shadow-2xl
            ${votingOpen
              ? "bg-red-600 hover:bg-red-500 shadow-red-600/30"
              : "bg-green-500 hover:bg-green-400 text-black shadow-green-500/30"
            }
          `}
        >
          {votingOpen
            ? <><Square className="w-7 h-7 fill-current" /> Close Voting</>
            : <><Play className="w-7 h-7 fill-current" /> Open Voting</>
          }
        </motion.button>

        {/* Voting status badge */}
        <AnimatePresence>
          {votingOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 text-green-400 font-bold"
            >
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
              VOTING IS OPEN
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer */}
        <div className={`
          glass-panel w-full max-w-sm p-5 rounded-2xl border transition-colors duration-500
          ${timerCritical ? "border-red-500 bg-red-500/10" : "border-white/10"}
        `}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-neutral-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-widest">Timer</span>
            </div>
            {timerActive && (
              <span className="text-xs font-bold text-blue-400 animate-pulse">LIVE ON DISPLAY</span>
            )}
          </div>

          {/* Countdown display */}
          <AnimatePresence mode="wait">
            {timerActive ? (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-center text-7xl font-black font-mono mb-4 ${timerCritical ? "text-red-400 animate-pulse" : "text-white"}`}
              >
                {formatTime(timeLeft!)}
              </motion.div>
            ) : showTimerSetup ? (
              <motion.div
                key="setup"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-3 mb-4"
              >
                <div className="flex flex-col items-center gap-1">
                  <label className="text-[10px] text-neutral-500 uppercase font-bold">Min</label>
                  <input
                    type="number"
                    value={timerMinutes}
                    onChange={e => setTimerMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 h-16 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <span className="text-3xl font-bold text-neutral-600 mt-4">:</span>
                <div className="flex flex-col items-center gap-1">
                  <label className="text-[10px] text-neutral-500 uppercase font-bold">Sec</label>
                  <input
                    type="number"
                    value={timerSeconds}
                    onChange={e => setTimerSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-20 h-16 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-neutral-600 text-sm mb-4 py-4"
              >
                Timer stopped
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick presets */}
          {showTimerSetup && (
            <div className="flex gap-2 justify-center mb-4">
              {[1, 2, 3, 5, 10].map(m => (
                <button
                  key={m}
                  onClick={() => { setTimerMinutes(m); setTimerSeconds(0); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border ${timerMinutes === m && timerSeconds === 0 ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10"}`}
                >
                  {m}m
                </button>
              ))}
            </div>
          )}

          {/* Timer buttons */}
          <div className="flex gap-3">
            {timerActive ? (
              <button
                onClick={stopTimer}
                className="flex-1 py-4 bg-red-600 hover:bg-red-500 active:scale-95 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Stop
              </button>
            ) : showTimerSetup ? (
              <>
                <button
                  onClick={() => setShowTimerSetup(false)}
                  className="px-4 py-4 bg-white/5 hover:bg-white/10 active:scale-95 rounded-xl font-bold transition-all text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  onClick={startTimer}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" /> Start
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowTimerSetup(true)}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 active:scale-95 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-neutral-300"
              >
                <Clock className="w-4 h-4" /> Set Timer
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Bottom navigation */}
      <footer className="relative z-10 border-t border-white/10 p-4 safe-area-inset-bottom">
        <div className="flex gap-4 max-w-sm mx-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={prevTeam}
            disabled={!activeTeam || activeTeamIndex <= 0}
            className="flex-1 py-5 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-6 h-6" /> Prev
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={nextTeam}
            disabled={!activeTeam || activeTeamIndex >= teams.length - 1}
            className="flex-1 py-5 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>
      </footer>
    </div>
  );
}
