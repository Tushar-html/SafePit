import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { userService, DEMO_ADMIN, DEMO_USER } from "../services/userService";
import { UserProfile } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface LoginPageProps {
  onSuccess: (user: UserProfile) => void;
  onOpenSignUp: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onOpenSignUp
}) => {
  const { t } = useLanguage();
  const [employeeId, setEmployeeId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setErrorMsg(t("errEnterEmployeeId"));
      return;
    }
    const user = userService.login(employeeId, password);
    if (user) {
      onSuccess(user);
    } else {
      setErrorMsg(t("errInvalidLogin"));
    }
  };

  const handleQuickDemo = (demoProfile: UserProfile) => {
    userService.setCurrentUser(demoProfile);
    onSuccess(demoProfile);
  };

  return (
    <div className="min-h-screen bg-[#edf6fc] flex flex-col items-center justify-center sm:py-6 sm:px-4 font-sans select-none">
      
      {/* Central Mobile / Card Frame (White) */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[720px] sm:rounded-3xl shadow-sm sm:border sm:border-[#e2eaf2] flex flex-col justify-between overflow-hidden">
        
        {/* Top Header with Centered Logo */}
        <header className="w-full bg-white border-b border-[#f1f5f9] h-14 sm:h-16 flex items-center justify-center px-4 relative shrink-0">
          <img
            src="logo.png"
            alt="SafePit"
            className="h-7 w-auto object-contain"
          />
        </header>

        {/* Form Body */}
        <div className="flex-1 px-6 sm:px-10 py-6 sm:py-8 flex flex-col justify-center max-w-sm mx-auto w-full">
          
          {/* Centered Large App Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="logo.png"
              alt="SafePit"
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>

          {/* Subtitle, Title & Description */}
          <div className="text-left mb-6">
            <span className="text-[11px] font-bold tracking-wider text-[#0284c7] uppercase block mb-1">
              {t("mineSafetyTraining")}
            </span>
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0f2942] tracking-tight mb-1">
              {t("welcomeBack")}
            </h1>
            <p className="text-xs text-[#64748b]">
              {t("signInToSafePit")}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold text-[#0f2942] mb-1.5">
                {t("employeeId")}
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                placeholder={t("enterEmployeeId")}
                className="w-full px-4 py-3 rounded-xl bg-[#f8fbfe] border border-[#e2eaf2] text-xs font-medium text-[#0f2942] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7] focus:bg-white transition-all"
              />
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold text-[#0f2942] mb-1.5">
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t("enterPassword")}
                className="w-full px-4 py-3 rounded-xl bg-[#f8fbfe] border border-[#e2eaf2] text-xs font-medium text-[#0f2942] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7] focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-sm active:scale-[0.99] transition-all mt-2"
            >
              {t("signIn")}
            </button>
          </form>

          {/* Quick Demo Logins for Fast Access */}
          <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-center gap-3 text-xs">
            <span className="text-[11px] text-[#94a3b8]">{t("demo")}</span>
            <button
              type="button"
              onClick={() => handleQuickDemo(DEMO_USER)}
              className="px-2.5 py-1 rounded-lg bg-[#eef7fe] text-[#0284c7] hover:bg-[#e0f0fc] text-[11px] font-bold transition-colors"
            >
              {t("demoMiner")}
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo(DEMO_ADMIN)}
              className="px-2.5 py-1 rounded-lg bg-[#eef7fe] text-[#0284c7] hover:bg-[#e0f0fc] text-[11px] font-bold transition-colors"
            >
              {t("demoOfficer")}
            </button>
          </div>

        </div>

        {/* Footer: New to SafePit? Sign up */}
        <footer className="py-5 text-center border-t border-[#f1f5f9] shrink-0">
          <p className="text-xs text-[#64748b]">
            {t("newToSafePit")}{" "}
            <button
              type="button"
              onClick={onOpenSignUp}
              className="font-bold text-[#0284c7] hover:underline focus:outline-none ml-1"
            >
              {t("signUp")}
            </button>
          </p>
        </footer>

      </div>
    </div>
  );
};
