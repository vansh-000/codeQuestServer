// // server.js
// import dotenv from "dotenv";
// import { dbConnect } from "./db/index.js";
// import { app } from "./app.js";
// import fs from "fs";
// import os from "os";
// import path from "path";
// import { exec } from "child_process";
// import { v4 as uuidv4 } from "uuid";
// import Problem from "./models/problems.model.js";

// dotenv.config({ path: "./.env" });

// async function compileAndRun(code, testCases) {
//   const workId = uuidv4();
//   const srcPath = path.join(os.tmpdir(), `code-${workId}.cpp`);
//   const binPath = path.join(os.tmpdir(), `code-${workId}.out`);
//   const boilerplate = `
//   #include <iostream>
//   #include <vector>
//   #include <algorithm>
//   using namespace std;
//   `;
  
//   fs.writeFileSync(srcPath, boilerplate + code, "utf8");

//   try {
//     await new Promise((resolve, reject) => {
//       exec(`g++ "${srcPath}" -O2 -std=c++17 -o "${binPath}"`, { timeout: 10000 }, (err, stdout, stderr) => {
//         if (err) return reject(new Error(`Compilation failed: ${stderr}`));
//         resolve();
//       });
//     });
//   } catch (compileErr) {
//     console.error(compileErr.message);
//     cleanup();
//     return false;
//   }

//   for (const { input, output: expected } of testCases) {
//     try {
//       const actual = await new Promise((resolve, reject) => {
//         const proc = exec(`"${binPath}"`, { timeout: 5000 }, (err, stdout, stderr) => {
//           if (err) return reject(new Error(stderr || "Runtime error"));
//           resolve(stdout.trim());
//         });
//         proc.stdin.write(input);
//         proc.stdin.end();
//       });

//       if (actual !== expected.trim()) {
//         console.warn(`Test failed.\n  Input:    ${input}\n  Expected: ${expected}\n  Got:      ${actual}`);
//         cleanup();
//         return false;
//       }
//     } catch (runErr) {
//       console.error("Runtime error:", runErr.message);
//       cleanup();
//       return false;
//     }
//   }

//   cleanup();
//   return true;
//   function cleanup() {
//     [srcPath, binPath].forEach((f) => {
//       if (fs.existsSync(f)) fs.unlinkSync(f);
//     });
//   }
// }

// app.post("/api/playground/run", async (req, res) => {
//   const { code, testCases } = req.body;
//   console.log("IN run ")
//   console.log(code)
//   console.log(typeof code)
//   if (typeof code !== "string" || !Array.isArray(testCases)) {
//     return res.status(400).json({ success: false, message: "Invalid payload" });
//   }

//   try {
//     const success = await compileAndRun(code, testCases);
//     return res.json({ success });
//   } catch (err) {
//     console.error("Error in /run:", err);
//     return res.json({ success: false });
//   }
// });

// app.post("/api/playground/submit", async (req, res) => {
//   const { code, problemId } = req.body;
  
//   if (typeof code !== "string") {
//     return res.status(400).json({ success: false, message: "Invalid payload" });
//   }

//   try {
//     console.log("IN submit");
    
//     // Fetch the test cases from your database based on problemId
//     // This is a placeholder - implement based on your actual database schema
//     const problem = await Problem.findById(problemId);
    
//     if (!problem || !problem.testCases) {
//       return res.status(404).json({ success: false, message: "Problem not found or has no test cases" });
//     }
    
//     const success = await compileAndRun(code, problem.testCases);
    
//     // TODO: record submission result in DB, etc.
//     return res.json({ success });
//   } catch (err) {
//     console.error("Error in /submit:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// // app.post("/api/playground/submit", async (req, res) => {
// //   const { code, problemId, testCases } = req.body;
// //   console.log(code)
// //   console.log(typeof code)
// //   if (typeof code !== "string") {
// //     return res.status(400).json({ success: false, message: "Invalid payload" });
// //   }

// //   try {
// //     console.log("IN submit ")
// //     const success = await compileAndRun(code, testCases);
// //     // TODO: record submission result in DB, etc.
// //     return res.json({ success });
// //   } catch (err) {
// //     console.error("Error in /submit:", err);
// //     return res.json({ success: false });
// //   }
// // });

