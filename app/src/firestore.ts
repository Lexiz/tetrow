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
  durationMs?: number;
  p1Stats?: PlayerStats;
  p2Stats?: PlayerStats;
  timestamp: any; // Firestore Timestamp
}

/** Calculate ELO change */
export function calcEloChange(myElo: number, oppElo: number, result: number, gamesPlayed: number): number {
  const K = gamesPlayed < 30 ? 32 : 16;
  const expected = 1 / (1 + Math.pow(10, (oppElo - myElo) / 400));
  return Math.round(K * (result - expected));
}

/**
 * Save match result for the current user only.
 * Each client calls this independently — updates only their own profile
 * and creates a match record (deduped by matchId if provided).
 */
export async function saveMyMatchResult(
  myId: string,
  myName: string,
  myPhotoURL: string | null,
  myPlayerNum: Owner,
  oppId: string,
  oppName: string,
  oppElo: number,
  p1Score: number,
  p2Score: number,
  winner: Owner | null,
  matchId?: string,
  durationMs?: number,
  stats?: [PlayerStats, PlayerStats],
): Promise<void> {
  // Get my current profile
  const myProfile = await getUserProfile(myId);
  const myElo = myProfile?.elo ?? 1200;
  const myGames = myProfile?.gamesPlayed ?? 0;

  // Calculate ELO change
  const iWon = winner === myPlayerNum;
  const iLost = winner !== null && winner !== myPlayerNum;
  const myResult = iWon ? 1 : iLost ? 0 : 0.5;
  const myEloChange = calcEloChange(myElo, oppElo, myResult, myGames);

  // Update my own profile
  const myUpdate: Partial<UserProfile> = {
    displayName: myName,
    photoURL: myPhotoURL,
    elo: myElo + myEloChange,
    gamesPlayed: myGames + 1,
    wins: (myProfile?.wins ?? 0) + (iWon ? 1 : 0),
    losses: (myProfile?.losses ?? 0) + (iLost ? 1 : 0),
    draws: (myProfile?.draws ?? 0) + (winner === null ? 1 : 0),
  };
  await setDoc(doc(db, 'users', myId), myUpdate, { merge: true });

  // Calculate opponent ELO change for the match record
  const oppResult = iWon ? 0 : iLost ? 1 : 0.5;
  const oppEloChange = calcEloChange(oppElo, myElo, oppResult, 0);

  // Create match record (both clients may write — Firestore handles it)
  const p1Id = myPlayerNum === 1 ? myId : oppId;
  const p1Name_ = myPlayerNum === 1 ? myName : oppName;
  const p2Id = myPlayerNum === 2 ? myId : oppId;
  const p2Name_ = myPlayerNum === 2 ? myName : oppName;
  const p1EloChange = myPlayerNum === 1 ? myEloChange : oppEloChange;
  const p2EloChange = myPlayerNum === 2 ? myEloChange : oppEloChange;

  const match: Omit<MatchRecord, 'id'> = {
    p1Id,
    p1Name: p1Name_,
    p2Id,
    p2Name: p2Name_,
    p1Score,
    p2Score,
    winner,
    p1EloChange,
    p2EloChange,
    ...(durationMs !== undefined ? { durationMs } : {}),
    ...(stats ? { p1Stats: stats[0], p2Stats: stats[1] } : {}),
    timestamp: serverTimestamp(),
  };
  if (matchId) {
    // Use deterministic ID so both clients write the same document (no duplicates)
    await setDoc(doc(db, 'matches', matchId), match, { merge: true });
  } else {
    await addDoc(collection(db, 'matches'), match);
  }
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
  const q1 = query(
    collection(db, 'matches'),
    where('p1Id', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(max),
  );
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

  matches.sort((a, b) => {
    const ta = a.timestamp?.seconds ?? 0;
    const tb = b.timestamp?.seconds ?? 0;
    return tb - ta;
  });

  return matches.slice(0, max);
}

// ── Practice History ──────────────────────────────────────────────────────────

export interface PracticeRecord {
  id?: string;
  userId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  myScore: number;
  aiScore: number;
  winner: Owner | null;  // 1 = player won, 2 = AI won, null = draw
  durationMs: number;
  myStats: PlayerStats;
  aiStats: PlayerStats;
  timestamp: any;
}

export async function savePracticeResult(
  userId: string,
  difficulty: 'easy' | 'medium' | 'hard',
  myScore: number,
  aiScore: number,
  winner: Owner | null,
  durationMs: number,
  stats: [PlayerStats, PlayerStats],
): Promise<void> {
  const record: Omit<PracticeRecord, 'id'> = {
    userId,
    difficulty,
    myScore,
    aiScore,
    winner,
    durationMs,
    myStats: stats[0],
    aiStats: stats[1],
    timestamp: serverTimestamp(),
  };
  await addDoc(collection(db, 'practice'), record);
}

export async function getPracticeHistory(userId: string, max = 20): Promise<PracticeRecord[]> {
  // Query without orderBy to avoid requiring a composite index.
  // Sort client-side instead.
  const q = query(
    collection(db, 'practice'),
    where('userId', '==', userId),
  );
  const snap = await getDocs(q);
  const records = snap.docs.map(d => ({ id: d.id, ...(d.data() as PracticeRecord) }));
  records.sort((a, b) => {
    const ta = a.timestamp?.seconds ?? 0;
    const tb = b.timestamp?.seconds ?? 0;
    return tb - ta;
  });
  return records.slice(0, max);
}
