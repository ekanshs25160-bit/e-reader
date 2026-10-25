import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawWord = (searchParams.get("word") || "").trim();
  const clean = rawWord.replace(/^[^a-zA-Z0-9-]+|[^a-zA-Z0-9-]+$/g, "");

  if (!clean) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean.toLowerCase())}`,
      {
        headers: {
          "User-Agent": "FlyleafReader/1.0 (https://e-reader-jj18.onrender.com)",
          Accept: "application/json",
        },
        next: { revalidate: 86400 }, // Caches definitions for 24h on Next.js server
      }
    );

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ statusCode: 200, success: true, data });
    }
  } catch {
    // Fall through to graceful 200 response so DevTools never logs red 500s
  }

  return NextResponse.json({
    statusCode: 200,
    success: true,
    data: [
      {
        word: clean,
        phonetic: "",
        meanings: [
          {
            partOfSpeech: "term",
            definitions: [
              {
                definition:
                  "No standard dictionary entry found. Tap 'Explain' for Literary Companion context.",
              },
            ],
          },
        ],
      },
    ],
  });
}
