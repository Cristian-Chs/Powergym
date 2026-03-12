"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: any;
  }
}

export default function CuentaPage() {
  const { firebaseUser, userProfile } = useAuth();

  // ── Email update state ──────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // ── Google Auth check ───────────────────────────────
  const [isGoogleOnly, setIsGoogleOnly] = useState(false);
  const [newAuthPassword, setNewAuthPassword] = useState("");

  useEffect(() => {
    if (firebaseUser?.providerData) {
      const hasPassword = firebaseUser.providerData.some(p => p.providerId === "password");
      setIsGoogleOnly(!hasPassword);
    }
  }, [firebaseUser]);

  // ── Phone update state ──────────────────────────────
  const [countryCode, setCountryCode] = useState("+58");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "otp">("input");
  const [phoneStatus, setPhoneStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [recaptchaLoading, setRecaptchaLoading] = useState(false);

  const recaptchaRef = useRef<HTMLDivElement>(null);

  // ── Email update handler ───────────────────────────
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setEmailLoading(true);
    setEmailStatus(null);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email!, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updateEmail(firebaseUser, newEmail);
      setEmailStatus({ type: "success", msg: "Correo actualizado correctamente." });
      setNewEmail("");
      setCurrentPassword("");
    } catch (err: any) {
      const msg =
        err.code === "auth/wrong-password" ? "Contraseña incorrecta." :
        err.code === "auth/requires-recent-login" ? "Por seguridad, cierra sesión e ingresa de nuevo antes de cambiar el correo." :
        err.code === "auth/email-already-in-use" ? "Este correo ya está en uso." :
        err.code === "auth/invalid-email" ? "Correo inválido." :
        err.message || "Error al actualizar el correo.";
      setEmailStatus({ type: "error", msg });
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Assign Password (for Google users) ─────────────
  const handleAssignPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !firebaseUser.email) return;
    setEmailLoading(true);
    setEmailStatus(null);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, newAuthPassword);
      await linkWithCredential(firebaseUser, credential);
      setEmailStatus({ type: "success", msg: "Contraseña asignada. Ahora puedes cambiar tu correo." });
      setNewAuthPassword("");
      setIsGoogleOnly(false); // They now have a password
    } catch (err: any) {
      const msg = 
        err.code === "auth/weak-password" ? "La contraseña debe tener al menos 6 caracteres." : 
        err.message || "Error al asignar contraseña.";
      setEmailStatus({ type: "error", msg });
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Phone: send OTP ───────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setPhoneLoading(true);
    setPhoneStatus(null);
    try {
      setRecaptchaLoading(true);
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current!, {
          size: "invisible",
        });
      }
      const fullPhone = `${countryCode}${phoneNumber.replace(/\s/g, "")}`;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmation;
      setPhoneStep("otp");
      setPhoneStatus({ type: "success", msg: "Código enviado. Revisa tu teléfono." });
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-phone-number" ? "Número de teléfono inválido." :
        err.code === "auth/too-many-requests" ? "Demasiados intentos. Espera antes de reintentar." :
        err.message || "Error al enviar el código.";
      setPhoneStatus({ type: "error", msg });
      window.recaptchaVerifier = undefined;
    } finally {
      setPhoneLoading(false);
      setRecaptchaLoading(false);
    }
  };

  // ── Phone: verify OTP ────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !window.confirmationResult) return;
    setPhoneLoading(true);
    setPhoneStatus(null);
    try {
      const result = await window.confirmationResult.confirm(otp);
      const phoneCredential = PhoneAuthProvider.credential(
        window.confirmationResult.verificationId,
        otp
      );
      await linkWithCredential(firebaseUser, phoneCredential);

      // Sync to Firestore
      const fullPhone = `${countryCode}${phoneNumber.replace(/\s/g, "")}`;
      await updateDoc(doc(db, "users", firebaseUser.uid), { phoneNumber: fullPhone }).catch(console.error);

      setPhoneStatus({ type: "success", msg: "Teléfono vinculado correctamente." });
      setPhoneStep("input");
      setPhoneNumber("");
      setOtp("");
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-verification-code" ? "Código incorrecto." :
        err.code === "auth/code-expired" ? "El código expiró. Solicita uno nuevo." :
        err.code === "auth/provider-already-linked" ? "Este número ya está vinculado a una cuenta." :
        err.message || "Error al verificar el código.";
      setPhoneStatus({ type: "error", msg });
    } finally {
      setPhoneLoading(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="border-b border-white/5 pb-6">
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-brand-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Dashboard
        </Link>
        <h1 className="text-2xl font-black text-gray-100">Configuración de la Cuenta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Actualiza tu información de contacto y seguridad.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Email Card ───────────────────────────── */}
        <div className="rounded-2xl border border-white/5 bg-surface-700 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
              <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">Cambiar Correo Electrónico</h2>
              <p className="text-xs text-gray-500">Correo actual: <span className="text-gray-400">{userProfile.email}</span></p>
            </div>
          </div>

          {isGoogleOnly ? (
            <form onSubmit={handleAssignPassword} className="space-y-4">
              <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-3 text-xs text-brand-primary">
                Tu cuenta está vinculada exclusivamente con Google. Para cambiar tu correo de acceso, primero debes crear una contraseña para tu cuenta.
              </div>
              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Crear Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newAuthPassword}
                  onChange={(e) => setNewAuthPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-surface-900/50 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:border-brand-primary/50"
                />
              </div>

              {emailStatus && (
                <div className={`rounded-xl border p-3 text-xs font-semibold ${
                  emailStatus.type === "success"
                    ? "border-brand-mint/30 bg-brand-mint/10 text-brand-mint"
                    : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}>
                  {emailStatus.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-white shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
              >
                {emailLoading ? "Asignando…" : "Asignar Contraseña"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Nuevo Correo
                </label>
                <input
                  type="email"
                  required
                  placeholder="nuevo@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-surface-900/50 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:border-brand-primary/50"
                />
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Contraseña Actual (para verificar)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-surface-900/50 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:border-brand-primary/50"
                />
              </div>

              {emailStatus && (
                <div className={`rounded-xl border p-3 text-xs font-semibold ${
                  emailStatus.type === "success"
                    ? "border-brand-mint/30 bg-brand-mint/10 text-brand-mint"
                    : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}>
                  {emailStatus.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-white shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
              >
                {emailLoading ? "Actualizando…" : "Actualizar Correo"}
              </button>
            </form>
          )}
        </div>

        {/* ── Phone Card ───────────────────────────── */}
        <div className="rounded-2xl border border-white/5 bg-surface-700 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
              <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">Cambiar Número de Teléfono</h2>
              <p className="text-xs text-gray-500">Se verificará con un código SMS (OTP).</p>
            </div>
          </div>

          {/* Invisible recaptcha container */}
          <div ref={recaptchaRef} id="recaptcha-phone-settings" />

          {phoneStep === "input" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Número de Teléfono
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
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 rounded-xl border border-white/5 bg-surface-900/50 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:border-brand-primary/50"
                  />
                </div>
              </div>

              {phoneStatus && (
                <div className={`rounded-xl border p-3 text-xs font-semibold ${
                  phoneStatus.type === "success"
                    ? "border-brand-mint/30 bg-brand-mint/10 text-brand-mint"
                    : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}>
                  {phoneStatus.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={phoneLoading}
                className="w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-white shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
              >
                {phoneLoading ? "Enviando…" : "Enviar Código SMS"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-xl border border-brand-mint/20 bg-brand-mint/5 p-3 text-xs text-brand-mint">
                Código enviado a {countryCode} {phoneNumber}
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Código de Verificación OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-surface-900/50 px-4 py-3 text-center text-lg font-black tracking-[0.5em] text-white placeholder:text-gray-600 outline-none transition-all focus:border-brand-primary/50"
                />
              </div>

              {phoneStatus && (
                <div className={`rounded-xl border p-3 text-xs font-semibold ${
                  phoneStatus.type === "success"
                    ? "border-brand-mint/30 bg-brand-mint/10 text-brand-mint"
                    : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}>
                  {phoneStatus.msg}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setPhoneStep("input"); setPhoneStatus(null); setOtp(""); }}
                  className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-gray-400 transition-all hover:border-white/20 hover:text-gray-200"
                >
                  Cambiar número
                </button>
                <button
                  type="submit"
                  disabled={phoneLoading || otp.length < 6}
                  className="flex-1 rounded-xl bg-brand-primary py-3 text-sm font-bold text-white shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
                >
                  {phoneLoading ? "Verificando…" : "Verificar"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
