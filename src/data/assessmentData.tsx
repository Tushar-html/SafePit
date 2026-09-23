import { FIRE_HAZARD_MODELS } from "./fireData";

/* ============================================================
   Assessment question bank.
   Level 1 — Fire & Explosion (active now)
   Level 2 — Gas (pending module)
   Level 3 — Machinery (pending module)
   Level 4/5 — Mixed revision
   Each level: 10 questions, 30s each, ≥7 to clear.
   ============================================================ */

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  /** optional inline SVG drawing shown as the "model image" */
  image?: "fire_methane" | "fire_coal" | "fire_electrical" | "fire_smouldering" | "extinguisher_aim";
  options: string[];
  answerIndex: number;
}

export interface AssessmentLevel {
  level: number;
  title: string;
  scope: "fire" | "gas" | "machinery" | "mixed";
  active: boolean;
  questions: AssessmentQuestion[];
}

const q = (
  id: string,
  prompt: string,
  options: string[],
  answerIndex: number,
  image?: AssessmentQuestion["image"]
): AssessmentQuestion => ({ id, prompt, options, answerIndex, image });

const FIRE_QS: AssessmentQuestion[] = [
  q("f1", "The AR fire shown here has a slender pale blue-violet flame with no smoke. What type of fire is this?",
    ["Methane (gas) fire", "Coal fire", "Oil fire", "Electrical arc fire"], 0, "fire_methane"),
  q("f2", "A fire has thick black-grey rolling smoke and bright orange flames over coal. What is your FIRST action?",
    ["Pour water on it", "Raise the alarm and evacuate per the plan", "Fan the smoke away", "Wait for it to die down"], 1),
  q("f3", "What is the FIRST step before using a fire extinguisher?",
    ["Squeeze the lever", "Pull the safety pin", "Shake the cylinder", "Aim at the flames' top"], 1),
  q("f4", "You must aim the extinguisher jet at:",
    ["The top of the flames", "The middle of the smoke", "The BASE of the fire", "Above the fire"], 2),
  q("f5", "The white-hot spark-shooting fire shown here is a:",
    ["Sulphide ore fire", "Gob fire", "Metal / electrical arc fire", "Smouldering fire"], 2, "fire_electrical"),
  q("f6", "A dull red glow under cracked coal with NO open flame and lazy white wisps means:",
    ["A smouldering (spontaneous heating) fire", "A gas outburst", "A blasting misfire", "An electrical fault"], 0, "fire_smouldering"),
  q("f7", "While evacuating you must walk:",
    ["Briskly and purposefully, never running", "As fast as possible, even running", "Slowly chatting with coworkers", "Backwards to watch the fire"], 0),
  q("f8", "During evacuation you must NEVER use the:",
    ["Ladderway", "Lift / elevator", "Main exit", "Marked escapeway"], 1),
  q("f9", "Which extinguisher action sequence is correct (PASS)?",
    ["Pull, Aim, Squeeze, Sweep", "Aim, Pull, Squeeze, Sweep", "Squeeze, Sweep, Pull, Aim", "Pull, Squeeze, Aim, Sweep"], 0),
  q("f10", "You spot a small contained fire and your exit route behind you is clear. You should:",
    ["Fight it with an extinguisher", "Run away immediately", "Wait for the fire to grow", "Take photos for the supervisor"], 0),
  q("f11", "A glowing coal-dust cloud rolling down the tunnel means you should:",
    ["Walk through it quickly", "Turn away and take the alternate escapeway", "Cover it with a jacket", "Stand still and wait"], 1),
  q("f12", "The safest place to keep yourself while evacuating is:",
    ["Near the fire to monitor it", "Low near the floor where visibility is best", "On top of equipment", "Inside the smoke column"], 1),
  q("f13", "Before leaving your workplace during an alarm you should:",
    ["Collect your personal bag first", "Go straight to the muster point", "Switch off machines only after lunch", "Wait for the fire to reach you"], 1),
  q("f14", "A coworker hasn't noticed the fire and keeps working. You should:",
    ["Let him be", "Alert him and point to the escape route", "Push him aside", "Shout from far and leave"], 1),
];

