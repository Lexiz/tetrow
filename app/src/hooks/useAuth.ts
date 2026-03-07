import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mobile, check for redirect result first
    if (isMobile) {
      getRedirectResult(auth).catch(() => {
        // Redirect result errors are non-fatal (e.g. no redirect pending)
      });
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleSignIn() {
    if (isMobile) {
      // Redirect flow works reliably on mobile Safari
      await signInWithRedirect(auth, googleProvider);
    } else {
      await signInWithPopup(auth, googleProvider);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  return { user, loading, signIn: handleSignIn, signOut: handleSignOut };
}
