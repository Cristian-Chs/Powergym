"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, Timestamp, limit, startAfter, endBefore, limitToLast } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Payment, UserProfile } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, ChevronLeft, ChevronRight, MessageCircle, AlertCircle, X } from "./Icons";

export default function AdminTransactionsView() {
  const [transactions, setTransactions] = React.useState([] as Payment[]);
  const [expiredUsers, setExpiredUsers] = React.useState([] as UserProfile[]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [selectedTx, setSelectedTx] = React.useState(null as Payment | any);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [lastDoc, setLastDoc] = React.useState(null as any);
  const [firstDoc, setFirstDoc] = React.useState(null as any);
  
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
      setPage((p: number) => p + 1);
      fetchTransactions('next');
    }
  };

  const filteredTransactions = transactions.filter((t: Payment) => 
    t.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.refNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const notifyWhatsApp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Hola ${name}, te recordamos que tu membresía en PowerGym ha expirado. ¡Te esperamos para renovar!`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Expiration Control Section */}
      <section className="card border-red-500/20 bg-red-500/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-red-100">Control de Expiración</h3>
              <p className="text-[10px] font-medium text-red-400 uppercase tracking-widest">Usuarios con membresía vencida</p>
            </div>
          </div>
          <span className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-black text-white shadow-glow shadow-red-500/30">
            {expiredUsers.length} PENDIENTES
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {expiredUsers.map((user: UserProfile) => (
            <div key={user.uid} className="flex items-center justify-between rounded-xl bg-surface-800 p-4 border border-white/5 transition-all hover:border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-surface-900">
                  {user.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-brand-primary/10" />}
                </div>
                <div>
                  <p className="text-[11px] font-black text-white truncate w-32">{user.displayName || 'Usuario'}</p>
                  <p className="text-[9px] font-medium text-gray-500 tracking-tighter italic">Venció: {user.subscriptionEnd ? format(user.subscriptionEnd.toDate(), "dd/MM/yy") : 'N/A'}</p>
                </div>
              </div>
              <button 
                onClick={() => notifyWhatsApp(user.phone || user.phoneNumber || '', user.displayName || '')}
                className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 transition-colors hover:bg-emerald-500 hover:text-white"
              >
                <MessageCircle size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Transactions Table Section */}
      <section className="card overflow-hidden !p-0">
        <div className="flex flex-col gap-4 border-b border-white/5 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Historial de Transacciones</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por usuario o referencia..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-surface-900 border border-white/10 pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-brand-primary/50 transition-all placeholder:text-gray-700 font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left">
            <thead className="border-b border-white/5 bg-white/[0.01]">
              <tr>
                {["Fecha", "Usuario", "Monto", "Referencia", "Estado", "Acción"].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentTransactions.map((tx: Payment) => (
                <tr 
                  key={tx.id} 
                  className="group transition-colors hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <td className="px-6 py-4 text-[11px] font-medium text-gray-400 whitespace-nowrap">
                    {tx.createdAt ? format(tx.createdAt.toDate(), "dd/MM/yyyy HH:mm") : '---'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-[10px] font-bold text-brand-primary border border-brand-primary/20">
                        {tx.userName?.[0]}
                      </div>
                      <span className="text-[11px] font-black text-white uppercase tracking-tighter truncate w-32">{tx.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-black text-brand-primary">
                    ${tx.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider">
                    #{tx.refNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
                      tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      tx.status === 'pending' ? 'bg-orange-500/10 text-orange-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="rounded-lg bg-surface-700 p-2 text-gray-400 transition-all hover:bg-brand-primary hover:text-white group-hover:scale-110">
                      <Search size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.01] px-6 py-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Mostrando {currentTransactions.length} de {filteredTransactions.length} items
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage((prev: number) => prev - 1)}
              className="flex items-center gap-1 rounded-lg border border-white/5 bg-surface-800 px-3 py-2 text-[10px] font-black uppercase text-gray-400 transition-all hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage((prev: number) => prev + 1)}
              className="flex items-center gap-1 rounded-lg border border-white/5 bg-surface-800 px-3 py-2 text-[10px] font-black uppercase text-gray-400 transition-all hover:text-white disabled:opacity-30"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedTx(null)} />
          <div className="relative w-full max-w-2xl animate-fade-in rounded-2xl border border-white/10 bg-surface-800 shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* Image Column */}
              <div className="w-full md:w-1/2 bg-black/40 p-1 flex items-center justify-center min-h-[300px]">
                {selectedTx.receiptUrl || selectedTx.proofUrl ? (
                  <img 
                    src={selectedTx.receiptUrl || selectedTx.proofUrl} 
                    alt="Comprobante" 
                    className="max-h-full max-w-full object-contain cursor-zoom-in" 
                    onClick={() => window.open(selectedTx.receiptUrl || selectedTx.proofUrl, '_blank')} 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-600">
                    <AlertCircle size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sin Comprobante</p>
                  </div>
                )}
              </div>

              {/* Info Column */}
              <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Detalles del Pago</h3>
                      <p className="text-xs text-brand-primary font-black uppercase tracking-[0.2em] mt-1">Ref: {selectedTx.refNumber}</p>
                    </div>
                    <button onClick={() => setSelectedTx(null)} className="text-gray-500 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Usuario</p>
                        <p className="text-sm font-bold text-white mt-1 uppercase">{selectedTx.userName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estado</p>
                        <div className="mt-1 flex">
                          <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                            selectedTx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            selectedTx.status === 'pending' ? 'bg-orange-500/10 text-orange-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {selectedTx.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Monto Pagado</p>
                        <p className="text-xl font-black text-brand-primary mt-1">${selectedTx.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fecha Registro</p>
                        <p className="text-[11px] font-bold text-white mt-1">
                          {selectedTx.createdAt ? format(selectedTx.createdAt.toDate(), "EEEE dd 'de' MMMM, yyyy", { locale: es }) : '---'}
                        </p>
                      </div>
                    </div>

                    {selectedTx.description && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nota / Descripción</p>
                        <p className="text-xs font-medium text-gray-400 italic bg-black/20 p-3 rounded-lg border border-white/5">"{selectedTx.description}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={() => setSelectedTx(null)}
                    className="w-full rounded-xl bg-surface-700 py-3 text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all hover:bg-surface-600 active:scale-95"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
