"use client";

import { useEffect, useState } from "react";
import { Users, Activity, Play, Square, ChevronRight, ChevronLeft, Settings, Plus, LogOut, QrCode, Printer, Download, ExternalLink, Edit2, Trash2, Check, X, Clock, RotateCcw } from "lucide-react";
import { serverTimestamp } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEventState, useTeams, useAttendees } from "@/hooks/useFirebaseData";
import { initializeEvent, updateEventState, addTeam, resetEvent, generateAttendeeIds, updateTeamName, deleteTeam } from "@/lib/firebaseUtils";
import { useStore } from "@/store/useStore";

export default function AdminDashboard() {
  const { isAdmin, setIsAdmin } = useStore();
  const [passwordInput, setPasswordInput] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(50);
  const [showQR, setShowQR] = useState(false);
  const [origin, setOrigin] = useState("");
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [isEditingEventName, setIsEditingEventName] = useState(false);
  const [tempEventName, setTempEventName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(3);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    setMounted(true);
    setOrigin(window.location.origin);
  }, []);
  
  const { eventState, loading: eventLoading } = useEventState();
  const { teams, loading: teamsLoading } = useTeams();
  const { attendees, loading: attendeesLoading } = useAttendees();

  // Handle DB init
  useEffect(() => {
    if (isAdmin) {
      initializeEvent();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (eventState?.eventName) {
      setTempEventName(eventState.eventName);
    }
  }, [eventState?.eventName]);

  const activeTeamIndex = teams.findIndex(t => t.id === eventState?.activeTeamId);
  const activeTeam = activeTeamIndex >= 0 ? teams[activeTeamIndex] : null;
  const votingOpen = eventState?.votingOpen || false;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const input = passwordInput.trim();
    // Default admin password
    if (input === "pitch-admin" || input === "admin123") {
      setIsAdmin(true);
    } else {
      alert("Invalid admin password. Please try again.");
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
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
      "Are you sure you want to RESET EVERYTHING? All votes, attendees, and scores will be deleted."
    );
    if (confirmReset) {
      await resetEvent();
      alert("Event has been reset.");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generateCount < 1 || generateCount > 500) return;
    
    setIsGenerating(true);
    await generateAttendeeIds(generateCount);
    setIsGenerating(false);
  };

  const handleStartEdit = (teamId: string, currentName: string) => {
    setEditingTeamId(teamId);
    setEditingName(currentName);
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setEditingName("");
  };

  const handleUpdateTeam = async (teamId: string) => {
    if (!editingName.trim()) return;
    setIsUpdatingTeam(true);
    await updateTeamName(teamId, editingName.trim());
    setEditingTeamId(null);
    setIsUpdatingTeam(false);
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete team "${teamName}"? This cannot be undone.`);
    if (confirmDelete) {
      await deleteTeam(teamId);
    }
  };

  const handleUpdateEventName = async () => {
    if (!tempEventName.trim()) return;
    await updateEventState({ eventName: tempEventName.trim() });
    setIsEditingEventName(false);
  };

  const handleStartTimer = async () => {
    const totalSeconds = (timerMinutes * 60) + timerSeconds;
    await updateEventState({ 
      timerDuration: totalSeconds,
      timerStartedAt: serverTimestamp()
    });
  };

  const handleStopTimer = async () => {
    await updateEventState({ 
      timerStartedAt: null 
    });
  };

  const handleSetTimerTemplate = (mins: number) => {
    setTimerMinutes(mins);
    setTimerSeconds(0);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <form onSubmit={handleLogin} className="glass-panel p-10 w-full max-w-sm flex flex-col items-center relative z-10">
          <div className="w-16 h-16 bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
            <Settings className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Admin Panel</h1>
          <p className="text-neutral-500 text-sm mb-8 text-center">Authorized access only</p>
          
          <div className="w-full space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter Admin Password"
              className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-all text-center font-mono"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              Access Dashboard
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            {isEditingEventName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempEventName}
                  onChange={(e) => setTempEventName(e.target.value)}
                  className="bg-white/5 border border-blue-500/50 rounded-lg px-3 py-1 text-2xl font-bold focus:outline-none"
                  autoFocus
                />
                <button onClick={handleUpdateEventName} className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => setIsEditingEventName(false)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-3xl font-bold">{eventState?.eventName || "Admin Panel"}</h1>
                <button 
                  onClick={() => setIsEditingEventName(true)}
                  className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-neutral-400">Manage competition and attendees</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowQR(!showQR)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" /> {showQR ? "Hide QR" : "Show QR Code"}
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
            <button 
              onClick={handleReset}
              className="px-4 py-2 bg-red-900/50 hover:bg-red-600 border border-red-500/50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Reset Event
            </button>
          </div>
        </header>

        {showQR && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-panel p-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-blue-600/5 border-blue-500/20"
          >
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Join Event</h2>
              <p className="text-neutral-400 mb-6 max-w-md">
                Attendees can scan this QR code to join the voting system. They will need an Attendee ID to participate.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg font-mono text-sm flex items-center gap-3">
                  <span className="text-neutral-500">{origin}/vote</span>
                  <a href={`${origin}/vote`} target="_blank" className="text-blue-400 hover:text-blue-300">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-[0_0_50px_rgba(37,99,235,0.2)]">
              <QRCodeCanvas 
                id="event-qr"
                value={`${origin}/vote`} 
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
          </motion.div>
        )}

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
              <h3 className="text-5xl font-black mb-2 text-center">
                {activeTeam.name}
              </h3>
              <p className="text-xl text-neutral-500 mb-12 uppercase tracking-widest">Now on stage</p>

              <div className="flex gap-4">
                <button
                  onClick={toggleVoting}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                    votingOpen 
                      ? "bg-red-500/20 text-red-500 border border-red-500/50" 
                      : "bg-green-500 text-black hover:bg-green-400"
                  }`}
                >
                  {votingOpen ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  {votingOpen ? "Close Voting" : "Open Voting"}
                </button>
              </div>
            </div>

            {/* Timer Management */}
            <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-lg">Pitch Timer</h3>
                </div>
                {eventState?.timerStartedAt && (
                  <span className="flex items-center gap-1.5 text-xs text-green-400 font-bold px-2 py-1 bg-green-500/10 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> LIVE ON LEADERBOARD
                  </span>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row items-end gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold px-1">Mins</label>
                    <input 
                      type="number" 
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-xl font-bold focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <span className="text-2xl font-bold text-neutral-600">:</span>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold px-1">Secs</label>
                    <input 
                      type="number" 
                      value={timerSeconds}
                      onChange={(e) => setTimerSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-xl font-bold focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 flex-1">
                  {[1, 3, 5, 10].map(m => (
                    <button 
                      key={m} 
                      onClick={() => handleSetTimerTemplate(m)}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-semibold transition-colors"
                    >
                      {m}m
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  {eventState?.timerStartedAt ? (
                    <button 
                      onClick={handleStopTimer}
                      className="flex-1 md:flex-none px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset Timer
                    </button>
                  ) : (
                    <button 
                      onClick={handleStartTimer}
                      className="flex-1 md:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Play className="w-4 h-4 fill-current" /> Start Timer
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-auto pt-6 border-t border-white/10">
              <button onClick={prevTeam} disabled={activeTeamIndex === 0} className="flex items-center gap-2 text-neutral-400 disabled:opacity-30"><ChevronLeft /> Prev</button>
              <button onClick={nextTeam} disabled={activeTeamIndex === teams.length - 1} className="flex items-center gap-2 text-neutral-400 disabled:opacity-30">Next <ChevronRight /></button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="glass-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Live Stats</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-neutral-500 text-sm">Status</p>
                  <p className="font-bold">{votingOpen ? "VOTING OPEN" : "VOTING CLOSED"}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-neutral-500 text-sm">Votes</p>
                    <p className="text-2xl font-bold">{activeTeam.totalVotes || 0}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 text-sm">Score</p>
                    <p className="text-2xl font-bold text-yellow-500">{activeTeam.totalScore || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold">Attendee IDs</h3>
                </div>
                <Link
                  href="/admin/print"
                  className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3 h-3" /> Print
                </Link>
              </div>
              <form onSubmit={handleGenerate} className="mb-4 flex gap-2">
                <input
                  type="number"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm"
                />
                <button type="submit" disabled={isGenerating} className="bg-blue-600 px-3 py-1 rounded-lg text-sm flex-1">
                  {isGenerating ? "..." : "Generate IDs"}
                </button>
              </form>
              <div className="max-h-[200px] overflow-y-auto space-y-1 font-mono text-xs">
                {attendees.map(a => (
                  <div key={a.id} className="p-1 bg-white/5 rounded px-2">{a.id}</div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-3 glass-panel p-6">
            <h3 className="text-lg font-semibold mb-4">Manage Teams</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {teams.map(t => (
                <div key={t.id} className="p-4 bg-white/5 rounded-xl border border-white/10 group">
                  {editingTeamId === t.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 bg-black/40 border border-blue-500/50 rounded px-2 py-1 text-sm focus:outline-none"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleUpdateTeam(t.id)}
                        disabled={isUpdatingTeam}
                        className="p-1 hover:bg-green-500/20 text-green-500 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        className="p-1 hover:bg-red-500/20 text-red-500 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{t.name}</p>
                        <p className="text-xs text-neutral-500">Order: {t.order}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleStartEdit(t.id, t.name)}
                          className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded"
                          title="Edit Name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTeam(t.id, t.name)}
                          className="p-1.5 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded"
                          title="Delete Team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleAddTeam} className="flex gap-2">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team Name"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
              <button type="submit" disabled={isAddingTeam} className="bg-blue-600 px-6 py-2 rounded-lg font-bold">Add Team</button>
            </form>
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
