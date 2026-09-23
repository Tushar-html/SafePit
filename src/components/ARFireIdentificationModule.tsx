import React, { useState } from "react";
import { ARShell } from "./ARShell";
import { FIRE_HAZARD_MODELS } from "../data/fireData";
import { FireHazardModel } from "../types";
import { create3DFireModel, updateFireAnimations, disposeFireModel } from "./fireModels3D";
import { useLanguage } from "../context/LanguageContext";
import { moduleLine } from "../i18n/moduleLines";

interface ARFireIdentificationModuleProps {
  onBack: () => void;
}

export const ARFireIdentificationModule: React.FC<ARFireIdentificationModuleProps> = ({ onBack }) => {
  const { t, lang } = useLanguage();
  const [currentFireIndex, setCurrentFireIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentFire: FireHazardModel = FIRE_HAZARD_MODELS[currentFireIndex];

  const handleNext = () => {
    if (currentLineIndex < currentFire.lines.length - 1) {
      setCurrentLineIndex(i => i + 1);
    } else if (currentFireIndex < FIRE_HAZARD_MODELS.length - 1) {
      setCurrentFireIndex(i => i + 1);
      setCurrentLineIndex(0);
    } else {
      setCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex(i => i - 1);
    } else if (currentFireIndex > 0) {
      const prevFire = FIRE_HAZARD_MODELS[currentFireIndex - 1];
      setCurrentFireIndex(i => i - 1);
      setCurrentLineIndex(prevFire.lines.length - 1);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Critical Risk": return "text-[#dc2626]";
      case "High Risk": return "text-[#854d0e]";
      case "Moderate Risk": return "text-[#b45309]";
      default: return "text-[#0369a1]";
    }
  };

  return (
    <ARShell
      onBack={onBack}
      title={currentFire.displayName}
      readyText={t("arReadyFire")}
      completedText={t("completedFire")}
      lineText={moduleLine(lang, `fire:${currentFireIndex}:${currentLineIndex}`)}
      voiceText={lang === "sat" ? moduleLine("hi", `fire:${currentFireIndex}:${currentLineIndex}`) : undefined}
      footerCaption="Live AR Environment · Pinch / +/- to Zoom · Drag to Rotate"
      scanHint={t("scanFloorHint")}
      modelKey={`${currentFireIndex}-${completed ? "done" : "run"}`}
      createModel={() => create3DFireModel(currentFire.modelType)}
      updateModel={(g, elapsed, delta) => updateFireAnimations(g, delta, elapsed)}
      disposeModel={disposeFireModel}
      progressLabel={`${currentFireIndex + 1} / ${FIRE_HAZARD_MODELS.length} · ${t("line")} ${currentLineIndex + 1} / ${currentFire.lines.length}`}
      canPrev={!(currentFireIndex === 0 && currentLineIndex === 0)}
      canNext={!completed}
      onPrev={handlePrev}
      onNext={handleNext}
      completedSignal={completed}
      onRestart={() => {
        setCurrentFireIndex(0);
        setCurrentLineIndex(0);
        setCompleted(false);
      }}
      badge={
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="bg-white/95 backdrop-blur-sm px-4 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] text-xs font-bold tracking-tight">
            <span className={getRiskColor(currentFire.hazardLevel)}>{currentFire.hazardLevel}</span>
          </div>
        </div>
      }
    />
  );
};
