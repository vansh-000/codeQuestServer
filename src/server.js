import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { dbConnect } from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

const BOILERPLATES = {
  cpp: `#include <bits/stdc++.h>
using namespace std;
`,
  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
`,
  python: `# Python code starts here
`,
  java: `public class Main {
    public static void main(String[] args) {
`,
  javaFooter: `    }
}`,
};

const FILE_EXTENSIONS = {
  cpp: ".cpp",
  c: ".c",
  python: ".py",
  java: ".java",
};

const COMPILE_COMMANDS = {
  cpp: (srcPath, binPath) => `g++ "${srcPath}" -O2 -std=c++17 -o "${binPath}"`,
  c: (srcPath, binPath) => `gcc "${srcPath}" -O2 -o "${binPath}"`,
  python: () => "",
  java: (srcPath, binDir) => `javac "${srcPath}" -d "${binDir}"`,
};

const RUN_COMMANDS = {
  cpp: (binPath) => `"${binPath}"`,
  c: (binPath) => `"${binPath}"`,
  python: (srcPath) => `python3 "${srcPath}"`,
  java: (binDir) => `cd "${binDir}" && java Main`,
};

function prepareSourceCode(code, language) {
  console.log("before prepareSourceCode:", code);
  switch (language) {
    case "cpp":
    case "c":
      return BOILERPLATES.c + code;
    case "python":
      return BOILERPLATES.python + code;
    case "java":
      if (code.includes("class Main")) {
        return code;
      }
      return BOILERPLATES.java + code + BOILERPLATES.javaFooter;
    default:
      return code;
  }
}

function cleanup(filesToDelete) {
  filesToDelete.forEach((f) => {
    if (fs.existsSync(f)) {
      try {
        if (fs.lstatSync(f).isDirectory()) {
          fs.rmSync(f, { recursive: true, force: true });
        } else {
          fs.unlinkSync(f);
        }
      } catch (e) {
        console.error("Cleanup error:", e.message);
      }
    }
  });
}

async function compileCode(language, srcPath, binPath, binDir) {
  if (language === "python") {
    return { success: true };
  }

  const compileCommand = COMPILE_COMMANDS[language](
    srcPath,
    language === "java" ? binDir : binPath
  );

  return new Promise((resolve, reject) => {
    exec(compileCommand, { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) {
        console.error(
          `❌ ${language.toUpperCase()} compilation error:`,
          stderr
        );
        return reject(new Error(stderr || `${language} compilation failed`));
      }
      resolve({ success: true });
    });
  });
}

async function runCode(language, srcPath, binPath, binDir) {
  const runCommand =
    language === "java"
      ? RUN_COMMANDS[language](binDir)
      : language === "python"
      ? RUN_COMMANDS[language](srcPath)
      : RUN_COMMANDS[language](binPath);

  return new Promise((resolve) => {
    exec(runCommand, { timeout: 5000 }, (err, stdout, stderr) => {
      const combinedOutput = `${stdout.trim()}\n${stderr.trim()}`.trim();
      console.log(`${language} output:`, combinedOutput);

      if (err) {
        console.warn(
          `⚠️ ${language.toUpperCase()} non-zero exit code:`,
          err.code
        );
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
}

async function compileAndRunCode(code, language) {
  if (!["cpp", "c", "python", "java"].includes(language)) {
    return {
      success: false,
      error: true,
      errors: `Unsupported language: ${language}. Supported languages are: C++, C, Python, and Java.`,
    };
  }

  const workId = uuidv4();
  const extension = FILE_EXTENSIONS[language];
  const srcPath = path.join(os.tmpdir(), `code-${workId}${extension}`);
  const binPath = path.join(os.tmpdir(), `code-${workId}.out`);
  const binDir = path.join(os.tmpdir(), `code-${workId}-bin`);

  if (language === "java") {
    fs.mkdirSync(binDir, { recursive: true });
  }

  const preparedCode = prepareSourceCode(code, language);
  console.log("prepareSourceCode:", code);
  fs.writeFileSync(srcPath, preparedCode, "utf8");

  const filesToCleanup = [srcPath, binPath];
  if (language === "java") {
    filesToCleanup.push(binDir);
  }

  try {
    // Compile code if needed
    await compileCode(language, srcPath, binPath, binDir);

    // Run the code
    const output = await runCode(language, srcPath, binPath, binDir);

    cleanup(filesToCleanup);
    return output;
  } catch (err) {
    cleanup(filesToCleanup);
    return { success: false, error: true, errors: err.message };
  }
}

app.post("/api/playground/run", async (req, res) => {
  const { code, language = "cpp" } = req.body;

  if (typeof code !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Code must be a string." });
  }

  try {
    const result = await compileAndRunCode(code, language.toLowerCase());
    if (result.success) {
      return res.json({ success: true, output: result.output });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error(`Error in /run (${language}):`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/playground/submit", async (req, res) => {
  const { code, language = "cpp" } = req.body;

  if (typeof code !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Code must be a string." });
  }

  try {
    const result = await compileAndRunCode(code, language.toLowerCase());
    if (result.success) {
      if (result.error) {
        return res.json({ success: true, error: true, errors: result.output });
      }
      return res.json({ success: true, error: false, output: result.output });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error(`Error in /submit (${language}):`, err);
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
      console.log(`✅ Supported languages: C++, C, Python, Java`);
    });
  })
  .catch((error) => {
    console.log("🔴 MongoDB connection failed !!!", error);
  });
