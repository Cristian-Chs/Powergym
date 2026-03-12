"use client";

import { useEffect, useState } from "react";

export default function BcvRate() {
  const [rate, setRate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRate() {
      try {
        const response = await fetch("/api/bcv");
        const data = await response.json();
        if (data.rate) {
          setRate(data.rate);
        }
      } catch (error) {
        console.error("Error fetching rate component:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRate();
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-32 animate-pulse rounded-lg bg-white/5" />
    );
  }

  if (!rate) {
    return (
      <div className="flex flex-col items-end">
        <p className="text-[10px] text-red-500/50 uppercase tracking-widest">
          Error al cargar tasa
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="text-[9px] text-brand-lime hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end text-right">
      <h1 className="text-2xl font-black tracking-tighter text-white sm:text-3xl">
        <span className="text-brand-primary">Bs.</span> {rate}
      </h1>
      <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
        Tasa del día (BCV)
      </p>
    </div>
  );
}
