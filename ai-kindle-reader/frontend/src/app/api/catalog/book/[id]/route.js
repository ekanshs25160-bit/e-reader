import { NextResponse } from 'next/server';

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET(request, { params }) {
  const rawId = params?.id;
  const cleanId = String(rawId || '').replace(/^gutenberg_/, '').trim();

  if (!cleanId) {
    return NextResponse.json({ message: 'Book ID is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://gutendex.com/books/${encodeURIComponent(cleanId)}/`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': BROWSER_USER_AGENT,
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: `Book #${cleanId} not found on Project Gutenberg (${res.status})` },
        { status: res.status }
      );
    }

    const book = await res.json();
    const formatted = {
      id: book.id,
      title: book.title,
      authors: book.authors?.map((a) => a.name) || [],
      coverUrl:
        book.formats?.['image/jpeg'] ||
        `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.cover.medium.jpg`,
      downloadUrl:
        book.formats?.['application/epub+zip'] ||
        `https://www.gutenberg.org/ebooks/${book.id}.epub3.images`,
      languages: book.languages || [],
      subjects: book.subjects || [],
      downloadCount: book.download_count ?? null,
      copyright: book.copyright ?? null,
      description: (book.summaries && book.summaries[0]) || null,
    };

    return NextResponse.json({
      statusCode: 200,
      data: formatted,
      message: 'Here is your book...',
    });
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Failed to fetch book from Project Gutenberg' },
      { status: 500 }
    );
  }
}
