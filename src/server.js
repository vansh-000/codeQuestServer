import dotenv from "dotenv";
import { dbConnect } from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
  path: "./.env",
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
