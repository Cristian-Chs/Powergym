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
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { addMonths } from "date-fns";
import { useRouter } from "next/navigation";

interface AuthContextType {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authLoading: boolean;
  profileLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
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
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("onAuthStateChanged:", user ? `Usuario: ${user.email}` : "Sin usuario");
      setFirebaseUser(user);
      setAuthLoading(false); // Auth is resolved quickly

      if (user) {
        setProfileLoading(true);
        try {
          const userRef = doc(db, "users", user.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            console.log("Perfil encontrado.");
            const data = snap.data();
            setUserProfile({ uid: user.uid, ...data } as UserProfile);
            
            // Set cookie for middleware
            const role = data.role || "client";
            document.cookie = `session=${role};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`;
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
            setUserProfile(newProfile);
            document.cookie = `session=client;path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`;
          }
        } catch (error: any) {
          console.error("Error en Firestore:", error);
          if (error.code === "permission-denied") {
            // alert("Firestore Error: Permisos denegados. Revisa la pestaña 'Reglas' en Firebase.");
          }
        } finally {
          setProfileLoading(false);
        }
      } else {
        setUserProfile(null);
        setProfileLoading(false);
        document.cookie = "session=;path=/;max-age=0;SameSite=Lax";
      }
    });

    return () => unsubscribe();
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
      // Set the display name immediately so Firestore profile creation picks it up
      await updateProfile(result.user, { displayName: name });
      // The onAuthStateChanged listener will create the Firestore profile
    } catch (error: any) {
      console.error("Error al registrarse con email:", error);
      throw error;
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

  // Para compatibilidad hacia atrás, 'loading' refleja el estado inicial crítico
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
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
