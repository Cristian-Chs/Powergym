"use client";

import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, GymEvent } from "@/types";
import { differenceInDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Users, UserCheck, UserMinus, ShieldCheck, ChevronLeft, ChevronRight, Plus, X, Calendar } from "./Icons";

interface AdminInicioProps {
  stats: { total: number; active: number; pending: number; verifying: number };
}

export default function AdminInicio({ stats }: AdminInicioProps) {
  const [events, setEvents] = useState<GymEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    title: "",
    description: "",
    isOpen: true
  });

  useEffect(() => {
    const q = query(collection(db, "gym_events"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as GymEvent)));
    });
    return () => unsubscribe();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.title) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, "gym_events"), {
        date: Timestamp.fromDate(new Date(formData.date + "T00:00:00")),
        title: formData.title,
        description: formData.description,
        isOpen: formData.isOpen
      });
      setIsModalOpen(false);
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), title: "", description: "", isOpen: true });
    } catch (error) {
      alert("Error al crear evento");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Eliminar este evento?")) {
      await deleteDoc(doc(db, "gym_events", id));
    }
  };

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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-xs font-black text-white transition-all hover:shadow-glow active:scale-95 shadow-brand-primary/20"
            >
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
                className={`min-h-[140px] border border-white/5 p-2 transition-colors hover:bg-white/[0.02] ${!isCurrentMonth ? "opacity-20 bg-black/20" : ""}`}
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
                      className={`group relative rounded-md border p-2 text-[9px] font-bold leading-tight transition-all hover:scale-[1.02] ${
                        ev.isOpen 
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" 
                          : "border-red-500/20 bg-red-500/5 text-red-100"
                      }`}
                    >
                      <button 
                        onClick={(e) => handleDeleteEvent(ev.id, e)}
                        className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                      >
                        <X size={10} strokeWidth={4} />
                      </button>
                      <p className="truncate uppercase tracking-tighter">{ev.title}</p>
                      {ev.description && <p className="mt-0.5 opacity-50 line-clamp-1 italic">{ev.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md animate-fade-in rounded-2xl border border-white/10 bg-surface-800 p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Crear Nuevo Evento</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Calendario PowerGym</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Fecha del Evento</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl bg-surface-900 border border-white/10 pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-brand-primary/50 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Título / Nombre</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. Feriado Semana Santa"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl bg-surface-900 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-brand-primary/50 transition-all placeholder:text-gray-700 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Descripción (Opcional)</label>
                <textarea 
                  placeholder="Detalles sobre el horario o motivo..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-24 rounded-xl bg-surface-900 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-brand-primary/50 transition-all placeholder:text-gray-700 font-bold resize-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-surface-900 p-4 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${formData.isOpen ? 'bg-emerald-500 shadow-glow shadow-emerald-500/50' : 'bg-red-500 shadow-glow shadow-red-500/50'}`} />
                  <span className="text-xs font-black uppercase text-gray-300">Gimnasio Abierto</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isOpen: !formData.isOpen })}
                  className={`relative flex h-6 w-12 items-center rounded-full transition-colors ${formData.isOpen ? 'bg-brand-primary' : 'bg-surface-700'}`}
                >
                  <span className={`h-4 w-4 rounded-full bg-white transition-transform ${formData.isOpen ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-primary py-4 text-xs font-black text-white uppercase tracking-[0.2em] transition-all hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-4 shadow-brand-primary/50 overflow-hidden relative"
              >
                {loading ? "Procesando..." : "Crear Evento"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
