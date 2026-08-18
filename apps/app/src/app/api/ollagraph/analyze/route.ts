import { NextResponse } from "next/server";

/**
 * Server-side proxy route for securing OllaGraph Content Analysis requests.
 * Enforces API key confidentiality and verified endpoint checking.
 */
export async function POST(req: Request) {
  try {
    const { text, mode } = await req.json();

    const apiKey = process.env.OLLAGRAPH_API_KEY;
    const apiUrl = process.env.OLLAGRAPH_API_URL;

    // Verify key configuration
    if (!apiKey) {
      return NextResponse.json(
        { error: "OllaGraph API Key not configured. Please set OLLAGRAPH_API_KEY in .env.local" },
        { status: 400 }
      );
    }

    // Enforce validated endpoint constraint
    if (!apiUrl || apiUrl === "<verified endpoint>" || apiUrl === "") {
      return NextResponse.json(
        { error: "Requires verified OllaGraph endpoint before implementation. Configure OLLAGRAPH_API_URL in .env.local" },
        { status: 400 }
      );
    }

    // Call the verified OllaGraph endpoint with a 10s request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ text, mode }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `OllaGraph API returned status code ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        return NextResponse.json({ error: "OllaGraph API request timed out" }, { status: 504 });
      }
      throw fetchErr;
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
