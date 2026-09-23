import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Award, Download, Printer, BadgeCheck } from "lucide-react";
import QRCode from "qrcode";
import { UserProfile } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { qualityScore, loadScores } from "../data/assessmentData";

interface CertificatesPageProps {
  user: UserProfile;
  onBack: () => void;
}

const PASS_MARK = 7;

function remarkFor(scorePct: number, t: (k: "qualityRemarkExcellent" | "qualityRemarkGood" | "qualityRemarkFair" | "qualityRemarkImprove") => string): string {
  if (scorePct >= 90) return t("qualityRemarkExcellent");
  if (scorePct >= 75) return t("qualityRemarkGood");
  if (scorePct >= 60) return t("qualityRemarkFair");
  return t("qualityRemarkImprove");
}

export const CertificatesPage: React.FC<CertificatesPageProps> = ({ user, onBack }) => {
  const { t, lang } = useLanguage();
  const [dataUrl, setDataUrl] = useState<string>("");
  const [notice, setNotice] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const scores = loadScores(user.employeeId);
  const clearedLevels = Object.entries(scores).filter(([, v]) => v >= PASS_MARK);
  const qScore = qualityScore(user.employeeId);

  const certId = `SP-${user.employeeId}-${new Date().getFullYear()}`;
  const verifyUrl = `https://safepit.app/verify/${certId}?q=${qScore}`;

  // Generate the QR
  useEffect(() => {
    QRCode.toDataURL(verifyUrl, {
      width: 400,
      margin: 1,
      color: { dark: "#0f2942", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [verifyUrl]);

  const handleDownload = async () => {
    // Render the certificate to an offscreen canvas at high resolution and save as PNG
    const W = 1200;
    const H = 850;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = (src: string): Promise<HTMLImageElement | null> =>
      new Promise(res => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = src;
      });

    // background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#f6fbff");
    grad.addColorStop(1, "#e8f4fd");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // border
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 6;
    ctx.strokeRect(28, 28, W - 56, H - 56);
    ctx.strokeStyle = "#bae6fd";
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, W - 88, H - 88);

    // header band
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(44, 44, W - 88, 120);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("SafePit", W / 2, 110);
    ctx.font = "600 22px Arial, sans-serif";
    ctx.fillText(t("dgmsCompliance"), W / 2, 146);

    // title
    ctx.fillStyle = "#0f2942";
    ctx.font = "bold 44px Georgia, serif";
    ctx.fillText(t("certificateOfCompletion"), W / 2, 230);
    ctx.font = "24px Arial, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText(t("vocationalTraining"), W / 2, 268);

    // presented to
    ctx.font = "20px Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(t("presentedTo"), W / 2, 320);

    ctx.fillStyle = "#0f2942";
    ctx.font = "bold 46px Georgia, serif";
    ctx.fillText(`${user.firstName} ${user.lastName}`.toUpperCase(), W / 2, 372);

    // divider flourish
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 160, 392);
    ctx.lineTo(W / 2 + 160, 392);
    ctx.stroke();

    ctx.font = "20px Arial, sans-serif";
    ctx.fillStyle = "#334155";
    ctx.fillText(t("hasSuccessfully"), W / 2, 428);
    ctx.fillText(t("trainingModules"), W / 2, 456);

    // profile photo (if any)
    let photo: HTMLImageElement | null = null;
    if (user.profilePictureUrl && user.profilePictureUrl !== "logo.png") {
      photo = await img(user.profilePictureUrl);
    } else {
      photo = await img("logo.png");
    }
    if (photo) {
      const ph = 110;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, 540, ph / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(photo, W / 2 - ph / 2, 540 - ph / 2, ph, ph);
      ctx.restore();
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(W / 2, 540, ph / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // details row
    ctx.font = "18px Arial, sans-serif";
    ctx.fillStyle = "#334155";
    ctx.fillText(`${t("employeeId")}: ${user.employeeId}`, W / 2 - 240, 640);
    ctx.fillText(`${t("mine")}: ${user.mineName.split("(")[0].trim()}`, W / 2 + 60, 640);
    ctx.fillText(`${t("issueDate")}: ${new Date().toLocaleDateString()}`, W / 2 - 240, 668);

    // quality score + remark
    ctx.fillStyle = "#0284c7";
    ctx.font = "bold 30px Arial, sans-serif";
    ctx.fillText(`${t("qualityScore")}: ${qScore}%`, W / 2 + 130, 660);

    ctx.font = "italic 20px Georgia, serif";
    ctx.fillStyle = "#475569";
    ctx.fillText(`"${remarkFor(qScore, t)}"`, W / 2, 700);

    // QR block
    const qr = await img(dataUrl);
    if (qr) {
      ctx.drawImage(qr, W - 260, H - 260, 180, 180);
      ctx.font = "14px Arial, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(t("scanToVerify"), W - 170, H - 66);
    }

    // certificate id bottom-left
    ctx.font = "14px Arial, monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "left";
    ctx.fillText(`${t("certificateId")}: ${certId}`, 70, H - 70);

    // download
    try {
      const a = document.createElement("a");
      a.download = `SafePit-Certificate-${user.employeeId}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      setNotice(true);
      setTimeout(() => setNotice(false), 2500);
    } catch {
      // canvas tainted (profile pic from file:// etc) — fall back to print
      window.print();
    }
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
            <img src="logo.png" alt="SafePit" className="h-7 w-auto object-contain" />
          </div>

          <div className="w-9 h-9"></div>
        </header>

        {/* Certificate Body */}
        <main className="flex-1 px-4 sm:px-8 py-6 flex flex-col justify-center max-w-sm mx-auto w-full overflow-y-auto">
          
          <h1 className="text-2xl font-black text-[#0f2942] tracking-tight text-left mb-4">
            {t("certificates")}
          </h1>

          {/* The certificate card */}
          <div
            ref={cardRef}
            className="relative rounded-2xl overflow-hidden border-2 border-[#0284c7] bg-gradient-to-br from-[#f6fbff] to-[#e8f4fd] shadow-sm"
          >
            {/* header band */}
            <div className="bg-[#0284c7] text-white py-3 px-4 flex items-center justify-between">
              <span className="font-serif font-bold text-lg">SafePit</span>
              <span className="text-[10px] font-semibold opacity-90">{t("dgmsCompliance")}</span>
            </div>

            <div className="p-5 text-center space-y-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#0f2942]">{t("certificateOfCompletion")}</h2>
                <p className="text-[11px] text-[#64748b] mt-0.5">{t("vocationalTraining")}</p>
              </div>

              <div className="pt-1">
                <p className="text-[10px] uppercase tracking-wider text-[#64748b]">{t("presentedTo")}</p>
                <p className="font-serif text-lg font-bold text-[#0f2942] mt-0.5">
                  {user.firstName} {user.lastName}
                </p>
              </div>

              {/* profile photo */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#0284c7] bg-white flex items-center justify-center">
                  {user.profilePictureUrl && user.profilePictureUrl !== "logo.png" ? (
                    <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <img src="logo.png" alt="Logo" className="w-8 h-8 object-contain opacity-70" />
                  )}
                </div>
              </div>

              <p className="text-[11px] text-[#334155] leading-relaxed">
                {t("hasSuccessfully")} {t("trainingModules")}
              </p>

              {/* score + remark */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-xl bg-white/80 border border-[#dbeefe] py-2">
                  <p className="text-[9px] uppercase tracking-wider text-[#64748b]">{t("qualityScore")}</p>
                  <p className="text-lg font-black text-[#0284c7]">{qScore}%</p>
                </div>
                <div className="rounded-xl bg-white/80 border border-[#dbeefe] py-2">
                  <p className="text-[9px] uppercase tracking-wider text-[#64748b]">{t("verified")}</p>
                  <p className="text-sm font-black text-emerald-600 flex items-center justify-center gap-1">
                    <BadgeCheck className="w-4 h-4" />
                    {clearedLevels.length} {t("level")}
                  </p>
                </div>
              </div>

              <p className="text-[11px] italic text-[#475569] font-serif">
                "{remarkFor(qScore, t)}"
              </p>

              {/* details + QR */}
              <div className="flex items-end justify-between pt-2">
                <div className="text-left space-y-0.5">
                  <p className="text-[10px] text-[#64748b]">
                    <span className="font-bold">{t("employeeId")}:</span> <span className="font-mono">{user.employeeId}</span>
                  </p>
                  <p className="text-[10px] text-[#64748b]">
                    <span className="font-bold">{t("mine")}:</span> {user.mineName.split("(")[0].trim()}
                  </p>
                  <p className="text-[10px] text-[#64748b]">
                    <span className="font-bold">{t("issueDate")}:</span> {new Date().toLocaleDateString()}
                  </p>
                  <p className="text-[9px] text-[#94a3b8] font-mono">{certId}</p>
                </div>

                <div className="text-center">
                  {dataUrl ? (
                    <img src={dataUrl} alt="QR" className="w-20 h-20 rounded-lg border border-[#dbeefe] bg-white p-1" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-100 animate-pulse" />
                  )}
                  <p className="text-[8px] text-[#94a3b8] mt-0.5 max-w-[80px]">{t("scanToVerify")}</p>
                </div>
              </div>
            </div>
          </div>

          {notice && (
            <p className="text-[11px] text-emerald-600 font-bold text-center mt-3">
              {t("certificateSaved")}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t("download")}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="py-2.5 px-3.5 rounded-xl bg-white border border-[#cfe6fa] text-[#0284c7] hover:bg-sky-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t("print")}</span>
            </button>
          </div>

          {/* cleared levels summary */}
          <p className="text-[10px] text-[#94a3b8] text-center pt-3">
            {t("bestScore")}: {clearedLevels.length}/5 {t("level")} cleared
          </p>
        </main>

        <div className="h-6 sm:h-8 shrink-0"></div>

      </div>
    </div>
  );
};
