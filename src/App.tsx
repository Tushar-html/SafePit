import React, { useState, useEffect } from "react";
import { UserProfile } from "./types";
import { userService } from "./services/userService";
import { CameraProvider, useCamera } from "./context/CameraContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { LanguageModal } from "./components/LanguageModal";
import { LoginPage } from "./components/LoginPage";
import { SignUpWizard } from "./components/SignUpWizard";
import { CameraPermissionModal } from "./components/CameraPermissionModal";
import { MainInterface } from "./components/MainInterface";
import { ProfileView } from "./components/ProfileView";
import { ModulesPage } from "./components/ModulesPage";
import { FireExplosionPage } from "./components/FireExplosionPage";
import { ARFireIdentificationModule } from "./components/ARFireIdentificationModule";
import { ARExplosionIdentificationModule } from "./components/ARExplosionIdentificationModule";
import { ARExitRouteIdentificationModule } from "./components/ARExitRouteIdentificationModule";
import { ARFireExtinguisherModule } from "./components/ARFireExtinguisherModule";
import { AREvacuationSequencingModule } from "./components/AREvacuationSequencingModule";
import { GasSafetyPage, MachinerySafetyPage } from "./components/ComingSoonPages";
import { AssessmentPage } from "./components/AssessmentPage";
import { CertificatesPage } from "./components/CertificatesPage";

type AppScreen = 
  | "main" 
  | "profile"
  | "modules" 
  | "fire_explosion" 
  | "fire_ar" 
  | "explosion_ar" 
  | "exit_routes_ar" 
  | "extinguisher_ar"
  | "evacuation_ar"
  | "gas" 
  | "machinery" 
  | "assessment"
  | "certificates";

