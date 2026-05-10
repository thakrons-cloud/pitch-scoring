"use client";

import { useAttendees } from "@/hooks/useFirebaseData";
import { Printer, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function PrintAttendeesPage() {
  const { attendees, loading } = useAttendees();

  if (loading) {
    return <div className="p-10 text-center">Loading IDs...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black p-8">
      {/* Controls - Hidden during print */}
      <div className="print:hidden mb-8 flex justify-between items-center bg-neutral-100 p-4 rounded-xl">
        <Link 
          href="/admin" 
          className="flex items-center gap-2 text-neutral-600 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-6">
          <p className="text-sm font-medium">
            <span className="text-blue-600 font-bold">{attendees.length}</span> Attendee IDs ready to print
          </p>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <Printer className="w-5 h-5" /> Print Now
          </button>
        </div>
      </div>

      {/* Printable Grid */}
      <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-0 border-t border-l border-black">
        {attendees.map((attendee) => (
          <div 
            key={attendee.id} 
            className="aspect-square border-r border-b border-black flex flex-col items-center justify-center p-4 text-center"
          >
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Attendee ID</p>
            <h3 className="text-2xl font-mono font-black tracking-wider">{attendee.id}</h3>
            <p className="text-[8px] mt-2 text-neutral-300">pitch-scoring-2026</p>
          </div>
        ))}
      </div>

      {attendees.length === 0 && (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-neutral-400">No IDs found.</h2>
          <p className="text-neutral-500">Generate IDs in the admin dashboard first.</p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
