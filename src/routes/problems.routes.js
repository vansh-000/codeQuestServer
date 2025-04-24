import { Router } from "express";
import {
  createProblems,
  getProblems,
  getProblemById,
  updateProblem,
  getElementByOrder,
} from "../controllers/problems.controller.js";

import { validateJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.post("/create-problems", validateJWT, createProblems);
router.get("/get-problems", validateJWT, getProblems);
router.get("/get-problem/:id", validateJWT, getProblemById);
router.put("/update-problem/:id", validateJWT, updateProblem);
router.get("/order/:order", validateJWT, getElementByOrder);

export default router;
