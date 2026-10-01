import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const searchBooks = asyncHandler(async (req, res) => {
  const { q, page } = req.query;

  const response = await fetch(
    `https://gutendex.com/books?search=${q}&page=${page}`,
  );

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
