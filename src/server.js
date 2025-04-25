import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { dbConnect } from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

async function compileAndRunRawCode(code) {
  const workId = uuidv4();
  const srcPath = path.join(os.tmpdir(), `code-${workId}.cpp`);
  const binPath = path.join(os.tmpdir(), `code-${workId}.out`);
  const boilerplate = `#include <bits/stdc++.h>\nusing namespace std;\n`;

  fs.writeFileSync(srcPath, boilerplate + code, "utf8");
  // console.log("✅ Code written:", boilerplate + code);
  // console.log("✅ Code written to file.");

  function cleanup() {
    [srcPath, binPath].forEach((f) => {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch (e) {
          console.error("Cleanup error:", e.message);
        }
      }
    });
  }

  try {
    // Compilation
    await new Promise((resolve, reject) => {
      exec(
        `g++ "${srcPath}" -O2 -std=c++17 -o "${binPath}"`,
        { timeout: 10000 },
        (err, stdout, stderr) => {
          if (err) {
            console.error("❌ Compilation error:", stderr);
            return reject(new Error(stderr || "Compilation failed"));
          }
          resolve();
        }
      );
    });

    // Execution (allow non-zero exit codes)
    const output = await new Promise((resolve) => {
      exec(`"${binPath}"`, { timeout: 5000 }, (err, stdout, stderr) => {
        const combinedOutput = `${stdout.trim()}\n${stderr.trim()}`.trim();
        console.log("combinedOutput::", combinedOutput);
        if (err) {
          console.warn("⚠️ Non-zero exit code:", err.code);
          return resolve({
            success: true,
            output: combinedOutput,
            error: true,
            exitCode: err?.code ?? 0,
          });
        }
        return resolve({
          success: true,
          error: false,
          output: combinedOutput,
        });
      });
    });

    cleanup();
    return output;
  } catch (err) {
    cleanup();
    return { success: false, error: true, errors: err.message };
  }
}

// POST /api/playground/run
app.post("/api/playground/run", async (req, res) => {
  const { code } = req.body;

  if (typeof code !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Code must be a string." });
  }

  try {
    const result = await compileAndRunRawCode(code);
    if (result.success) {
      return res.json({ success: true, output: result.output });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("Error in /run:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/playground/submit
app.post("/api/playground/submit", async (req, res) => {
  const { code } = req.body;

  if (typeof code !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Code must be a string." });
  }

  try {
    const result = await compileAndRunRawCode(code);
    if (result.success) {
      //console.log("result::", result);
      if (result.error) {
        return res.json({ success: true, error: true, errors: result.output });
      }
      return res.json({ success: true, error: false, output: result.output });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("Error in /submit:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DB connection and server start
dbConnect()
  .then(() => {
    app.on("error", (error) => {
      console.error("🔴 Error interacting with database:", error);
    });

    const PORT = process.env.PORT || 4020;
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("🔴 MongoDB connection failed !!!", error);
  });
