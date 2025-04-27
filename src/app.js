import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

// MIDDLEWARES

// CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
// JSON VALIDATER AND LIMITER
app.use(express.json({ limit: "16kb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));

// COOKIE PARSER to use crud operation on special cookies
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter);
import problemsRouter from "./routes/problems.routes.js";
app.use("/api/v1/problems", problemsRouter);
import submissionRouter from "./routes/submission.routes.js";
app.use("/api/v1/submissions", submissionRouter);

// ERROR HANDLER middleware
app.use(errorHandler);

export { app };
