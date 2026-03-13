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
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => extendSubscription(u.uid)}
                          className="rounded-lg bg-brand-lime/10 p-2 text-brand-lime transition-all hover:bg-brand-lime/20"
                          title="Añadir 1 mes"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
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
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.399-4.397 9.831-9.797 9.831m8.532-18.362A11.861 11.861 0 0012.059 0C5.449 0 .062 5.388.059 11.998c0 2.113.543 4.176 1.579 6.02L0 24l6.146-1.612a11.827 11.827 0 005.908 1.569h.005c6.608 0 11.995-5.388 11.998-11.998a11.817 11.817 0 00-3.518-8.483"/>
                          </svg>
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
