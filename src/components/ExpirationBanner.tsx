"use client";

import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { getMembershipStatus } from "@/lib/membership";
import { Calendar } from "./Icons";

interface Props {
  subscriptionEnd: Date;
}

export default function ExpirationBanner({ subscriptionEnd }: Props) {
  const today = new Date();
  const daysLeft = differenceInDays(subscriptionEnd, today);
  const { isExpired } = getMembershipStatus(subscriptionEnd);
  const isUrgent = daysLeft >= 0 && daysLeft < 5;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 transition-all ${
        isExpired
          ? "border-red-500/40 bg-red-950/30"
          : isUrgent
            ? "border-amber-500/40 bg-amber-950/30"
            : "border-brand-primary/20 bg-surface-700"
      }`}
    >
      {/* Glow accent */}
      <div
        className={`pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl ${
          isExpired
            ? "bg-red-500/20"
            : isUrgent
              ? "bg-amber-500/20"
              : "bg-brand-primary/10"
        }`}
      />

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium tracking-wider text-gray-400 uppercase">
            Suscripción
          </h3>

          {isExpired ? (
            <>
              <p className="mt-1 text-2xl font-bold text-red-400">Expirada</p>
              <p className="mt-1 text-sm text-red-300/70">
                Tu suscripción venció el{" "}
                {format(subscriptionEnd, "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </>
          ) : isUrgent ? (
            <>
              <p className="mt-1 text-2xl font-bold text-amber-400">
                {daysLeft === 0
                  ? "¡Vence hoy!"
                  : `${daysLeft} día${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`}
              </p>
              <p className="mt-1 text-sm text-amber-300/70">
                Renueva antes del{" "}
                {format(subscriptionEnd, "d 'de' MMMM", { locale: es })} para no
                perder acceso.
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-2xl font-bold text-brand-primary">
                {daysLeft} días restantes
              </p>
              <p className="mt-1 text-sm text-brand-primary/70">
                Próximo pago:{" "}
                {format(subscriptionEnd, "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </>
          )}
        </div>

        {/* Icon */}
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
            isExpired
              ? "bg-red-500/20 text-red-400"
              : isUrgent
                ? "bg-amber-500/20 text-amber-400"
                : "bg-brand-primary/10 text-brand-primary"
          }`}
        >
          <Calendar size={28} />
        </div>
      </div>
    </div>
  );
}
