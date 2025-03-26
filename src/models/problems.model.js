import mongoose from "mongoose";

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
  likes: {
    type: Number,
    default: 0,
    min: 0,
  },
  dislikes: {
    type: Number,
    default: 0,
    min: 0,
  },
  videoId: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: false,
    validate: {
      validator: function (v) {
        return /^https?:\/\/.+\..+/.test(v);
      },
      message: "Invalid URL format",
    },
  },
});

const Problem = mongoose.model("Problem", ProblemSchema);
export default Problem;
