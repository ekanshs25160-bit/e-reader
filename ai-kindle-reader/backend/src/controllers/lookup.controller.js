import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const defineWord = asyncHandler(async (req, res) => {
  const { word, lang = "en" } = req.query;
  if (!word) {
    throw new ApiError(400, "Word is not selected");
  }

  const cleanWord = word.trim().toLowerCase();
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${cleanWord}`,
  );
  if (response.status === 404) {
    throw new ApiError(404, `No dictionary entry found for '${cleanWord}'`);
  }
  const rawData = await response.json();

  const text = rawData[0];

  const phonetic =
    text.phonetic || text.phonetics?.find((p) => p.text)?.text || "";

  const partsOfSpeech = text.meanings.map((m) => m.partOfSpeech);

  const definitions = text.meanings.flatMap((m) => m.definitions.map((d)=>d.definition));

  const payload = {
    word: text.word || cleanWord,
    phonetic: phonetic,
    partsOfSpeech: partsOfSpeech,
    definition: definitions,
  };

  return res.status(200).json(new ApiResponse(200, payload, "Definition arrived..."));
});
