"use client";

import AnimatedSurvey from "@/components/AnimatedSurvey";

export default function SurveyPage() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            Análisis de <span className="text-brand-primary">Potencial</span>
          </h1>
          <p className="text-gray-500 uppercase font-bold text-xs tracking-widest">
            Responde estas preguntas para que podamos llevar tu entrenamiento al siguiente nivel.
          </p>
        </div>
        
        <AnimatedSurvey />
      </div>
    </div>
  );
}
