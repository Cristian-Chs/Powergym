import { ExerciseDay } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Matches a given date to an exercise day from a list of routines.
 * Normalizes day names to handle "Lunes", "Martes", etc.
 */
export function getWorkoutForDate(date: Date, routines: ExerciseDay[]): ExerciseDay | undefined {
  if (!routines || routines.length === 0) return undefined;

  const dayName = format(date, "EEEE", { locale: es }); // e.g., "lunes"
  const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1); // e.g., "Lunes"

  // 1. Try exact match (e.g., "Lunes")
  let match = routines.find(r => r.day.toLowerCase() === dayName.toLowerCase());
  
  // 2. Try partial match if not found (e.g., "Lunes - Pecho" contains "Lunes")
  if (!match) {
    match = routines.find(r => r.day.toLowerCase().includes(dayName.toLowerCase()));
  }

  return match;
}

/**
 * Gets the current day of the week in Spanish.
 */
export function getTodayName(): string {
  const dayName = format(new Date(), "EEEE", { locale: es });
  return dayName.charAt(0).toUpperCase() + dayName.slice(1);
}
