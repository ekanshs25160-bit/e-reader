import { NextResponse } from 'next/server';

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');
  const languages = searchParams.get('languages') || 'en';
  const page = searchParams.get('page') || '1';

  const params = new URLSearchParams({ languages, page });
  if (topic && topic !== 'All Classics') {
    params.append('topic', topic);
  }

  try {
    const res = await fetch(`https://gutendex.com/books/?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': BROWSER_USER_AGENT,
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: `Project Gutenberg catalog error (${res.status})` },
        { status: res.status }
      );
    }

    const rawData = await res.json();
    const results = rawData?.results || [];
    const filtered = results.filter((b) => b.formats?.['application/epub+zip']);
    const books = filtered.map((b) => ({
      id: b.id,
      title: b.title,
      authors: b.authors?.map((a) => a.name) || [],
      coverUrl:
        b.formats?.['image/jpeg'] ||
        `https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.cover.medium.jpg`,
      downloadUrl:
        b.formats?.['application/epub+zip'] ||
        `https://www.gutenberg.org/ebooks/${b.id}.epub3.images`,
      languages: b.languages || [],
      subjects: b.subjects || [],
      downloadCount: b.download_count ?? null,
      copyright: b.copyright ?? null,
      description: (b.summaries && b.summaries[0]) || null,
    }));

    return NextResponse.json({
      statusCode: 200,
      data: {
        total: rawData.count,
        page: Number(page) || 1,
        books,
      },
      message: 'Here you go with the books...',
    });
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Failed to browse Project Gutenberg catalog' },
      { status: 500 }
    );
  }
}
