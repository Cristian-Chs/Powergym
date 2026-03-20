"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import PlanSelector from "@/components/PlanSelector";
import { useRouter } from "next/navigation";
import { getMembershipStatus } from "@/lib/membership";

export default function OnboardingPage() {
  const { userProfile, authLoading, profileLoading } = useAuth() as any;
  const [showPlans, setShowPlans] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (userProfile && !authLoading && !profileLoading) {
      const { isExpired } = getMembershipStatus(userProfile.subscriptionEnd?.toDate());
      
      // Si ya tiene un plan activo y NO está expirado, mandarlo al dashboard
      if (userProfile.planId && userProfile.status === "active" && !isExpired) {
        setRedirecting(true);
        router.replace("/dashboard");
      }
    }
  }, [userProfile, authLoading, profileLoading, router]);

  if (authLoading || profileLoading || redirecting) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (!userProfile) return null;

  const { isExpired } = getMembershipStatus(userProfile.subscriptionEnd?.toDate());

  if (!showPlans) {
    return (
      <div className="mx-auto max-w-3xl pt-12 pb-24 animate-fade-in">
        {isExpired && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center animate-pulse">
            <p className="text-sm font-bold text-red-400">
              ⚠️ Tu membresía ha expirado. Por favor, selecciona un plan para renovar tu acceso.
            </p>
          </div>
        )}
        <div className="mb-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl overflow-hidden mb-6 shadow-glow border border-white/5 bg-surface-800">
            <img 
              src="/LOGO.png" 
              alt="PowerGym Logo" 
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl tracking-tight mb-4">
            Bienvenido a <span className="text-brand-primary">PowerGym</span>
          </h1>
          <p className="text-lg text-gray-400">
            Estamos muy emocionados de acompañarte en tu transformación física. Para comenzar a utilizar la plataforma y llevar el control de tus ingresos, es indispensable que selecciones un plan de membresía.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 mb-12">
          <div className="rounded-2xl border border-white/5 bg-surface-800 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 mb-4">
               <svg className="h-6 w-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-100 mb-2">Control de Rutinas</h3>
            <p className="text-sm text-gray-500">Podrás acceder a tus planes de entrenamiento asignados por los instructores directamente desde tu panel.</p>
          </div>
          
          <div className="rounded-2xl border border-white/5 bg-surface-800 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 mb-4">
               <svg className="h-6 w-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-100 mb-2">Gestión de Pagos</h3>
            <p className="text-sm text-gray-500">Verifica fácilmente cuándo expira tu mensualidad y envía notificaciones de transferencia enseguida.</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setShowPlans(true)}
            className="w-full sm:w-auto rounded-xl bg-brand-primary px-12 py-4 text-sm font-bold text-white shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Comenzar mi Entrenamiento
          </button>
          <button
            onClick={() => setShowPlans(true)}
            className="text-xs font-semibold text-gray-500 hover:text-white transition-colors"
          >
            Omitir inducción y elegir plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-white/5 pb-6 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-gray-100">
          Selección de Membresía
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Escoge el plan que mejor se adapte a tus metas para activar tu cuenta.
        </p>
      </div>
      
      <PlanSelector userProfile={userProfile} />
    </div>
  );
}
