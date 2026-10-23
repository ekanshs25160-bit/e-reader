import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Readable } from "node:stream";

const formatGutendexBooks = (rawData) => {
  const results = rawData.results || []; // ai 
  const filteredBooks = results.filter(   //ai
    (book) => book.formats?.["application/epub+zip"],
  );
  const books = filteredBooks.map((book) => ({
    id: book.id,
    title: book.title,
    authors: book.authors?.map((a) => a.name) || [],
    coverUrl: book.formats?.["image/jpeg"] || null,
    downloadUrl: book.formats?.["application/epub+zip"] || null,
    languages: book.languages || [],
    subjects: book.subjects || [],  // ai
    downloadCount: book.download_count ?? null,   //ai
    copyright: book.copyright ?? null,  //ai
  }));
  return books;
};

const formatSingleBook = (book) => {
  return {
    id: book.id,
    title: book.title,
    authors: book.authors?.map((a) => a.name) || [],
    coverUrl: book.formats?.["image/jpeg"] || null,
    downloadUrl: book.formats?.["application/epub+zip"] || null,
    languages: book.languages || [],
    subjects: book.subjects || [],
    downloadCount: book.download_count ?? null,
    copyright: book.copyright ?? null,
  };
};

export const searchBooks = asyncHandler(async (req, res) => {
  const { q, page = 1 } = req.query;

  if (!q) {
    return res
      .status(400)
      .json(new ApiError(400, "Search query requires title"));
  }

  const response = await fetch(
    `https://gutendex.com/books?search=${encodeURIComponent(q)}&page=${page}`,
    {
      headers: {
        accept: "application/json",
        "User-Agent": "KindleReader/1.0 (Educational Project)",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Upstream status:", response.status);
    console.error(errorText.slice(0, 500));
    throw new ApiError(
      502,
      "Upstream catalog service is temporarily unavailable",
    );
  }

  const rawData = await response.json();

  // const filteredBooks = rawData.results.filter(
  //   (book) => book.formats?.["application/epub+zip"],
  // );
  // const books = filteredBooks.map((book) => ({
  //   id: book.id,
  //   title: book.title,
  //   authors: book.authors?.map((a) => a.name) || [],
  //   coverUrl: book.formats?.["image/jpeg"] || null,
  //   downloadUrl: book.formats?.["application/epub+zip"] || null,
  //   languages: book.languages || [],
  // }));

  const books = formatGutendexBooks(rawData);

  const payload = {
    total: rawData.count,
    page: Number(page) || 1,
    books: books,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, payload, "Here are the required books"));
});

export const downloadBook = asyncHandler(async (req, res) => {
  const rawId = req.params.bookId;
  const cleanId = String(rawId || "").replace(/^gutenberg_/, "").trim();
  if (!cleanId) {
    return res.status(400).json(new ApiError(400, "Book ID is not provided"));
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
          Accept: "application/epub+zip",
          "User-Agent": "KindleReader/1.0 (Educational Project)",
        },
        redirect: "follow",
      });
      if (resp.ok) {
        successResponse = resp;
        break;
      }
    } catch {
      // try next candidate
    }
  }

  if (!successResponse) {
    throw new ApiError(
      404,
      `Book ${cleanId} not found on Gutenberg`,
    );
  }

  // Tell our client's browser what it is receiving
  res.setHeader("Content-Type", "application/epub+zip");
  res.setHeader("Content-Disposition", `attachment; filename="${cleanId}.epub"`);

  Readable.fromWeb(successResponse.body).pipe(res);
});

export const browseCatalog = asyncHandler(async (req, res) => {
  const { topic, languages = "en", sort = "popular", page = 1 } = req.query;
  // const topicQuery = topic? encodeURIComponent(topic) : ''
  const params = new URLSearchParams({ sort, languages, page });
  if (topic) {
    params.append("topic", topic);
  }
  const response = await fetch(
    `https://gutendex.com/books?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "KindleReader/1.0 (Educational Project)",
      },
    },
  );

  // console.log(response)

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gutendex Error:", response.status, errorText.slice(0, 300));
    throw new ApiError(
      response.status,
      `Upstream catalog error (${response.status})`,
    );
  }

  const rawData = await response.json();

  const gotIt = formatGutendexBooks(rawData);

  const payload = {
    total: rawData.count,
    page: Number(page) || 1,
    books: gotIt,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, payload, "Here you go with the books..."));
});

export const getBookById = asyncHandler(async (req, res) => {
  const rawId = req.params.id;
  const cleanId = String(rawId || "").replace(/^gutenberg_/, "").trim();
  if (!cleanId) {
    return res.status(400).json(new ApiError(400, "Book ID is not provided"));
  }

  const response = await fetch(`https://gutendex.com/books/${encodeURIComponent(cleanId)}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "KindleReader/1.0 (Educational Project)",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gutendex Error:", response.status, errorText.slice(0, 300));
    throw new ApiError(
      response.status,
      `Upstream catalog error (${response.status})`,
    );
  }

  const rawData = await response.json();
  const book = formatSingleBook(rawData);
  return res.status(200).json(new ApiResponse(200, book, "Here is your book..."));
});