const GAS_QS: AssessmentQuestion[] = [
  q("g1", "Which gas in mines is called 'firedamp' and is highly explosive between 5–15% concentration?",
    ["Carbon dioxide", "Methane", "Nitrogen", "Oxygen"], 1),
  q("g2", "Which gas is nicknamed 'blackdamp' and suffocates by displacing oxygen?",
    ["Methane", "Carbon dioxide / nitrogen mix", "Hydrogen sulphide", "Carbon monoxide"], 1),
  q("g3", "The gas that smells like rotten eggs and deadens your sense of smell at high levels is:",
    ["Hydrogen sulphide (H2S)", "Methane", "CO2", "Oxygen"], 0),
  q("g4", "CO is dangerous because it is:",
    ["Visible and yellow", "Odourless and binds to blood haemoglobin", "Heavier than air only", "Only explosive"], 1),
  q("g5", "A methane layer near the roof should be checked with:",
    ["A naked flame", "A flame safety lamp / gas detector at roof level", "Your nose", "Wetting the roof"], 1),
  q("g6", "Whiffletree / Boy's gas checks are recorded in the:",
    ["Lunch break register", "Gas monitoring log / board at the mine entrance", "Canteen notice", "Salary register"], 1),
  q("g7", "If your personal gas alarm sounds you must:",
    ["Ignore it if you feel fine", "Stop work, move to fresh air and inform the official", "Take off the detector", "Increase ventilation yourself"], 1),
  q("g8", "Ventilation in a mine exists mainly to:",
    ["Cool the workers", "Dilute and remove gases and dust, and supply oxygen", "Dry the coal", "Reduce noise"], 1),
  q("g9", "Which gas collects in dead ends and low-lying unused galleries?",
    ["Oxygen", "Blackdamp (CO2) in low spots, methane in roof pockets", "Steam", "Nitrogen only"], 1),
  q("g10", "A stone-dust barrier in a roadway is used to:",
    ["Decorate the mine", "Stop flame propagation of a dust explosion", "Filter water", "Support the roof"], 1),
  q("g11", "After blasting you should re-enter the face only when:",
    ["Smoke clears a little", "The official tests gas and declares it safe", "You feel like it", "The blaster whistles twice"], 1),
  q("g12", "Smell of rotten eggs near a puddle means you should:",
    ["Walk in to check", "Leave the area uphill/upwind and report", "Light a match to test", "Drink nothing and continue"], 1),
];

const MACHINERY_QS: AssessmentQuestion[] = [
  q("m1", "Before repairing any machine you must:",
    ["Tell a friend", "Isolate power, lock and tag out, then verify zero energy", "Work quickly", "Wear gloves only"], 1),
  q("m2", "While a conveyor is running you must NEVER:",
    ["Ride it", "Grease rollers", "Clean the drive drum", "All of the above"], 3),
  q("m3", "Guards on moving machine parts must be:",
    ["Removed for speed", "Fixed in place and never bypassed", "Loose", "Painted over"], 1),
  q("m4", "Loose clothing near rotating shafts:",
    ["Is fine if short", "Can get caught — wear snug clothing / PPE", "Helps cooling", "Is required by DGMS"], 1),
  q("m5", "The Pull-cord on a longwall conveyor is used to:",
    ["Speed it up", "Stop the conveyor along its full length in an emergency", "Change direction", "Signal lunch"], 1),
  q("m6", "A machine starts making abnormal noise/smell. You should:",
    ["Continue and watch", "Stop it and report for maintenance", "Hit it", "Increase load"], 1),
  q("m7", "Before reversing a loader/LHD the operator must:",
    ["Sound the horn and check behind", "Reverse fast", "Turn off lights", "Close one eye"], 0),
  q("m8", "Hydraulic hose pin-hole leaks are dangerous because:",
    ["Oil is costly", "High-pressure oil can inject through skin", "They are noisy", "They attract dust"], 1),
  q("m9", "Refuelling a diesel machine must be done with engine:",
    ["Running", "Off and cooled", "In neutral at idle", "In reverse"], 1),
  q("m10", "Who may operate a mine machine legally?",
    ["Anyone nearby", "A trained, certified operator", "Visitors", "Trainees alone"], 1),
  q("m11", "Seat belts in underground vehicles:",
    ["Optional", "Mandatory where fitted", "Only for supervisors", "Only on surface"], 1),
  q("m12", "Before approaching a stopped machine the first check is:",
    ["Horn", "That it is isolated and cannot move", "Tyres", "Paint"], 1),
];

