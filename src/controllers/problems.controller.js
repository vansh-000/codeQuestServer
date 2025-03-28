import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Problem from "../models/problems.model.js";

const createProblems = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      category,
      difficulty,
      description,
      examples,
      constraints,
      testCases,
      starterCode,
      likes,
      dislikes,
      order,
      videoId,
    } = req.body;

    if (
      !title ||
      !category ||
      !difficulty ||
      !description ||
      !examples ||
      !constraints ||
      !testCases ||
      !starterCode ||
      !videoId ||
      order === undefined
    ) {
      throw new ApiError("All required fields must be provided", 400);
    }

    const formattedExamples = Array.isArray(examples) ? examples : [];
    const formattedConstraints = Array.isArray(constraints) ? constraints : [];
    const formattedTestCases = Array.isArray(testCases)
      ? testCases.map((tc) => ({
          input: Array.isArray(tc.input) ? tc.input.map(String) : [],
          expectedOutput: tc.expectedOutput,
        }))
      : [];

    const problem = new Problem({
      title,
      category,
      difficulty,
      description,
      examples: formattedExamples,
      constraints: formattedConstraints,
      testCases: formattedTestCases,
      starterCode,
      likes: likes || 0,
      dislikes: dislikes || 0,
      order,
      videoId,
    });

    await problem.save();

    return res
      .status(201)
      .json(new ApiResponse({ message: "Problem created successfully" }, 201));
  } catch (error) {
    throw new ApiError(`Error creating problem: ${error.message}`, 400);
  }
});

const getProblems = asyncHandler(async (req, res) => {
  try {
    const problems = await Problem.find(); 

    const formattedProblems = problems.map((problem) => ({
      _id: problem._id.toString(),
      title: problem.title,
      category: problem.category,
      difficulty: problem.difficulty,
      description: problem.description,
      examples: problem.examples,
      constraints: problem.constraints,
      testCases: problem.testCases,
      starterCode: problem.starterCode,
      likes: problem.likes || 0,
      dislikes: problem.dislikes || 0,
      order: problem.order,
      videoId: problem.videoId ? problem.videoId : null,
    }));

    return res.status(200).json(new ApiResponse(formattedProblems, 200));
  } catch (error) {
    throw new ApiError(`Error fetching problems: ${error.message}`, 400);
  }
});


const getProblemById = asyncHandler(async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      throw new ApiError("Problem not found", 404);
    }
    return res.status(200).json(new ApiResponse(problem, 200));
  } catch (error) {
    throw new ApiError(`Error fetching problem: ${error.message}`, 400);
  }
});

const updateProblem = asyncHandler(async (req, res) => {
  try {
    const updatedData = req.body;

    if (updatedData.testCases) {
      updatedData.testCases = updatedData.testCases.map((tc) => ({
        input: Array.isArray(tc.input) ? tc.input.map(String) : [],
        expectedOutput: tc.expectedOutput,
      }));
    }

    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!problem) {
      throw new ApiError("Problem not found", 404);
    }

    return res.status(200).json(new ApiResponse(problem, 200));
  } catch (error) {
    throw new ApiError(`Error updating problem: ${error.message}`, 400);
  }
});

export { createProblems, getProblems, getProblemById, updateProblem };