// dbConnect()
//   .then(() => {
//     app.on("error", (error) => {
//       console.error("🔴 Error interacting with database: ", error);
//     });
//     app.listen(process.env.PORT || 5000, () => {
//       console.log(`✅ Server is running on port ${process.env.PORT || 5000}`);
//     });
//   })
//   .catch((error) => {
//     console.log("🔴 MongoDB connection failed !!!", error);
//   });


// server.js
import dotenv from "dotenv";
import { dbConnect } from "./db/index.js";
import { app } from "./app.js";
import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { v4 as uuidv4 } from "uuid";
import Problem from "./models/problems.model.js";

dotenv.config({ path: "./.env" });

function parseTestCase(testCase) {
  // If testCase is already properly formatted, return it
  if (testCase && typeof testCase.input === 'string' && typeof testCase.output === 'string') {
    return testCase;
  }
  
  // If testCase is a string (for example: '[1,2,3],[4,5,6]'), parse it
  if (typeof testCase === 'string') {
    // Split by comma outside of brackets
    const parts = testCase.split(/,(?![^\[]*\])/);
    if (parts.length >= 2) {
      return {
        input: parts[0] + ',' + parts[1],
        output: parts.length > 2 ? parts[2] : ''
      };
    }
  }
  
  console.error("Unparseable test case:", testCase);
  return { input: '', output: '' };
}

// async function compileAndRun(code, testCases) {
//   const workId = uuidv4();
//   const srcPath = path.join(os.tmpdir(), `code-${workId}.cpp`);
//   const binPath = path.join(os.tmpdir(), `code-${workId}.out`);
//   const boilerplate = `
//   #include <iostream>
//   #include <vector>
//   #include <algorithm>
//   using namespace std;
//   `;
  
//   fs.writeFileSync(srcPath, boilerplate + code, "utf8");
  
//   try {
//     // Compile the code
//     await new Promise((resolve, reject) => {
//       exec(`g++ "${srcPath}" -O2 -std=c++17 -o "${binPath}"`, { timeout: 10000 }, (err, stdout, stderr) => {
//         if (err) {
//           console.error("Compilation error:", stderr);
//           return reject(new Error(`Compilation failed: ${stderr}`));
//         }
//         resolve();
//       });
//     });
    
//     // Store outputs for each test case
//     const outputs = [];
//     let allPassed = true;
    
//     // Run each test case
//     for (const testCase of testCases) {
//       try {
//         if (!testCase || typeof testCase.input === 'undefined') {
//           console.error("Invalid test case format:", testCase);
//           throw new Error("Invalid test case format");
//         }
        
//         console.log("Running test case with input:", testCase.input);
        
//         const actual = await new Promise((resolve, reject) => {
//           const proc = exec(`"${binPath}"`, { timeout: 5000 }, (err, stdout, stderr) => {
//             if (err) {
//               console.error("Execution error:", stderr || err.message);
//               return reject(new Error(stderr || "Runtime error"));
//             }
//             resolve(stdout.trim());
//           });
          
//           proc.stdin.write(testCase.input);
//           proc.stdin.end();
//         });
        
//         outputs.push(actual);
        
//         const expected = testCase.output.trim();
//         if (actual !== expected) {
//           console.warn(`Test failed.\n  Input:    ${testCase.input}\n  Expected: ${expected}\n  Got:      ${actual}`);
//           allPassed = false;
//         }
//       } catch (runErr) {
//         console.error("Runtime error details:", runErr.message);
//         outputs.push(`Error: ${runErr.message}`);
//         allPassed = false;
//       }
//     }
    
//     cleanup();
//     return { success: allPassed, outputs };
//   } catch (err) {
//     console.error("Error in compileAndRun:", err.message);
//     cleanup();
//     return { success: false, error: err.message };
//   }
  
//   function cleanup() {
//     [srcPath, binPath].forEach((f) => {
//       if (fs.existsSync(f)) {
//         try {
//           fs.unlinkSync(f);
//         } catch (e) {
//           console.error("Error cleaning up file:", e);
//         }
//       }
//     });
//   }
// }

// async function compileAndRun(code, testCases) {
//   const workId = uuidv4();
//   const srcPath = path.join(os.tmpdir(), `code-${workId}.cpp`);
//   const inputPath = path.join(os.tmpdir(), `input-${workId}.txt`);
//   const binPath = path.join(os.tmpdir(), `code-${workId}.out`);
  
