import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Readable } from "node:stream";

const formatGutendexBooks = (rawData) => {
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
  return books;
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
