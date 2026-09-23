import { FireHazardModel } from "../types";

export const FIRE_HAZARD_MODELS: FireHazardModel[] = [
  {
    id: 1,
    name: "methane_fire",
    displayName: "Methane / Gas Fire",
    hazardLevel: "High Risk",
    hazardColorHex: "#ea580c",
    hazardBadgeColor: "bg-white text-orange-600 border border-orange-200",
    modelType: "methane",
    lines: [
      "Slender, pale blue-violet flame with a whitish-blue core, standing 6–12 inches tall.",
      "Flickers and dances erratically rather than standing still.",
      "Almost translucent near the base, becoming wispy and faint toward the tip.",
      "Small dancing flame tongues split along roof cracks or floor fissures.",
      "Clean combustion with no soot; only a thin heat-shimmer distortion in the air."
    ]
  },
  {
    id: 2,
    name: "coal_fire",
    displayName: "Coal (Solid Fuel) Fire",
    hazardLevel: "High Risk",
    hazardColorHex: "#ea580c",
    hazardBadgeColor: "bg-white text-orange-600 border border-orange-200",
    modelType: "coal",
    lines: [
      "Fuller, bright orange-yellow flame with deep red streaks near its base.",
      "Jagged tips curl upward; flames may be roughly 1–3 feet tall.",
      "Dense and opaque flame body, brightest orange in middle, fading to red at edges.",
      "Above it, thick black-grey smoke billows continuously in rolling cauliflower plumes.",
      "Small glowing embers or sparks drift upward from the flame tips."
    ]
  },
  {
    id: 3,
    name: "smouldering_fire",
    displayName: "Smouldering Spontaneous Heating",
    hazardLevel: "Moderate Risk",
    hazardColorHex: "#ca8a04",
    hazardBadgeColor: "bg-white text-amber-600 border border-amber-200",
    modelType: "smouldering",
    lines: [
      "No open flame here at all.",
      "Dull reddish-orange glow deep within a coal seam or pile.",
      "Embers pulse faintly beneath a fractured greyish coal crust.",
      "Thin wisps of white-grey smoke or haze seep out slowly and lazily.",
      "Coal surface displays a dusty yellowish-white film of sulphur/ammonium salt deposits."
    ]
  },
  {
    id: 4,
    name: "gob_fire",
    displayName: "Deep-Seated Hidden Fire (Gob / Goaf)",
    hazardLevel: "Critical Risk",
    hazardColorHex: "#dc2626",
    hazardBadgeColor: "bg-white text-red-600 border border-red-200",
    modelType: "gob",
    lines: [
      "Almost no flame is visible on the surface.",
      "Faint deep-red flicker buried within collapsed rubble, mostly hidden from view.",
      "Dense, heavy black-grey smoke pours out from voids in thick, rolling plumes.",
      "Smoke is turbulent and opaque; its source may look yellowish.",
      "Smoke pulses with a breathing rhythm—surging out strongly, thinning, and surging again."
    ]
  },
  {
    id: 5,
    name: "oil_conveyor_fire",
    displayName: "Oil / Grease / Conveyor Belt Fire",
    hazardLevel: "High Risk",
    hazardColorHex: "#ea580c",
    hazardBadgeColor: "bg-white text-orange-600 border border-orange-200",
    modelType: "oil",
    lines: [
      "Tall, wavy flame 2–4 feet high, deep orange at core with reddish flickering tips.",
      "Thick, fuel-heavy greasy appearance with smooth, glossy undulating movement.",
      "Very dark oily smoke rises in dense, twisting columns.",
      "Very thick smoke almost blots out visibility above the flame zone.",
      "Small droplets or sparks of melting/burning rubber fall from the flame source."
    ]
  },
  {
    id: 6,
    name: "sulphide_ore_fire",
    displayName: "Sulphide Ore Fire",
    hazardLevel: "Moderate Risk",
    hazardColorHex: "#0284c7",
    hazardBadgeColor: "bg-white text-sky-600 border border-sky-200",
    modelType: "sulphide",
    lines: [
      "Low, creeping flame, faint blue-grey in color, barely rising above ore surface.",
      "Almost flat and ground-hugging rather than tall, spreading slowly across the ore pile.",
      "Smoke is thin and bluish-white, drifting in slow, straight wisps rather than billowing.",
      "Visible shimmer of heat around the creeping flame edge.",
      "Surrounding ore surface shows a pale yellowish crust of sulphur residue."
    ]
  },
  {
    id: 7,
    name: "electrical_arc_fire",
    displayName: "Metal / Electrical Arc Fire",
    hazardLevel: "Critical Risk",
    hazardColorHex: "#dc2626",
    hazardBadgeColor: "bg-white text-red-600 border border-red-200",
    modelType: "metal_arc",
    lines: [
      "Short, intensely bright white to yellow-white flame, almost blinding at its core.",
      "No taller than a few inches, but extremely concentrated and sharp-edged rather than wavy.",
      "Rapid bursts of brilliant white-yellow sparks shoot outward in firework-like arcs.",
      "Very little smoke is present; only a faint grey wisp directly above the arc point.",
      "Surrounding area displays scorch marks, blackened steel, and glowing hot metal."
    ]
  }
];
