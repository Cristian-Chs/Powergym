"use client";

import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { differenceInDays } from "date-fns";
import BcvRate from "@/components/BcvRate";
import AdminNotifications from "@/components/AdminNotifications";
import AdminInicio from "@/components/AdminInicio";
import AdminTransactionsView from "@/components/AdminTransactionsView";
import AdminPlansView from "@/components/AdminPlansView";
import { Bell } from "@/components/Icons";

export default function AdminDashboard({ activeView = "inicio" }: { activeView?: string }) {
  const { userProfile, authLoading, profileLoading } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, verifying: 0 });

  useEffect(() => {
    // 1. Listen to Users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (uSnap) => {
      const users = uSnap.docs
        .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter((u) => u.role !== "admin");

      // 2. Listen to Pending Payments
      const q = query(collection(db, "payments"), where("status", "==", "pending"));
      const unsubscribePayments = onSnapshot(q, (pSnap) => {
        const verifying = pSnap.size;
        const active = users.filter((u) => {
          if (!u.subscriptionEnd) return false;
          try {
            return differenceInDays(u.subscriptionEnd.toDate(), new Date()) >= 0;
          } catch (e) {
            return false;
          }
        }).length;

        setStats({
          total: users.length,
          active,
          pending: users.length - active,
          verifying
        });
      });

      return () => unsubscribePayments();
    });

    return () => unsubscribeUsers();
  }, []);

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent shadow-glow shadow-brand-primary/20" />
      </div>
    );
  }

  if (!userProfile || userProfile.role !== "admin") return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-white/5 pb-8 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            {activeView === "inicio" ? "Panel de Control" : 
             activeView === "transacciones" ? "Historial Financiero" : 
             "Gestor de Entrenamiento"}
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500 uppercase tracking-widest">
            {activeView === "inicio" ? "Monitorea tu gimnasio en tiempo real" : 
             activeView === "transacciones" ? "Gestiona membresías y pagos" : 
             "Diseña rutinas y planes nutricionales"}
          </p>
        </div>
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <BcvRate />
          <div className="h-10 w-[1px] bg-white/10 mx-2" />
          <div className="relative group">
            <AdminNotifications />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
            </span>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="min-h-[70vh]">
        {activeView === "inicio" && <AdminInicio stats={stats} />}
        {activeView === "transacciones" && <AdminTransactionsView />}
        {activeView === "planes" && <AdminPlansView />}
      </div>
    </div>
  );
}
