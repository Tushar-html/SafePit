import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Lock, CheckCircle2, XCircle, Timer, Award, RotateCcw } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  ASSESSMENT_LEVELS,
  levelUnlocked,
  loadScores,
  saveScore,
  ScoreState,
  QuestionImage,
} from "../data/assessmentData";
import { UserProfile } from "../types";

interface AssessmentPageProps {
  user: UserProfile;
  onBack: () => void;
}

type Phase = "levels" | "quiz" | "result";

const TIME_PER_Q = 30;
const PASS_MARK = 7;

export const AssessmentPage: React.FC<AssessmentPageProps> = ({ user, onBack }) => {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("levels");
  const [levelIdx, setLevelIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [best, setBest] = useState<ScoreState>(() => loadScores(user.employeeId));

  const level = ASSESSMENT_LEVELS[levelIdx];
  const question = level.questions[qIdx % level.questions.length];

  // shuffle-free fixed 10-question run
  const questions = level.questions.slice(0, 10);

  useEffect(() => {
    setBest(loadScores(user.employeeId));
  }, [user.employeeId]);

  const startLevel = (idx: number) => {
    setLevelIdx(idx);
    setQIdx(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setTimeLeft(TIME_PER_Q);
    setPhase("quiz");
  };

  const finish = useCallback((finalScore: number) => {
    const s = saveScore(user.employeeId, level.level, finalScore);
    setBest(s);
    setPhase("result");
  }, [user.employeeId, level.level]);

  // timer
  useEffect(() => {
    if (phase !== "quiz" || revealed) return;
    if (timeLeft <= 0) {
      // timeout counts as wrong
      setRevealed(true);
      return;
    }
    const id = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, revealed, timeLeft]);

  const submitAnswer = (idx: number | null) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx !== null && idx === question.answerIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (qIdx + 1 >= questions.length) {
      finish(score);
      return;
    }
    setQIdx(i => i + 1);
    setSelected(null);
    setRevealed(false);
    setTimeLeft(TIME_PER_Q);
  };

  const passed = score >= PASS_MARK;

  return (
    <div className="min-h-screen bg-[#edf6fc] flex flex-col items-center justify-center sm:py-6 sm:px-4 font-sans select-none">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[720px] sm:rounded-3xl shadow-sm sm:border sm:border-[#e2eaf2] flex flex-col justify-between overflow-hidden">
        
        {/* Header */}
        <header className="w-full bg-white border-b border-[#f1f5f9] h-14 sm:h-16 flex items-center justify-between px-5 relative shrink-0">
          <button
            onClick={phase === "levels" ? onBack : () => setPhase("levels")}
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

        {/* BODY */}
        <main className="flex-1 px-6 sm:px-8 py-5 flex flex-col justify-center max-w-sm mx-auto w-full overflow-y-auto">
          
          {phase === "levels" && (
            <div className="space-y-4">
              <div className="text-left mb-2">
                <h1 className="text-2xl font-black text-[#0f2942] tracking-tight">{t("assessmentTitle")}</h1>
                <p className="text-xs text-[#64748b] mt-1">{t("assessmentSubtitle")}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {ASSESSMENT_LEVELS.map((lvl, idx) => {
                  const open = idx === 0 || (best[idx] ?? 0) >= PASS_MARK || levelUnlocked(user.employeeId, lvl.level);
                  const cleared = (best[idx] ?? 0) >= PASS_MARK;
                  return (
                    <button
                      key={lvl.level}
                      onClick={() => open && startLevel(idx)}
                      disabled={!open}
                      className={`w-full py-4 px-5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.99] ${
                        !open
                          ? "bg-[#f5f8fb] border-[#e2eaf2] opacity-60 cursor-not-allowed"
                          : cleared
                          ? "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                          : "bg-[#eef7fe] hover:bg-[#e4f1fc] border-[#dbeefe]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${
                          cleared ? "bg-emerald-500 text-white" : open ? "bg-[#0284c7] text-white" : "bg-slate-300 text-white"
                        }`}>
                          {lvl.level}
                        </span>
                        <span className="flex flex-col">
                          <span className="text-sm font-bold text-[#0f2942]">
                            {t("level")} {lvl.level} · {lvl.title}
                          </span>
                          <span className="text-[11px] text-[#64748b]">
                            {open
                              ? cleared
                                ? `${t("bestScore")}: ${best[idx]}/10`
                                : t("startQuiz")
                              : t("clearToUnlock", { n: lvl.level - 1 })}
                          </span>
                        </span>
                      </span>
                      {!open ? (
                        <Lock className="w-4 h-4 text-slate-400" />
                      ) : cleared ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Award className="w-5 h-5 text-[#0284c7]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-[#94a3b8] text-center pt-1">
                {t("viewModulesFirst")}
              </p>
            </div>
          )}

          {phase === "quiz" && (
            <div className="space-y-4">
              {/* progress + timer */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0f2942]">
                  {t("question")} {qIdx + 1} {t("of")} {questions.length}
                </span>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  timeLeft <= 10 ? "bg-rose-50 text-rose-600" : "bg-[#eef7fe] text-[#0284c7]"
                }`}>
                  <Timer className="w-3.5 h-3.5" />
                  {timeLeft}s
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#e2eaf2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0284c7] transition-all duration-1000"
                  style={{ width: `${((qIdx + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
                />
              </div>

              {/* question */}
              <div className="space-y-3">
                {question.image && <QuestionImage kind={question.image} />}
                <p className="text-sm font-bold text-[#0f2942] leading-snug">{question.prompt}</p>
                <div className="space-y-2">
                  {question.options.map((opt, i) => {
                    const isAnswer = i === question.answerIndex;
                    const isPicked = selected === i;
                    let cls = "bg-[#f8fbfe] border-[#e2eaf2] text-[#0f2942] hover:border-[#0284c7]";
                    if (revealed && isAnswer) cls = "bg-emerald-50 border-emerald-300 text-emerald-800";
                    else if (revealed && isPicked && !isAnswer) cls = "bg-rose-50 border-rose-300 text-rose-700";
                    else if (revealed) cls = "bg-[#f8fbfe] border-[#e2eaf2] text-[#64748b]";
                    return (
                      <button
                        key={i}
                        onClick={() => submitAnswer(i)}
                        disabled={revealed}
                        className={`w-full py-2.5 px-4 rounded-xl border text-left text-xs font-semibold transition-all ${cls}`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span>{opt}</span>
                          {revealed && isAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                          {revealed && isPicked && !isAnswer && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {revealed && (
                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-xs font-bold ${selected === question.answerIndex ? "text-emerald-600" : "text-rose-600"}`}>
                      {selected === question.answerIndex ? t("correct") : question.prompt && t("wrongAnswer")}
                    </span>
                    <button
                      onClick={nextQuestion}
                      className="px-5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold active:scale-95 transition-all"
                    >
                      {qIdx + 1 >= questions.length ? t("done") : t("next")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {phase === "result" && (
            <div className="text-center space-y-4 py-6">
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
                passed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}>
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0f2942]">
                  {passed ? t("quizPassedTitle") : t("quizFailedTitle")}
                </h3>
                <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed">
                  {passed
                    ? t("quizPassedBody", { s: score, n: level.level + 1 })
                    : t("quizFailedBody", { s: score })}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#eef7fe] border border-[#dbeefe] text-sm font-black text-[#026aa7]">
                {t("scoreLabel")}: {score} / 10
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => startLevel(levelIdx)}
                  className="w-full py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{passed ? t("reviewFromStart") : t("retryQuiz")}</span>
                </button>
                <button
                  onClick={() => setPhase("levels")}
                  className="w-full py-2.5 rounded-xl border border-[#cfe6fa] text-[#0284c7] hover:bg-sky-50 font-bold text-xs transition-all active:scale-95"
                >
                  {t("backToAssessment")}
                </button>
              </div>
            </div>
          )}

        </main>

        <div className="h-6 sm:h-8 shrink-0"></div>
      </div>
    </div>
  );
};
