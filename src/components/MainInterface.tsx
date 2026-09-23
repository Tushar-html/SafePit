import React, { useState } from "react";
import { User, Globe } from "lucide-react";
import { UserProfile } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { LanguageModal } from "./LanguageModal";

interface MainInterfaceProps {
  user: UserProfile;
  onOpenModules: () => void;
  onOpenCertificates: () => void;
  onOpenAssessment: () => void;
  onOpenProfile: () => void;
}

export const MainInterface: React.FC<MainInterfaceProps> = ({
  user,
  onOpenModules,
  onOpenCertificates,
  onOpenAssessment,
  onOpenProfile
}) => {
  const { t } = useLanguage();
  const [showLangModal, setShowLangModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#edf6fc] flex flex-col items-center justify-center sm:py-6 sm:px-4 font-sans select-none">
      
      {/* Central Mobile / Card Frame (Pure White) */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[720px] sm:rounded-3xl shadow-sm sm:border sm:border-[#e2eaf2] flex flex-col justify-between overflow-hidden">
        
        {/* Top Header: Change-Language button (left) + Centered Logo + Profile Icon (right) */}
        <header className="w-full bg-white border-b border-[#f1f5f9] h-14 sm:h-16 flex items-center justify-between px-5 relative shrink-0">
          {/* Change Language button — opposite the profile icon */}
          <button
            onClick={() => setShowLangModal(true)}
            className="h-9 px-3 rounded-full bg-[#f0f7fe] text-[#0284c7] hover:bg-[#e0f0fc] flex items-center gap-1.5 transition-colors active:scale-95"
            title={t("changeLanguage")}
          >
            <Globe className="w-4 h-4 stroke-[1.8]" />
            <span className="text-[11px] font-bold hidden xs:inline sm:inline">
              {t("changeLanguage")}
            </span>
          </button>

          {/* Centered SafePit Logo */}
          <div className="flex items-center justify-center">
            <img
              src="logo.png"
              alt="SafePit"
              className="h-7 w-auto object-contain"
            />
          </div>

          {/* Top Right Profile Icon (Round Light Blue Circle) */}
          <button
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full bg-[#f0f7fe] text-[#0284c7] hover:bg-[#e0f0fc] flex items-center justify-center transition-colors active:scale-95"
            title={t("profile")}
          >
            {user.profilePictureUrl && user.profilePictureUrl !== "logo.png" ? (
              <img
                src={user.profilePictureUrl}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 stroke-[1.8]" />
            )}
          </button>
        </header>

        {/* Center Section: main action buttons */}
        <main className="flex-1 px-6 sm:px-8 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="space-y-4 sm:space-y-5">
            
            {/* Button 1: Modules */}
            <button
              onClick={onOpenModules}
              className="w-full py-7 sm:py-8 px-6 rounded-2xl sm:rounded-3xl bg-[#eef7fe] hover:bg-[#e4f1fc] border border-[#dbeefe] text-center active:scale-[0.99] transition-all shadow-xs"
            >
              <span className="text-base sm:text-lg font-bold text-[#026aa7] tracking-tight">
                {t("modules")}
              </span>
            </button>

            {/* Button 2: Assessment (directly below the module box) */}
            <button
              onClick={onOpenAssessment}
              className="w-full py-7 sm:py-8 px-6 rounded-2xl sm:rounded-3xl bg-[#eef7fe] hover:bg-[#e4f1fc] border border-[#dbeefe] text-center active:scale-[0.99] transition-all shadow-xs"
            >
              <span className="text-base sm:text-lg font-bold text-[#026aa7] tracking-tight">
                {t("assessment")}
              </span>
            </button>

            {/* Button 3: Certificates */}
            <button
              onClick={onOpenCertificates}
              className="w-full py-7 sm:py-8 px-6 rounded-2xl sm:rounded-3xl bg-[#eef7fe] hover:bg-[#e4f1fc] border border-[#dbeefe] text-center active:scale-[0.99] transition-all shadow-xs"
            >
              <span className="text-base sm:text-lg font-bold text-[#026aa7] tracking-tight">
                {t("certificates")}
              </span>
            </button>

          </div>
        </main>

        {/* Subtle empty bottom spacer matching screenshot proportions */}
        <div className="h-10 sm:h-12 shrink-0"></div>

      </div>

      {/* Language chooser popup */}
      {showLangModal && (
        <LanguageModal onClose={() => setShowLangModal(false)} />
      )}
    </div>
  );
};
