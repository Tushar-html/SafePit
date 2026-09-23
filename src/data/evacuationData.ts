export interface EvacuationStep {
  id: number;
  name: string;
  displayName: string;
  hazardLevel: "Low Risk" | "Medium Risk" | "High Risk";
  hazardColorHex: string;
  hazardBadgeColor: string;
  modelType:
    | "recognize"
    | "alarm"
    | "assist"
    | "judgment"
    | "move_exit"
    | "avoid_lift"
    | "no_return"
    | "muster"
    | "checkin";
  lines: string[];
}

export const EVACUATION_STEPS: EvacuationStep[] = [
  {
    id: 1,
    name: "recognize",
    displayName: "Evacuation Sequencing",
    hazardLevel: "Low Risk",
    hazardColorHex: "#16a34a",
    hazardBadgeColor: "bg-white text-emerald-600 border border-emerald-200",
    modelType: "recognize",
    lines: [
      "Drill opens mid-task — smoke begins rising from equipment in the drift.",
      "The miner stops work and turns his head toward the hazard source.",
      "The hazard is highlight-flashed to confirm detection and mark reaction time.",
      "Recognizing the hazard quickly is scored as the first checkpoint."
    ]
  },
  {
    id: 2,
    name: "alarm",
    displayName: "Evacuation Sequencing",
    hazardLevel: "Low Risk",
    hazardColorHex: "#16a34a",
    hazardBadgeColor: "bg-white text-emerald-600 border border-emerald-200",
    modelType: "alarm",
    lines: [
      "The miner moves directly to the nearest manual call point — nothing else first.",
      "He grips the lever and pulls it down, breaking the cover.",
      "Site-wide alarm triggers: strobes flash in sequence down the tunnel.",
      "Alerting the control room must happen before any other response action."
    ]
  },
  {
    id: 3,
    name: "assist",
    displayName: "Evacuation Sequencing",
    hazardLevel: "Medium Risk",
    hazardColorHex: "#ca8a04",
    hazardBadgeColor: "bg-white text-amber-600 border border-amber-200",
    modelType: "assist",
    lines: [
      "A quick 180-degree visual sweep of the immediate surroundings.",
      "A nearby coworker hasn't reacted — still working, unaware.",
      "The miner closes the distance, waves and points to the hazard and escape route.",
      "The coworker switches from idle to alert and follows — no lingering allowed."
    ]
  },
  {
    id: 4,
    name: "judgment",
    displayName: "Evacuation Sequencing",
    hazardLevel: "High Risk",
    hazardColorHex: "#ea580c",
    hazardBadgeColor: "bg-white text-orange-600 border border-orange-200",
    modelType: "judgment",
    lines: [
      "Decision point: fight the fire, or flee to the exit?",
      "If the fire is small and contained AND the exit path behind stays clear — fight.",
      "If it is large, spreading, or blocking the escapeway — turn away immediately.",
      "Fleeing is the default correct choice; firefighting must be justified."
    ]
  },
  {
    id: 5,
    name: "move_exit",
    displayName: "Evacuation Sequencing",
    hazardLevel: "Medium Risk",
    hazardColorHex: "#ca8a04",
    hazardBadgeColor: "bg-white text-amber-600 border border-amber-200",
    modelType: "move_exit",
    lines: [
      "A brisk, purposeful walk — never a run, to avoid trips and falls.",
      "Follow the glowing AR path markers along the floor toward the escapeway.",
      "Check waypoint markers at each junction before committing.",
      "If smoke blocks the route, the overlay reroutes to the alternate escapeway."
    ]
  },
  {
    id: 6,
    name: "avoid_lift",
    displayName: "Evacuation Sequencing",
    hazardLevel: "High Risk",
    hazardColorHex: "#ea580c",
    hazardBadgeColor: "bg-white text-orange-600 border border-orange-200",
    modelType: "avoid_lift",
    lines: [
      "At the junction: lift cage on one side, ladderway on the other.",
      "The miner reaches for the lift call button — then pulls back mid-reach.",
      "A flashing DO-NOT-USE cross marks the lift: it can trap occupants or lose power.",
      "He redirects to the ladderway and descends at a steady pace, hand on the rail."
    ]
  },
  {
    id: 7,
    name: "no_return",
    displayName: "Evacuation Sequencing",
    hazardLevel: "Medium Risk",
    hazardColorHex: "#ca8a04",
    hazardBadgeColor: "bg-white text-amber-600 border border-amber-200",
    modelType: "no_return",
    lines: [
      "A personal bag is left on a bench beside the drift — highlighted briefly.",
      "The miner's head turns toward it — one beat of hesitation.",
      "He keeps walking: personal items are never worth the delay.",
      "Any detour here scores a time penalty against the evacuation."
    ]
  },
  {
    id: 8,
    name: "muster",
    displayName: "Evacuation Sequencing",
    hazardLevel: "Low Risk",
    hazardColorHex: "#16a34a",
    hazardBadgeColor: "bg-white text-emerald-600 border border-emerald-200",
    modelType: "muster",
    lines: [
      "Clear of the hazard zone, he continues to the flagged muster point.",
      "ASSEMBLY POINT B: marked post with sign and painted ground marking.",
      "Other miners converge from different escape routes into a loose group.",
      "Stopping anywhere other than the assigned muster point is scored as a miss."
    ]
  },
  {
    id: 9,
    name: "checkin",
    displayName: "Evacuation Sequencing",
    hazardLevel: "Low Risk",
    hazardColorHex: "#16a34a",
    hazardBadgeColor: "bg-white text-emerald-600 border border-emerald-200",
    modelType: "checkin",
    lines: [
      "Final beat: he reports to the supervisor with the checklist at the muster post.",
      "A raised-hand gesture registers his presence on the roll call.",
      "The kiosk marks a green check with his name and employee ID.",
      "Check-in completes the evacuation loop — never leave without registering."
    ]
  }
];
