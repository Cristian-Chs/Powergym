"use client";

import React, { createContext, useContext, useState } from "react";

export interface AdminContextType {
  activeView: string;
  setActiveView: (view: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState("inicio");

  return (
    <AdminContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
