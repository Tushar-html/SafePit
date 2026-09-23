import React, { useState, useEffect, useRef } from "react";
import { X, MapPin, Check, Navigation, Search, Loader2, AlertTriangle } from "lucide-react";
import { COAL_MINES } from "../data/minesData";

/* ============================================================
   LocationPickerModal — "Select in Map" registration flow.
   1. Asks for device location permission FIRST (required to
      open the map centred on the user).
   2. Embeds Google Maps (keyless embed) centred on the user or
      on a search query.
   3. Reverse-geocodes the user's fix (Nominatim) to auto-fill
      mine details, or lets the user pick a known coalfield.
   ============================================================ */

export interface LocationPick {
  name?: string;
  city: string;
  state: string;
  pinCode?: string;
  coordinates?: { lat: number; lng: number };
}

interface LocationPickerModalProps {
  onClose: () => void;
  onPick: (pick: LocationPick) => void;
}

type GeoState = "asking" | "granted" | "denied" | "unavailable";

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  onClose,
  onPick
}) => {
  const [geoState, setGeoState] = useState<GeoState>("asking");
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mapQuery, setMapQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [autoFilling, setAutoFilling] = useState<boolean>(false);
  const [fillInfo, setFillInfo] = useState<string>("");
  const requestedRef = useRef<boolean>(false);

  const requestLocation = () => {
    setGeoState("asking");
    if (!("geolocation" in navigator)) {
      setGeoState("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        setMapQuery(`${p.lat.toFixed(5)},${p.lng.toFixed(5)}`);
        setGeoState("granted");
        // auto-fill mine details from the fix
        reverseGeocode(p);
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  // Ask for permission immediately when the modal opens
  useEffect(() => {
    if (!requestedRef.current) {
      requestedRef.current = true;
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = async (p: { lat: number; lng: number }) => {
    setAutoFilling(true);
    setFillInfo("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.lat}&lon=${p.lng}&zoom=14&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      const a = data?.address ?? {};
      const city = a.city || a.town || a.village || a.county || a.state_district || "";
      const state = a.state || "";
      const pin = a.postcode || "";
      if (city || state) {
        setFillInfo(`${city ? city : ""}${city && state ? ", " : ""}${state}`);
        onPick({ city: city || "", state: state || "", pinCode: pin, coordinates: p });
      } else {
        setFillInfo("");
      }
    } catch {
      setFillInfo("");
    } finally {
      setAutoFilling(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setMapQuery(searchInput.trim());
    }
  };

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery || "India coalfield")}&z=13&output=embed`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sky-950/70 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-sky-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-sky-50 border-b border-sky-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-600 text-white shadow-sm">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sky-950 text-base">Select Mine on Map</h3>
              <p className="text-xs text-sky-700">Location permission is required to open the map</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-sky-600 hover:bg-sky-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission gate */}
        {geoState !== "granted" && (
          <div className="px-6 py-8 text-center space-y-4">
            {geoState === "asking" ? (
              <>
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
                <p className="text-sm text-slate-600 font-medium">
                  Asking for location permission…
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Your device will ask to allow SafePit to access your location.
                  This permission is required to select the mine on the map.
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-sm text-slate-700 font-semibold">
                  {geoState === "denied" ? "Location permission denied" : "Location unavailable"}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {geoState === "denied"
                    ? "To pick your mine on the map, allow location access for SafePit in your device settings, then tap retry."
                    : "Your device could not provide a location fix. You can still search the map manually below."}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={requestLocation}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors"
                  >
                    Retry Permission
                  </button>
                </div>
                <form onSubmit={handleSearch} className="pt-2 flex items-center gap-2 max-w-sm mx-auto">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search a mine or place…"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#f8fbfe] border border-[#e2eaf2] text-xs text-[#0f2942] focus:outline-none focus:border-[#0284c7]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2.5 rounded-xl bg-[#eef7fe] text-[#0284c7] border border-[#dbeefe] text-xs font-bold flex items-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Search
                  </button>
                </form>
                {mapQuery && (
                  <div className="pt-2">
                    <iframe
                      title="Google Maps"
                      src={mapSrc}
                      className="w-full h-56 rounded-2xl border border-[#e2eaf2]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Map + picker (permission granted) */}
        {geoState === "granted" && (
          <>
            <div className="px-5 pt-4 pb-3 space-y-3 shrink-0">
              {userPos && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    {autoFilling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>
                      {autoFilling
                        ? "Filling details from your location…"
                        : fillInfo
                        ? `Detected: ${fillInfo}`
                        : `Using your location (${userPos.lat.toFixed(3)}, ${userPos.lng.toFixed(3)})`}
                    </span>
                  </div>
                  <button
                    onClick={() => userPos && reverseGeocode(userPos)}
                    className="px-3 py-1.5 rounded-lg bg-[#eef7fe] text-[#0284c7] border border-[#dbeefe] text-[11px] font-bold"
                  >
                    Use My Location
                  </button>
                </div>
              )}
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search a mine, town or landmark…"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#f8fbfe] border border-[#e2eaf2] text-xs text-[#0f2942] focus:outline-none focus:border-[#0284c7]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2.5 rounded-xl bg-[#eef7fe] text-[#0284c7] border border-[#dbeefe] text-xs font-bold flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search
                </button>
              </form>
            </div>

            {/* Embedded Google Map */}
            <div className="px-5 pb-3 min-h-0">
              <iframe
                title="Google Maps"
                src={mapSrc}
                className="w-full h-52 sm:h-64 rounded-2xl border border-[#e2eaf2]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Known coalfields quick-pick */}
            <div className="px-5 pb-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Or pick a known coalfield
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {COAL_MINES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onPick({
                        name: m.name,
                        city: m.city,
                        state: m.state,
                        pinCode: m.pinCode,
                        coordinates: m.coordinates
                      });
                    }}
                    className="shrink-0 px-3 py-2 rounded-xl bg-[#f8fbfe] border border-[#e2eaf2] text-left hover:border-[#0284c7] transition-colors"
                  >
                    <p className="text-xs font-bold text-[#0f2942] whitespace-nowrap">{m.name.split("(")[0].trim()}</p>
                    <p className="text-[10px] text-slate-500 whitespace-nowrap">{m.city}, {m.state}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-sky-100 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500">
            Picked details are filled into Step 1 automatically.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
