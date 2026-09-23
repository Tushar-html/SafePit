import React from "react";
import { Globe, Check } from "lucide-react";
import { useLanguage, LANGUAGES, Language } from "../context/LanguageContext";

interface LanguageModalProps {
  onClose?: () => void;
  /** when false the modal cannot be dismissed (first-login choice) */
  dismissible?: boolean;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  onClose,
  dismissible = true
}) => {
  const { lang, setLang } = useLanguage();
  const { t } = useLanguage();

  const choose = (l: Language) => {
    setLang(l);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#e2eaf2] p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#eef7fe] text-[#0284c7] flex items-center justify-center mx-auto">
          <Globe className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-black text-[#0f2942] tracking-tight">
            {t("chooseLanguageTitle")}
          </h3>
          <p className="text-xs text-[#64748b] leading-relaxed">
            {t("chooseLanguageBody")}
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={`w-full py-3 px-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.99] ${
                lang === l.code
                  ? "bg-[#0284c7] text-white border-[#0284c7] shadow-sm"
                  : "bg-[#f8fbfe] text-[#0f2942] border-[#e2eaf2] hover:border-[#0284c7]"
              }`}
            >
              <span className="flex flex-col">
                <span className="text-sm font-bold">{l.native}</span>
                <span className={`text-[10px] ${lang === l.code ? "text-sky-100" : "text-slate-400"}`}>
                  {l.label}
                </span>
              </span>
              {lang === l.code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>

        {dismissible && (
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            {t("close")}
          </button>
        )}
      </div>
    </div>
  );
};
