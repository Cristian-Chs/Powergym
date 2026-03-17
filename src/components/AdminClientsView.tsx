"use client";

import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Search, UserCheck, UserMinus, MessageCircle, MoreVertical, ShieldCheck } from "./Icons";

export default function AdminClientsView() {
  const [clients, setClients] = React.useState([] as UserProfile[]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filter, setFilter] = React.useState("all" as "all" | "active" | "expired");

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "!=", "admin"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setClients(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    });
    return () => unsubscribe();
  }, []);

  const filteredClients = clients.filter((c: UserProfile) => {
    const matchesSearch = (c.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === "all") return matchesSearch;
    
    const isExpired = !c.subscriptionEnd || differenceInDays(c.subscriptionEnd.toDate(), new Date()) < 0;
    if (filter === "active") return matchesSearch && !isExpired;
    if (filter === "expired") return matchesSearch && isExpired;
    
    return matchesSearch;
  });

  const getStatus = (c: UserProfile) => {
    if (!c.subscriptionEnd) return { label: "SIN PLAN", color: "bg-gray-500/10 text-gray-400" };
    const days = differenceInDays(c.subscriptionEnd.toDate(), new Date());
    if (days < 0) return { label: "EXPIRADO", color: "bg-red-500/10 text-red-100" };
    if (days <= 7) return { label: "POR VENCER", color: "bg-orange-500/10 text-orange-400" };
    return { label: "ACTIVO", color: "bg-emerald-500/10 text-emerald-400" };
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-surface-800 border border-white/10 pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-brand-primary/50 transition-all placeholder:text-gray-700 font-bold"
          />
        </div>
        <div className="flex gap-2 p-1 rounded-xl bg-surface-800 border border-white/5">
          {(["all", "active", "expired"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? "bg-brand-primary text-white shadow-glow shadow-brand-primary/20" : "text-gray-500 hover:text-white"
              }`}
            >
              {f === "all" ? "Todos" : f === "active" ? "Activos" : "Expirados"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Clients */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredClients.map((client: UserProfile) => {
          const status = getStatus(client);
          return (
            <div key={client.uid} className="group relative card p-0 overflow-hidden transition-all hover:scale-[1.02] hover:border-brand-primary/30">
              {/* Header with Background/Banner Placeholder */}
              <div className="h-20 w-full bg-gradient-to-br from-surface-700 to-surface-800 opacity-50" />
              
              {/* Profile Pic Floating */}
              <div className="absolute top-10 left-6">
                <div className="h-20 w-20 rounded-2xl border-[4px] border-surface-900 bg-surface-800 overflow-hidden shadow-2xl relative group-hover:border-brand-primary/30 transition-all">
                  {client.photoURL ? (
                    <img src={client.photoURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-brand-primary/10 text-brand-primary">
                      <ShieldCheck size={32} />
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-lg ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="p-6 pt-12">
                <div className="mb-4">
                  <h4 className="text-lg font-black text-white uppercase italic tracking-tighter truncate leading-none">
                    {client.displayName || 'Sin Nombre'}
                  </h4>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-1">
                    {client.email || 'Sin Email'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">Membresía</p>
                      <p className="text-[11px] font-bold text-white mt-1 uppercase truncate font-mono">
                        {client.planId || 'Standard'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">Vence en</p>
                      <p className="text-[11px] font-bold text-brand-primary mt-1">
                        {client.subscriptionEnd 
                          ? `${differenceInDays(client.subscriptionEnd.toDate(), new Date())} días` 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <button className="flex h-10 items-center gap-2 rounded-xl bg-emerald-500/10 px-4 text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white"
                        onClick={() => {
                          const phone = client.phone || client.phoneNumber || "";
                          const name = client.displayName || "Cliente";
                          const message = encodeURIComponent(`Hola ${name}, te escribimos de PowerGym.`);
                          window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                        }}
                      >
                        <MessageCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                      </button>
                    </div>
                    
                    <div className="relative group/menu">
                      <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-700 text-gray-400 hover:text-white transition-all">
                        <MoreVertical size={16} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute bottom-full right-0 mb-2 w-48 scale-95 opacity-0 pointer-events-none group-focus-within/menu:scale-100 group-focus-within/menu:opacity-100 group-focus-within/menu:pointer-events-auto transition-all duration-200 z-50">
                        <div className="rounded-xl border border-white/10 bg-surface-800 p-2 shadow-2xl backdrop-blur-xl">
                          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                            Ver Perfil
                          </button>
                          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                            Editar Plan
                          </button>
                          <div className="my-1 border-t border-white/5" />
                          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:bg-red-500/10 hover:text-red-500 transition-colors">
                            Suspender
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="font-black uppercase tracking-widest text-xs italic">No se encontraron clientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
