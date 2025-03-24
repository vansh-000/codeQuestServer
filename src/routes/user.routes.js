import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  getCurrentUser,
  resetPassword,
} from "../controllers/user.controller.js";
import { validateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// register router
router.route("/register").post(registerUser);

// login router
router.route("/login").post(loginUser);

// reset password router
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// PROTECTED ROUTES
// validateJWT is a middleware that is injected in the route and the next allows it to execute the next logoutUser
router.route("/logout").post(validateJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(validateJWT, getCurrentUser);


export default router;