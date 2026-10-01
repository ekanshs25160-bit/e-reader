import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";

export const healthCheck = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "operational",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
      "server running perfectly",
    ),
  );
});
