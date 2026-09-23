import React from "react";
import { Camera, ShieldCheck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface CameraPermissionModalProps {
  onAllow: () => void;
  onSkip: () => void;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
  onAllow,
  onSkip
}) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#e2eaf2] p-6 space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#eef7fe] text-[#0284c7] flex items-center justify-center mx-auto">
          <Camera className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-black text-[#0f2942] tracking-tight">
            {t("cameraAccessTitle")}
          </h3>
          <p className="text-xs text-[#64748b] leading-relaxed text-left">
            {t("cameraAccessBody")}
          </p>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-700 font-semibold text-left">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Camera is used only inside the app for AR training.</span>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={onAllow}
            className="w-full py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-sm active:scale-[0.99] transition-all"
          >
            {t("allowCamera")}
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2.5 rounded-xl border border-[#cfe6fa] text-[#0284c7] hover:bg-sky-50 font-bold text-xs transition-all active:scale-95"
          >
            {t("skipForNow")}
          </button>
        </div>
      </div>
    </div>
  );
};
