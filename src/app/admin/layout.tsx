"use client";

import AdminSidebar from "@/components/AdminSidebar";
import React, { useState } from "react";
import { Menu } from "@/components/Icons";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeView, setActiveView] = useState("inicio");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-900">
      <AdminSidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header Toggle */}
        <header className="flex h-16 items-center border-b border-white/5 bg-[#121212]/50 px-4 backdrop-blur-md lg:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm font-bold tracking-tight text-white uppercase italic">Power<span className="text-brand-primary">Gym</span></span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl">
            {/* Cloned children with activeView injected if needed, 
                or just handle routing via AdminPage. 
                Given current structure, AdminPage will handle inner routing based on state. 
             */}
            {React.isValidElement(children) 
              ? React.cloneElement(children as React.ReactElement<any>, { activeView }) 
              : children}
          </div>
        </main>
      </div>
    </div>
  );
}
