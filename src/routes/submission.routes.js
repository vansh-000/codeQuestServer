import express from "express";
import {
  createSubmission,
  deleteSubmission,
  editSubmission,
  modifyScore,
  getUserScoreByProblem,
  getScore,
  getSubmissionByUserAndProblem,
} from "../controllers/submission.controller.js";

const router = express.Router();

router.post("/user/:userId/problem/:problemId", createSubmission);
router.delete("/:id", deleteSubmission);
router.put("/:id", editSubmission);
router.get("/scores", getScore);
router.patch("/:id/score", modifyScore);
router.get("/user/:userId/problem-scores", getUserScoreByProblem);
router.get("/user/:userId/problem/:problemId", getSubmissionByUserAndProblem);

export default router;