const MIX_QS: AssessmentQuestion[] = [
  q("x1", "The fire triangle contains:",
    ["Fuel, heat, oxygen", "Water, dust, air", "Coal, gas, smoke", "Heat, water, foam"], 0),
  q("x2", "First action on discovering ANY underground fire:",
    ["Fight it alone", "Raise alarm / inform others and follow the escape plan", "Collect belongings", "Hide from smoke"], 1),
  q("x3", "A tagged-out switchboard must be switched on by:",
    ["Whoever needs power", "Only the person who locked/tagged it", "The newest worker", "The shift boss only"], 1),
  q("x4", "During smoke-filled escape you should:",
    ["Walk upright fast", "Stay low and follow the lifeline/markings", "Run blindly", "Climb to the roof"], 1),
  q("x5", "Self-rescuer (SCSR) is used when:",
    ["Every day", "There is smoke/gas in the air during escape", "Resting", "Eating"], 1),
  q("x6", "The best proof that gas testing happened:",
    ["Rumours", "Signed gas check record on the notice board", "A sticker on helmet", "Word of mouth"], 1),
  q("x7", "You find a damaged conveyor guard. You should:",
    ["Ignore if machine works", "Report and get it repaired before operating", "Remove other guards too", "Cover with cloth"], 1),
  q("x8", "Water should NEVER be used on:",
    ["Coal fire", "Electrical / oil fire", "Timber fire", "Paper fire"], 1),
  q("x9", "The final step of any evacuation is:",
    ["Go home", "Report to the muster point supervisor for roll call", "Sleep in the refuge", "Remove helmet"], 1),
  q("x10", "Refuge chambers are used when:",
    ["Escape is impossible — they provide air, water, comms", "You want rest", "It is lunch time", "Lift is broken"], 0),
  q("x11", "A blow of gas from a face means you should:",
    ["Run deeper inside", "Withdraw to fresh air and alarm", "Check with a match", "Take photos"], 1),
  q("x12", "Correct PPE underground includes:",
    ["Helmet, boots, lamp, SCSR, reflective clothing", "Only helmet", "Only boots", "Slippers and dhoti"], 0),
];

export const ASSESSMENT_LEVELS: AssessmentLevel[] = [
  { level: 1, title: "Fire & Explosion", scope: "fire", active: true, questions: FIRE_QS },
  { level: 2, title: "Gas", scope: "gas", active: false, questions: GAS_QS },
  { level: 3, title: "Machinery", scope: "machinery", active: false, questions: MACHINERY_QS },
  { level: 4, title: "Mixed Revision I", scope: "mixed", active: false, questions: MIX_QS },
  { level: 5, title: "Mixed Revision II", scope: "mixed", active: false, questions: [...MIX_QS.slice(0, 5), ...FIRE_QS.slice(0, 5)] },
];

