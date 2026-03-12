"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  linkWithCredential,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function CuentaPage() {
  const { firebaseUser, userProfile } = useAuth();

  // ── Email update state ──────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailStatus, setEmailStatus] = useState(null as { type: "success" | "error"; msg: string } | null);
  const [emailLoading, setEmailLoading] = useState(false);

  // ── Google Auth check ───────────────────────────────
  const [isGoogleOnly, setIsGoogleOnly] = useState(false);
  const [newAuthPassword, setNewAuthPassword] = useState("");

  useEffect(() => {
    if (firebaseUser?.providerData) {
      const hasPassword = firebaseUser.providerData.some((p: any) => p.providerId === "password");
      setIsGoogleOnly(!hasPassword);
    }
  }, [firebaseUser]);

  // ── Phone update state ──────────────────────────────
  const [countryCode, setCountryCode] = useState("+58");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneStatus, setPhoneStatus] = useState(null as { type: "success" | "error"; msg: string } | null);
  const [phoneLoading, setPhoneLoading] = useState(false);

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

  // ── Phone: Direct Upload ─────────────────────────
  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setPhoneLoading(true);
    setPhoneStatus(null);
    try {
      if (!phoneNumber.trim()) {
        throw new Error("Agrega un número de teléfono.");
      }
      const fullPhone = `${countryCode}${phoneNumber.replace(/\s/g, "")}`;
      await updateDoc(doc(db, "users", firebaseUser.uid), { phoneNumber: fullPhone });
      setPhoneStatus({ type: "success", msg: "Teléfono actualizado correctamente." });
    } catch (err: any) {
      setPhoneStatus({ type: "error", msg: err.message || "Error al actualizar el teléfono." });
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAuthPassword(e.target.value)}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
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
              <p className="text-xs text-gray-500">
                Tu número telefónico nos ayuda a contactarte en caso de emergencia.
                <br /><br /> Actual: <span className="text-gray-400">{userProfile.phoneNumber || "No registrado"}</span>
              </p>
            </div>
          </div>

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Número de Teléfono
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountryCode(e.target.value)}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
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
                {phoneLoading ? "Guardando…" : "Guardar Número"}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
}
