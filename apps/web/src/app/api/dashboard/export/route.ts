import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/api";

const COOKIE = "access_token";

/**
 * Streams the api's CSV export through the web origin so the browser's
 * cookie-based auth flow keeps working (no CORS, no token in URL).
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const upstreamUrl = new URL(`${API_URL}/api/dashboard/export/clicks.csv`);
  for (const [key, value] of req.nextUrl.searchParams.entries()) {
    upstreamUrl.searchParams.set(key, value);
  }

  const upstream = await fetch(upstreamUrl.toString(), {
    headers: { authorization: `Bearer ${token}` },
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new NextResponse(text || null, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
      "content-disposition":
        upstream.headers.get("content-disposition") ??
        `attachment; filename="clicks.csv"`,
    },
  });
}
