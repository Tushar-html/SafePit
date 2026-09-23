import React, { useState } from "react";
import { ARShell } from "./ARShell";
import { EXIT_ROUTE_MODELS, ExitRouteModel } from "../data/exitRouteData";
import { create3DExitRouteModel, updateExitRouteAnimations, disposeExitRouteModel } from "./exitRouteModels3D";
import { useLanguage } from "../context/LanguageContext";
import { moduleLine } from "../i18n/moduleLines";

interface ARExitRouteIdentificationModuleProps {
  onBack: () => void;
}

export const ARExitRouteIdentificationModule: React.FC<ARExitRouteIdentificationModuleProps> = ({ onBack }) => {
  const { t, lang } = useLanguage();
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentRoute: ExitRouteModel = EXIT_ROUTE_MODELS[currentRouteIndex];

  const handleNext = () => {
    if (currentLineIndex < currentRoute.lines.length - 1) {
      setCurrentLineIndex(i => i + 1);
    } else if (currentRouteIndex < EXIT_ROUTE_MODELS.length - 1) {
      setCurrentRouteIndex(i => i + 1);
      setCurrentLineIndex(0);
    } else {
      setCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex(i => i - 1);
    } else if (currentRouteIndex > 0) {
      const prevRoute = EXIT_ROUTE_MODELS[currentRouteIndex - 1];
      setCurrentRouteIndex(i => i - 1);
      setCurrentLineIndex(prevRoute.lines.length - 1);
    }
  };

  const getStatusColor = (level: string) => {
    if (level.includes("Safe Haven")) return "text-[#16a34a]";
    if (level.includes("Alternate")) return "text-[#ea580c]";
    if (level.includes("Vertical")) return "text-[#ca8a04]";
    return "text-[#0284c7]";
  };

  return (
    <ARShell
      onBack={onBack}
      title={currentRoute.displayName}
      readyText={t("arReadyExit")}
      completedText={t("completedExit")}
      lineText={moduleLine(lang, `exit:${currentRouteIndex}:${currentLineIndex}`)}
      voiceText={lang === "sat" ? moduleLine("hi", `exit:${currentRouteIndex}:${currentLineIndex}`) : undefined}
      footerCaption="Live AR Environment · Drill auto-replays · Pinch / +/- to Zoom"
      scanHint={t("scanFloorHint")}
      modelKey={`${currentRouteIndex}-${completed ? "done" : "run"}`}
      createModel={() => create3DExitRouteModel(currentRoute.modelType)}
      updateModel={(g, elapsed, delta) => updateExitRouteAnimations(g, currentRoute.modelType, elapsed, delta)}
      disposeModel={disposeExitRouteModel}
      progressLabel={`${currentRouteIndex + 1} / ${EXIT_ROUTE_MODELS.length} · ${t("step")} ${currentLineIndex + 1} / ${currentRoute.lines.length}`}
      canPrev={!(currentRouteIndex === 0 && currentLineIndex === 0)}
      canNext={!completed}
      onPrev={handlePrev}
      onNext={handleNext}
      completedSignal={completed}
      onRestart={() => {
        setCurrentRouteIndex(0);
        setCurrentLineIndex(0);
        setCompleted(false);
      }}
      badge={
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="bg-white/95 backdrop-blur-sm px-4 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] text-xs font-bold tracking-tight">
            <span className={getStatusColor(currentRoute.hazardLevel)}>{currentRoute.hazardLevel}</span>
          </div>
        </div>
      }
    />
  );
};
