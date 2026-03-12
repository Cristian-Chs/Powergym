"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { userProfile, authLoading, profileLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Esperamos a que ambos terminen para decidir la ruta inicial
    if (authLoading || profileLoading) return;
    if (!userProfile) {
      router.replace("/login");
    } else if (userProfile.role === "admin") {
      router.replace("/admin");
    } else if (!userProfile.planId || userProfile.status !== "active") {
      router.replace("/dashboard/onboarding");
    } else {
      router.replace("/dashboard");
    }
  }, [userProfile, authLoading, profileLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-lime border-t-transparent" />
        <p className="text-sm text-gray-500">Redirigiendo…</p>
      </div>
    </div>
  );
}
