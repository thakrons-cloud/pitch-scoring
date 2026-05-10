"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CheckCircle, Lock } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useEventState, useTeams } from "@/hooks/useFirebaseData";
import { submitVote } from "@/lib/firebaseUtils";
import { v4 as uuidv4 } from "uuid";

export default function VotePage() {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sessionId, setSessionId } = useStore();
  
  const { eventState, loading: eventLoading } = useEventState();
  const { teams, loading: teamsLoading } = useTeams();

  const activeTeamIndex = teams.findIndex(t => t.id === eventState?.activeTeamId);
  const activeTeam = activeTeamIndex >= 0 ? teams[activeTeamIndex] : null;

  // Initialize session
  useEffect(() => {
    if (!sessionId) {
      setSessionId(uuidv4());
    }
  }, [sessionId, setSessionId]);

  // Handle vote submission
  const handleSubmit = async () => {
    if (rating === 0 || !activeTeam || !sessionId) return;
    setIsSubmitting(true);

    try {
      await submitVote(activeTeam.id, sessionId, rating);
      setHasVoted(true);
    } catch (err) {
      console.error("Error submitting vote:", err);
      alert("Failed to submit vote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (eventLoading || teamsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // If voting is closed
  if (!eventState?.votingOpen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-md w-full glass-panel p-10"
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
          <p className="text-neutral-400">Rate this pitch from 1 to 5 stars</p>
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
              <div className="flex justify-center gap-3 sm:gap-4 mb-10 w-full" onMouseLeave={() => setHoveredRating(0)}>
                {[1, 2, 3, 4, 5].map((num) => (
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
                disabled={rating === 0 || isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                  ${rating > 0 
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
                You gave {activeTeam?.name} a score of <strong className="text-white text-xl">{rating}</strong>. <br />
                Please wait for the next team.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
