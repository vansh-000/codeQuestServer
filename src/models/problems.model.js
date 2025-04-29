import mongoose from "mongoose";

const TestCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
});

const LanguageSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true,
  },
  starterCode: {
    type: String,
    required: true,
  },
  helperCode: {
    type: String,
    required: true,
  },
});

const ProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ["Easy", "Medium", "Hard"],
  },
  description: {
    type: String,
    required: true,
  },
  examples: {
    type: Array,
    required: true,
  },
  constraints: {
    type: Array,
    required: true,
  },
  testCases: {
    type: [TestCaseSchema],
    required: true,
  },
  codes: {
    type: [LanguageSchema],
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
});

const Problem = mongoose.model("Problem", ProblemSchema);

export default Problem;
