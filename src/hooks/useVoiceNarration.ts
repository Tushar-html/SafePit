import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { useLanguage } from "../context/LanguageContext";

/* ============================================================
   Voice narration — the module reads its description aloud.

   Engines, in order:
   1. NATIVE Android TextToSpeech (@capacitor-community/text-to-speech)
      — imported DIRECTLY so the plugin proxy is always resolved
      through the Capacitor bridge. The Android WebView does not
      ship window.speechSynthesis, so on the APK this is the only
      engine that can actually be heard.
   2. Web Speech Synthesis — desktop/browser fallback.

   Language follows the user's choice (en-IN / hi-IN / sat-IN).
   If the device lacks the exact locale (Santali), the nearest
   supported engine locale is probed and used automatically.
   ============================================================ */

export function useVoiceNarration() {
  const { lang, ttsLocale } = useLanguage();
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  const nativeLangRef = useRef<string | null>(null); // probed locale, null = native unavailable
  const voiceCache = useRef<SpeechSynthesisVoice[] | null>(null);

  /* ---- engine availability + native language probe -------------- */
  useEffect(() => {
    const web = typeof window !== "undefined" && "speechSynthesis" in window;
    const isNative = Capacitor.isNativePlatform?.() ?? false;
    setSupported(isNative || web);
    if (!isNative) {
      nativeLangRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      // probe: exact locale → language-only → Hindi → English
      const candidates = [ttsLocale, ttsLocale.split("-")[0], "hi-IN", "en-IN"];
      let resolved: string | null = null;
      for (const c of candidates) {
        try {
          const r = await TextToSpeech.isLanguageSupported({ lang: c });
          if (r?.supported) {
            resolved = c;
            break;
          }
        } catch {
          break; // plugin broken → web fallback handles it
        }
      }
      if (!cancelled) nativeLangRef.current = resolved; // null → engine will fallback internally
    })();
    return () => {
      cancelled = true;
    };
  }, [ttsLocale]);

  /* ---- web voices cache ----------------------------------------- */
  const pickVoice = useCallback((): SpeechSynthesisVoice | undefined => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
    if (!voiceCache.current) {
      voiceCache.current = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        voiceCache.current = window.speechSynthesis.getVoices();
      };
    }
    const voices = voiceCache.current ?? [];
    const loc = ttsLocale.toLowerCase();
    const base = loc.split("-")[0];
    return (
      voices.find(v => v.lang.toLowerCase() === loc) ||
      voices.find(v => v.lang.toLowerCase().replace("_", "-") === loc) ||
      voices.find(v => v.lang.toLowerCase().startsWith(base)) ||
      undefined
    );
  }, [ttsLocale]);

  const stop = useCallback(() => {
    if (Capacitor.isNativePlatform?.()) {
      try {
        TextToSpeech.stop().catch(() => {});
      } catch {
        /* plugin missing */
      }
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const speakWeb = useCallback(
    (text: string, rate: number, onEnd?: () => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = ttsLocale;
      u.rate = rate;
      u.pitch = 1;
      u.volume = 1;
      const v = pickVoice();
      if (v) u.voice = v;
      u.onend = () => {
        setSpeaking(false);
        onEnd?.();
      };
      u.onerror = () => {
        setSpeaking(false);
        onEnd?.();
      };
      setSpeaking(true);
      // small delay helps engines start reliably right after cancel()
      setTimeout(() => window.speechSynthesis.speak(u), 60);
    },
    [ttsLocale, pickVoice]
  );

  const speak = useCallback(
    (text: string, opts?: { rate?: number; onEnd?: () => void }) => {
      if (!text) {
        opts?.onEnd?.();
        return;
      }
      const rate = opts?.rate ?? 0.95;

      // ---- 1. native Android TTS ----------------------------------
      if (Capacitor.isNativePlatform?.()) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setSpeaking(true);
        TextToSpeech.stop()
          .catch(() => {})
          .then(() =>
            TextToSpeech.speak({
              text,
              lang: nativeLangRef.current ?? ttsLocale,
              rate,
              pitch: 1,
              volume: 1,
            })
          )
          .then(() => {
            setSpeaking(false);
            opts?.onEnd?.();
          })
          .catch(() => {
            // native engine failed → try the web engine before giving up
            speakWeb(text, rate, opts?.onEnd);
          });
        return;
      }

      // ---- 2. web speech synthesis --------------------------------
      speakWeb(text, rate, opts?.onEnd);
    },
    [ttsLocale, speakWeb]
  );

  // cancel narration when language changes or the component unmounts
  useEffect(() => {
    return () => {
      stop();
    };
  }, [lang, stop]);

  return { speak, stop, speaking, supported };
}
