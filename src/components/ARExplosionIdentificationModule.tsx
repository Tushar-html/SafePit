import React, { useState } from "react";
import { ARShell } from "./ARShell";
import { EXPLOSION_HAZARD_MODELS, ExplosionHazardModel } from "../data/explosionData";
import { create3DExplosionModel, updateExplosionAnimations, disposeExplosionModel } from "./explosionModels3D";
import { useLanguage } from "../context/LanguageContext";
import { moduleLine } from "../i18n/moduleLines";

interface ARExplosionIdentificationModuleProps {
  onBack: () => void;
}

export const ARExplosionIdentificationModule: React.FC<ARExplosionIdentificationModuleProps> = ({ onBack }) => {
  const { t, lang } = useLanguage();
  const [currentExplosionIndex, setCurrentExplosionIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentExplosion: ExplosionHazardModel = EXPLOSION_HAZARD_MODELS[currentExplosionIndex];

  const handleNext = () => {
    if (currentLineIndex < currentExplosion.lines.length - 1) {
      setCurrentLineIndex(i => i + 1);
    } else if (currentExplosionIndex < EXPLOSION_HAZARD_MODELS.length - 1) {
      setCurrentExplosionIndex(i => i + 1);
      setCurrentLineIndex(0);
    } else {
      setCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex(i => i - 1);
    } else if (currentExplosionIndex > 0) {
      const prevExp = EXPLOSION_HAZARD_MODELS[currentExplosionIndex - 1];
      setCurrentExplosionIndex(i => i - 1);
      setCurrentLineIndex(prevExp.lines.length - 1);
    }
  };

  const getRiskColor = (level: string) => {
    if (level.includes("Critical")) return "text-[#dc2626]";
    if (level.includes("High")) return "text-[#ea580c]";
    return "text-[#ca8a04]";
  };

  return (
    <ARShell
      onBack={onBack}
      title={currentExplosion.displayName}
      readyText={t("arReadyExplosion")}
      completedText={t("completedExplosion")}
      lineText={moduleLine(lang, `explo:${currentExplosionIndex}:${currentLineIndex}`)}
      voiceText={lang === "sat" ? moduleLine("hi", `explo:${currentExplosionIndex}:${currentLineIndex}`) : undefined}
      footerCaption="Live AR Environment · Blast loops · Pinch / +/- to Zoom"
      scanHint={t("scanFloorHint")}
      modelKey={`${currentExplosionIndex}-${completed ? "done" : "run"}`}
      createModel={() => create3DExplosionModel(currentExplosion.modelType)}
      updateModel={(g, elapsed, delta) => updateExplosionAnimations(g, currentExplosion.modelType, elapsed, delta)}
      disposeModel={disposeExplosionModel}
      progressLabel={`${currentExplosionIndex + 1} / ${EXPLOSION_HAZARD_MODELS.length} · ${t("line")} ${currentLineIndex + 1} / ${currentExplosion.lines.length}`}
      canPrev={!(currentExplosionIndex === 0 && currentLineIndex === 0)}
      canNext={!completed}
      onPrev={handlePrev}
      onNext={handleNext}
      completedSignal={completed}
      onRestart={() => {
        setCurrentExplosionIndex(0);
        setCurrentLineIndex(0);
        setCompleted(false);
      }}
      badge={
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="bg-white/95 backdrop-blur-sm px-4 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] text-xs font-bold tracking-tight">
            <span className={getRiskColor(currentExplosion.hazardLevel)}>{currentExplosion.hazardLevel}</span>
          </div>
        </div>
      }
    />
  );
};
