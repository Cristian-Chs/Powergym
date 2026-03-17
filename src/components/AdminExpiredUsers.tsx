"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminExpiredUsers() {
  const [expiredUsers, setExpiredUsers] = useState([] as UserProfile[]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "client"),
      where("status", "==", "inactive")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      // Secondary filter for subscriptionEnd if status is not enough
      const now = new Date();
      const actualExpired = users.filter(u => u.subscriptionEnd && u.subscriptionEnd.toDate() < now);
      
      setExpiredUsers(actualExpired);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendWhatsApp = (user: UserProfile) => {
    const phone = user.phoneNumber || user.phone || "";
    const name = user.displayName || "Cliente";
    const message = encodeURIComponent(`Hola ${name}, te recordamos que tu membresía en PowerGym ha expirado. ¡Te esperamos pronto para seguir entrenando!`);
    const cleanPhone = phone.replace(/\+/g, '').replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  if (loading) return <div className="p-4 text-gray-500">Cargando usuarios expirados...</div>;

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-800 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-red-400/5">
        <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">Usuarios con Membresía Expirada</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] font-black uppercase text-gray-500">
              <th className="px-6 py-3">Usuario</th>
              <th className="px-6 py-3">Expiró</th>
              <th className="px-6 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {expiredUsers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No hay usuarios expirados.</td>
              </tr>
            ) : (
              expiredUsers.map((user: UserProfile) => (
                <tr key={user.uid} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm">
                    <p className="font-bold text-gray-100">{user.displayName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {user.subscriptionEnd ? format(user.subscriptionEnd.toDate(), "dd/MM/yyyy") : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => sendWhatsApp(user)}
                      className="rounded-lg bg-green-500/10 px-3 py-1.5 text-[10px] font-bold text-green-500 hover:bg-green-500/20 transition-colors"
                    >
                      NOTIFICAR WHATSAPP
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