//   const boilerplate = `
//   #include <iostream>
//   #include <vector>
//   #include <string>
//   #include <sstream>
//   #include <algorithm>
//   using namespace std;
  
//   // Function to parse a vector from a string like [1,2,3]
//   vector<int> parseVector(string s) {
//       vector<int> result;
//       s.erase(remove(s.begin(), s.end(), '['), s.end());
//       s.erase(remove(s.begin(), s.end(), ']'), s.end());
      
//       stringstream ss(s);
//       string item;
//       while (getline(ss, item, ',')) {
//           if (!item.empty())
//               result.push_back(stoi(item));
//       }
//       return result;
//   }
  
//   // Main wrapper to parse input and call user function
//   int main() {
//       string line;
//       getline(cin, line);
      
//       // Find position of first ],[ to split input
//       size_t pos = line.find("],[");
//       if (pos == string::npos) {
//           cerr << "Invalid input format" << endl;
//           return 1;
//       }
      
//       // Split into two parts
//       string startStr = line.substr(0, pos + 1);  // Include the closing ]
//       string endStr = line.substr(pos + 1);       // Start with the opening [
      
//       // Parse vectors
//       vector<int> start = parseVector(startStr);
//       vector<int> end = parseVector(endStr);
      
//       // Call the user's function
//       vector<int> result = activitySelection(start, end);
      
//       // Output the result
//       cout << "[";
//       for (size_t i = 0; i < result.size(); i++) {
//           cout << result[i];
//           if (i < result.size() - 1) cout << ",";
//       }
//       cout << "]";
      
//       return 0;
//   }
//   `;
//   console.log("Writing code :", code + boilerplate);
//   // Write the full code to the file, with the boilerplate AFTER the user code
//   fs.writeFileSync(srcPath, code + boilerplate, "utf8");
  
//   try {
//     // Compile the code
//     await new Promise((resolve, reject) => {
//       exec(`g++ "${srcPath}" -O2 -std=c++17 -o "${binPath}"`, { timeout: 10000 }, (err, stdout, stderr) => {
//         if (err) {
//           console.error("Compilation error:", stderr);
//           return reject(new Error(`Compilation failed: ${stderr}`));
//         }
//         resolve();
//       });
//     });
    
//     // Store outputs for each test case
//     const outputs = [];
//     let allPassed = true;
    
//     // Run each test case
//     for (const testCase of testCases) {
//       try {
//         if (!testCase || typeof testCase.input === 'undefined') {
//           console.error("Invalid test case format:", testCase);
//           throw new Error("Invalid test case format");
//         }
        
//         console.log("Running test case with input:", testCase.input);
        
//         // Write input to file
//         fs.writeFileSync(inputPath, testCase.input, "utf8");
        
//         const actual = await new Promise((resolve, reject) => {
//           const proc = exec(`"${binPath}" < "${inputPath}"`, { timeout: 5000 }, (err, stdout, stderr) => {
//             if (err) {
//               console.error("Execution error:", stderr || err.message);
//               return reject(new Error(stderr || "Runtime error"));
//             }
//             resolve(stdout.trim());
//           });
//         });
        
//         outputs.push(actual);
        
//         const expected = testCase.output.trim();
//         if (actual !== expected) {
//           console.warn(`Test failed.\n  Input:    ${testCase.input}\n  Expected: ${expected}\n  Got:      ${actual}`);
//           allPassed = false;
//         } else {
//           console.log(`Test passed!\n  Input:    ${testCase.input}\n  Expected: ${expected}\n  Got:      ${actual}`);
//         }
//       } catch (runErr) {
//         console.error("Runtime error details:", runErr.message);
//         outputs.push(`Error: ${runErr.message}`);
//         allPassed = false;
//       }
//     }
    
//     cleanup();
//     return { success: allPassed, outputs };
//   } catch (err) {
//     console.error("Error in compileAndRun:", err.message);
//     cleanup();
//     return { success: false, error: err.message };
//   }
  
//   function cleanup() {
//     [srcPath, binPath, inputPath].forEach((f) => {
//       if (fs.existsSync(f)) {
//         try {
//           fs.unlinkSync(f);
//         } catch (e) {
//           console.error("Error cleaning up file:", e);
//         }
//       }
//     });
//   }
// }

