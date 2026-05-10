import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EventState, Team, Ticket } from "@/lib/firebaseUtils";

export function useEventState() {
  const [eventState, setEventState] = useState<EventState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "eventState", "current"), (doc) => {
      if (doc.exists()) {
        setEventState(doc.data() as EventState);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { eventState, loading };
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "teams"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamsData: Team[] = [];
      snapshot.forEach((doc) => {
        teamsData.push({ id: doc.id, ...doc.data() } as Team);
      });
      setTeams(teamsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { teams, loading };
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => doc.data() as Ticket);
      setTickets(ticketsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { tickets, loading };
}
