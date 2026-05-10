"use client";

import { useEffect, useState } from "react";
import { Users, Activity, Play, Square, ChevronRight, ChevronLeft, Settings, Plus, Printer, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useEventState, useTeams, useTickets } from "@/hooks/useFirebaseData";
import { initializeEvent, updateEventState, addTeam, resetEvent, generateTickets } from "@/lib/firebaseUtils";
import Link from "next/link";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [isGeneratingTickets, setIsGeneratingTickets] = useState(false);
  const [generateCount, setGenerateCount] = useState(50);
  
  const { eventState, loading: eventLoading } = useEventState();
  const { teams, loading: teamsLoading } = useTeams();
  const { tickets, loading: ticketsLoading } = useTickets();

  // Handle DB init
  useEffect(() => {
    if (isAuthenticated) {
      initializeEvent();
    }
  }, [isAuthenticated]);

  const activeTeamIndex = teams.findIndex(t => t.id === eventState?.activeTeamId);
  const activeTeam = activeTeamIndex >= 0 ? teams[activeTeamIndex] : null;
  const votingOpen = eventState?.votingOpen || false;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would be verified against an API/env var securely
    if (password === "supersecretpassword123" || password === "admin") {
      setIsAuthenticated(true);
    } else {
      alert("Invalid password");
    }
  };

  const toggleVoting = async () => {
    if (!eventState) return;
    await updateEventState({ votingOpen: !votingOpen });
  };

  const nextTeam = async () => {
    if (activeTeamIndex < teams.length - 1) {
      await updateEventState({ 
        activeTeamId: teams[activeTeamIndex + 1].id,
        votingOpen: false 
      });
    }
  };

  const prevTeam = async () => {
    if (activeTeamIndex > 0) {
      await updateEventState({ 
        activeTeamId: teams[activeTeamIndex - 1].id,
        votingOpen: false 
      });
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    
    setIsAddingTeam(true);
    await addTeam(newTeamName, teams.length);
    setNewTeamName("");
    setIsAddingTeam(false);
  };

  const handleReset = async () => {
    const confirmReset = window.confirm(
      "Are you sure you want to RESET ALL SCORES to zero? This action cannot be undone."
    );
    if (confirmReset) {
      await resetEvent();
      alert("Event has been reset.");
    }
  };

  const handleGenerateTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generateCount < 1 || generateCount > 200) return alert("Please enter a number between 1 and 200");
    
    setIsGeneratingTickets(true);
    await generateTickets(generateCount);
    setIsGeneratingTickets(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6">
        <form onSubmit={handleLogin} className="glass-panel p-8 w-full max-w-sm flex flex-col items-center">
          <Settings className="w-12 h-12 text-blue-500 mb-6" />
          <h1 className="text-2xl font-bold text-white mb-6">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Admin Password"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 mb-4 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">Event Dashboard</h1>
            <p className="text-neutral-400">Manage live pitching competition</p>
          </div>
          <div className="flex items-center gap-4">
            {eventLoading || teamsLoading ? (
              <span className="text-neutral-500">Connecting...</span>
            ) : (
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium">Live Connected</span>
              </div>
            )}
            
            <button 
              onClick={handleReset}
              className="px-4 py-2 bg-red-900/50 hover:bg-red-600 border border-red-500/50 text-white text-sm font-semibold rounded-lg transition-colors ml-4"
            >
              Reset Event
            </button>
          </div>
        </header>

        {(!eventLoading && !teamsLoading && activeTeam) ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Control Panel */}
          <div className="lg:col-span-2 glass-panel p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-neutral-300">Active Team Control</h2>
              <span className="text-sm px-3 py-1 bg-white/10 rounded-full">
                Team {activeTeamIndex + 1} of {teams.length}
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-10">
              <h3 className="text-5xl font-black mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">
                {activeTeam.name}
              </h3>
              <p className="text-xl text-neutral-500 mb-12">Now on stage</p>

              <div className="flex gap-4">
                <button
                  onClick={toggleVoting}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                    votingOpen 
                      ? "bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30" 
                      : "bg-green-500 text-black hover:bg-green-400"
                  }`}
                >
                  {votingOpen ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  {votingOpen ? "Close Voting" : "Open Voting"}
                </button>
              </div>
            </div>

            <div className="flex justify-between mt-auto pt-6 border-t border-white/10">
              <button 
                onClick={prevTeam}
                disabled={activeTeamIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-neutral-400 hover:text-white disabled:opacity-50 disabled:hover:text-neutral-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Previous Team
              </button>
              <button 
                onClick={nextTeam}
                disabled={activeTeamIndex === teams.length - 1}
                className="flex items-center gap-2 px-4 py-2 text-neutral-400 hover:text-white disabled:opacity-50 disabled:hover:text-neutral-400 transition-colors"
              >
                Next Team <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="flex flex-col gap-6">
            <div className="glass-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Live Stats</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-neutral-500 text-sm mb-1">Status</p>
                  <p className={`font-bold text-lg ${votingOpen ? "text-green-400" : "text-neutral-300"}`}>
                    {votingOpen ? "Accepting Votes..." : "Voting Closed"}
                  </p>
                </div>
                
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <div>
                    <p className="text-neutral-500 text-sm mb-1">Votes Received</p>
                    <p className="font-bold text-3xl">{activeTeam.totalVotes || 0}</p>
                  </div>
                  <div className="text-sm text-green-400 flex items-center gap-1">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-2 h-2 bg-green-400 rounded-full" 
                    />
                    Live
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-neutral-500 text-sm mb-1">Total Score</p>
                    <p className="font-bold text-3xl text-yellow-400">
                      {activeTeam.totalScore || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold">Teams Management</h3>
              </div>
              <div className="flex-1 overflow-y-auto mb-4 max-h-[150px] pr-2 space-y-2">
                {teams.map((t, i) => (
                  <div key={t.id} className="flex justify-between items-center text-sm p-2 bg-white/5 rounded-lg">
                    <span>{i + 1}. {t.name}</span>
                    <span className="text-neutral-500">{t.totalVotes} votes</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddTeam} className="mt-auto pt-4 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="New team name..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isAddingTeam || !newTeamName.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white p-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
          
          {/* Tickets Management Panel */}
          <div className="mt-6 glass-panel p-6 md:p-8">
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-300">Tickets Management</h2>
                  <p className="text-sm text-neutral-500">
                    {tickets.length} total tickets / {tickets.filter(t => !t.used).length} unused
                  </p>
                </div>
                <Link
                  href="/admin/print"
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium flex items-center gap-2 border border-white/10"
                >
                  <Printer className="w-4 h-4" /> Print View
                </Link>
              </div>

              <form onSubmit={handleGenerateTickets} className="flex flex-wrap items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-sm text-neutral-400 font-medium">Generate more tickets:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(Number(e.target.value))}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-24 text-center"
                  />
                  <button
                    type="submit"
                    disabled={isGeneratingTickets}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white px-6 py-2 rounded-lg text-sm transition-colors font-bold shadow-lg shadow-blue-900/20"
                  >
                    {isGeneratingTickets ? "Generating..." : "Generate Tickets"}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {tickets.map(ticket => (
                <div 
                  key={ticket.code} 
                  className={`p-2 rounded-lg border text-center font-mono text-sm font-bold truncate
                    ${ticket.used 
                      ? "bg-red-500/10 border-red-500/30 text-red-500/50" 
                      : "bg-green-500/10 border-green-500/30 text-green-400"
                    }`}
                  title={ticket.code}
                >
                  {ticket.code}
                </div>
              ))}
            </div>
          </div>
        </div>
        ) : (
          <div className="flex items-center justify-center p-20">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
