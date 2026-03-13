"use client";

import React from "react";
import { 
  LayoutDashboard, 
  History, 
  ClipboardList, 
  Menu, 
  X 
} from "./Icons";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: any) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
  { id: "inicio", label: "Inicio", icon: LayoutDashboard },
  { id: "transacciones", label: "Transacciones", icon: History },
  { id: "planes", label: "Gestión de Planes", icon: ClipboardList },
];

export default function AdminSidebar({ activeView, setActiveView, isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[#121212] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col border-r border-white/5">
          {/* Logo Section */}
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center">
                <span className="font-black text-white text-lg italic">P</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white uppercase italic">Power<span className="text-brand-primary">Gym</span></span>
            </div>
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="mt-6 flex-1 space-y-2 px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold uppercase transition-all ${
                  activeView === item.id
                    ? "bg-brand-primary/10 text-brand-primary shadow-glow shadow-brand-primary/10 border border-brand-primary/20"
                    : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                }`}
              >
                <item.icon size={18} strokeWidth={activeView === item.id ? 2.5 : 2} />
                <span className="tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer Info */}
          <div className="p-6 border-t border-white/5">
            <div className="rounded-xl bg-surface-800 p-4 border border-white/5">
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-300 uppercase">Personal Activo</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
