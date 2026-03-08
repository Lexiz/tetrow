import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Owner } from '../../shared/types';
import type { PlayerStats } from '../../shared/game/engine';

// ── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  displayName: string;
  photoURL: string | null;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
}

/** Get or create a user profile */
export async function getOrCreateProfile(userId: string, displayName: string, photoURL: string | null): Promise<UserProfile> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    // Update display name and photo if changed
    const data = snap.data() as UserProfile;
    if (data.displayName !== displayName || data.photoURL !== photoURL) {
      await setDoc(ref, { displayName, photoURL }, { merge: true });
    }
    return { ...data, displayName, photoURL };
  }

  const profile: UserProfile = {
    displayName,
    photoURL,
    elo: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    gamesPlayed: 0,
  };
  await setDoc(ref, profile);
  return profile;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ── Match History ────────────────────────────────────────────────────────────

export interface MatchRecord {
  id?: string;
  p1Id: string;
  p1Name: string;
  p2Id: string;
  p2Name: string;
  p1Score: number;
  p2Score: number;
  winner: Owner | null;
  p1EloChange: number;
  p2EloChange: number;
  timestamp: any; // Firestore Timestamp
}

/** Calculate ELO change */
function calcEloChange(myElo: number, oppElo: number, result: number, gamesPlayed: number): number {
  const K = gamesPlayed < 30 ? 32 : 16;
  const expected = 1 / (1 + Math.pow(10, (oppElo - myElo) / 400));
  return Math.round(K * (result - expected));
}

/** Save match result — updates both player profiles and creates a match record */
export async function saveMatchResult(
  p1Id: string,
  p1Name: string,
  p2Id: string,
  p2Name: string,
  p1Score: number,
  p2Score: number,
  winner: Owner | null,
): Promise<{ p1EloChange: number; p2EloChange: number }> {
  // Get both profiles
  const p1Profile = await getUserProfile(p1Id);
  const p2Profile = await getUserProfile(p2Id);

  const p1Elo = p1Profile?.elo ?? 1200;
  const p2Elo = p2Profile?.elo ?? 1200;
  const p1Games = p1Profile?.gamesPlayed ?? 0;
  const p2Games = p2Profile?.gamesPlayed ?? 0;

  // Calculate ELO changes
  const p1Result = winner === 1 ? 1 : winner === 2 ? 0 : 0.5;
  const p2Result = winner === 2 ? 1 : winner === 1 ? 0 : 0.5;
  const p1EloChange = calcEloChange(p1Elo, p2Elo, p1Result, p1Games);
  const p2EloChange = calcEloChange(p2Elo, p1Elo, p2Result, p2Games);

  // Update player profiles
  const p1Update: Partial<UserProfile> = {
    elo: p1Elo + p1EloChange,
    gamesPlayed: p1Games + 1,
    wins: (p1Profile?.wins ?? 0) + (winner === 1 ? 1 : 0),
    losses: (p1Profile?.losses ?? 0) + (winner === 2 ? 1 : 0),
    draws: (p1Profile?.draws ?? 0) + (winner === null ? 1 : 0),
  };
  const p2Update: Partial<UserProfile> = {
    elo: p2Elo + p2EloChange,
    gamesPlayed: p2Games + 1,
    wins: (p2Profile?.wins ?? 0) + (winner === 2 ? 1 : 0),
    losses: (p2Profile?.losses ?? 0) + (winner === 1 ? 1 : 0),
    draws: (p2Profile?.draws ?? 0) + (winner === null ? 1 : 0),
  };

  await setDoc(doc(db, 'users', p1Id), p1Update, { merge: true });
  await setDoc(doc(db, 'users', p2Id), p2Update, { merge: true });

  // Create match record
  const match: Omit<MatchRecord, 'id'> = {
    p1Id, p1Name, p2Id, p2Name,
    p1Score, p2Score, winner,
    p1EloChange, p2EloChange,
    timestamp: serverTimestamp(),
  };
  await addDoc(collection(db, 'matches'), match);

  return { p1EloChange, p2EloChange };
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard(max = 10): Promise<(UserProfile & { id: string })[]> {
  const q = query(
    collection(db, 'users'),
    where('gamesPlayed', '>', 0),
    orderBy('elo', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as UserProfile) }));
}

// ── Match History for a User ─────────────────────────────────────────────────

export async function getMatchHistory(userId: string, max = 10): Promise<MatchRecord[]> {
  // Query matches where user was P1
  const q1 = query(
    collection(db, 'matches'),
    where('p1Id', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(max),
  );
  // Query matches where user was P2
  const q2 = query(
    collection(db, 'matches'),
    where('p2Id', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(max),
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const matches: MatchRecord[] = [
    ...snap1.docs.map(d => ({ id: d.id, ...(d.data() as MatchRecord) })),
    ...snap2.docs.map(d => ({ id: d.id, ...(d.data() as MatchRecord) })),
  ];

  // Sort by timestamp descending and take top N
  matches.sort((a, b) => {
    const ta = a.timestamp?.seconds ?? 0;
    const tb = b.timestamp?.seconds ?? 0;
    return tb - ta;
  });

  return matches.slice(0, max);
}
