import React from "react";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface ModulesPageProps {
  onBack: () => void;
  onSelectSubModule: (moduleName: "fire_explosion" | "gas" | "machinery") => void;
}

export const ModulesPage: React.FC<ModulesPageProps> = ({
  onBack,
  onSelectSubModule
}) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#edf6fc] flex flex-col items-center justify-center sm:py-6 sm:px-4 font-sans select-none">
      
      {/* Central Mobile / Card Frame (White) */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[720px] sm:rounded-3xl shadow-sm sm:border sm:border-[#e2eaf2] flex flex-col justify-between overflow-hidden">
        
        {/* Top Header: Circular Back Button on Left, Centered Logo */}
        <header className="w-full bg-white border-b border-[#f1f5f9] h-14 sm:h-16 flex items-center justify-between px-5 relative shrink-0">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#f0f7fe] text-[#0284c7] hover:bg-[#e0f0fc] flex items-center justify-center transition-colors active:scale-95"
            title={t("back")}
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>

          <div className="flex items-center justify-center">
            <img
              src="logo.png"
              alt="SafePit"
              className="h-7 w-auto object-contain"
            />
          </div>

          <div className="w-9 h-9"></div>
        </header>

        {/* 3 Modules Boxes Lined Up Vertically */}
        <main className="flex-1 px-6 sm:px-8 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="space-y-4 sm:space-y-5">
            
            {/* Box 1: Fire & explosion */}
            <button
              onClick={() => onSelectSubModule("fire_explosion")}
              className="w-full py-7 sm:py-8 px-6 rounded-2xl sm:rounded-3xl bg-[#eef7fe] hover:bg-[#e4f1fc] border border-[#dbeefe] text-center active:scale-[0.99] transition-all shadow-xs"
            >
              <span className="block text-base sm:text-lg font-bold text-[#026aa7] tracking-tight">
                {t("fireExplosion")}
              </span>
              <span className="block text-[11px] text-[#64748b] mt-1">
                {t("fireExplosionDesc")}
              </span>
            </button>

            {/* Box 2: Gas (coming soon) */}
            <button
              onClick={() => onSelectSubModule("gas")}
              className="w-full py-7 sm:py-8 px-6 rounded-2xl sm:rounded-3xl bg-[#eef7fe] hover:bg-[#e4f1fc] border border-[#dbeefe] text-center active:scale-[0.99] transition-all shadow-xs"
            >
              <span className="block text-base sm:text-lg font-bold text-[#026aa7] tracking-tight">
                {t("gas")}
              </span>
              <span className="block text-[11px] text-[#64748b] mt-1">
                {t("gasDesc")}
              </span>
            </button>

            {/* Box 3: Machinery (coming soon) */}
            <button
              onClick={() => onSelectSubModule("machinery")}
              className="w-full py-7 sm:py-8 px-6 rounded-2xl sm:rounded-3xl bg-[#eef7fe] hover:bg-[#e4f1fc] border border-[#dbeefe] text-center active:scale-[0.99] transition-all shadow-xs"
            >
              <span className="block text-base sm:text-lg font-bold text-[#026aa7] tracking-tight">
                {t("machinery")}
              </span>
              <span className="block text-[11px] text-[#64748b] mt-1">
                {t("machineryDesc")}
              </span>
            </button>

          </div>
        </main>

        <div className="h-10 sm:h-12 shrink-0"></div>

      </div>
    </div>
  );
};
