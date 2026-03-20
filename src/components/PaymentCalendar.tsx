import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GymEvent } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { X } from "./Icons";

interface Props {
  subscriptionEnd: Date;
}

export default function PaymentCalendar({ subscriptionEnd }: Props) {
  const [events, setEvents] = useState<GymEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<GymEvent | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "gym_events"), 
      (snap) => {
        setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as GymEvent)));
      },
      (error) => {
        console.error("Error al cargar eventos del calendario:", error);
        // Error silencioso para el usuario para no romper la UI, 
        // probablemente falta de permisos para usuarios no administradores
      }
    );
    return () => unsubscribe();
  }, []);

  const closedDays = events.filter((e: GymEvent) => !e.isOpen).map((e: GymEvent) => e.date.toDate());
  const specialEvents = events.filter((e: GymEvent) => e.isOpen).map((e: GymEvent) => e.date.toDate());

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    const event = events.find((e: GymEvent) => {
      const eDate = e.date.toDate();
      return eDate.getDate() === day.getDate() &&
             eDate.getMonth() === day.getMonth() &&
             eDate.getFullYear() === day.getFullYear();
    });
    setSelectedEvent(event || null);
  };

  return (
    <div className="relative rounded-2xl border border-white/5 bg-surface-700 p-6">
      <h3 className="mb-4 text-sm font-medium tracking-wider text-gray-400 uppercase">
        Calendario de Actividades
      </h3>
      <div className="flex justify-center [&_.rdp]:text-gray-200">
        <DayPicker
          mode="single"
          selected={subscriptionEnd}
          onDayClick={handleDayClick}
          modifiers={{
            payment: subscriptionEnd,
            closed: closedDays,
            event: specialEvents
          }}
          modifiersStyles={{
            payment: {
              backgroundColor: "#48C774",
              color: "#0a0a0f",
              fontWeight: 700,
              borderRadius: "9999px",
            },
            closed: {
              color: "#f87171",
              fontWeight: 900,
              textDecoration: "underline"
            },
            event: {
              color: "#F26722",
              fontWeight: 800
            }
          }}
          styles={{
            caption: { color: "#f97316" },
            head_cell: { color: "#6b7280", fontSize: "0.75rem" },
            day: { color: "#d1d5db" },
            nav_button: { color: "#f97316" },
          }}
          className="!bg-transparent"
        />
      </div>

      {/* Event Details Popup */}
      {selectedDay && (
        <div className="absolute inset-x-0 bottom-0 z-20 mx-4 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-xl border border-white/10 bg-surface-800 p-4 shadow-2xl backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                {format(selectedDay, "dd 'de' MMMM", { locale: es })}
              </span>
              <button 
                onClick={() => setSelectedDay(undefined)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            {selectedEvent ? (
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{selectedEvent.title}</h4>
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${selectedEvent.isOpen ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {selectedEvent.isOpen ? "Abierto" : "Cerrado"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">{selectedEvent.description}</p>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">No hay eventos programados para este día.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-4 border-t border-white/5 pt-4">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="h-2 w-2 rounded-full bg-brand-mint" /> Pago
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="h-2 w-2 rounded-full bg-red-400" /> Cerrado
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="h-2 w-2 rounded-full bg-brand-primary" /> Evento
        </div>
      </div>
    </div>
  );
}
