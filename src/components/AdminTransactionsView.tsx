"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, Timestamp, limit, startAfter, endBefore, limitToLast } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Payment, UserProfile } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, ChevronLeft, ChevronRight, MessageCircle, AlertCircle } from "./Icons";

export default function AdminTransactionsView() {
  const [transactions, setTransactions] = useState<Payment[]>([]);
  const [expiredUsers, setExpiredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [firstDoc, setFirstDoc] = useState<any>(null);
  
  const itemsPerPage = 10;

  // 1. Fetch Expired Users (Checklist)
  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "client"),
      where("status", "==", "inactive")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const users = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
      const now = new Date();
      setExpiredUsers(users.filter(u => u.subscriptionEnd && u.subscriptionEnd.toDate() < now).slice(0, 5));
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Paginated Transactions
  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async (direction?: 'next' | 'prev') => {
    setLoading(true);
    let q;
    const paymentsCol = collection(db, "payments");

    if (direction === 'next' && lastDoc) {
      q = query(paymentsCol, orderBy("date", "desc"), startAfter(lastDoc), limit(itemsPerPage));
    } else if (direction === 'prev' && firstDoc) {
      q = query(paymentsCol, orderBy("date", "desc"), endBefore(firstDoc), limitToLast(itemsPerPage));
    } else {
      q = query(paymentsCol, orderBy("date", "desc"), limit(itemsPerPage));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
      setTransactions(docs);
      setFirstDoc(snap.docs[0]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const handleNext = () => {
    if (transactions.length === itemsPerPage) {
      setPage(p => p + 1);
      fetchTransactions('next');
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      setPage(p => p - 1);
      fetchTransactions('prev');
    }
  };

  const sendWhatsApp = (user: UserProfile) => {
    const message = encodeURIComponent(`Hola ${user.displayName}, te recordamos que tu membresía en PowerGym ha expirado. ¡Te esperamos pronto para seguir entrenando!`);
    const phone = user.phoneNumber || "";
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, "_blank");
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Expiration Quick Control */}
      <section className="card bg-red-500/5 border-red-500/20">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-400" size={18} />
            <h3 className="text-sm font-black uppercase tracking-widest text-red-400">Control de Vencimientos</h3>
          </div>
          <span className="rounded-full bg-red-400/10 px-2 py-0.5 text-[10px] font-black text-red-400 uppercase">
            {expiredUsers.length} Pendientes
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {expiredUsers.map(user => (
            <div key={user.uid} className="flex items-center justify-between rounded-xl bg-surface-800 p-3 border border-white/5 group hover:border-red-500/30 transition-all">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded border-white/10 bg-surface-900 text-brand-primary focus:ring-brand-primary" />
                <div>
                  <p className="text-xs font-bold text-white">{user.displayName}</p>
                  <p className="text-[10px] text-gray-500 italic">Venció el {format(user.subscriptionEnd.toDate(), "dd/MM/yy")}</p>
                </div>
              </div>
              <button 
                onClick={() => sendWhatsApp(user)}
                className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                title="Notificar por WhatsApp"
              >
                <MessageCircle size={16} />
              </button>
            </div>
          ))}
          {expiredUsers.length === 0 && (
            <p className="col-span-full py-4 text-center text-xs text-gray-500 italic">No hay membresías vencidas recientemente.</p>
          )}
        </div>
      </section>

      {/* Transactions Table */}
      <section className="card !p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Historial de Transacciones</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              type="text" 
              placeholder="Buscar por usuario o ID..." 
              className="rounded-lg bg-surface-800 border border-white/10 pl-9 pr-4 py-1.5 text-xs text-white outline-none focus:border-brand-primary/50 transition-all w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Usuario</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Plan / Monto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4 h-16 bg-white/[0.01]" />
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500 italic">No se encontraron transacciones.</td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-gray-300">{format(tx.date.toDate(), "dd MMM, yyyy", { locale: es })}</p>
                      <p className="text-[10px] text-gray-500">{format(tx.date.toDate(), "HH:mm")}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white uppercase tracking-tight">{tx.userName}</p>
                      <p className="text-[10px] text-gray-500 font-mono">ID: {tx.userId.substring(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-brand-primary">{tx.tier}</span>
                        <span className="text-sm font-black text-white">${tx.amount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${
                        tx.status === 'completed' ? 'bg-emerald-400/10 text-emerald-400' :
                        tx.status === 'pending' ? 'bg-orange-400/10 text-orange-400' :
                        'bg-red-400/10 text-red-100'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.01] px-6 py-4">
          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Página {page}</p>
          <div className="flex gap-2">
            <button 
              onClick={handlePrev}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border border-white/5 px-3 py-1.5 text-[10px] font-black uppercase text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>
            <button 
              onClick={handleNext}
              disabled={transactions.length < itemsPerPage}
              className="flex items-center gap-1 rounded-lg border border-white/5 px-3 py-1.5 text-[10px] font-black uppercase text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              Siguiente
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
