import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

  if (!bookId) {
    return NextResponse.json({ error: "Missing book id" }, { status: 400 });
  }

  // Follow Gutenberg's 302 redirects server-side (bypasses browser CORS completely)
  const candidateUrls = [
    `https://www.gutenberg.org/ebooks/${bookId}.epub3.images`,
    `https://www.gutenberg.org/ebooks/${bookId}.epub.images`,
    `https://www.gutenberg.org/ebooks/${bookId}.epub.noimages`,
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": "KindleReader/1.0 (Educational Project)",
          Accept: "application/epub+zip",
        },
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new NextResponse(arrayBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/epub+zip",
            "Content-Disposition": `attachment; filename="pg${bookId}.epub"`,
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    } catch (e) {
      // Try next format
    }
  }

  return NextResponse.json(
    { error: "Book not found on Project Gutenberg" },
    { status: 404 }
  );
}
