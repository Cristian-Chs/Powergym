"use client";

import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, GymEvent } from "@/types";
import { differenceInDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Users, UserCheck, UserMinus, ShieldCheck, ChevronLeft, ChevronRight, Plus } from "./Icons";

interface AdminInicioProps {
  stats: { total: number; active: number; pending: number; verifying: number };
}

export default function AdminInicio({ stats }: AdminInicioProps) {
  const [events, setEvents] = useState<GymEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const q = query(collection(db, "gym_events"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as GymEvent)));
    });
    return () => unsubscribe();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="animate-fade-in space-y-8">
      {/* KPI Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Clientes", value: stats.total, color: "text-gray-100", icon: Users, bg: "bg-surface-700" },
          { label: "Activos", value: stats.active, color: "text-emerald-400", icon: UserCheck, bg: "bg-surface-700" },
          { label: "Expirados", value: stats.pending, color: "text-red-400", icon: UserMinus, bg: "bg-surface-700" },
          { label: "Por Verificar", value: stats.verifying, color: "text-orange-400", icon: ShieldCheck, bg: "bg-orange-500/5 border-orange-500/20" },
        ].map((kpi, idx) => (
          <div key={idx} className={`card p-5 transition-all hover:scale-[1.02] ${kpi.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{kpi.label}</p>
                <p className={`mt-1 text-3xl font-black ${kpi.color}`}>{kpi.value}</p>
              </div>
              <div className={`rounded-xl p-3 ${kpi.color.replace('text', 'bg')}/10`}>
                <kpi.icon className={kpi.color} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Calendar */}
      <section className="card overflow-hidden !p-0">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Calendario de Eventos</h3>
            <p className="text-xs text-gray-500 font-medium capitalize mt-1">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-surface-800 p-1 border border-white/5 mr-4">
              <button onClick={prevMonth} className="p-1.5 text-gray-400 hover:bg-white/5 hover:text-white rounded-md transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCurrentMonth(new Date())} className="px-3 text-[10px] font-black uppercase text-gray-400 hover:text-white transition-colors">
                Hoy
              </button>
              <button onClick={nextMonth} className="p-1.5 text-gray-400 hover:bg-white/5 hover:text-white rounded-md transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-xs font-black text-white transition-all hover:shadow-glow active:scale-95 shadow-brand-primary/20">
              <Plus size={16} strokeWidth={3} />
              <span className="uppercase tracking-widest">Nuevo Evento</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-collapse">
          {calendarDays.map((day, idx) => {
            const dayEvents = events.filter(ev => isSameDay(ev.date.toDate(), day));
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <div 
                key={idx} 
                className={`min-h-[120px] border border-white/5 p-2 transition-colors hover:bg-white/[0.02] ${!isCurrentMonth ? "opacity-20 bg-black/20" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black ${
                    isToday 
                      ? "bg-brand-primary text-white shadow-glow shadow-brand-primary/30" 
                      : "text-gray-500"
                  }`}>
                    {format(day, "d")}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.map(ev => (
                    <div 
                      key={ev.id} 
                      className={`group relative rounded-md border p-1.5 text-[9px] font-bold leading-tight transition-all hover:scale-[1.02] ${
                        ev.isOpen 
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" 
                          : "border-red-500/20 bg-red-500/5 text-red-100"
                      }`}
                    >
                      <p className="truncate line-clamp-2 uppercase tracking-tighter">{ev.title}</p>
                      {!ev.isOpen && <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-red-400" />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
