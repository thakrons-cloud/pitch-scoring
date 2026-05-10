"use client";

import { motion } from "framer-motion";
import { ArrowRight, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = () => {
    setIsLoading(true);
    // In the future: handle Firebase Anonymous Auth here
    setTimeout(() => {
      router.push("/vote");
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-gradient-to-br from-neutral-900 to-black">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 flex flex-col items-center max-w-md w-full glass-panel p-8 sm:p-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30"
        >
          <Trophy className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400 mb-4">
          Live Pitching
        </h1>
        
        <p className="text-neutral-400 mb-10 text-sm sm:text-base leading-relaxed">
          Welcome to the realtime scoring system. Join now to cast your vote for the active startup on stage.
        </p>

        <button
          onClick={handleJoin}
          disabled={isLoading}
          className="w-full relative group overflow-hidden rounded-xl bg-white text-black font-semibold text-lg py-4 px-6 transition-all active:scale-95 disabled:opacity-80"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-center gap-2">
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
              />
            ) : (
              <>
                <span>Join Voting Session</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </div>
        </button>
      </motion.div>
      
      <div className="absolute bottom-6 text-neutral-600 text-xs font-medium tracking-wider uppercase">
        Live Audience System
      </div>
    </div>
  );
}
