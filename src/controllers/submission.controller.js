import mongoose from "mongoose";
import Submission from "../models/submission.model.js";
import { User } from "../models/user.model.js";

export const createSubmission = async (req, res) => {
  try {
    const { userId, problemId } = req.params;

    const submissionData = {
      ...req.body,
      user: userId,
      problem: problemId,
    };

    if (!submissionData.code || !submissionData.status) {
      return res.status(400).json({
        message: "Code and status are required fields",
      });
    }

    const submission = await Submission.create(submissionData);
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: "Failed to create submission", error });
  }
};

export const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSubmission = await Submission.findByIdAndDelete(id);

    if (!deletedSubmission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json({ message: "Submission deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete submission", error });
  }
};

export const editSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const { user, problem, ...updateData } = req.body;

    const updatedSubmission = await Submission.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSubmission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.status(200).json(updatedSubmission);
  } catch (error) {
    res.status(500).json({ message: "Failed to update submission", error });
  }
};

export const getScore = async (req, res) => {
  try {
    const scores = await Submission.aggregate([
      {
        $group: {
          _id: "$user",
          totalScore: { $sum: "$score" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          totalScore: 1,
          username: { $ifNull: ["$userDetails.username", "Unknown User"] },
        },
      },
      {
        $sort: { totalScore: -1 },
      },
    ]);

    console.log("Aggregated scores:", scores);

    res.status(200).json({
      message: scores.length
        ? "Scores fetched successfully"
        : "No submissions found",
      data: scores,
    });
  } catch (error) {
    console.error("Error in getScore:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch scores", error: error.message });
  }
};

export const modifyScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;

    if (score === undefined || score === null) {
      return res.status(400).json({ message: "Score is required" });
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const updated = await Submission.findByIdAndUpdate(
      id,
      { score },
      { new: true, runValidators: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to modify score", error });
  }
};

// find submission by userId and problemId
export const getSubmissionByUserAndProblem = async (req, res) => {
  try {
    const { userId, problemId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(problemId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid user ID or problem ID format" });
    }

    const submission = await Submission.findOne({
      user: new mongoose.Types.ObjectId(userId),
      problem: new mongoose.Types.ObjectId(problemId),
    });

    if (!submission) {
      return res.status(200).json({ message: false, submission: null });
    }

    res.status(200).json({ message: true, submission });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch submission", error });
  }
};

// export const getUserScoreByProblem = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user ID format" });
//     }

//     const result = await Submission.aggregate([
//       {
//         $match: { user: new mongoose.Types.ObjectId(userId) },
//       },
//       {
//         $group: {
//           _id: "$problem",
//           totalScore: { $sum: "$score" },
//           submissions: { $sum: 1 },
//         },
//       },
//       {
//         $lookup: {
//           from: "problems",
//           localField: "_id",
//           foreignField: "_id",
//           as: "problemDetails",
//         },
//       },
//       {
//         $unwind: "$problemDetails",
//       },
//       {
//         $project: {
//           problemId: "$_id",
//           problemTitle: "$problemDetails.title",
//           totalScore: 1,
//           submissions: 1,
//           _id: 0,
//         },
//       },
//       {
//         $sort: { totalScore: -1 },
//       },
//     ]);

//     res.status(200).json(result);
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to fetch user's score by problem",
//       error: error.message,
//     });
//   }
// };

export const getSubmissionsofUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const name = await User.findById(userId);
    if (!name) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = await User.findById(userId).select("username");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const submissions = await Submission.find({ user: userId }).populate(
      "user"
    );

    if (!submissions || submissions.length === 0) {
      return res.status(404).json({ message: "No submissions found" });
    }

    res.status(200).json({
      username: user.username,
      submissions,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch submissions", error });
  }
};
