"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { userProfile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!loading && userProfile) {
      if (userProfile.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [userProfile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        if (!name) throw new Error("Por favor ingresa tu nombre");
        await signUpWithEmail(email, password, name);
      }
    } catch (err: any) {
      let message = "Ocurrió un error inesperado";
      if (err.code === "auth/user-not-found") message = "Usuario no encontrado";
      else if (err.code === "auth/wrong-password") message = "Contraseña incorrecta";
      else if (err.code === "auth/email-already-in-use") message = "El email ya está registrado";
      else if (err.code === "auth/weak-password") message = "La contraseña es muy débil";
      else if (err.code === "auth/invalid-email") message = "Email inválido";
      else message = err.message;
      
      setError(message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-brand-secondary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in py-12">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-primary shadow-glow-lg transition-transform hover:scale-110">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Gym<span className="text-brand-primary">Pro</span>
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Maximiza tu potencial físico
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-surface-800/80 p-8 shadow-2xl backdrop-blur-xl transition-all">
          <div className="mb-8 flex justify-center gap-1 rounded-2xl bg-surface-900/50 p-1">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                isLogin ? "bg-brand-primary text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                !isLogin ? "bg-brand-primary text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Registro
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Juan Perez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-surface-900/50 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-brand-primary/50 transition-all"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-surface-900/50 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-brand-primary/50 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-surface-900/50 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-brand-primary/50 transition-all"
              />
            </div>

            {error && (
              <div className="mt-2 rounded-xl bg-red-500/10 p-3 text-center text-xs font-semibold text-red-400 border border-red-500/20 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full rounded-xl bg-brand-primary py-4 text-sm font-black text-white shadow-lg shadow-brand-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
            >
              {formLoading ? "Procesando…" : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-800 px-2 text-gray-500">O también</span>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-surface-900/50 px-6 py-4 text-sm font-bold text-gray-200 transition-all hover:border-brand-primary/30 hover:bg-surface-700 active:scale-[0.98] disabled:opacity-50"
          >
            {/* Google icon */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? "Conectando…" : "Continuar con Google"}
          </button>
        </div>

        <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-widest text-gray-600">
          GymPro © 2026 • Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
