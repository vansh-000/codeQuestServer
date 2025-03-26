import { Router } from "express";
import { createProblems } from "../controllers/problems.controller.js";

import { validateJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.post("/create-problems", createProblems);

export default router;
