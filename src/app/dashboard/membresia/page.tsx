"use client";

import PlanSelector from "@/components/PlanSelector";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function MembresiaPage() {
  const { userProfile, authLoading, profileLoading } = useAuth();

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (!userProfile) return null;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-brand-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Dashboard
          </Link>
          <h1 className="text-2xl font-black text-gray-100">Mi Membresía</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra tu plan y consulta los beneficios disponibles.
          </p>
        </div>

        {/* Current plan badge */}
        {userProfile.membershipTier && (
          <div className="flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-2">
            <svg className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.95-.69l1.519-4.674z" />
            </svg>
            <div>
              <p className="text-[10px] font-bold uppercase text-brand-primary/70 tracking-wider">Plan Activo</p>
              <p className="text-sm font-bold capitalize text-brand-primary">{userProfile.membershipTier}</p>
            </div>
          </div>
        )}
      </div>

      {/* Plan Selector */}
      <PlanSelector userProfile={userProfile} />
    </div>
  );
}
