export interface ExitRouteModel {
  id: number;
  name: string;
  displayName: string;
  hazardLevel: string;
  hazardColorHex: string;
  hazardBadgeColor: string;
  modelType: "primary_escapeway" | "secondary_escapeway" | "escape_shafts" | "refuge_chambers";
  lines: [string, string, string, string, string];
}

export const EXIT_ROUTE_MODELS: ExitRouteModel[] = [
  {
    id: 1,
    name: "primary_escapeway",
    displayName: "Primary Escapeway",
    hazardLevel: "Active Evacuation",
    hazardColorHex: "#0284c7",
    hazardBadgeColor: "bg-white text-sky-600 border border-sky-200",
    modelType: "primary_escapeway",
    lines: [
      "Alarm activation: Cap lamp switched to emergency brightness and SCSR self-rescuer clipped.",
      "Miner walks briskly trailing hand along wall-mounted lifeline rope for directional guidance.",
      "Illuminated directional arrow signs highlight route junctions under emergency beam.",
      "Brief check-in pause at communication alcove to press call button and transmit location.",
      "Stepping over minor obstacles toward shaft collar to press cage call signal for surface hoist."
    ]
  },
  {
    id: 2,
    name: "secondary_escapeway",
    displayName: "Secondary (Alternate) Escapeway",
    hazardLevel: "Alternate Route (Hazard Bypass)",
    hazardColorHex: "#ea580c",
    hazardBadgeColor: "bg-white text-orange-600 border border-orange-200",
    modelType: "secondary_escapeway",
    lines: [
      "Blocked main route detected from heavy smoke/rockfall; miner turns to marked crosscut opening.",
      "Entering narrower alternate tunnel and gripping low-strung lifeline rope as visibility drops.",
      "Snapping emergency glow-stick strobe to illuminate spaced directional cone markers.",
      "Sweeping foot forward through standing water puddles to verify solid floor traction.",
      "Activating secondary emergency lighting pull-station to mark the safe path for trailing crews."
    ]
  },
  {
    id: 3,
    name: "escape_shafts",
    displayName: "Escape Shafts / Raises",
    hazardLevel: "Vertical Shaft Ascent",
    hazardColorHex: "#ca8a04",
    hazardBadgeColor: "bg-white text-amber-600 border border-amber-200",
    modelType: "escape_shafts",
    lines: [
      "Shaft collar arrival: Safety harness carabiner clipped onto ladder fall-arrest safety cable.",
      "Hand-over-hand climbing on rungs with rhythmic foot placement inside protective cage casing.",
      "Pausing at 6-meter rest platform to lean against safety cage and verify SCSR oxygen gauge.",
      "Unclipping and re-anchoring harness to upper cable segment amidst falling shaft water droplets.",
      "Emerging through surface escape hatch into fresh air as natural daylight floods the collar."
    ]
  },
  {
    id: 4,
    name: "refuge_chambers",
    displayName: "Refuge Chambers (Safe Rooms)",
    hazardLevel: "Safe Haven (Life Support Active)",
    hazardColorHex: "#16a34a",
    hazardBadgeColor: "bg-white text-emerald-600 border border-emerald-200",
    modelType: "refuge_chambers",
    lines: [
      "Surface escape compromised: Following high-visibility reflective signs directly into chamber alcove.",
      "Pulling heavy blast door open against seal, swinging shut, and rotating locking wheel airtight.",
      "Flipping ventilation console switches to initiate positive-pressure purified air overpressure.",
      "Seated inside hermetic room, opening backup oxygen cylinders and verifying CO2 scrubber gauges.",
      "Using wall-mounted communications handset with confirming green status light connected to surface."
    ]
  }
];
