export interface ExtinguisherStep {
  id: number;
  name: string;
  displayName: string;
  hazardLevel: "Training Drill" | "Low Risk" | "Medium Risk" | "High Risk";
  hazardColorHex: string;
  hazardBadgeColor: string;
  modelType: "stance" | "approach" | "lift" | "pin_pull" | "aim" | "discharge" | "sweep" | "extinguished";
  lines: string[];
}

export const EXTINGUISHER_STEPS: ExtinguisherStep[] = [
  {
    id: 1,
    name: "stance",
    displayName: "Fire Extinguisher Use",
    hazardLevel: "Training Drill",
    hazardColorHex: "#0284c7",
    hazardBadgeColor: "bg-white text-sky-600 border border-sky-200",
    modelType: "stance",
    lines: [
      "Watch the drill: the miner walks in with the extinguisher already gripped in both hands.",
      "A contained fire burns on a wooden pallet ahead of him.",
      "Before approaching any fire, always confirm your escape route stays clear behind you.",
      "You must do the same: carry the extinguisher ready and keep low — visibility is best near the floor."
    ]
  },
  {
    id: 2,
    name: "approach",
    displayName: "Fire Extinguisher Use",
    hazardLevel: "Low Risk",
    hazardColorHex: "#16a34a",
    hazardBadgeColor: "bg-white text-emerald-600 border border-emerald-200",
    modelType: "approach",
    lines: [
      "The miner walks straight up to a safe distance — about 2 metres from the fire.",
      "He stops and stands firm, facing the fire with his back to the open escape path.",
      "You should stop at the same distance — never get closer than needed.",
      "Stand square, feet apart, ready to act or retreat instantly."
    ]
  },
  {
    id: 3,
    name: "pin_pull",
    displayName: "Fire Extinguisher Use",
    hazardLevel: "Low Risk",
    hazardColorHex: "#16a34a",
    hazardBadgeColor: "bg-white text-emerald-600 border border-emerald-200",
    modelType: "pin_pull",
    lines: [
      "Next he removes the safety pin — watch his right hand twist and pull the ring out.",
      "The tamper seal breaks and the pin comes free in one firm motion.",
      "When you do this, hold the cylinder steady with one hand while pulling the pin with the other.",
      "Never squeeze the lever before the pin is out — the handle will not press."
    ]
  },
  {
    id: 4,
    name: "aim",
    displayName: "Fire Extinguisher Use",
    hazardLevel: "Medium Risk",
    hazardColorHex: "#ca8a04",
    hazardBadgeColor: "bg-white text-amber-600 border border-amber-200",
    modelType: "aim",
    lines: [
      "Now he raises the nozzle and aims at the BASE of the fire — never the flames' tips.",
      "Hitting the top of the flame only spreads burning material around.",
      "You must aim the nozzle low, at the base where the fuel is burning.",
      "Keep the hose firm in one hand and the cylinder stable in the other."
    ]
  },
  {
    id: 5,
    name: "discharge",
    displayName: "Fire Extinguisher Use",
    hazardLevel: "Medium Risk",
    hazardColorHex: "#ca8a04",
    hazardBadgeColor: "bg-white text-amber-600 border border-amber-200",
    modelType: "discharge",
    lines: [
      "He squeezes the lever slowly and evenly — white smoke jets onto the fire's base.",
      "The spray crashes over the flames and begins smothering them immediately.",
      "Squeeze your lever the same way: press fully and control the jet at the base.",
      "A discharge lasts only seconds — make every moment count."
    ]
  },
  {
    id: 6,
    name: "sweep",
    displayName: "Fire Extinguisher Use",
    hazardLevel: "High Risk",
    hazardColorHex: "#ea580c",
    hazardBadgeColor: "bg-white text-orange-600 border border-orange-200",
    modelType: "sweep",
    lines: [
      "Watch the flame shrink with every side-to-side sweep of his nozzle.",
      "He keeps the jet on the base until the fire is fully knocked down.",
      "Sweep your nozzle slowly across the base of the fire until nothing is left burning.",
      "If the fire ever flares back, stop, back away, and never fight a growing fire."
    ]
  },
  {
    id: 7,
    name: "extinguished",
    displayName: "Fire Extinguisher Use",
    hazardLevel: "Low Risk",
    hazardColorHex: "#16a34a",
    hazardBadgeColor: "bg-white text-emerald-600 border border-emerald-200",
    modelType: "extinguished",
    lines: [
      "The fire is out — only light smoke drifts off the wet, powder-coated pallet.",
      "The miner holds the extinguisher in one hand and gives a thumbs-up: fire defeated.",
      "After extinguishing a fire, always watch the area — re-ignition can occur without warning.",
      "Report the used extinguisher for recharge and log the incident with your supervisor."
    ]
  }
];