async function compileAndRun(code, testCases) {
  const workId = uuidv4();
  const srcPath = path.join(os.tmpdir(), `code-${workId}.cpp`);
  const inputPath = path.join(os.tmpdir(), `input-${workId}.txt`);
  const binPath = path.join(os.tmpdir(), `code-${workId}.out`);
  
  // Put the boilerplate BEFORE the user code
  const boilerplate = `
  #include <iostream>
  #include <vector>
  #include <string>
  #include <sstream>
  #include <algorithm>
  using namespace std;
  
  // Forward declaration of the user's function
  vector<int> activitySelection(vector<int> &start, vector<int> &end);
  
  // Function to parse a vector from a string like [1,2,3]
  vector<int> parseVector(string s) {
      vector<int> result;
      s.erase(remove(s.begin(), s.end(), '['), s.end());
      s.erase(remove(s.begin(), s.end(), ']'), s.end());
      
      stringstream ss(s);
      string item;
      while (getline(ss, item, ',')) {
          if (!item.empty())
              result.push_back(stoi(item));
      }
      return result;
  }
  
  // Main wrapper to parse input and call user function
  int main() {
      string line;
      getline(cin, line);
      
      // Find position of first ],[ to split input
      size_t pos = line.find("],[");
      if (pos == string::npos) {
          cerr << "Invalid input format" << endl;
          return 1;
      }
      
      // Split into two parts
      string startStr = line.substr(0, pos + 1);  // Include the closing ]
      string endStr = line.substr(pos + 1);       // Start with the opening [
      
      // Parse vectors
      vector<int> start = parseVector(startStr);
      vector<int> end = parseVector(endStr);
      
      // Call the user's function
      vector<int> result = activitySelection(start, end);
      
      // Output the result
      cout << "[";
      for (size_t i = 0; i < result.size(); i++) {
          cout << result[i];
          if (i < result.size() - 1) cout << ",";
      }
      cout << "]";
      
      return 0;
  }
  
  // User's implementation follows:
  `;
  
  // Write the full code to the file, with the boilerplate BEFORE the user code
  fs.writeFileSync(srcPath, boilerplate + code, "utf8");
  console.log("Writing code:", boilerplate + code);
  
  // Rest of your function remains the same
  try {
    // Compile the code
    await new Promise((resolve, reject) => {
      exec(`g++ "${srcPath}" -O2 -std=c++17 -o "${binPath}"`, { timeout: 10000 }, (err, stdout, stderr) => {
        if (err) {
          console.error("Compilation error:", stderr);
          return reject(new Error(`Compilation failed: ${stderr}`));
        }
        resolve();
      });
    });
    
    // Store outputs for each test case
    const outputs = [];
    let allPassed = true;
    
    // Run each test case
    for (const testCase of testCases) {
      try {
        if (!testCase || typeof testCase.input === 'undefined') {
          console.error("Invalid test case format:", testCase);
          throw new Error("Invalid test case format");
        }
        
        console.log("Running test case with input:", testCase.input);
        
        // Write input to file
        fs.writeFileSync(inputPath, testCase.input, "utf8");
        
        const actual = await new Promise((resolve, reject) => {
          const proc = exec(`"${binPath}" < "${inputPath}"`, { timeout: 5000 }, (err, stdout, stderr) => {
            if (err) {
              console.error("Execution error:", stderr || err.message);
              return reject(new Error(stderr || "Runtime error"));
            }
            resolve(stdout.trim());
          });
        });
        
        outputs.push(actual);
        
        const expected = testCase.output.trim();
        if (actual !== expected) {
          console.warn(`Test failed.\n  Input:    ${testCase.input}\n  Expected: ${expected}\n  Got:      ${actual}`);
          allPassed = false;
        } else {
          console.log(`Test passed!\n  Input:    ${testCase.input}\n  Expected: ${expected}\n  Got:      ${actual}`);
        }
      } catch (runErr) {
        console.error("Runtime error details:", runErr.message);
        outputs.push(`Error: ${runErr.message}`);
        allPassed = false;
      }
    }
    
    cleanup();
    return { success: allPassed, outputs };
  } catch (err) {
    console.error("Error in compileAndRun:", err.message);
    cleanup();
    return { success: false, error: err.message };
  }
  
  function cleanup() {
    [srcPath, binPath, inputPath].forEach((f) => {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch (e) {
          console.error("Error cleaning up file:", e);
        }
      }
    });
  }
}

// API endpoints
// app.post("/api/playground/run", async (req, res) => {
//   const { code, testCases } = req.body;
//   console.log("IN run");
  
