import React from "react";
import { ArrowLeft, Clock } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface ComingSoonPageProps {
  titleKey: "gas" | "machinery";
  onBack: () => void;
}

/** Placeholder page for modules that are still under construction. */
export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ titleKey, onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#edf6fc] flex flex-col items-center justify-center sm:py-6 sm:px-4 font-sans select-none">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[720px] sm:rounded-3xl shadow-sm sm:border sm:border-[#e2eaf2] flex flex-col overflow-hidden">

        <header className="w-full bg-white border-b border-[#f1f5f9] h-14 sm:h-16 flex items-center justify-between px-5 shrink-0">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#f0f7fe] text-[#0284c7] hover:bg-[#e0f0fc] flex items-center justify-center transition-colors active:scale-95"
            title={t("back")}
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <div className="flex items-center justify-center">
            <img src="logo.png" alt="SafePit" className="h-7 w-auto object-contain" />
          </div>
          <div className="w-9 h-9"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f0f7fe] flex items-center justify-center mb-5">
            <Clock className="w-7 h-7 text-[#0284c7]" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0f2942] tracking-tight mb-2">
            {t(titleKey)}
          </h1>
          <p className="text-sm text-[#64748b] leading-relaxed max-w-[260px]">
            {t("comingSoonBody")}
          </p>
        </main>

        <div className="h-10 sm:h-12 shrink-0"></div>
      </div>
    </div>
  );
};

export const GasSafetyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <ComingSoonPage titleKey="gas" onBack={onBack} />
);

export const MachinerySafetyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <ComingSoonPage titleKey="machinery" onBack={onBack} />
);
