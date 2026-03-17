"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { addMonths } from "date-fns";
import { useRouter } from "next/navigation";

export interface AuthContextType {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authLoading: boolean;
  profileLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  authLoading: true,
  profileLoading: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState(null as User | null);
  const [userProfile, setUserProfile] = useState(null as UserProfile | null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user: User | null) => {
      console.log("onAuthStateChanged:", user ? `Usuario: ${user.email}` : "Sin usuario");
      setFirebaseUser(user);
      setAuthLoading(false);

      if (user) {
        setProfileLoading(true);
        const userRef = doc(db, "users", user.uid);
        
        unsubscribeProfile = onSnapshot(userRef, async (snap) => {
          if (snap.exists()) {
            console.log("Perfil actualizado detectado.");
            const data = snap.data();
            setUserProfile({ uid: user.uid, ...data } as UserProfile);
            
            const role = data.role || "client";
            document.cookie = `session=${role};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`;
            setProfileLoading(false);
          } else {
            console.log("Creando perfil nuevo...");
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email ?? "",
              displayName: user.displayName ?? "",
              photoURL: user.photoURL ?? "",
              role: "client",
              subscriptionEnd: Timestamp.fromDate(addMonths(new Date(), 1)),
              status: "active",
              createdAt: Timestamp.now(),
            };
            await setDoc(userRef, newProfile);
            // onSnapshot will catch this new profile
          }
        }, (error) => {
          console.error("Error en onSnapshot perfil:", error);
          setProfileLoading(false);
        });
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUserProfile(null);
        setProfileLoading(false);
        document.cookie = "session=;path=/;max-age=0;SameSite=Lax";
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setAuthLoading(true);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Error al iniciar sesión con email:", error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, phone?: string) => {
    try {
      setAuthLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { displayName: name });
    } catch (error: any) {
      console.error("Error al registrarse con email:", error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setAuthLoading(true);
      await sendPasswordResetEmail(auth, email);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    document.cookie = "session=;path=/;max-age=0;SameSite=Lax";
    setUserProfile(null);
    setFirebaseUser(null);
    router.push("/login");
  };

  const loading = authLoading;

  return (
    <AuthContext.Provider
      value={{ 
        firebaseUser, 
        userProfile, 
        loading, 
        authLoading, 
        profileLoading, 
        signInWithGoogle, 
        signInWithEmail,
        signUpWithEmail,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
