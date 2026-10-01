import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Readable } from "node:stream";

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

  const filteredBooks = rawData.results.filter(
    (book) => book.formats?.["application/epub+zip"],
  );
  const books = filteredBooks.map((book) => ({
    id: book.id,
    title: book.title,
    authors: book.authors?.map((a) => a.name) || [],
    coverUrl: book.formats?.["image/jpeg"] || null,
    downloadUrl: book.formats?.["application/epub+zip"] || null,
    languages: book.languages || [],
  }));
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
  const { bookId } = req.params;
  if (!bookId) {
    return res.status(400).json(new ApiError(400, "Book ID is not provided"));
  }

  const response = await fetch(
    `https://www.gutenberg.org/ebooks/${bookId}.epub3.images`,
    {
      headers: {
        Accept: "application/epub+zip",
        "User-Agent": "KindleReader/1.0 (Educational Project)",
      },
    },
  );

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Book ${bookId} not found on Gutenberg`,
    );
  }
  
  //tell our client's browser what it is receiving
  res.setHeader("Content-Type", "application/epub+zip");
  res.setHeader("Content-Disposition", `attachment; filename="${bookId}.epub"`);


  Readable.fromWeb(response.body).pipe(res);
});
