"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, Star, Settings, LogOut, Shield } from "./Icons";

export default function Navbar() {
  const { userProfile, logout, loading } = useAuth() as any;
  const [open, setOpen] = useState(false as boolean);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (loading || !userProfile) return null;

  const isAdmin = userProfile.role === "admin";

  const menuItems = isAdmin
    ? [
        { label: "Panel Admin", href: "/admin", icon: Shield },
        { label: "Cerrar Sesión", href: null, icon: LogOut, danger: true },
      ]
    : [
        { label: "Perfil", href: "/dashboard", icon: User },
        { label: "Mi Membresía", href: "/dashboard/membresia", icon: Star },
        { label: "Configuración de la Cuenta", href: "/dashboard/cuenta", icon: Settings },
        { label: "Cerrar Sesión", href: null, icon: LogOut, danger: true },
      ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-surface-900/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2.5 group">
          <img 
            src="/logo.png" 
            alt="PowerGym Logo" 
            className="h-10 w-auto transition-transform group-hover:scale-105"
          />
        </Link>

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v: boolean) => !v)}
            className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-surface-800/60 px-3 py-2 transition-all hover:border-brand-primary/30 hover:bg-surface-700"
          >
            {/* Avatar */}
            {userProfile.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt=""
                className="h-7 w-7 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/20 text-xs font-bold text-brand-primary">
                {userProfile.displayName?.charAt(0).toUpperCase() ?? "U"}
              </div>
            )}

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-none text-gray-100">
                {userProfile.displayName?.split(" ")[0] ?? "Usuario"}
              </p>
              <p className="mt-0.5 text-[10px] leading-none text-gray-500">
                {isAdmin ? "Administrador" : "Cliente"}
              </p>
            </div>

            {/* Chevron */}
            <svg
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 animate-fade-in overflow-hidden rounded-2xl border border-white/8 bg-surface-800 shadow-2xl">
              {/* User header */}
              <div className="border-b border-white/5 px-4 py-3">
                <p className="text-sm font-bold text-gray-100 truncate">
                  {userProfile.displayName ?? "Usuario"}
                </p>
                <p className="text-xs text-gray-500 truncate">{userProfile.email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                {menuItems.map((item) =>
                  item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                        item.danger
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      } ${pathname === item.href ? "bg-brand-primary/10 text-brand-primary" : ""}`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      onClick={() => { setOpen(false); logout(); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}


