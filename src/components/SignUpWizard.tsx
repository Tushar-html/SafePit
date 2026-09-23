import React, { useState, useRef } from "react";
import { 
  ArrowLeft, 
  MapPin, 
  Camera, 
  AlertCircle
} from "lucide-react";
import { UserProfile, UserRole } from "../types";
import { INDIAN_STATES } from "../data/minesData";
import { LocationPickerModal } from "./LocationPickerModal";
import { useLanguage } from "../context/LanguageContext";

interface SignUpWizardProps {
  onComplete: (profile: UserProfile) => void;
  onBackToLogin: () => void;
}

/** Employee ID: exactly 3 letters followed by 3 digits, e.g. ABC123 */
const EMPLOYEE_ID_RE = /^[A-Za-z]{3}\d{3}$/;

export const SignUpWizard: React.FC<SignUpWizardProps> = ({
  onComplete,
  onBackToLogin
}) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);

  // Form State
  // Step 1: Mine details
  const [mineName, setMineName] = useState<string>("");
  const [state, setState] = useState<string>(INDIAN_STATES[0]);
  const [city, setCity] = useState<string>("");
  const [pinCode, setPinCode] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Step 2: Personal credentials & role
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [role, setRole] = useState<UserRole>("user");

  // Step 3: Medical and emergency contact
  const [bloodGroup, setBloodGroup] = useState<string>("B+");
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [hasMedicalCondition, setHasMedicalCondition] = useState<boolean>(false);
  const [medicalConditionDetails, setMedicalConditionDetails] = useState<string>("");
  const [emergencyName, setEmergencyName] = useState<string>("");
  const [emergencyPhone, setEmergencyPhone] = useState<string>("");

  // Step 4: Profile Picture
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [isCameraStreaming, setIsCameraStreaming] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Validation error
  const [errorMsg, setErrorMsg] = useState<string>("");

  const startCameraSnap = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraStreaming(true);
      setErrorMsg("");
    } catch {
      setErrorMsg("Camera access not available. Please use image upload.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 320, 320);
      setProfilePictureUrl(canvas.toDataURL("image/png"));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(tr => tr.stop());
      streamRef.current = null;
    }
    setIsCameraStreaming(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePictureUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    if (!mineName.trim() || !state.trim() || !city.trim() || !pinCode.trim()) {
      setErrorMsg(t("errFillMine"));
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const validateStep2 = () => {
    if (!firstName.trim() || !lastName.trim() || !employeeId.trim() || !password.trim()) {
      setErrorMsg(t("errCompleteCredentials"));
      return false;
    }
    if (!EMPLOYEE_ID_RE.test(employeeId.trim())) {
      setErrorMsg(t("errEmployeeIdFormat"));
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t("errPasswordsDiffer"));
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const validateStep3 = () => {
    if (!emergencyName.trim() || !emergencyPhone.trim()) {
      setErrorMsg(t("errProvideEmergency"));
      return false;
    }
    if (hasMedicalCondition && !medicalConditionDetails.trim()) {
      setErrorMsg(t("errSpecifyMedical"));
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
    else if (currentStep === 3 && validateStep3()) setCurrentStep(4);
  };

  const handleBack = () => {
    setErrorMsg("");
    if (currentStep > 1) {
      if (currentStep === 4) stopCamera();
      setCurrentStep(currentStep - 1);
    } else {
      onBackToLogin();
    }
  };

  const handleFinalSubmit = () => {
    stopCamera();
    const newProfile: UserProfile = {
      mineName,
      mineLocation: {
        state,
        city,
        pinCode,
        coordinates
      },
      firstName,
      lastName,
      employeeId,
      password,
      role,
      bloodGroup,
      height,
      weight,
      age,
      hasMedicalCondition,
      medicalConditionDetails: hasMedicalCondition ? medicalConditionDetails : "",
      emergencyContact: {
        name: emergencyName,
        phone: emergencyPhone
      },
      profilePictureUrl: profilePictureUrl || "logo.png"
    };

    onComplete(newProfile);
  };

  const inputCls = "w-full px-3.5 py-3 rounded-xl bg-[#f8fbfe] border border-[#e2eaf2] text-xs font-medium text-[#0f2942] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7] focus:bg-white transition-all";

  return (
    <div className="min-h-screen bg-[#edf6fc] flex flex-col items-center justify-center sm:py-6 sm:px-4 font-sans select-none">
      
      {/* Central Mobile Frame (White) */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[720px] sm:rounded-3xl shadow-sm sm:border sm:border-[#e2eaf2] flex flex-col justify-between overflow-hidden">
        
        {/* Top Header: Circular Back Button on Left, Centered Logo */}
        <header className="w-full bg-white border-b border-[#f1f5f9] h-14 sm:h-16 flex items-center justify-between px-5 relative shrink-0">
          <button
            onClick={handleBack}
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

        {/* Content Body */}
        <main className="flex-1 px-6 sm:px-8 py-6 flex flex-col justify-between overflow-y-auto max-w-sm mx-auto w-full">
          <div>
            {/* Title */}
            <div className="text-left mb-5">
              <span className="text-[11px] font-bold tracking-wider text-[#0284c7] uppercase block mb-1">
                {t("registrationStep", { n: currentStep })}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#0f2942] tracking-tight">
                {currentStep === 1 && t("step1Title")}
                {currentStep === 2 && t("step2Title")}
                {currentStep === 3 && t("step3Title")}
                {currentStep === 4 && t("step4Title")}
              </h1>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="space-y-3.5 text-left text-xs">
                <div>
                  <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("mineName")}</label>
                  <input
                    type="text"
                    value={mineName}
                    onChange={e => setMineName(e.target.value)}
                    placeholder={t("enterMineName")}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("state")}</label>
                    <select
                      value={state}
                      onChange={e => setState(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl bg-[#f8fbfe] border border-[#e2eaf2] text-xs font-medium text-[#0f2942] focus:outline-none"
                    >
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("city")}</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder={t("enterCity")}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("pinCode")}</label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={e => setPinCode(e.target.value)}
                    placeholder="828111"
                    className={inputCls}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#eef7fe] text-[#0284c7] hover:bg-[#e0f0fc] font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-1"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{t("selectInMap")}</span>
                </button>
                <p className="text-[10px] text-[#64748b] text-center -mt-2">
                  {t("mapLocatingHint")}
                </p>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="space-y-3.5 text-left text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("firstName")}</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("lastName")}</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("employeeId")}</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className={`${inputCls} uppercase tracking-wider`}
                  />
                  <p className="text-[10px] text-[#64748b] mt-1">{t("employeeIdRule")}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("password")}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t("enterPassword")}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("confirmPassword")}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={t("reenterPassword")}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f2942] mb-1.5">{t("roleType")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("user")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        role === "user"
                          ? "bg-[#0284c7] text-white border-[#0284c7]"
                          : "bg-[#f8fbfe] text-[#0f2942] border-[#e2eaf2]"
                      }`}
                    >
                      {t("roleUser")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        role === "admin"
                          ? "bg-[#0284c7] text-white border-[#0284c7]"
                          : "bg-[#f8fbfe] text-[#0f2942] border-[#e2eaf2]"
                      }`}
                    >
                      {t("roleAdmin")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="space-y-3.5 text-left text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("bloodGroup")}</label>
                    <select
                      value={bloodGroup}
                      onChange={e => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#f8fbfe] border border-[#e2eaf2] text-xs font-bold text-[#0f2942]"
                    >
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("age")}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      placeholder={t("enterAge")}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("heightCm")}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={height}
                      onChange={e => setHeight(e.target.value)}
                      placeholder={t("enterHeight")}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("weightKg")}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      placeholder={t("enterWeight")}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Medical Condition Checkbox */}
                <div className="p-3 bg-[#f8fbfe] rounded-xl border border-[#e2eaf2] space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0f2942]">
                    <input
                      type="checkbox"
                      checked={hasMedicalCondition}
                      onChange={e => setHasMedicalCondition(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0284c7] focus:ring-[#0284c7]"
                    />
                    <span>{t("medicalConditionQ")}</span>
                  </label>
                  {hasMedicalCondition && (
                    <textarea
                      rows={2}
                      value={medicalConditionDetails}
                      onChange={e => setMedicalConditionDetails(e.target.value)}
                      placeholder={t("medicalConditionPlaceholder")}
                      className="w-full p-2 rounded-lg border border-[#cfe6fa] bg-white text-xs text-[#0f2942] focus:outline-none"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("emergencyName")}</label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={e => setEmergencyName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0f2942] mb-1">{t("emergencyContact")}</label>
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={e => setEmergencyPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <div className="space-y-4 text-center">
                <div className="relative mx-auto w-36 h-36 rounded-full overflow-hidden border-2 border-[#cfe6fa] bg-[#eef7fe] flex items-center justify-center">
                  {isCameraStreaming ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  ) : profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-[#0284c7] opacity-60" />
                  )}
                </div>

                <div className="flex justify-center gap-2">
                  {isCameraStreaming ? (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-4 py-2 rounded-xl bg-[#0284c7] text-white text-xs font-bold"
                    >
                      {t("capturePhoto")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCameraSnap}
                      className="px-4 py-2 rounded-xl bg-[#0284c7] text-white text-xs font-bold"
                    >
                      {t("clickPicture")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#eef7fe] text-[#0284c7] text-xs font-bold border border-[#dbeefe]"
                  >
                    {t("uploadFile")}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-[11px] text-[#64748b]">
                  {t("faceVisibleHint")}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="pt-6">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-sm active:scale-[0.99] transition-all"
              >
                {t("next")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-sm active:scale-[0.99] transition-all"
              >
                {t("completeProfile")}
              </button>
            )}
          </div>
        </main>

        <div className="h-4 shrink-0"></div>

      </div>

      {showMapModal && (
        <LocationPickerModal
          onClose={() => setShowMapModal(false)}
          onPick={(pick) => {
            if (pick.name) setMineName(pick.name);
            setCity(pick.city);
            setState(pick.state);
            if (pick.pinCode) setPinCode(pick.pinCode);
            setCoordinates(pick.coordinates);
          }}
        />
      )}
    </div>
  );
};
