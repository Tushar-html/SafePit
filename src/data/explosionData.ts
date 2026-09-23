export interface ExplosionHazardModel {
  id: number;
  name: string;
  displayName: string;
  hazardLevel: string;
  hazardColorHex: string;
  hazardBadgeColor: string;
  modelType: "methane_explosion" | "coal_dust_explosion" | "combined_explosion" | "blasting_misfire" | "sulphide_dust_explosion" | "gas_outburst_explosion";
  lines: [string, string, string, string, string];
}

export const EXPLOSION_HAZARD_MODELS: ExplosionHazardModel[] = [
  {
    id: 1,
    name: "methane_explosion",
    displayName: "Methane (Firedamp) Explosion",
    hazardLevel: "Critical Risk",
    hazardColorHex: "#dc2626",
    hazardBadgeColor: "bg-white text-red-600 border border-red-200",
    modelType: "methane_explosion",
    lines: [
      "Near-instantaneous expanding fireball with a pale blue core and bright orange-yellow outer edge.",
      "Thin sheet-like flame front races along the roof line first where lighter methane pools.",
      "Thickens rapidly into a spherical orange-red fireball spanning roadway dimensions before collapsing inward.",
      "Fast-moving shimmering shockwave ring trails ahead, pushing dust and loose rock outward.",
      "Followed immediately by thick, turbulent grey-black smoke rapidly filling the mine roadway."
    ]
  },
  {
    id: 2,
    name: "coal_dust_explosion",
    displayName: "Coal Dust Explosion",
    hazardLevel: "Critical Risk",
    hazardColorHex: "#dc2626",
    hazardBadgeColor: "bg-white text-red-600 border border-red-200",
    modelType: "coal_dust_explosion",
    lines: [
      "Rolling, self-propagating wall of orange-red flame moving in a continuous advancing wave.",
      "Flame front picks up and ignites suspended coal dust ahead, growing larger and more violent.",
      "Rough, turbulent texture with chunky billowing orange tongues mixed with dark particulate clouds.",
      "Dense black smoke and heavy dust clouds trail the flame front, dropping roadway visibility to zero.",
      "Violent blast path scatters splintered timber supports and rock fragments outward."
    ]
  },
  {
    id: 3,
    name: "combined_explosion",
    displayName: "Combined Methane + Coal Dust Explosion",
    hazardLevel: "Critical Risk (Most Severe)",
    hazardColorHex: "#991b1b",
    hazardBadgeColor: "bg-white text-red-700 border border-red-300",
    modelType: "combined_explosion",
    lines: [
      "Two-stage catastrophic event: initiated by a sharp, brilliant blue-white methane ignition flash.",
      "Immediately triggers and transitions into a massive advancing orange-red coal dust flame wall.",
      "Expands violently and elongates down the roadway, consuming airborne dust over great distances.",
      "High-velocity pressure wave and destructive debris field far exceeding single-source events.",
      "Complete tunnel atmosphere is overcome with dense opaque smoke, toxic gases, and heavy dust."
    ]
  },
  {
    id: 4,
    name: "blasting_misfire",
    displayName: "Blasting Misfire / Secondary Explosion",
    hazardLevel: "High to Critical Risk",
    hazardColorHex: "#ea580c",
    hazardBadgeColor: "bg-white text-orange-600 border border-orange-200",
    modelType: "blasting_misfire",
    lines: [
      "Localized, intensely bright white-orange point-source detonation flash at the blast face.",
      "Short-lived sharp-edged starburst flame pattern rather than an advancing rolling wave.",
      "Rock fragments and mineral dust shoot radially outward in a concentrated high-speed cone.",
      "Distinct visible pressure-wave distortion ring expands rapidly from the blast center.",
      "Delayed rolling orange-black secondary cloud forms if airborne coal dust is ignited."
    ]
  },
  {
    id: 5,
    name: "sulphide_dust_explosion",
    displayName: "Sulphide Dust Explosion",
    hazardLevel: "Moderate to High Risk",
    hazardColorHex: "#ca8a04",
    hazardBadgeColor: "bg-white text-amber-600 border border-amber-200",
    modelType: "sulphide_dust_explosion",
    lines: [
      "Duller, deep reddish-orange flame front advancing in a rolling wave through ore galleries.",
      "Slower propagation velocity and less luminous than organic coal dust combustions.",
      "Grainy, speckled flame texture caused by burning sulphide mineral micro-particulates.",
      "Trails a dense, yellowish-brown smoke and toxic sulphur dioxide (SO2) dust cloud.",
      "Extensive irritating sulphur haze expands well beyond the immediate flame and blast boundary."
    ]
  },
  {
    id: 6,
    name: "gas_outburst_explosion",
    displayName: "Gas Outburst-Triggered Explosion",
    hazardLevel: "Critical Risk",
    hazardColorHex: "#dc2626",
    hazardBadgeColor: "bg-white text-red-600 border border-red-200",
    modelType: "gas_outburst_explosion",
    lines: [
      "Initiated by a sudden mechanical gas outburst violently ejecting fractured coal from the face.",
      "Dense, fast-expanding grey-brown dust cloud forms first with large flying rock chunks.",
      "Sudden high-pressure methane/CO2 release saturates the roadway atmosphere within seconds.",
      "Delayed secondary blue-orange ignition tears through the suspended dust-laden gas cloud.",
      "Flame appears distinctly 'dirty', with turbulent orange fire visibly churning with mineral dust."
    ]
  }
];