/** Fire model sketches rendered as simple inline SVG "model images". */
export function QuestionImage({ kind }: { kind: NonNullable<AssessmentQuestion["image"]> }) {
  const common = "w-full h-24 rounded-xl bg-slate-900";
  if (kind === "fire_methane") {
    return (
      <svg viewBox="0 0 120 60" className={common} preserveAspectRatio="xMidYMid slice">
        <rect width="120" height="60" fill="#0b1220" />
        {[-8, 0, 8].map((x, i) => (
          <path key={i} d={`M ${60 + x} 48 C ${58 + x} 36, ${62 + x} 30, ${60 + x} 16`} stroke="#8fa8ff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
        ))}
        <ellipse cx="60" cy="49" rx="16" ry="3" fill="#1e293b" />
      </svg>
    );
  }
  if (kind === "fire_coal") {
    return (
      <svg viewBox="0 0 120 60" className={common} preserveAspectRatio="xMidYMid slice">
        <rect width="120" height="60" fill="#0b1220" />
        <path d="M 45 48 C 40 30, 55 26, 60 12 C 65 26, 80 30, 75 48 Z" fill="#ff7a1a" />
        <path d="M 52 48 C 50 38, 58 34, 60 24 C 62 34, 70 38, 68 48 Z" fill="#ffd166" />
        <circle cx="60" cy="10" r="6" fill="#1c1c22" opacity="0.8" />
        <ellipse cx="60" cy="49" rx="20" ry="3" fill="#1e293b" />
      </svg>
    );
  }
  if (kind === "fire_electrical") {
    return (
      <svg viewBox="0 0 120 60" className={common} preserveAspectRatio="xMidYMid slice">
        <rect width="120" height="60" fill="#0b1220" />
        <rect x="50" y="8" width="20" height="34" rx="2" fill="#334155" />
        {[[46, 20], [74, 28], [50, 36], [70, 14]].map(([x, y], i) => (
          <path key={i} d={`M ${x} ${y} l 5 -4 l -3 5 l 5 -1`} stroke="#fff7c2" strokeWidth="2" fill="none" />
        ))}
        <circle cx="60" cy="26" r="4" fill="#ffffff" />
      </svg>
    );
  }
  if (kind === "fire_smouldering") {
    return (
      <svg viewBox="0 0 120 60" className={common} preserveAspectRatio="xMidYMid slice">
        <rect width="120" height="60" fill="#0b1220" />
        <ellipse cx="60" cy="44" rx="26" ry="8" fill="#2c2a28" />
        <ellipse cx="60" cy="44" rx="14" ry="4.5" fill="#b33c0a" opacity="0.85" />
        <path d="M 52 38 q 3 -6 -2 -12" stroke="#cfcabc" strokeWidth="2" fill="none" opacity="0.7" />
        <path d="M 66 36 q 4 -7 -1 -13" stroke="#cfcabc" strokeWidth="2" fill="none" opacity="0.7" />
      </svg>
    );
  }
  // extinguisher_aim
  return (
    <svg viewBox="0 0 120 60" className={common} preserveAspectRatio="xMidYMid slice">
      <rect width="120" height="60" fill="#0b1220" />
      <rect x="18" y="14" width="8" height="24" rx="2" fill="#dc2626" />
      <rect x="21" y="8" width="3" height="6" fill="#222" />
      <path d="M 30 30 Q 45 34 52 40" stroke="#e2e8f0" strokeWidth="2" fill="none" />
      <path d="M 78 46 C 74 34, 84 32, 80 20 C 90 30, 96 36, 88 46 Z" fill="#ff7a1a" />
      <text x="44" y="56" fill="#94a3b8" fontSize="6">aim at base</text>
    </svg>
  );
}

/** localStorage key per user for best scores + unlock state */
export function scoreKey(employeeId: string) {
  return `safepit_scores_${employeeId}`;
}

export interface ScoreState {
  [level: number]: number; // best score achieved (out of 10)
}

export function loadScores(employeeId: string): ScoreState {
  try {
    const raw = localStorage.getItem(scoreKey(employeeId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function saveScore(employeeId: string, level: number, score: number): ScoreState {
  const s = loadScores(employeeId);
  if (!s[level] || score > s[level]) s[level] = score;
  try { localStorage.setItem(scoreKey(employeeId), JSON.stringify(s)); } catch { /* ignore */ }
  return s;
}

export function levelUnlocked(employeeId: string, level: number): boolean {
  if (level === 1) return true;
  const s = loadScores(employeeId);
  return (s[level - 1] ?? 0) >= 7;
}

export function qualityScore(employeeId: string): number {
  // average of cleared level scores as a percentage (max 100)
  const s = loadScores(employeeId);
  const cleared = Object.entries(s).filter(([, v]) => v >= 7);
  if (cleared.length === 0) return 0;
  const total = cleared.reduce((acc, [, v]) => acc + v, 0);
  return Math.round((total / (cleared.length * 10)) * 100);
}
