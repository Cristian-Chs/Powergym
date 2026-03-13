"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminNotification } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { approvePayment, rejectPayment } from "@/lib/payment";
import { Bell, Trash2, Check, X } from "./Icons";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("date", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminNotification));
      setNotifications(docs);
    });

    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const [procId, setProcId] = useState<string | null>(null);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (e: any, n: AdminNotification) => {
    e.stopPropagation();
    if (!n.paymentId) return;
    setProcId(n.id);
    try {
      await approvePayment(n.paymentId, n.id);
    } catch (err) {
      alert("Error al aprobar pago");
    } finally {
      setProcId(null);
    }
  };

  const handleReject = async (e: any, n: AdminNotification) => {
    e.stopPropagation();
    if (!n.paymentId) return;
    if (!confirm("¿Rechazar este pago?")) return;
    setProcId(n.id);
    try {
      await rejectPayment(n.paymentId, n.id);
    } catch (err) {
      alert("Error al rechazar pago");
    } finally {
      setProcId(null);
    }
  };

  const handleDelete = async (e: any, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err) {
      alert("Error al eliminar notificación");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-800 border border-white/5 text-gray-400 transition-all hover:bg-surface-700 hover:text-white"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-lime text-[10px] font-bold text-surface-900">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/5 bg-surface-800 p-2 shadow-2xl animate-fade-in z-[100]">
          <div className="p-3 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notificaciones</h3>
            {unreadCount > 0 && <span className="text-[10px] text-brand-lime underline cursor-pointer" onClick={() => notifications.forEach((n: AdminNotification) => !n.read && markAsRead(n.id))}>Marcar todas como leídas</span>}
          </div>
          <div className="max-h-96 overflow-y-auto pt-2">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-xs text-gray-500 italic">No hay notificaciones</p>
            ) : (
              notifications.map((n: AdminNotification) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`group relative rounded-xl p-3 transition-all hover:bg-surface-700 cursor-pointer mb-1 ${!n.read ? 'bg-brand-lime/5' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-white leading-tight">Pago Pendiente</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">
                        {formatDistanceToNow(n.date.toDate(), { addSuffix: true, locale: es })}
                      </span>
                      <button
                        onClick={(e: any) => handleDelete(e, n.id)}
                        className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">
                    <span className="text-brand-lime font-medium">{n.userName}</span> envió un pago por <span className="text-white font-black">${n.amount}</span>.
                  </p>
                  
                  {n.method && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] bg-brand-lime/10 text-brand-lime px-1.5 py-0.5 rounded uppercase font-bold">
                        {n.method}
                      </span>
                      <span className="text-[10px] text-gray-500 truncate lowercase">
                        {n.details}
                      </span>
                    </div>
                  )}

                  {n.receiptUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-white/5">
                      <img 
                        src={n.receiptUrl} 
                        alt="Capture de pago" 
                        className="w-full h-auto max-h-48 object-cover cursor-pointer transition-transform hover:scale-105"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          if (n.receiptUrl) window.open(n.receiptUrl, "_blank");
                        }}
                      />
                    </div>
                  )}

                  {(!n.paymentStatus || n.paymentStatus === "pending") && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e: any) => handleApprove(e, n)}
                        disabled={procId === n.id}
                        className="flex-1 rounded-lg bg-brand-lime py-1.5 text-[10px] font-bold text-surface-900 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        {procId === n.id ? "..." : "Aprobar"}
                      </button>
                      <button
                        onClick={(e: any) => handleReject(e, n)}
                        disabled={procId === n.id}
                        className="flex-1 rounded-lg bg-surface-600 py-1.5 text-[10px] font-bold text-gray-300 transition-all hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      >
                        {procId === n.id ? "..." : "Rechazar"}
                      </button>
                    </div>
                  )}
                  
                  {n.paymentStatus === "completed" && (
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check size={12} strokeWidth={3} />
                        Pago Aprobado
                      </p>
                      <button
                        onClick={(e: any) => {
                          e.stopPropagation();
                          const message = encodeURIComponent(`Hola ${n.userName}, tu pago de $${n.amount} ha sido aprobado. ¡Gracias por tu reporte! Tu membresía ha sido actualizada.`);
                          window.open(`https://wa.me/?text=${message}`, "_blank");
                        }}
                        className="text-[9px] text-brand-lime hover:underline font-bold uppercase"
                      >
                        Avisar WhatsApp
                      </button>
                    </div>
                  )}

                  {n.paymentStatus === "rejected" && (
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                        <X size={12} strokeWidth={3} />
                        Pago Rechazado
                      </p>
                      <button
                        onClick={(e: any) => {
                          e.stopPropagation();
                          const message = encodeURIComponent(`Hola ${n.userName}, tu reporte de pago por $${n.amount} no ha podido ser validado. Por favor, verifica los datos y vuelve a intentarlo o contáctanos.`);
                          window.open(`https://wa.me/?text=${message}`, "_blank");
                        }}
                        className="text-[9px] text-brand-lime hover:underline font-bold uppercase"
                      >
                        Avisar WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
