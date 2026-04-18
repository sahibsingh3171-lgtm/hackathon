import { NextResponse } from "next/server";

type NominatimAddress = Record<string, string | undefined>;

/**
 * One-shot reverse geocode for the therapist “approximate my area” control.
 * Uses OpenStreetMap Nominatim (non-commercial demo — respect their usage policy).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lat = typeof body === "object" && body !== null && "lat" in body ? Number((body as { lat: unknown }).lat) : NaN;
  const lon = typeof body === "object" && body !== null && "lon" in body ? Number((body as { lon: unknown }).lon) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "ClarityTherapistDemo/1.0 (hackathon demo; non-commercial)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Area lookup is temporarily unavailable. Try typing a city or region instead." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      address?: NominatimAddress;
      display_name?: string;
    };

    const addr = data.address ?? {};
    const locality =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.hamlet ||
      addr.municipality ||
      addr.county ||
      "";
    const state = addr.state || addr.region || "";
    let display = [locality, state].filter((s) => typeof s === "string" && s.trim().length > 0).join(", ");

    if (!display.trim() && typeof data.display_name === "string") {
      const parts = data.display_name.split(",").map((p) => p.trim()).filter(Boolean);
      display = parts.slice(0, 2).join(", ");
    }

    if (!display.trim()) {
      return NextResponse.json(
        { error: "We could not read a city or region from your location. Try typing it instead." },
        { status: 422 }
      );
    }

    if (display.length > 96) {
      display = `${display.slice(0, 93).trimEnd()}…`;
    }

    return NextResponse.json({ display });
  } catch {
    return NextResponse.json(
      { error: "Area lookup timed out. Try typing a city or region instead." },
      { status: 504 }
    );
  }
}
