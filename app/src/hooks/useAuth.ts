import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleSignIn() {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      const code = err.code ?? '';
      const msg = err.message ?? 'Unknown error';

      // If popup was blocked or closed, show a helpful message
      if (code === 'auth/popup-blocked') {
        setError('Popup blocked — please allow popups for this site');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else if (code === 'auth/unauthorized-domain') {
        setError('Domain not authorized in Firebase');
      } else {
        setError(`Sign-in failed: ${code || msg}`);
      }
      console.error('Auth error:', code, msg);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  return { user, loading, error, signIn: handleSignIn, signOut: handleSignOut };
}
