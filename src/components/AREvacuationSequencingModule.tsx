import React, { useState } from "react";
import { ARShell } from "./ARShell";
import { EVACUATION_STEPS, EvacuationStep } from "../data/evacuationData";
import { create3DEvacuationModel, updateEvacuationAnimations, disposeEvacuationModel } from "./evacuationModels3D";
import { useLanguage } from "../context/LanguageContext";
import { moduleLine } from "../i18n/moduleLines";

interface AREvacuationSequencingModuleProps {
  onBack: () => void;
}

export const AREvacuationSequencingModule: React.FC<AREvacuationSequencingModuleProps> = ({ onBack }) => {
  const { t, lang } = useLanguage();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentStep: EvacuationStep = EVACUATION_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentLineIndex < currentStep.lines.length - 1) {
      setCurrentLineIndex(i => i + 1);
    } else if (currentStepIndex < EVACUATION_STEPS.length - 1) {
      setCurrentStepIndex(i => i + 1);
      setCurrentLineIndex(0);
    } else {
      setCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex(i => i - 1);
    } else if (currentStepIndex > 0) {
      const prevStep = EVACUATION_STEPS[currentStepIndex - 1];
      setCurrentStepIndex(i => i - 1);
      setCurrentLineIndex(prevStep.lines.length - 1);
    }
  };

  const getStatusColor = (level: string) => {
    switch (level) {
      case "High Risk": return "text-[#dc2626]";
      case "Medium Risk": return "text-[#ca8a04]";
      case "Low Risk": return "text-[#16a34a]";
      default: return "text-[#0284c7]";
    }
  };

  return (
    <ARShell
      onBack={onBack}
      title={currentStep.displayName}
      readyText={t("arReadyEvacuation")}
      completedText={t("completedEvacuation")}
      lineText={moduleLine(lang, `evac:${currentStepIndex}:${currentLineIndex}`)}
      voiceText={lang === "sat" ? moduleLine("hi", `evac:${currentStepIndex}:${currentLineIndex}`) : undefined}
      footerCaption="Live AR Environment · Drill auto-replays · Pinch / +/- to Zoom"
      scanHint={t("scanFloorHint")}
      modelKey={`${currentStepIndex}-${completed ? "done" : "run"}`}
      createModel={() => create3DEvacuationModel(currentStep.modelType)}
      updateModel={(g, elapsed, delta) => updateEvacuationAnimations(g, elapsed, delta)}
      disposeModel={disposeEvacuationModel}
      progressLabel={`${t("step")} ${currentStepIndex + 1} / ${EVACUATION_STEPS.length} · ${t("line")} ${currentLineIndex + 1} / ${currentStep.lines.length}`}
      canPrev={!(currentStepIndex === 0 && currentLineIndex === 0)}
      canNext={!completed}
      onPrev={handlePrev}
      onNext={handleNext}
      completedSignal={completed}
      onRestart={() => {
        setCurrentStepIndex(0);
        setCurrentLineIndex(0);
        setCompleted(false);
      }}
      badge={
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="bg-white/95 backdrop-blur-sm px-4 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] text-xs font-bold tracking-tight">
            <span className={getStatusColor(currentStep.hazardLevel)}>{currentStep.hazardLevel}</span>
          </div>
        </div>
      }
    />
  );
};
