"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

declare global {
  interface Window {
    recaptchaVerifierLogin?: RecaptchaVerifier;
    registerConfirmation?: any;
  }
}

type RegisterStep = "form" | "otp" | "recover";

export default function LoginPage() {
  const { userProfile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, firebaseUser } = useAuth();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+58");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("form");
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [recaptchaLoading, setRecaptchaLoading] = useState(false);

  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && userProfile) {
      if (userProfile.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [userProfile, loading, router]);

  // ── Login ──────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setFormLoading(false);
    }
  };

  // ── Register Step 1: create account + send OTP ────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Por favor ingresa tu nombre."); return; }
    setError(null);
    setFormLoading(true);
    try {
      // 1. Create Firebase account (sets displayName via updateProfile inside signUpWithEmail)
      await signUpWithEmail(email, password, name);

      // 2. Set up recaptcha and send OTP
      setRecaptchaLoading(true);
      if (!window.recaptchaVerifierLogin) {
        window.recaptchaVerifierLogin = new RecaptchaVerifier(auth, recaptchaRef.current!, {
          size: "invisible",
        });
      }
      const fullPhone = `${countryCode}${phone.replace(/\s/g, "")}`;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifierLogin);
      window.registerConfirmation = confirmation;
      setRegisterStep("otp");
    } catch (err: any) {
      setError(mapAuthError(err));
      window.recaptchaVerifierLogin = undefined;
    } finally {
      setFormLoading(false);
      setRecaptchaLoading(false);
    }
  };

  // ── Register Step 2: verify OTP + link phone ─────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.registerConfirmation) {
      setError("No hay un código activo. Reinicia el registro.");
      return;
    }
    setError(null);
    setFormLoading(true);
    try {
      const phoneCredential = PhoneAuthProvider.credential(
        window.registerConfirmation.verificationId,
        otp
      );
      if (firebaseUser) {
        await linkWithCredential(firebaseUser, phoneCredential);
        // Sync phone to Firestore
        const fullPhone = `${countryCode}${phone.replace(/\s/g, "")}`;
        await updateDoc(doc(db, "users", firebaseUser.uid), { phoneNumber: fullPhone }).catch(console.error);
      } else {
        const result = await window.registerConfirmation.confirm(otp);
        // Sync phone to Firestore if user exists
        if (result.user) {
           const fullPhone = `${countryCode}${phone.replace(/\s/g, "")}`;
           await updateDoc(doc(db, "users", result.user.uid), { phoneNumber: fullPhone }).catch(console.error);
        }
      }
      // Redirect will be handled by the useEffect above
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setFormLoading(false);
    }
  };

  // ── Skip phone (optional) ──────────────────────
  const handleSkipPhone = () => {
    // User already created — just navigate
    router.replace("/dashboard");
  };

  // ── Password Recovery ─────────────────────────
  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Por favor ingresa tu email para recuperar la contraseña."); return; }
    setError(null);
    setFormLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setError("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleTabSwitch = (login: boolean) => {
    setIsLogin(login);
    setError(null);
    setRegisterStep("form");
    setOtp("");
  };

  function mapAuthError(err: any): string {
    const code = err?.code ?? "";
    if (code === "auth/user-not-found" || code === "auth/invalid-credential") return "Usuario o contraseña incorrectos.";
    if (code === "auth/wrong-password") return "Contraseña incorrecta.";
    if (code === "auth/email-already-in-use") return "El email ya está registrado.";
    if (code === "auth/weak-password") return "La contraseña debe tener al menos 6 caracteres.";
    if (code === "auth/invalid-email") return "Email inválido.";
    if (code === "auth/invalid-phone-number") return "Número de teléfono inválido.";
    if (code === "auth/too-many-requests") return "Demasiados intentos. Espera antes de reintentar.";
    if (code === "auth/invalid-verification-code") return "Código incorrecto.";
    if (code === "auth/code-expired") return "El código expiró. Reinicia el registro.";
    if (code === "auth/provider-already-linked") return "Este número ya está vinculado.";
    return err?.message || "Ocurrió un error inesperado.";
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-brand-secondary/5 blur-3xl" />
      </div>

      {/* Invisible recaptcha */}
      <div ref={recaptchaRef} id="recaptcha-register" />

      <div className="relative w-full max-w-md animate-fade-in py-12">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-primary shadow-glow-lg transition-transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Power<span className="text-brand-primary">Gym</span>
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            {isLogin ? "Accede a tu entrenamiento" : "Empieza tu transformación"}
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-surface-800/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Tab switcher */}
          <div className="mb-8 flex justify-center gap-1 rounded-2xl bg-surface-900/50 p-1">
            <button
              onClick={() => handleTabSwitch(true)}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                isLogin ? "bg-brand-primary text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => handleTabSwitch(false)}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                !isLogin ? "bg-brand-primary text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Registro
            </button>
          </div>

          {/* ── Login form ───────────────────────── */}
          {isLogin && registerStep !== "recover" && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" />
              <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setRegisterStep("recover")}
                  className="text-[11px] font-bold text-brand-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error && <ErrorBox msg={error} isSuccess={error.includes("enviado")} />}
              <SubmitButton loading={formLoading} label="Iniciar Sesión" />
            </form>
          )}

          {/* ── Recover Password form ──────────────── */}
          {isLogin && registerStep === "recover" && (
            <form onSubmit={handleRecoverPassword} className="space-y-4 animate-fade-in">
              <p className="text-xs text-gray-400 mb-4 text-center">Te enviaremos un enlace para restablecer tu contraseña.</p>
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" />
              {error && <ErrorBox msg={error} isSuccess={error.includes("enviado")} />}
              <SubmitButton loading={formLoading} label="Enviar enlace" />
              <button
                type="button"
                onClick={() => { setRegisterStep("form"); setError(null); }}
                className="w-full text-center text-xs font-medium text-gray-500 transition-colors hover:text-gray-300 mt-2"
              >
                ← Volver al login
              </button>
            </form>
          )}

          {/* ── Register: Step 1 – form ──────────── */}
          {!isLogin && registerStep === "form" && (
            <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
              <Field label="Nombre Completo" type="text" value={name} onChange={setName} placeholder="Juan Pérez" required />
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" required />
              <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" required />

              {/* Phone field */}
              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Teléfono (para verificación)
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="rounded-xl border border-white/5 bg-surface-900/50 px-3 py-3 text-sm text-white outline-none focus:border-brand-primary/50"
                  >
                    <option value="+58">🇻🇪 +58</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+54">🇦🇷 +54</option>
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+51">🇵🇪 +51</option>
                    <option value="+56">🇨🇱 +56</option>
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="4141234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 rounded-xl border border-white/5 bg-surface-900/50 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:border-brand-primary/50"
                  />
                </div>
              </div>

              {error && <ErrorBox msg={error} />}
              {recaptchaLoading && (
                <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-3 text-center text-[10px] font-semibold text-brand-primary">
                  Verificando seguridad anti-spam de Google... espere.
                </div>
              )}
              <SubmitButton loading={formLoading || recaptchaLoading} label="Crear Cuenta y Enviar Código" />
            </form>
          )}

          {/* ── Register: Step 2 – OTP ───────────── */}
          {!isLogin && registerStep === "otp" && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-xl border border-brand-mint/20 bg-brand-mint/5 p-4 text-center">
                <p className="text-xs font-bold text-brand-mint">Código enviado por SMS</p>
                <p className="mt-1 text-[10px] text-brand-mint/70">
                  Revisa el número {countryCode} {phone}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Código de Verificación
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-surface-900/50 px-4 py-4 text-center text-2xl font-black tracking-[0.6em] text-white placeholder:text-gray-600 outline-none transition-all focus:border-brand-primary/50"
                  />
                </div>

                {error && <ErrorBox msg={error} />}

                <SubmitButton loading={formLoading} label="Verificar y Entrar" disabled={otp.length < 6} />
              </form>

              <button
                type="button"
                onClick={handleSkipPhone}
                className="w-full text-center text-xs font-medium text-gray-500 transition-colors hover:text-gray-300"
              >
                Omitir verificación por ahora →
              </button>
            </div>
          )}

          {/* ── Divider + Google ──────────────────── */}
          {!(registerStep === "otp") && (
            <>
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
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {loading ? "Conectando…" : "Continuar con Google"}
              </button>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-widest text-gray-600">
          PowerGym © 2026 • Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}

/* ── Shared form sub-components ──────────────────────── */
function Field({
  label, type, value, onChange, placeholder, required,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</label>
      <input
        type={type}
        required={required ?? true}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/5 bg-surface-900/50 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:border-brand-primary/50"
      />
    </div>
  );
}

function ErrorBox({ msg, isSuccess }: { msg: string; isSuccess?: boolean }) {
  return (
    <div className={`mt-2 rounded-xl border p-3 text-center text-xs font-semibold animate-fade-in ${
      isSuccess 
      ? "border-brand-mint/30 bg-brand-mint/10 text-brand-mint" 
      : "border-red-500/20 bg-red-500/10 text-red-400"
    }`}>
      {msg}
    </div>
  );
}

function SubmitButton({ loading, label, disabled }: { loading: boolean; label: string; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full rounded-xl bg-brand-primary py-4 text-sm font-black text-white shadow-lg shadow-brand-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
    >
      {loading ? "Procesando…" : label}
    </button>
  );
}
