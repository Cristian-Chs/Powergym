"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ExpirationBanner from "@/components/ExpirationBanner";
import PaymentCalendar from "@/components/PaymentCalendar";
import PlanViewer from "@/components/PlanViewer";

import { getMembershipStatus } from "@/lib/membership";
import { getWorkoutForDate } from "@/lib/workout";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plan, ExerciseDay } from "@/types";

export default function ClientDashboard() {
  const { userProfile, authLoading, profileLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [workoutToday, setWorkoutToday] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (userProfile && !authLoading && !profileLoading) {
      const { isExpired } = getMembershipStatus(userProfile.subscriptionEnd?.toDate());
      
      if (!userProfile.planId || userProfile.status !== "active" || isExpired) {
        setRedirecting(true);
        router.replace("/dashboard/onboarding");
      }
    }
  }, [userProfile, authLoading, profileLoading, router]);

  useEffect(() => {
    const resolveWorkout = async () => {
      if (!userProfile) return;

      let routines: ExerciseDay[] = [];

      if (userProfile.customExercises && userProfile.customExercises.length > 0) {
        routines = userProfile.customExercises;
      } else if (userProfile.planId) {
        const planSnap = await getDoc(doc(db, "plans", userProfile.planId));
        if (planSnap.exists()) {
          routines = (planSnap.data() as Plan).exercises || [];
        }
      }

      const todayWorkout = getWorkoutForDate(new Date(), routines);
      if (todayWorkout) {
        setWorkoutToday(todayWorkout.day);
      }
    };

    if (userProfile && !profileLoading) {
      resolveWorkout();
    }
  }, [userProfile, profileLoading]);

  if (authLoading || profileLoading || redirecting) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-lime border-t-transparent" />
      </div>
    );
  }

  if (!userProfile) return null;

  const subscriptionEnd = userProfile.subscriptionEnd.toDate();

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            Bienvenido {userProfile.displayName?.split(" ")[0]} 
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Aquí tienes un resumen de tu actividad y plan actual.
          </p>
        </div>
      </div>

      {/* Expiration + Calendar row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ExpirationBanner 
          subscriptionEnd={subscriptionEnd} 
          workoutToday={workoutToday}
        />
        <PaymentCalendar 
          subscriptionEnd={subscriptionEnd} 
          customExercises={userProfile.customExercises || []}
          planId={userProfile.planId}
        />
      </div>

      {/* Plan section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-200">
          Tu Plan Actual
        </h2>
        <PlanViewer planId={userProfile.planId} />
      </section>

    </div>
  );
}
