import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ success: true, data: { books: [] } });
  }

  try {
    const response = await fetch(
      `https://gutendex.com/books/?search=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "KindleReader/1.0 (Educational Project)",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, data: { books: [] } },
        { status: response.status }
      );
    }

    const data = await response.json();
    const books = (data.results || []).map((item) => {
      const coverUrl =
        item.formats?.["image/jpeg"] ||
        item.formats?.["image/png"] ||
        null;

      return {
        id: item.id,
        title: item.title,
        authors: (item.authors || []).map((a) => a.name),
        coverUrl,
        downloadUrl: item.formats?.["application/epub+zip"] || null,
        subjects: item.subjects || [],
      };
    });

    return NextResponse.json({ success: true, data: { books } });
  } catch (error) {
    console.error("Gutenberg search proxy error:", error);
    return NextResponse.json(
      { success: false, data: { books: [] }, error: error.message },
      { status: 500 }
    );
  }
}
