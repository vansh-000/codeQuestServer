import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Problem from "../models/problems.model.js";

const createProblems = asyncHandler(async (req, res) => {
  // get all data
  try {
    const { title, category, difficulty, likes, dislikes, videoId } = req.body;
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

const getProblems = asyncHandler(async (req, res) => {
  try {
    const problems = await Problem.find();
    return res.status(200).json(new ApiResponse(problems, 200));
  } catch (error) {
    throw new ApiError(`error getting problems: ${error.message}`, 400);
  }
});

const getProblemById = asyncHandler(async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    return res.status(200).json(new ApiResponse(problem, 200));
  } catch (error) {
    throw new ApiError(`error getting problem: ${error.message}`, 400);
  }
});

const updateProblem = asyncHandler(async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(200).json(new ApiResponse(problem, 200));
  } catch (error) {
    throw new ApiError(`error updating problem: ${error.message}`, 400);
  }
});

export { createProblems, getProblems, getProblemById, updateProblem };
