"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Lock, UserCircle2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useEventState, useTeams } from "@/hooks/useFirebaseData";
import { submitVote, validateAttendeeId } from "@/lib/firebaseUtils";

export default function VotePage() {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendeeInput, setAttendeeInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  
  const { attendeeId, setAttendeeId, votedTeamIds, addVotedTeamId, lastResetTime, setLastResetTime, clearState } = useStore();
  
  const { eventState, loading: eventLoading } = useEventState();
  const { teams, loading: teamsLoading } = useTeams();

  const activeTeamIndex = teams.findIndex(t => t.id === eventState?.activeTeamId);
  const activeTeam = activeTeamIndex >= 0 ? teams[activeTeamIndex] : null;

  // Sync event reset
  useEffect(() => {
    if (eventState?.lastResetAt) {
      const resetTime = eventState.lastResetAt.toMillis();
      if (lastResetTime !== null && resetTime > lastResetTime) {
        clearState();
      }
      setLastResetTime(resetTime);
    }
  }, [eventState?.lastResetAt, lastResetTime, clearState, setLastResetTime]);

  const hasVoted = activeTeam ? votedTeamIds.includes(activeTeam.id) : false;

  // Handle vote submission
  const handleSubmit = async () => {
    if (rating === null || !activeTeam || !attendeeId) return;
    setIsSubmitting(true);

    try {
      await submitVote(activeTeam.id, attendeeId, rating);
      addVotedTeamId(activeTeam.id);
      setRating(null); // Reset rating for next team
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit vote.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    if (!attendeeInput.trim()) return;
    
    setIsValidating(true);
    try {
      const isValid = await validateAttendeeId(attendeeInput.trim().toUpperCase());
      if (isValid) {
        setAttendeeId(attendeeInput.trim().toUpperCase());
      } else {
        setLoginError("Invalid Attendee ID. Please check and try again.");
      }
    } catch {
      setLoginError("An error occurred during validation.");
    } finally {
      setIsValidating(false);
    }
  };

  if (eventLoading || teamsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // If no attendee ID is set
  if (!attendeeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-black relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-md w-full glass-panel p-10"
        >
          <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
            <UserCircle2 className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Attendee Login</h2>
          <p className="text-neutral-400 mb-8">
            Please enter your Attendee ID provided at the entrance to participate in the voting.
          </p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <input
              type="text"
              value={attendeeInput}
              onChange={(e) => setAttendeeInput(e.target.value.toUpperCase())}
              placeholder="e.g. A4X9"
              className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl tracking-[0.2em] placeholder:tracking-normal placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors uppercase font-mono"
            />
            {loginError && (
              <p className="text-red-400 text-sm text-center">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={isValidating || !attendeeInput.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center"
            >
              {isValidating ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Enter Voting"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // If voting is closed
  if (!eventState?.votingOpen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-black relative overflow-hidden">
        <div className="absolute top-0 w-full h-[30vh] bg-gradient-to-b from-blue-900/20 to-transparent" />
        <div className="absolute top-4 right-4 bg-white/10 px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-neutral-400 flex items-center gap-2">
          <UserCircle2 className="w-3 h-3" /> {attendeeId}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-md w-full glass-panel p-10 z-10"
        >
          <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-neutral-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Voting Closed</h2>
          <p className="text-neutral-400">
            Please wait for the admin to open voting for the next team.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      <div className="absolute top-0 w-full h-[30vh] bg-gradient-to-b from-blue-900/20 to-transparent" />
      <div className="absolute top-4 right-4 bg-white/10 px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-neutral-400 flex items-center gap-2 z-20">
        <UserCircle2 className="w-3 h-3" /> {attendeeId}
      </div>
      
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-400 text-sm font-semibold tracking-wider uppercase mb-6">
            Team {activeTeam?.order}
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            {activeTeam?.name}
          </h1>
          <p className="text-neutral-400">Rate this pitch from 0 to 5</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!hasVoted ? (
            <motion.div
              key="voting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full glass-panel p-8 flex flex-col items-center"
            >
              <div className="flex justify-center gap-2 sm:gap-3 mb-10 w-full" onMouseLeave={() => setHoveredRating(null)}>
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <motion.button
                    key={num}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => setHoveredRating(num)}
                    onClick={() => setRating(num)}
                    className={`relative w-14 h-16 sm:w-16 sm:h-20 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all duration-200 border-2 ${
                      rating === num
                        ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                        : hoveredRating === num
                        ? "bg-white/10 border-blue-400/50 text-white"
                        : "bg-white/5 border-white/10 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {num}
                  </motion.button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={rating === null || isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                  ${rating !== null 
                    ? "bg-white text-black hover:bg-neutral-200 active:scale-95" 
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  }
                `}
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full"
                  />
                ) : (
                  "Submit Score"
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full glass-panel p-10 flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle className="w-12 h-12 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Score Submitted!</h2>
              <p className="text-neutral-400">
                You have successfully cast your vote for {activeTeam?.name}. <br />
                Please wait for the next team.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
