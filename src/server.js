import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { dbConnect } from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

// DB connection and server start
dbConnect()
  .then(() => {
    app.on("error", (error) => {
      console.error("🔴 Error interacting with database:", error);
    });

    const PORT = process.env.PORT || 4020;
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`✅ Supported languages: C++, C, Python, Java`);
    });
  })
  .catch((error) => {
    console.log("🔴 MongoDB connection failed !!!", error);
  });
