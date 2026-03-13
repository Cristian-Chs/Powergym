"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, Payment } from "@/types";
import CheckoutModal from "./CheckoutModal";

interface Props {
  userProfile: UserProfile;
}

const TIERS = [
  {
    id: "basico",
    name: "Básico",
    price: 5,
    features: ["Acceso al gimnasio", "Uso de máquinas", "Vestuarios"],
    accent: "border-gray-500/20",
    bg: "bg-surface-800",
    popular: false,
    planId: "plan_basico",
  },
  {
    id: "pro",
    name: "Pro",
    price: 10,
    features: ["Todo en Básico", "Clases grupales", "Plan de entrenamiento"],
    accent: "border-brand-lime/30",
    bg: "bg-brand-lime/5",
    popular: true,
    planId: "plan_pro",
  },
  {
    id: "elite",
    name: "Elite",
    price: 15,
    features: ["Todo en Pro", "Entrenador personal", "Plan nutricional", "Sauna"],
    accent: "border-purple-500/30",
    bg: "bg-purple-500/5",
    popular: false,
    planId: "plan_elite",
  },
] as const;

export default function PlanSelector({ userProfile }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<typeof TIERS[number] | null>(null);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const q = query(
          collection(db, "payments"),
          where("userId", "==", userProfile.uid),
          where("status", "==", "pending")
        );
        const snap = await getDocs(q);
        setHasPendingPayment(!snap.empty);
      } catch (error) {
        console.error("Error al verificar pagos pendientes:", error);
        // Error silencioso para el usuario
      }
    };
    checkPending();
  }, [userProfile.uid]);

  const handleSelect = (tier: typeof TIERS[number]) => {
    if (hasPendingPayment) {
      alert("Tienes un pago pendiente de verificación. Por favor, espera a que el administrador lo apruebe.");
      return;
    }
    setSelectedTier(tier);
  };

  const handleCancel = async () => {
    if (!confirm("¿Estás seguro de que deseas cancelar tu suscripción? Seguirás teniendo acceso hasta el final del periodo.")) return;
    
    try {
      setLoading("cancel");
      const userRef = doc(db, "users", userProfile.uid);
      await updateDoc(userRef, {
        cancelAtEnd: true,
      });
      window.location.reload();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("Error al cancelar la suscripción.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-100">Planes de Membresía</h2>
          <p className="text-sm text-gray-500">Elige el plan que mejor se adapte a tus objetivos.</p>
        </div>
        {userProfile.membershipTier && !userProfile.cancelAtEnd && (
          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {loading === "cancel" ? "Cancelando..." : "Cancelar suscripción"}
          </button>
        )}
        {userProfile.cancelAtEnd && (
          <span className="text-xs font-medium text-orange-400">
            Cancelación pendiente al final del periodo
          </span>
        )}
      </div>

      {hasPendingPayment && (
        <div className="flex items-center gap-3 rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 animate-pulse">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-orange-400">Pago en Verificación</p>
            <p className="text-xs text-orange-400/70">Tu plan se activará en cuanto el administrador confirme tu transferencia.</p>
          </div>
        </div>
      )}

      <div className={`grid gap-4 sm:grid-cols-3 ${hasPendingPayment ? 'opacity-50 pointer-events-none' : ''}`}>
        {TIERS.map((tier) => {
          const isSelected = userProfile.membershipTier === tier.id;
          return (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                isSelected ? tier.accent + " " + tier.bg : "border-white/5 bg-surface-800"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-mint px-3 py-1 text-[10px] font-bold text-surface-900 uppercase">
                  Popular
                </span>
              )}
              
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-100">{tier.name}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">${tier.price}</span>
                  <span className="text-xs text-gray-500">/mes</span>
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-2">
                {tier.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <svg className="h-3 w-3 text-brand-mint" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(tier)}
                disabled={loading !== null || hasPendingPayment}
                className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all disabled:opacity-50 ${
                  isSelected
                    ? "bg-brand-lime text-surface-900 shadow-glow shadow-brand-lime/20"
                    : "bg-surface-700 text-gray-400 hover:text-white border border-white/5 hover:border-white/10"
                }`}
              >
                {isSelected ? "Renovar Plan" : "Seleccionar Plan"}
              </button>
            </div>
          );
        })}
      </div>

      {selectedTier && (
        <CheckoutModal
          isOpen={!!selectedTier}
          onClose={() => setSelectedTier(null)}
          tier={selectedTier}
          userProfile={userProfile}
        />
      )}
    </div>
  );
}
