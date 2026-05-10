import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, increment, serverTimestamp, getDocs, runTransaction } from "firebase/firestore";

export interface EventState {
  activeTeamId: string;
  votingOpen: boolean;
  currentRound: number;
}

export interface Team {
  id: string;
  name: string;
  order: number;
  averageScore: number;
  totalScore: number;
  totalVotes: number;
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
