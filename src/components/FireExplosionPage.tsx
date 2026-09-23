import React from "react";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface FireExplosionPageProps {
  onBack: () => void;
  onOpenFireIdentification: () => void;
  onOpenExplosionIdentification: () => void;
  onOpenExitRouteIdentification: () => void;
  onOpenExtinguisherUse: () => void;
  onOpenEvacuationSequencing: () => void;
}

export const FireExplosionPage: React.FC<FireExplosionPageProps> = ({
  onBack,
  onOpenFireIdentification,
  onOpenExplosionIdentification,
  onOpenExitRouteIdentification,
  onOpenExtinguisherUse,
  onOpenEvacuationSequencing
}) => {
  const { t } = useLanguage();

  const boxes = [
    { label: t("fireIdentification"), onClick: onOpenFireIdentification },
    { label: t("explosionIdentification"), onClick: onOpenExplosionIdentification },
    { label: t("exitRoutesIdentification"), onClick: onOpenExitRouteIdentification },
    { label: t("fireExtinguisherUse"), onClick: onOpenExtinguisherUse },
    { label: t("evacuationSequencing"), onClick: onOpenEvacuationSequencing }
  ];

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

        {/* 5 Sub-modules Boxes Lined Up Vertically, Clean Theme */}
        <main className="flex-1 px-6 sm:px-8 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="space-y-4 sm:space-y-5">
            {boxes.map((b, i) => (
              <button
                key={i}
                onClick={b.onClick}
                className="w-full py-6 sm:py-7 px-6 rounded-2xl sm:rounded-3xl bg-[#eef7fe] hover:bg-[#e4f1fc] border border-[#dbeefe] text-center active:scale-[0.99] transition-all shadow-xs"
              >
                <span className="text-base sm:text-lg font-bold text-[#026aa7] tracking-tight">
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </main>

        {/* Clean Empty Bottom Spacer */}
        <div className="h-6 shrink-0"></div>

      </div>
    </div>
  );
};
