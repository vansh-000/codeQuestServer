import express from "express";
import {
  createSubmission,
  deleteSubmission,
  editSubmission,
  getTotalScoreByUser,
  modifyScore,
  getUserScoreByProblem,
} from "../controllers/submission.controller.js";

const router = express.Router();

router.post("/", createSubmission);
router.delete("/:id", deleteSubmission);
router.put("/:id", editSubmission);
router.get("/user/:userId/total-score", getTotalScoreByUser);
router.patch("/:id/score", modifyScore);
router.get("/user/:userId/problem-scores", getUserScoreByProblem);

export default router;
