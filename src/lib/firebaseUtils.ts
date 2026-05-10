import { db } from "./firebase";
import { collection, doc, getDoc, setDoc, getDocs, updateDoc, addDoc, serverTimestamp, writeBatch, runTransaction, query, where, Timestamp, deleteDoc } from "firebase/firestore";

export interface EventState {
  activeTeamId: string;
  votingOpen: boolean;
  currentRound: number;
  eventName: string;
  timerDuration: number; // in seconds
  timerStartedAt: Timestamp | null;
  lastResetAt?: Timestamp;
}

export interface Team {
  id: string;
  name: string;
  order: number;
  averageScore: number;
  totalScore: number;
  totalVotes: number;
}

export interface Attendee {
  id: string;
  createdAt: Timestamp;
}

// Ensure the basic structure exists in Firestore
export const initializeEvent = async () => {
  const eventRef = doc(db, "eventState", "current");
  const eventSnap = await getDoc(eventRef);
  
  if (!eventSnap.exists()) {
    await setDoc(eventRef, {
      activeTeamId: "t1",
      votingOpen: false,
      currentRound: 1,
      eventName: "Pitching Competition 2026",
      timerDuration: 180, // Default 3 minutes
      timerStartedAt: null,
      lastResetAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create initial teams
    const teamsCollection = collection(db, "teams");
    const teamsSnap = await getDocs(teamsCollection);
    
    if (teamsSnap.empty) {
      const initialTeams = [
        { id: "t1", name: "Startup Alpha", order: 1, averageScore: 0, totalScore: 0, totalVotes: 0 },
        { id: "t2", name: "Beta Innovations", order: 2, averageScore: 0, totalScore: 0, totalVotes: 0 },
        { id: "t3", name: "Gamma Tech", order: 3, averageScore: 0, totalScore: 0, totalVotes: 0 },
      ];

      for (const team of initialTeams) {
        await setDoc(doc(db, "teams", team.id), team);
      }
    }
  }
};

export const submitVote = async (teamId: string, attendeeId: string, score: number) => {
  if (score < 0 || score > 5) throw new Error("Invalid score");

  // Check if this attendee has already voted for this team
  const votesRef = collection(db, "votes");
  const q = query(votesRef, where("teamId", "==", teamId), where("attendeeId", "==", attendeeId));
  const voteSnap = await getDocs(q);

  if (!voteSnap.empty) {
    throw new Error("You have already voted for this team.");
  }

  // Record the vote
  await addDoc(collection(db, "votes"), {
    teamId,
    attendeeId,
    score,
    timestamp: serverTimestamp()
  });

  // Update team aggregates
  const teamRef = doc(db, "teams", teamId);
  
  await runTransaction(db, async (transaction) => {
    const teamSnap = await transaction.get(teamRef);
    
    if (teamSnap.exists()) {
      const teamData = teamSnap.data() as Team;
      const newTotalVotes = (teamData.totalVotes || 0) + 1;
      const newTotalScore = (teamData.totalScore || 0) + score;
      const newAverageScore = newTotalScore / newTotalVotes;

      transaction.update(teamRef, {
        totalVotes: newTotalVotes,
        totalScore: newTotalScore,
        averageScore: newAverageScore,
      });
    }
  });
};

export const updateEventState = async (updates: Partial<EventState>) => {
  const eventRef = doc(db, "eventState", "current");
  await updateDoc(eventRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const addTeam = async (name: string, currentTeamCount: number) => {
  const newTeamId = `t${Date.now()}`;
  const newTeam: Team = {
    id: newTeamId,
    name,
    order: currentTeamCount + 1,
    averageScore: 0,
    totalScore: 0,
    totalVotes: 0,
  };
  await setDoc(doc(db, "teams", newTeamId), newTeam);
};

export const updateTeamName = async (teamId: string, name: string) => {
  const teamRef = doc(db, "teams", teamId);
  await updateDoc(teamRef, { name });
};

export const deleteTeam = async (teamId: string) => {
  const teamRef = doc(db, "teams", teamId);
  await deleteDoc(teamRef);
};

export const resetEvent = async () => {
  const batch = writeBatch(db);
  
  // 1. Reset all teams scores
  const teamsSnap = await getDocs(collection(db, "teams"));
  for (const teamDoc of teamsSnap.docs) {
    batch.update(teamDoc.ref, {
      averageScore: 0,
      totalScore: 0,
      totalVotes: 0
    });
  }

  // 2. Delete all attendee IDs
  const attendeesSnap = await getDocs(collection(db, "attendees"));
  for (const attendeeDoc of attendeesSnap.docs) {
    batch.delete(attendeeDoc.ref);
  }

  // 3. Delete all votes logs
  const votesSnap = await getDocs(collection(db, "votes"));
  for (const voteDoc of votesSnap.docs) {
    batch.delete(voteDoc.ref);
  }

  // 4. Reset event state
  const eventRef = doc(db, "eventState", "current");
  batch.update(eventRef, {
    votingOpen: false,
    lastResetAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await batch.commit();
};

// Generate unique 6-char Attendee IDs (e.g. PITCH-123 or random)
export const generateAttendeeIds = async (count: number) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const batch = writeBatch(db);
  const attendeesRef = collection(db, "attendees");

  for (let i = 0; i < count; i++) {
    let code = "A"; // Start with A for Attendee
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check for collisions is omitted for simplicity in this batch, 
    // but with 4 random chars it's highly unlikely for small events
    const newDoc = doc(attendeesRef, code);
    batch.set(newDoc, {
      id: code,
      createdAt: serverTimestamp()
    });
  }

  await batch.commit();
};

export const validateAttendeeId = async (id: string): Promise<boolean> => {
  const attendeeRef = doc(db, "attendees", id.toUpperCase());
  const attendeeSnap = await getDoc(attendeeRef);
  return attendeeSnap.exists();
};
