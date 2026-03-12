"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { userProfile, logout, loading } = useAuth();
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
        { label: "Panel Admin", href: "/admin", icon: ShieldIcon },
        { label: "Cerrar Sesión", href: null, icon: LogoutIcon, danger: true },
      ]
    : [
        { label: "Perfil", href: "/dashboard", icon: UserIcon },
        { label: "Mi Membresía", href: "/dashboard/membresia", icon: StarIcon },
        { label: "Configuración de la Cuenta", href: "/dashboard/cuenta", icon: SettingsIcon },
        { label: "Cerrar Sesión", href: null, icon: LogoutIcon, danger: true },
      ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-surface-900/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary shadow-glow transition-transform group-hover:scale-110">
            {/* Dumbbell / bolt icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <span className="text-xl font-black tracking-tight text-white">
              Power<span className="text-brand-primary">Gym</span>
            </span>
            <span className="hidden text-xs font-medium text-gray-500 sm:block">
              Gestión de Gimnasio
            </span>
          </div>
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

/* ── Inline icon components ─────────────────────────────────── */
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1118.88 6.196M12 12a4 4 0 110-8 4 4 0 010 8z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.95-.69l1.519-4.674z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
