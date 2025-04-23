import Submission from "../models/submission.model.js";


export const createSubmission = async (req, res) => {
  try {
    const submission = await Submission.create(req.body);
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: "Failed to create submission", error });
  }
};

export const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    await Submission.findByIdAndDelete(id);
    res.status(200).json({ message: "Submission deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete submission", error });
  }
};

export const editSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSubmission = await Submission.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(updatedSubmission);
  } catch (error) {
    res.status(500).json({ message: "Failed to update submission", error });
  }
};

export const getTotalScoreByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await Submission.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$user", totalScore: { $sum: "$score" } } },
    ]);
    res.status(200).json(result[0] || { totalScore: 0 });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch total score", error });
  }
};

export const modifyScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;
    const updated = await Submission.findByIdAndUpdate(
      id,
      { score },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to modify score", error });
  }
};

export const getUserScoreByProblem = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Submission.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$problem",
          totalScore: { $sum: "$score" },
        },
      },
      {
        $lookup: {
          from: "problems", // Make sure this matches your Problem model's collection name
          localField: "_id",
          foreignField: "_id",
          as: "problem",
        },
      },
      {
        $unwind: "$problem",
      },
      {
        $project: {
          _id: 0,
          problemId: "$problem._id",
          problemTitle: "$problem.title",
          totalScore: 1,
        },
      },
    ]);

    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch user's score by problem", error });
  }
};
