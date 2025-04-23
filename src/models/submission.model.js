import mongoose, { Schema } from "mongoose";

const submissionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problem: {
      type: Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: "cpp",
    },
    status: {
      type: String,
      enum: ["Accepted", "Wrong Answer", "Compilation Error"],
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
