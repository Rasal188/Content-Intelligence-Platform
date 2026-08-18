import { NextResponse } from "next/server";

/**
 * Server-side proxy route for securing OllaGraph Web Scrape / Extraction requests.
 */
export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    const apiKey = process.env.OLLAGRAPH_API_KEY;
    const scrapeUrl = "https://api.ollagraph.com/v1/scrape";

    if (!apiKey) {
      return NextResponse.json(
        { error: "OllaGraph API Key not configured. Please set OLLAGRAPH_API_KEY in .env.local" },
        { status: 400 }
      );
    }

    const response = await fetch(scrapeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url, extract: true }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OllaGraph scrape returned status code ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text || "" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
