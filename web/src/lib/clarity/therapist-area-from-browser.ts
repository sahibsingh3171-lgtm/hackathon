/**
 * Browser geolocation + server reverse geocode → a short city/region string
 * for `MatchPreferences.locationPreference` (demo substring matching).
 */

export type TherapistAreaFromBrowserResult =
  | { ok: true; display: string }
  | { ok: false; error: string };

function readGeoError(code: number): string {
  if (code === 1) return "Location access was declined. You can type a city or region instead.";
  if (code === 2) return "Your position could not be determined. Try typing your area instead.";
  if (code === 3) return "Location timed out. Try again or type your area instead.";
  return "Location is not available here. Type a city or region instead.";
}

export function requestBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 60_000,
      timeout: 12_000,
    });
  });
}

export async function resolveTherapistAreaLabelFromBrowser(): Promise<TherapistAreaFromBrowserResult> {
  try {
    const pos = await requestBrowserPosition();
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    const res = await fetch("/api/clarity/reverse-geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon }),
    });

    const data = (await res.json()) as { display?: string; error?: string };
    if (!res.ok || !data.display) {
      return { ok: false, error: data.error ?? "Could not resolve your area. Try typing it instead." };
    }
    return { ok: true, display: data.display };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && typeof (e as GeolocationPositionError).code === "number") {
      return { ok: false, error: readGeoError((e as GeolocationPositionError).code) };
    }
    const msg = e instanceof Error ? e.message : "Something went wrong.";
    return { ok: false, error: msg };
  }
}
