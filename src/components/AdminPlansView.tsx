"use client";

import React, { useState } from "react";
import AdminPlanEditor from "@/components/AdminPlanEditor";
import AdminUserRoutineEditor from "@/components/AdminUserRoutineEditor";
import { Globe, UserCog } from "./Icons";

export default function AdminPlansView() {
  const [activeTab, setActiveTab] = useState<"global" | "personal">("global");

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Gestión de Planes</h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Edita las rutinas globales o personaliza el entrenamiento de cada cliente.
          </p>
        </div>
        
        <div className="flex gap-2 rounded-xl bg-surface-800 p-1 border border-white/5">
          <button
            onClick={() => setActiveTab("global")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase transition-all ${
              activeTab === "global" 
                ? "bg-brand-primary text-white shadow-glow shadow-brand-primary/20" 
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Globe size={14} />
            Planes Globales
          </button>
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase transition-all ${
              activeTab === "personal" 
                ? "bg-brand-primary text-white shadow-glow shadow-brand-primary/20" 
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <UserCog size={14} />
            Personalizados
          </button>
        </div>
      </div>

      <div className="transition-all duration-300">
        {activeTab === "global" ? (
          <section className="animate-fade-in">
            <AdminPlanEditor />
          </section>
        ) : (
          <section className="animate-fade-in">
            <AdminUserRoutineEditor />
          </section>
        )}
      </div>
    </div>
  );
}