function AppContent() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("main");
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [showLangModal, setShowLangModal] = useState<boolean>(false);
  const { requestCamera } = useCamera();

  // Check stored user on mount
  useEffect(() => {
    const user = userService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Android hardware back button (Capacitor). Falls back silently in browser.
  useEffect(() => {
    let removed = false;
    let sub: { remove: () => Promise<void> } | null = null;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("backButton", () => {
          if (showCameraModal || showLangModal) return;
          if (!currentUser) { App.exitApp(); return; }
          const parent: Partial<Record<AppScreen, AppScreen | null>> = {
            main: null,
            profile: "main",
            modules: "main",
            assessment: "main",
            certificates: "main",
            fire_explosion: "modules",
            gas: "modules",
            machinery: "modules",
            fire_ar: "fire_explosion",
            explosion_ar: "fire_explosion",
            exit_routes_ar: "fire_explosion",
            extinguisher_ar: "fire_explosion",
            evacuation_ar: "fire_explosion",
          };
          const p = parent[currentScreen];
          if (p) setCurrentScreen(p);
          else App.exitApp();
        });
        if (removed) { void listener.remove(); return; }
        sub = listener;
      } catch { /* browser — no native back button */ }
    })();
    return () => { removed = true; if (sub) void sub.remove(); };
  }, [currentUser, currentScreen, showCameraModal, showLangModal]);

  /** After sign-in: first-time users pick a language, then camera permission. */
  const afterAuth = () => {
    const langChosen = localStorage.getItem("safepit_lang_chosen");
    if (!langChosen) {
      setShowLangModal(true);
      return;
    }
    const prompted = localStorage.getItem("safepit_camera_prompted");
    if (!prompted) setShowCameraModal(true);
    else setCurrentScreen("main");
  };

  const handleLangChosen = () => {
    localStorage.setItem("safepit_lang_chosen", "true");
    setShowLangModal(false);
    const prompted = localStorage.getItem("safepit_camera_prompted");
    if (!prompted) setShowCameraModal(true);
    else setCurrentScreen("main");
  };

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    // Ask camera access after sign-in only via explicit permission modal
    afterAuth();
  };

  const handleSignUpComplete = (profile: UserProfile) => {
    const registered = userService.register(profile);
    setCurrentUser(registered);
    // Ask camera access after sign-in only via explicit permission modal
    afterAuth();
  };

  const handleAllowCamera = async () => {
    localStorage.setItem("safepit_camera_prompted", "true");
    await requestCamera();
    setShowCameraModal(false);
    setCurrentScreen("main");
  };

  const handleSkipCamera = () => {
    localStorage.setItem("safepit_camera_prompted", "true");
    setShowCameraModal(false);
    setCurrentScreen("main");
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setCurrentUser(updated);
  };

  const handleLogout = () => {
    userService.logout();
    setCurrentUser(null);
    setAuthView("login");
    setCurrentScreen("main");
  };

  // 1. Authentication Flow (Login & Sign Up Wizard - No permission block before sign in)
  if (!currentUser) {
    if (authView === "signup") {
      return (
        <SignUpWizard
          onComplete={handleSignUpComplete}
          onBackToLogin={() => setAuthView("login")}
        />
      );
    }
    return (
      <LoginPage
        onSuccess={handleAuthenticated}
        onOpenSignUp={() => setAuthView("signup")}
      />
    );
  }

  // 2. First-time Language Choice (non-dismissible) shown right after sign-in
  if (showLangModal) {
    return (
      <LanguageModal
        onClose={handleLangChosen}
        dismissible={false}
      />
    );
  }

  // 3. Explicit Camera Permission Pop-Up Modal (Shown strictly AFTER sign in)
  if (showCameraModal) {
    return (
      <CameraPermissionModal
        onAllow={handleAllowCamera}
        onSkip={handleSkipCamera}
      />
    );
  }

  // 4. Authenticated App Screens
  return (
    <div className="min-h-screen bg-[#edf6fc] text-slate-900 font-sans">
      
      {/* SCREEN 1: Main Interface */}
      {currentScreen === "main" && (
        <MainInterface
          user={currentUser}
          onOpenModules={() => setCurrentScreen("modules")}
          onOpenCertificates={() => setCurrentScreen("certificates")}
          onOpenAssessment={() => setCurrentScreen("assessment")}
          onOpenProfile={() => setCurrentScreen("profile")}
        />
      )}

      {/* SCREEN 2: Profile View */}
      {currentScreen === "profile" && (
        <ProfileView
          user={currentUser}
          onBack={() => setCurrentScreen("main")}
          onUpdate={handleUpdateProfile}
          onLogout={handleLogout}
        />
      )}

      {/* SCREEN 3: Modules Page */}
      {currentScreen === "modules" && (
        <ModulesPage
          onBack={() => setCurrentScreen("main")}
          onSelectSubModule={subModule => {
            if (subModule === "fire_explosion") setCurrentScreen("fire_explosion");
            if (subModule === "gas") setCurrentScreen("gas");
            if (subModule === "machinery") setCurrentScreen("machinery");
          }}
        />
      )}

      {/* SCREEN 4: Fire & Explosion Sub-modules Page (5 sub-modules) */}
      {currentScreen === "fire_explosion" && (
        <FireExplosionPage
          onBack={() => setCurrentScreen("modules")}
          onOpenFireIdentification={() => setCurrentScreen("fire_ar")}
          onOpenExplosionIdentification={() => setCurrentScreen("explosion_ar")}
          onOpenExitRouteIdentification={() => setCurrentScreen("exit_routes_ar")}
          onOpenExtinguisherUse={() => setCurrentScreen("extinguisher_ar")}
          onOpenEvacuationSequencing={() => setCurrentScreen("evacuation_ar")}
        />
      )}

      {/* SCREEN 5A: AR Fire Identification Experience */}
      {currentScreen === "fire_ar" && (
        <ARFireIdentificationModule
          onBack={() => setCurrentScreen("fire_explosion")}
        />
      )}

      {/* SCREEN 5B: AR Explosion Identification Experience */}
      {currentScreen === "explosion_ar" && (
        <ARExplosionIdentificationModule
          onBack={() => setCurrentScreen("fire_explosion")}
        />
      )}

      {/* SCREEN 5C: AR Exit Routes Identification Experience */}
      {currentScreen === "exit_routes_ar" && (
        <ARExitRouteIdentificationModule
          onBack={() => setCurrentScreen("fire_explosion")}
        />
      )}

      {/* SCREEN 5D: AR Fire Extinguisher Use Experience */}
      {currentScreen === "extinguisher_ar" && (
        <ARFireExtinguisherModule
          onBack={() => setCurrentScreen("fire_explosion")}
        />
      )}

      {/* SCREEN 5E: AR Evacuation Sequencing Experience */}
      {currentScreen === "evacuation_ar" && (
        <AREvacuationSequencingModule
          onBack={() => setCurrentScreen("fire_explosion")}
        />
      )}

      {/* SCREEN 6: Gas Safety Page */}
      {currentScreen === "gas" && (
        <GasSafetyPage
          onBack={() => setCurrentScreen("modules")}
        />
      )}

      {/* SCREEN 7: Machinery Safety Page */}
      {currentScreen === "machinery" && (
        <MachinerySafetyPage
          onBack={() => setCurrentScreen("modules")}
        />
      )}

      {/* SCREEN 7B: Assessment (Levels 1-5 quiz) */}
      {currentScreen === "assessment" && (
        <AssessmentPage
          user={currentUser}
          onBack={() => setCurrentScreen("main")}
        />
      )}

      {/* SCREEN 8: Certificates Page */}
      {currentScreen === "certificates" && (
        <CertificatesPage
          user={currentUser}
          onBack={() => setCurrentScreen("main")}
        />
      )}

    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <CameraProvider>
        <AppContent />
      </CameraProvider>
    </LanguageProvider>
  );
}

export default App;
