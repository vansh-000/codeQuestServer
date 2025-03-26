import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Problem from "../models/problems.model.js";

const createProblems = asyncHandler(async (req, res) => {
  // get all data
  try {
    const { title, category, difficulty, likes, dislikes, videoId} =
      req.body;
    const problem = new Problem({
      title,
      category,
      difficulty,
      likes,
      dislikes,
      videoId,
    });
    // save problem
    await problem.save();
    // return success response
    return res
      .status(201)
      .json(new ApiResponse({ message: "Problem generated" }, 201));
  } catch (error) {
    // return error response
    throw new ApiError(`error generating problems: ${error.message}`, 400);
  }
});

export { createProblems };
