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
      codes,
      order,
    } = req.body;

    if (
      !title ||
      !category ||
      !difficulty ||
      !description ||
      !examples ||
      !constraints ||
      !testCases ||
      !codes ||
      order === undefined
    ) {
      throw new ApiError("All required fields must be provided", 400);
    }

    const formattedExamples = Array.isArray(examples) ? examples : [];
    const formattedConstraints = Array.isArray(constraints) ? constraints : [];

    const formattedTestCases = Array.isArray(testCases)
      ? testCases.map((tc) => ({
          input: typeof tc.input === "string" ? tc.input : "",
          output: tc.output,
        }))
      : [];

    const formattedCodes = Array.isArray(codes)
      ? codes.map((code) => ({
          language: code.language,
          starterCode: code.starterCode,
          helperCode: code.helperCode,
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
      codes: formattedCodes,
      order,
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
      codes: problem.codes,
      order: problem.order,
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

const getElementByOrder = asyncHandler(async (req, res) => {
  try {
    const { order } = req.params;
    const problem = await Problem.findOne({ order: parseInt(order) });
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
        input: typeof tc.input === "string" ? tc.input : "",
        output: tc.output,
      }));
    }

    if (updatedData.codes) {
      updatedData.codes = updatedData.codes.map((code) => ({
        language: code.language,
        starterCode: code.starterCode,
        helperCode: code.helperCode,
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

export {
  createProblems,
  getProblems,
  getProblemById,
  updateProblem,
  getElementByOrder,
};
