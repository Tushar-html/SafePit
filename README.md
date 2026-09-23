# SafePit 🪖

An **augmented reality safety training app for mine workers**. SafePit overlays interactive 3D training modules onto the user's real environment through the phone camera, with on-screen descriptions and voice narration in **English, Hindi, and Santali** — breaking language and literacy barriers in industrial safety education.

Built with **React + Three.js**, packaged for **Android 10+** via **Capacitor**.

---

## ✨ Features

### 🧑‍🏭 Onboarding
- Registration flow with mine/map-based site selection (Google Maps + location permission), validated employee ID (3 letters + 3 digits), and password confirmation.
- Language selection popup on first login (English / हिन्दी / ᱥᱟᱱᱛᱟᱲᱤ) — the entire app UI, module descriptions, and voice narration follow the chosen language. A **change-language button** stays available on the main interface.

### 🎓 Training Modules (AR)
Each module renders a scripted 3D scene in a mine-like environment (wooden pit props, clean drift), narrated step by step:

| Module | Teaches |
|---|---|
| 🔥 **Fire & Explosion Identification** | Fire classes, eruption-phase explosion behaviour |
| 🚪 **Exit Route Identification** | Primary escapeway ("MAIN EXIT"), secondary escapeway, refuge chamber entry (green-light door protocol) |
| 🧯 **Fire Extinguisher Operation** | Full PASS sequence — approach, safety-pin removal, aim, squeeze, sweep, thumbs-up completion |
| 🧭 **Evacuation Sequencing** | Call-point alarm, alerting co-workers, group assembly, supervisor reporting |

- **Voice narration** via native Text-to-Speech, in the selected language (Santali voice falls back to Hindi audio, as no TTS engine reads Ol Chiki script today).
- **Mute/unmute** toggle inside every module.

### 📱 True AR Placement
- **Plane surface detection**: point the center reticle at any reasonably flat surface (floor, table, bed, even a hand) → short hold → the surface locks.
- **World-locked models**: once placed, the model is an object *in the room*, not an overlay — pan the phone and it stays at its spot, walk closer and it grows, step back and it shrinks.
- **360° viewing**: pan/orbit around the placed model from every direction (except from underneath the surface).
- **Tracking-state handling**: rapid movement, blocked camera, or lost tracking hides the model with a banner and restores it at the same anchor when tracking recovers. A **re-place button** re-anchors at any time.
- **Debug HUD** (bug icon in-module): live pitch/yaw, camera position, distance, visual-odometry and sensor health readouts for on-device diagnosis.

### 📝 Assessment
- 5 levels (Level 1 = Fire & Explosion, 2 = Gas, 3 = Machinery, 4–5 = mixed) — 10 timed multiple-choice questions each, unlocked sequentially. Scores feed the certificate.

### 📜 Certificate
- QR-verified certificate with profile photo, module completion, quality score, and a performance remark (85 %+ = strong pass).

---

## 🛠 Tech Stack

- **React 19 + TypeScript + Vite** — UI and build
- **Three.js** — 3D module scenes and AR rendering
- **Tailwind CSS** — styling
- **Capacitor 8** — Android packaging (`@capacitor-community/text-to-speech` for narration)
- **Custom AR pipeline** — sensor-fusion world tracking:
  - Device orientation (absolute when available) → camera pose
  - Visual-inertial odometry (camera-feed block matching, gyro-compensated) → position/translation
  - Floor-plane anchoring, tracking-state machine, hysteresis to prevent flicker

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **Android Studio** (SDK 29+, for the Android build/emulator)
- A device or emulator on **Android 10+**

### Install

```bash
npm install
```

### Develop (browser)

```bash
npm run dev
```

### Build for Android

```bash
# Web build + sync to the Android project
npm run android:sync

# Full debug APK (build + sync + gradle assembleDebug)
npm run android:build

# Build, install and launch on a connected device
npm run android:run
```

The debug APK is written to `android/app/build/outputs/apk/debug/`.

### Regenerate launcher icons

After changing `public/logo.png`:

```bash
npm run icons
```

---

## 📁 Project Structure

```
android/               Capacitor Android shell (gradle project)
public/                Static assets (logo, icons source)
scripts/               Icon generation and utility scripts
src/
  components/          App screens + AR module shells
    ARShell.tsx        Shared AR session UI: camera box, reticle,
                       placement flow, tracking banners, HUD
    AR*Module.tsx      The five training modules
    *Models3D.ts       Three.js scene builders per module
  hooks/
    useARTracking.ts   AR session core: device pose, plane detection,
                       anchor state machine, tracking quality
    useVisualOdometry.ts  Camera-feed block-matching position tracking
    useVoiceNarration.ts  TTS narration (native plugin + web fallback)
  i18n/                UI dictionary (en/hi/sat) + module line translations
  context/             Language context (choice persists across the app)
  data/                Scripted step definitions per module
```

---

## 🌐 Languages & Voice

- All UI strings and all module step descriptions exist in **English, Hindi, and Santali** (`src/i18n/`).
- Narration uses the device TTS engine: exact locale match → language match → `hi-IN` → `en-IN` fallback chain.
- **Santali note**: no Android TTS engine can read Ol Chiki script, so in Santali mode the screen text is Santali while the spoken audio uses the Hindi rendering of the same line.

---

## 🔧 Troubleshooting AR

| Symptom | Check |
|---|---|
| "No plane surface found" never clears | Open the debug HUD — if `gyro`/`motion` show `never`, sensors are blocked; check app permissions. Aim *down* at the surface and hold still ~½ s. |
| Model floats above the floor | The anchor is stamped at the crosshair point — re-place (radar icon) aiming the reticle exactly at the surface. |
| Model doesn't grow when walking closer | Visual odometry needs a **textured** surface — over a blank uniform floor it degrades to rotation-only tracking. HUD `blocks` should read > 5. |
| Model flickers | Should not — tracking-loss needs 700 ms sustained vision loss. If it does, check for flickering room lights and report HUD `state`. |
| Voice silent | Rebuild the APK — the TTS plugin requires a fresh `android:build` after install. |

---

## 📄 License

Private project — all rights reserved.
