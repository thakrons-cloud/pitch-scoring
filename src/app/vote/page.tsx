"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Lock, LogIn } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useEventState, useTeams } from "@/hooks/useFirebaseData";
import { submitVote, signInWithGoogle } from "@/lib/firebaseUtils";

export default function VotePage() {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  
  const { user, setUser, votedTeamIds, addVotedTeamId, lastResetTime, setLastResetTime, clearState } = useStore();
  
  const { eventState, loading: eventLoading } = useEventState();
  const { teams, loading: teamsLoading } = useTeams();

  const activeTeamIndex = teams.findIndex(t => t.id === eventState?.activeTeamId);
  const activeTeam = activeTeamIndex >= 0 ? teams[activeTeamIndex] : null;

  const sessionId = user?.uid;

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
    if (rating === null || !activeTeam || !sessionId) return;
    setIsSubmitting(true);

    try {
      await submitVote(activeTeam.id, sessionId, rating);
      addVotedTeamId(activeTeam.id);
      setRating(null); // Reset rating for next team
    } catch (err) {
      console.error("Error submitting vote:", err);
      alert("Failed to submit vote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsValidating(true);
    try {
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        setUser({
          uid: loggedInUser.uid,
          email: loggedInUser.email,
          displayName: loggedInUser.displayName
        });
      }
    } catch (err) {
      setTicketError("Failed to sign in with Google. Please try again.");
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

  // If no user is logged in
  if (!user) {
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
            <LogIn className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Join Voting</h2>
          <p className="text-neutral-400 mb-8">
            Please sign in with your Google account to participate in the pitching competition.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={isValidating}
            className="w-full bg-white hover:bg-neutral-200 text-black font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            {isValidating ? (
              <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </>
            )}
          </button>
          {ticketError && (
            <p className="text-red-400 text-sm mt-4 text-center">{ticketError}</p>
          )}
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
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> {user.email}
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
      {/* Background decoration */}
      <div className="absolute top-0 w-full h-[30vh] bg-gradient-to-b from-blue-900/20 to-transparent" />
      <div className="absolute top-4 right-4 bg-white/10 px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-neutral-400 flex items-center gap-2 z-20">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> {user.email}
      </div>
      
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Header / Team Info */}
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

        {/* Voting Card */}
        <AnimatePresence mode="wait">
          {!hasVoted ? (
            <motion.div
              key="voting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full glass-panel p-8 flex flex-col items-center"
            >
              {/* Number Score Buttons */}
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

              {/* Submit Button */}
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
