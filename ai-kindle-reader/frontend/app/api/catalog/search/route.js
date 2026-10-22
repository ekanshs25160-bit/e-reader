import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || searchParams.get("search") || "";
  const page = searchParams.get("page") || "1";

  if (!q.trim()) {
    return NextResponse.json({ success: true, data: { books: [] } });
  }

  try {
    const res = await fetch(
      `https://gutendex.com/books/?search=${encodeURIComponent(q.trim())}&page=${page}`,
      {
        headers: {
          "User-Agent": "KindleReader/1.0 (Educational Project)",
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, data: { books: [] } },
        { status: res.status }
      );
    }

    const data = await res.json();
    const books = (data.results || [])
      .filter((b) => Boolean(b.formats?.["application/epub+zip"]))
      .map((b) => {
        const coverUrl =
          b.formats?.["image/jpeg"] ||
          b.formats?.["image/png"] ||
          null;

        const author =
          b.authors && b.authors[0]
            ? b.authors[0].name.replace(/,\s*/g, " ")
            : "Unknown Author";

        return {
          id: String(b.id),
          title: b.title,
          author,
          coverUrl,
          downloadUrl: b.formats["application/epub+zip"],
          subjects: b.subjects || [],
          bookshelves: b.bookshelves || [],
        };
      });

    return NextResponse.json({
      success: true,
      count: data.count,
      next: Boolean(data.next),
      previous: Boolean(data.previous),
      data: { books },
    });
  } catch (error) {
    console.error("Catalog search error:", error);
    return NextResponse.json(
      { success: false, data: { books: [] }, error: error.message },
      { status: 500 }
    );
  }
}