//   if (typeof code !== "string" || !Array.isArray(testCases)) {
//     return res.status(400).json({ success: false, message: "Invalid payload" });
//   }

//   try {
//     const result = await compileAndRun(code, testCases);
//     return res.json({ 
//       success: result.success, 
//       outputs: result.outputs || [],
//       error: result.error 
//     });
//   } catch (err) {
//     console.error("Error in /run:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// app.post("/api/playground/submit", async (req, res) => {
//   const { code, problemId, testCases } = req.body;
  
//   if (typeof code !== "string") {
//     return res.status(400).json({ success: false, message: "Invalid payload: Code must be a string" });
//   }

//   try {
//     console.log("IN submit");
    
//     // Check if testCases is provided and valid
//     if (!testCases || !Array.isArray(testCases)) {
//       console.error("Invalid or missing testCases:", testCases);
//       return res.status(400).json({ success: false, message: "Invalid or missing test cases" });
//     }
    
//     // Log testCase structure to debug
//     console.log("Test cases structure:", JSON.stringify(testCases[0], null, 2));
    
//     // Process the test cases to ensure they're in the right format
//     const processedTestCases = testCases.map(tc => {
//       if (typeof tc === 'string') {
//         // Parse string test cases
//         const parts = tc.split('],[');
//         return {
//           input: parts[0].replace('[', '') + '\n',
//           output: parts[1]?.replace(']', '') || ''
//         };
//       } else if (tc && typeof tc.input !== 'undefined' && typeof tc.output !== 'undefined') {
//         // Already in correct format
//         return tc;
//       } else {
//         console.error("Invalid test case format:", tc);
//         return { input: '', output: '' };
//       }
//     });
    
//     const result = await compileAndRun(code, processedTestCases);
    
//     // TODO: record submission result in DB, etc.
//     return res.json({ 
//       success: result.success, 
//       outputs: result.outputs || [],
//       error: result.error,
//       message: result.success ? "All test cases passed!" : "Some test cases failed."
//     });
//   } catch (err) {
//     console.error("Error in /submit:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

app.post("/api/playground/submit", async (req, res) => {
  const { code, problemId, testCases } = req.body;
  
  if (typeof code !== "string") {
    return res.status(400).json({ success: false, message: "Invalid payload: Code must be a string" });
  }

  try {
    console.log("IN submit");
    
    // Check if testCases is provided and valid
    if (!testCases || !Array.isArray(testCases)) {
      console.error("Invalid or missing testCases:", testCases);
      return res.status(400).json({ success: false, message: "Invalid or missing test cases" });
    }
    
    // Log testCase structure to debug
    console.log("Test cases structure:", JSON.stringify(testCases[0], null, 2));
    
    // Clean the user's code to make sure it only contains their implementation
    let cleanCode = code;
    
    // Remove main functions if they exist (we'll provide our own)
    cleanCode = cleanCode.replace(/int\s+main\s*\([^)]*\)\s*{[\s\S]*}/g, '');
    
    const result = await compileAndRun(cleanCode, testCases);
    
    // TODO: record submission result in DB, etc.
    return res.json({ 
      success: result.success, 
      outputs: result.outputs || [],
      error: result.error,
      message: result.success ? "All test cases passed!" : "Some test cases failed."
    });
  } catch (err) {
    console.error("Error in /submit:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Also update the run endpoint to use the same approach
app.post("/api/playground/run", async (req, res) => {
  const { code, testCases } = req.body;
  console.log("IN run");
  
  if (typeof code !== "string" || !Array.isArray(testCases)) {
    return res.status(400).json({ success: false, message: "Invalid payload" });
  }

  try {
    // Clean the user's code to make sure it only contains their implementation
    let cleanCode = code;
    
    // Remove main functions if they exist (we'll provide our own)
    cleanCode = cleanCode.replace(/int\s+main\s*\([^)]*\)\s*{[\s\S]*}/g, '');
    
    const result = await compileAndRun(cleanCode, testCases);
    
    return res.json({ 
      success: result.success, 
      outputs: result.outputs || [],
      error: result.error 
    });
  } catch (err) {
    console.error("Error in /run:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

dbConnect()
  .then(() => {
    app.on("error", (error) => {
      console.error("🔴 Error interacting with database: ", error);
    });
    app.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server is running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.log("🔴 MongoDB connection failed !!!", error);
  });