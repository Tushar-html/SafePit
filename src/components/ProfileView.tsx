import React, { useState, useRef } from "react";
import { ArrowLeft, Camera, LogOut, Edit3, Save, Check } from "lucide-react";
import { UserProfile } from "../types";
import { userService } from "../services/userService";
import { useLanguage } from "../context/LanguageContext";

interface ProfileViewProps {
  user: UserProfile;
  onBack: () => void;
  onUpdate: (updated: UserProfile) => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onBack,
  onUpdate,
  onLogout
}) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [mineName, setMineName] = useState(user.mineName);
  const [state, setState] = useState(user.mineLocation.state);
  const [city, setCity] = useState(user.mineLocation.city);
  const [pinCode, setPinCode] = useState(user.mineLocation.pinCode);
  const [height, setHeight] = useState(user.height);
  const [weight, setWeight] = useState(user.weight);
  const [age, setAge] = useState(user.age);
  const [hasMedicalCondition, setHasMedicalCondition] = useState(user.hasMedicalCondition);
  const [medicalDetails, setMedicalDetails] = useState(user.medicalConditionDetails);
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergencyContact.phone);
  const [profilePic, setProfilePic] = useState(user.profilePictureUrl || "");
  const [savedNotice, setSavedNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updated: UserProfile = {
      ...user,
      firstName,
      lastName,
      mineName,
      mineLocation: {
        ...user.mineLocation,
        state,
        city,
        pinCode
      },
      height,
      weight,
      age,
      hasMedicalCondition,
      medicalConditionDetails: hasMedicalCondition ? medicalDetails : "",
      emergencyContact: {
        ...user.emergencyContact,
        phone: emergencyPhone
      },
      profilePictureUrl: profilePic
    };

    userService.updateProfile(updated);
    onUpdate(updated);
    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#edf6fc] flex flex-col items-center justify-center sm:py-6 sm:px-4 font-sans select-none">
      
      {/* Central Mobile / Card Frame (White) */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[720px] sm:rounded-3xl shadow-sm sm:border sm:border-[#e2eaf2] flex flex-col justify-between overflow-hidden">
        
        {/* Top Header: Circular Back Button on Left, Centered Logo */}
        <header className="w-full bg-white border-b border-[#f1f5f9] h-14 sm:h-16 flex items-center justify-between px-5 relative shrink-0">
          <button
            onClick={onBack}
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

        {/* Profile Content Body */}
        <main className="flex-1 px-6 sm:px-8 py-6 flex flex-col justify-start overflow-y-auto">
          
          {/* Title: Profile */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-[#0f2942] tracking-tight text-left">
              {t("profile")}
            </h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t("edit")}</span>
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-[#0284c7] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t("save")}</span>
              </button>
            )}
          </div>

          {savedNotice && (
            <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{t("profileSaved")}</span>
            </div>
          )}

          {/* Centered Large Circular Avatar */}
          <div className="flex flex-col items-center justify-center my-3">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#eef7fe] border-2 border-[#cfe6fa] flex items-center justify-center shadow-xs overflow-hidden">
              {profilePic && profilePic !== "logo.png" ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg viewBox="0 0 100 100" className="w-14 h-14 text-[#0284c7]">
                  <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="4.5" opacity="0.6" />
                  <circle cx="50" cy="50" r="14" fill="none" stroke="currentColor" strokeWidth="4.5" opacity="0.8" />
                  <circle cx="50" cy="50" r="4.5" fill="currentColor" />
                </svg>
              )}

              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center text-white"
                >
                  <Camera className="w-6 h-6" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* Name below avatar */}
            <h2 className="text-base sm:text-lg font-black text-[#0f2942] tracking-tight mt-3 mb-5 text-center">
              {user.firstName} {user.lastName}
            </h2>
          </div>

          {/* 2-Column Info Table with Horizontal Dividers */}
          {!isEditing ? (
            <div className="w-full text-left text-xs">
              
              {/* Row 1: Mine & State */}
              <div className="grid grid-cols-2 gap-4 pb-2.5">
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("mine")}</p>
                  <p className="font-bold text-[#0f2942] truncate">{user.mineName.split("(")[0].trim()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("state")}</p>
                  <p className="font-bold text-[#0f2942]">{user.mineLocation.state}</p>
                </div>
              </div>
              <div className="border-b border-[#f1f5f9] mb-2.5"></div>

              {/* Row 2: City & PIN code */}
              <div className="grid grid-cols-2 gap-4 pb-2.5">
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("city")}</p>
                  <p className="font-bold text-[#0f2942]">{user.mineLocation.city}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("pinCode")}</p>
                  <p className="font-bold text-[#0f2942] font-mono">{user.mineLocation.pinCode}</p>
                </div>
              </div>
              <div className="border-b border-[#f1f5f9] mb-2.5"></div>

              {/* Row 3: Map coordinates & Employee ID */}
              <div className="grid grid-cols-2 gap-4 pb-2.5">
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("mapCoordinates")}</p>
                  <p className="font-bold text-[#0f2942]">
                    {user.mineLocation.coordinates
                      ? `${user.mineLocation.coordinates.lat.toFixed(3)}, ${user.mineLocation.coordinates.lng.toFixed(3)}`
                      : t("notProvided")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("employeeId")}</p>
                  <p className="font-bold text-[#0f2942] font-mono">{user.employeeId}</p>
                </div>
              </div>
              <div className="border-b border-[#f1f5f9] mb-2.5"></div>

              {/* Row 4: Role & Blood group */}
              <div className="grid grid-cols-2 gap-4 pb-2.5">
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("role")}</p>
                  <p className="font-bold text-[#0f2942] capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("bloodGroup")}</p>
                  <p className="font-bold text-[#0f2942]">{user.bloodGroup}</p>
                </div>
              </div>
              <div className="border-b border-[#f1f5f9] mb-2.5"></div>

              {/* Row 5: Height & Weight */}
              <div className="grid grid-cols-2 gap-4 pb-2.5">
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("heightCm")}</p>
                  <p className="font-bold text-[#0f2942]">{user.height.replace("cm", "").trim() || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("weightKg")}</p>
                  <p className="font-bold text-[#0f2942]">{user.weight.replace("kg", "").trim() || "—"}</p>
                </div>
              </div>
              <div className="border-b border-[#f1f5f9] mb-2.5"></div>

              {/* Row 6: Medical condition & Emergency */}
              <div className="grid grid-cols-2 gap-4 pb-2">
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("medicalCondition")}</p>
                  <p className="font-bold text-[#0f2942] truncate">
                    {user.hasMedicalCondition ? (user.medicalConditionDetails || t("reported")) : t("none")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b] mb-0.5">{t("emergencyContact")}</p>
                  <p className="font-bold text-[#0f2942] font-mono truncate">{user.emergencyContact.phone}</p>
                </div>
              </div>

            </div>
          ) : (
            /* Edit Form */
            <div className="space-y-3 text-xs text-left">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-1">{t("firstName")}</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#e2eaf2] bg-[#f8fbfe]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-1">{t("lastName")}</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#e2eaf2] bg-[#f8fbfe]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#64748b] block mb-1">{t("mineName")}</label>
                <input
                  type="text"
                  value={mineName}
                  onChange={e => setMineName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#e2eaf2] bg-[#f8fbfe]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-1">{t("state")}</label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#e2eaf2] bg-[#f8fbfe]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-1">{t("city")}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#e2eaf2] bg-[#f8fbfe]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-1">{t("pinCode")}</label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={e => setPinCode(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#e2eaf2] bg-[#f8fbfe]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-1">{t("age")}</label>
                  <input
                    type="text"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#e2eaf2] bg-[#f8fbfe]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-1">{t("bloodGroup")}</label>
                  <input
                    type="text"
                    value={user.bloodGroup}
                    readOnly
                    className="w-full p-2 rounded-lg border border-[#e2eaf2] bg-[#f8fbfe] opacity-70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-1">{t("heightCm")}</label>
                  <input
                    type="text"
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#e2eaf2] bg-[#f8fbfe]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] block mb-1">{t("weightKg")}</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#e2eaf2] bg-[#f8fbfe]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#64748b] block mb-1">{t("emergencyContact")}</label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#e2eaf2] bg-[#f8fbfe]"
                />
              </div>

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
                    value={medicalDetails}
                    onChange={e => setMedicalDetails(e.target.value)}
                    placeholder={t("medicalConditionPlaceholder")}
                    className="w-full p-2 rounded-lg border border-[#cfe6fa] bg-white text-xs text-[#0f2942] focus:outline-none"
                  />
                )}
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          <div className="mt-8 pt-4 border-t border-[#f1f5f9] pb-4">
            <button
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t("signOut")}</span>
            </button>
          </div>

        </main>

      </div>
    </div>
  );
};
