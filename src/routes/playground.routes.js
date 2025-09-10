import { handleRun, handleSubmit } from "../controllers/playground.controller.js";
import { Router } from "express";

const router = Router();

router.post("/run", handleRun);
router.post("/submit", handleSubmit);

export default router;