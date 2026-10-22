import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

  try {
    // Follow Gutenberg's 302 redirects server-side (bypasses browser CORS completely!)
    const candidateUrls = [
      `https://www.gutenberg.org/ebooks/${bookId}.epub3.images`,
      `https://www.gutenberg.org/ebooks/${bookId}.epub.images`,
      `https://www.gutenberg.org/ebooks/${bookId}.epub.noimages`,
    ];

    let response = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          redirect: "follow",
          headers: {
            "User-Agent": "KindleReader/1.0 (Educational Project)",
            Accept: "application/epub+zip",
          },
        });
        if (res.ok) {
          response = res;
          break;
        }
      } catch (e) {
        // Continue to fallback candidate
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch EPUB from Project Gutenberg" },
        { status: response ? response.status : 404 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="pg${bookId}.epub"`,
      },
    });
  } catch (error) {
    console.error("Gutenberg download proxy error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
