import { NextResponse } from 'next/server';

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET(request, { params }) {
  const rawId = params?.bookId;
  const cleanId = String(rawId || '').replace(/^gutenberg_/, '').trim();

  if (!cleanId) {
    return NextResponse.json({ message: 'Book ID is required' }, { status: 400 });
  }

  // Potential Gutenberg download endpoints in order of preference
  const candidateUrls = [
    `https://www.gutenberg.org/ebooks/${cleanId}.epub3.images`,
    `https://www.gutenberg.org/ebooks/${cleanId}.epub.images`,
    `https://www.gutenberg.org/cache/epub/${cleanId}/pg${cleanId}-images-3.epub`,
    `https://www.gutenberg.org/cache/epub/${cleanId}/pg${cleanId}.epub`,
    `https://www.gutenberg.org/ebooks/${cleanId}.epub.noimages`,
  ];

  let successResponse = null;
  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url, {
        headers: {
          Accept: 'application/epub+zip',
          'User-Agent': BROWSER_USER_AGENT,
        },
        redirect: 'follow',
      });
      if (resp.ok) {
        successResponse = resp;
        break;
      }
    } catch {
      // try next candidate
    }
  }

  // If Gutenberg direct failed, try backend proxy as fallback
  if (!successResponse) {
    try {
      const rawBackend = (
        process.env.BACKEND_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'https://e-reader-backend-46oy.onrender.com'
      )
        .trim()
        .replace(/\/api\/?$/, '')
        .replace(/\/+$/, '');

      const bResp = await fetch(`${rawBackend}/api/catalog/download/${cleanId}`, {
        headers: {
          Accept: 'application/epub+zip',
          'User-Agent': BROWSER_USER_AGENT,
        },
        redirect: 'follow',
      });
      if (bResp.ok) {
        successResponse = bResp;
      }
    } catch {
      // Fallback failed
    }
  }

  if (!successResponse) {
    return NextResponse.json(
      { message: `Book #${cleanId} not found on Project Gutenberg` },
      { status: 404 }
    );
  }

  // Stream binary directly to client
  return new Response(successResponse.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/epub+zip',
      'Content-Disposition': `attachment; filename="${cleanId}.epub"`,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
