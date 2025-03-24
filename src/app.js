import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// MIDDLEWARES

// CORS
app.use(
  cors({
    origin: "http://localhost:3001", // Allow frontend to access backend
    methods: ["GET", "POST", "PUT", "DELETE"],
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

export { app };
