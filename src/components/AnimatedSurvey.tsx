"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Dumbbell } from "./Icons";

/**
 * TUTORIAL: Definición de Tipos
 * ----------------------------
 * Definimos qué forma tiene una pregunta para que TypeScript nos ayude a evitar errores.
 */
interface Question {
  id: number;
  title: string;
  description: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: "¿Cuál es tu objetivo principal?",
    description: "Esto nos ayuda a personalizar tu rutina de entrenamiento.",
    options: ["Ganar Músculo", "Perder Peso", "Resistencia", "Salud General"],
  },
  {
    id: 2,
    title: "¿Cuántos días puedes entrenar?",
    description: "Sé realista con tu tiempo disponible por semana.",
    options: ["1-2 días", "3-4 días", "5+ días"],
  },
  {
    id: 3,
    title: "¿Tienes alguna lesión?",
    description: "La seguridad es lo primero en PowerGym.",
    options: ["No, estoy al 100%", "Sí, en las articulaciones", "Sí, en la espalda"],
  },
  {
    id: 4,
    title: "¿Cómo es tu alimentación?",
    description: "El 70% del éxito está en la cocina.",
    options: ["Balanceada", "Alta en Proteína", "Vegana/Vegetariana", "Sin control actual"],
  },
  {
    id: 5,
    title: "¿Nivel de experiencia?",
    description: "Dinos cuánto tiempo llevas levantando pesas.",
    options: ["Principiante (< 6 meses)", "Intermedio (1-2 años)", "Avanzado (> 3 años)"],
  },
];

export default function AnimatedSurvey() {
  /**
   * TUTORIAL: Manejo de Estado (useState)
   * ------------------------------------
   * 1. 'step': Rastrea en qué pregunta estamos (0 a 4).
   * 2. 'answers': Un objeto donde la clave es el ID de la pregunta y el valor es la respuesta seleccionada.
   * 3. 'isFinished': Para mostrar el mensaje final de éxito.
   * 4. 'direction': Para saber si la animación debe ir hacia la izquierda o derecha (opcional para más pulido).
   */
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [animating, setAnimating] = useState(false);

  const currentQuestion = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  /**
   * TUTORIAL: Navegación con Animación
   * ---------------------------------
   * Usamos un pequeño 'timeout' para cambiar el estado justo cuando la animación de salida termina,
   * creando un efecto fluido de "deslizamiento".
   */
  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setStep(step + 1);
        setAnimating(false);
      }, 300); // Coincide con la duración del CSS
    } else {
      setIsFinished(true);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setAnimating(true);
      setTimeout(() => {
        setStep(step - 1);
        setAnimating(false);
      }, 300);
    }
  };

  const selectOption = (option: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: option });
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary shadow-glow">
          <Check size={40} />
        </div>
        <h2 className="text-3xl font-black text-white uppercase italic">¡Perfil Creado!</h2>
        <p className="mt-4 text-gray-500 uppercase font-bold text-xs tracking-widest leading-relaxed">
          Hemos analizado tus metas. <br /> Tu plan personalizado está listo para comenzar.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 rounded-xl bg-brand-primary px-8 py-3 text-sm font-black text-white hover:scale-105 active:scale-95 transition-all shadow-glow shadow-brand-primary/20"
        >
          VER MI RUTINA
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/5 bg-surface-700 p-8 shadow-2xl relative">
      {/* 
        TUTORIAL: Barra de Progreso Dinámica
        Utilizamos el valor 'progress' calculado arriba para estirar el div naranja.
      */}
      <div className="absolute top-0 left-0 h-1 w-full bg-white/5">
        <div 
          className="h-full bg-brand-primary transition-all duration-700 ease-out shadow-glow shadow-brand-primary/50"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-brand-primary" size={20} />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Paso {step + 1} de {QUESTIONS.length}</span>
        </div>
        <span className="text-[10px] font-bold text-brand-primary uppercase">{Math.round(progress)}% Completado</span>
      </div>

      {/* 
        TUTORIAL: Contenedor Animado
        Aplicamos clases dinámicas para el efecto de entrada/salida.
      */}
      <div className={`transition-all duration-300 transform ${animating ? "opacity-0 translate-x-10" : "opacity-100 translate-x-0"}`}>
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight leading-tight">
          {currentQuestion.title}
        </h2>
        <p className="mt-2 text-sm text-gray-500 font-medium font-archivo">
          {currentQuestion.description}
        </p>

        <div className="mt-10 grid gap-4">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => selectOption(option)}
              className={`group flex items-center justify-between rounded-2xl border p-5 text-left transition-all duration-200 ${
                answers[currentQuestion.id] === option
                  ? "border-brand-primary bg-brand-primary/10 text-white shadow-xl shadow-brand-primary/10"
                  : "border-white/5 bg-surface-800 text-gray-400 hover:border-white/20 hover:bg-surface-600"
              }`}
            >
              <span className="text-sm font-bold uppercase tracking-tight">{option}</span>
              <div className={`h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center ${
                answers[currentQuestion.id] === option 
                ? "border-brand-primary bg-brand-primary text-white" 
                : "border-gray-700"
              }`}>
                {answers[currentQuestion.id] === option && <Check size={12} strokeWidth={4} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between gap-4 border-t border-white/5 pt-8">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-600 border border-white/5 text-gray-400 transition-all hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={handleNext}
          disabled={!answers[currentQuestion.id]}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-8 h-12 text-sm font-black text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shadow-glow shadow-brand-primary/20"
        >
          {step === QUESTIONS.length - 1 ? "FINALIZAR" : "SIGUIENTE"}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
