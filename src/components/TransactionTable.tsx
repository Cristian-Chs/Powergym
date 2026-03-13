"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, Payment } from "@/types";
import { differenceInDays, format, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Minus, Plus, WhatsApp } from "./Icons";

export default function TransactionTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "expired" | "verifying">("all");

  useEffect(() => {
    // 1. Listen for Users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (uSnap) => {
      const usersList = uSnap.docs.map(
        (d) => ({ uid: d.id, ...d.data() }) as UserProfile
      );

      // 2. Listen for Pending Payments
      const q = query(collection(db, "payments"), where("status", "==", "pending"));
      const unsubscribePayments = onSnapshot(q, (pSnap) => {
        const pendingMap: Record<string, boolean> = {};
        pSnap.docs.forEach(d => {
          const p = d.data() as Payment;
          pendingMap[p.userId] = true;
        });

        setUsers(usersList);
        setPendingPayments(pendingMap);
        setLoading(false);
      });

      return () => unsubscribePayments();
    });

    return () => unsubscribeUsers();
  }, []);

  const extendSubscription = async (uid: string) => {
    const user = users.find((u: UserProfile) => u.uid === uid);
    if (!user) return;

    const now = new Date();
    const currentEnd = user.subscriptionEnd.toDate();
    const baseDate = currentEnd > now ? currentEnd : now;
    const newEnd = Timestamp.fromDate(addMonths(baseDate, 1));

    await updateDoc(doc(db, "users", uid), {
      subscriptionEnd: newEnd,
      status: "active",
    });
    
    setUsers((prev: UserProfile[]) =>
      prev.map((u: UserProfile) =>
        u.uid === uid
          ? { ...u, subscriptionEnd: newEnd, status: "active" }
          : u
      )
    );
  };

  const subtractSubscription = async (uid: string) => {
    const user = users.find((u: UserProfile) => u.uid === uid);
    if (!user) return;

    const currentEnd = user.subscriptionEnd.toDate();
    const newEnd = Timestamp.fromDate(addMonths(currentEnd, -1));

    await updateDoc(doc(db, "users", uid), {
      subscriptionEnd: newEnd,
    });
    
    setUsers((prev: UserProfile[]) =>
      prev.map((u: UserProfile) =>
        u.uid === uid
          ? { ...u, subscriptionEnd: newEnd }
          : u
      )
    );
  };

  const getStatus = (u: UserProfile) => {
    if (pendingPayments[u.uid]) return "verifying";
    const end = u.subscriptionEnd.toDate();
    return differenceInDays(end, new Date()) >= 0 ? "paid" : "expired";
  };

  const filtered = users.filter((u: UserProfile) => {
    if (u.role === "admin") return false;
    if (filter === "all") return true;
    return getStatus(u) === filter;
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-surface-700" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "paid", "expired", "verifying"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              filter === f
                ? "bg-brand-lime text-surface-900"
                : "bg-surface-700 text-gray-400 hover:bg-surface-600"
            }`}
          >
            {f === "all" ? "Todos" : f === "paid" ? "Pagado" : f === "expired" ? "Expirados" : "Por Verificar"}
          </button>
        ))}
      </div>

      {/* Table container with horizontal scroll for mobile */}
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-surface-800">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-gray-500">
              <th className="px-5 py-4">Usuario</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4 text-center">Vencimiento</th>
              <th className="px-5 py-4 text-center">Estado</th>
              <th className="px-5 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((u: UserProfile) => {
              const status = getStatus(u);
              const end = u.subscriptionEnd.toDate();
              return (
                <tr
                  key={u.uid}
                  className="bg-surface-700/50 transition-colors hover:bg-surface-700"
                >
                  <td className="px-5 py-4 font-bold text-white whitespace-nowrap">
                    {u.displayName || "Sin nombre"}
                  </td>
                  <td className="px-5 py-4 text-gray-400 whitespace-nowrap">
                    {u.email}
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-center whitespace-nowrap">
                    {format(end, "d MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-tighter ${
                        status === "paid"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : status === "verifying"
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      <span
                        className={`h-1 w-1 rounded-full ${
                          status === "paid" ? "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" : status === "verifying" ? "bg-orange-400 animate-pulse" : "bg-red-400"
                        }`}
                      />
                      {status === "paid" ? "Pagado" : status === "verifying" ? "Validando" : "Expirado"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {status === "verifying" ? (
                      <span className="text-[10px] text-gray-500 italic">Usar buzón</span>
                    ) : (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => subtractSubscription(u.uid)}
                          className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-all hover:bg-red-500/20"
                          title="Quitar 1 mes"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => extendSubscription(u.uid)}
                          className="rounded-lg bg-brand-lime/10 p-2 text-brand-lime transition-all hover:bg-brand-lime/20"
                          title="Añadir 1 mes"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => {
                            const cleanPhone = u.phoneNumber?.replace(/\D/g, "");
                            const message = encodeURIComponent(`Hola ${u.displayName || "Usuario"}, te escribimos de PowerGym para recordarte que tu membresía está por vencer o ya ha vencido. ¡Esperamos verte pronto!`);
                            window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
                          }}
                          disabled={!u.phoneNumber}
                          className="rounded-lg bg-green-500/10 p-2 text-green-400 transition-all hover:bg-green-500/20 disabled:opacity-10"
                          title={u.phoneNumber ? "WhatsApp" : "Sin número"}
                        >
                          <WhatsApp size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-gray-500 italic"
                >
                  No hay usuarios en esta categoría
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
 
      {/* Summary - more responsive flex */}
      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
          Total: <span className="text-white">{users.filter((u: UserProfile) => u.role !== "admin").length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Pagados: <span className="text-emerald-400">{users.filter((u: UserProfile) => u.role !== "admin" && getStatus(u) === "paid").length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Expirados: <span className="text-red-400">{users.filter((u: UserProfile) => u.role !== "admin" && getStatus(u) === "expired").length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          Por Verificar: <span className="text-orange-400">{users.filter((u: UserProfile) => u.role !== "admin" && getStatus(u) === "verifying").length}</span>
        </div>
      </div>
    </div>
  );
}
