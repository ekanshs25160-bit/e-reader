import { GoogleGenAI } from "@google/genai";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";


//ai written code
const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

async function generateWithFallback(ai, options) {
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const responseStream = await ai.models.generateContentStream({
        ...options,
        model,
      });
      return responseStream;
    } catch (err) {
      console.warn(`[Gemini Fallback] Model ${model} failed:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error("All Gemini candidate models failed.");
}

async function streamToClient(responseStream, res) {
  try {
    for await (const chunk of responseStream) {
      const textChunk = chunk.text;
      if (textChunk) {
        res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
      }
    }
  } catch (err) {
    // Known bug in @google/genai SSE decoder if stream terminates without double newline
    if (err?.message?.includes("Incomplete JSON segment")) {
      console.warn("[Gemini Stream] Suppressed trailing incomplete JSON segment notice.");
    } else {
      throw err;
    }
  }
  res.write("data: [DONE]\n\n");
  res.end();
}

// -----

export const aiAssist = asyncHandler(async (req, res) => {
  const { bookTitle, author, currentChapter, selectedText, userQuery } =
    req.body;

  if (!bookTitle || !selectedText) {
    throw new ApiError(400, "bookTitle and selectedText are required");
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const systemInstruction = `You are an elite literary scholar embedded inside a Kindle-style reader.
    Book: "${bookTitle}" by ${author || "Unknown"}.
    Current Chapter: "${currentChapter || "Unknown"}".
    Do not spoil any future plot points. Be concise, insightful, and use clear markdown formatting.`;

    const userPrompt = userQuery
      ? `Excerpt: '${selectedText}'\n\n Question: ${userQuery}`
      : `Please explain this excerpt, including literary devices, subtext, 
    and historical or vocabulary context: "${selectedText}"`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const responseStream = await generateWithFallback(ai, {
      contents: userPrompt,
      config: {
        systemInstruction,
      },
    });

    await streamToClient(responseStream, res);
  } catch (error) {
    console.error("Gemini stream error:", error);
    res.write(
      `data: ${JSON.stringify({ error: error.message || "Failed to generate AI response" })}\n\n`,
    );
    res.end();
  }
});

export const aiSummary = asyncHandler(async (req, res) => {
  const { bookTitle, author, chapterTitle, chapterText } = req.body;

  if (!chapterText) {
    throw new ApiError(400, "chapterText is required");
  }
  if (chapterText.length > 50000) {
    throw new ApiError(
      413,
      "chapterText exceeds maximum length of 50,000 characters",
    );
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const systemInstruction = `You are an elite literary scholar embedded inside a Kindle-style reader.
        Book: "${bookTitle}" by ${author || "Unknown"}.
        Current Chapter: "${chapterTitle || "Unknown"}".
        Do not spoil any future plot points. Be concise, insightful, and use clear markdown`;

    const userPrompt = `Summarize the following chapter from "${bookTitle || "the book"}" 
    titled "${chapterTitle || "Current Chapter"}":\n\n${chapterText}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const responseStream = await generateWithFallback(ai, {
      contents: userPrompt,
      config: {
        systemInstruction,
      },
    });

    await streamToClient(responseStream, res);
  } catch (error) {
    console.error("Gemini stream error:", error);
    res.write(
      `data: ${JSON.stringify({ error: error.message || "Failed to generate AI response" })}\n\n`,
    );
    res.end();
  }
});

export const aiAuthorGrounding = asyncHandler(async (req, res) => {
  const { author, bookTitle, userQuery } = req.body;
  if (!author || !userQuery) {
    throw new ApiError(400, "author and userQuery are required");
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const systemInstruction = `You are an expert biographer and literary historian.
    Author: "${author}".
    Book Context: "${bookTitle || "General Works"}".
    Provide accurate, historically grounded insights into the author's life, 
    political context, and writing circumstances. 
    Cite real historical facts and dates clearly using markdown formatting.`;

    const userPrompt = bookTitle
      ? `Context: "${bookTitle}" by ${author}.\n\nQuestion: ${userQuery}`
      : `Author: ${author}.\n\nQuestion: ${userQuery}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const responseStream = await generateWithFallback(ai, {
      contents: userPrompt,
      config: {
        systemInstruction,
      },
    });

    await streamToClient(responseStream, res);
  } catch (error) {
    console.error("Gemini stream error:", error);
    res.write(
      `data: ${JSON.stringify({ error: error.message || "Failed to generate AI response" })}\n\n`,
    );
    res.end();
  }
});
