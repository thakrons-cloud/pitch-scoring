import { db } from "./firebase";
import { collection, doc, getDoc, setDoc, getDocs, updateDoc, addDoc, serverTimestamp, writeBatch, runTransaction, Timestamp } from "firebase/firestore";

export interface EventState {
  activeTeamId: string;
  votingOpen: boolean;
  currentRound: number;
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

export interface Ticket {
  code: string;
  used: boolean;
  usedBySessionId: string | null;
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
      lastResetAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create some initial teams if they don't exist
    const teamsCollection = collection(db, "teams");
    const teamsSnap = await getDocs(teamsCollection);
    
    if (teamsSnap.empty) {
      const initialTeams = [
        { id: "t1", name: "Startup Alpha", order: 1, averageScore: 0, totalVotes: 0 },
        { id: "t2", name: "Beta Innovations", order: 2, averageScore: 0, totalVotes: 0 },
        { id: "t3", name: "Gamma Tech", order: 3, averageScore: 0, totalVotes: 0 },
      ];

      for (const team of initialTeams) {
        await setDoc(doc(db, "teams", team.id), team);
      }
    }
  }
};

export const submitVote = async (teamId: string, sessionId: string, score: number) => {
  if (score < 0 || score > 5) throw new Error("Invalid score");

  // Record the vote
  await addDoc(collection(db, "votes"), {
    teamId,
    sessionId,
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

export const resetEvent = async () => {
  const batch = writeBatch(db);
  
  // 1. Reset all teams scores
  const teamsSnap = await getDocs(collection(db, "teams"));
  teamsSnap.forEach((teamDoc) => {
    batch.update(teamDoc.ref, {
      averageScore: 0,
      totalScore: 0,
      totalVotes: 0
    });
  });

  // 2. Delete all tickets
  const ticketsSnap = await getDocs(collection(db, "tickets"));
  ticketsSnap.forEach((ticketDoc) => {
    batch.delete(ticketDoc.ref);
  });

  // 3. Delete all votes logs
  const votesSnap = await getDocs(collection(db, "votes"));
  votesSnap.forEach((voteDoc) => {
    batch.delete(voteDoc.ref);
  });

  // 4. Reset event state
  const eventRef = doc(db, "eventState", "current");
  batch.update(eventRef, {
    votingOpen: false,
    lastResetAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await batch.commit();
};

// Generate random 4-char alphanumeric tickets
export const generateTickets = async (count: number) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking chars (I, 1, O, 0)
  const batch = writeBatch(db);
  const ticketsRef = collection(db, "tickets");

  for (let i = 0; i < count; i++) {
    let code = "";
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newDoc = doc(ticketsRef, code);
    batch.set(newDoc, {
      code,
      used: false,
      usedBySessionId: null,
      createdAt: serverTimestamp()
    });
  }

  await batch.commit();
};

export const validateTicket = async (code: string, sessionId: string): Promise<boolean> => {
  const ticketRef = doc(db, "tickets", code.toUpperCase());
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const ticketSnap = await transaction.get(ticketRef);
      if (!ticketSnap.exists()) {
        throw new Error("Invalid ticket code");
      }
      
      const data = ticketSnap.data() as Ticket;
      
      // If ticket is already used by this exact session, that's fine (re-validation)
      if (data.used && data.usedBySessionId === sessionId) {
        return true;
      }
      
      // If ticket is used by someone else
      if (data.used) {
        throw new Error("Ticket code already used");
      }

      // Claim the ticket
      transaction.update(ticketRef, {
        used: true,
        usedBySessionId: sessionId
      });
      
      return true;
    });
    
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error claiming ticket";
    throw new Error(message);
  }
};
